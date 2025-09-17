import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/dbConnect'
import Property from '@/models/Property'
import PropertyAmenity from '@/models/PropertyAmenity'
import Room from '@/models/Room'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// Helper function to categorize amenities based on name
function getAmenityCategory(amenityName: string): string {
  const name = amenityName.toLowerCase()
  if (name.includes('wifi') || name.includes('tv') || name.includes('ac') || name.includes('kitchen') || name.includes('fridge')) {
    return 'room'
  } else if (name.includes('pool') || name.includes('parking') || name.includes('restaurant') || name.includes('bar')) {
    return 'property'
  } else if (name.includes('reception') || name.includes('room service')) {
    return 'service'
  } else if (name.includes('shower') || name.includes('bath') || name.includes('geyser')) {
    return 'room'
  } else {
    return 'property'
  }
}

// Helper function to get icon for amenity based on name
function getAmenityIcon(amenityName: string): string {
  const name = amenityName.toLowerCase()
  if (name.includes('wifi')) return 'wifi'
  if (name.includes('tv')) return 'tv'
  if (name.includes('parking')) return 'car'
  if (name.includes('pool')) return 'waves'
  if (name.includes('kitchen')) return 'utensils'
  if (name.includes('restaurant')) return 'utensils'
  if (name.includes('bar')) return 'coffee'
  if (name.includes('ac')) return 'snowflake'
  if (name.includes('reception')) return 'users'
  if (name.includes('service')) return 'users'
  if (name.includes('shower') || name.includes('bath')) return 'bath'
  if (name.includes('geyser')) return 'snowflake'
  if (name.includes('fridge')) return 'snowflake'
  return 'wifi' // default
}

// OPTIMIZED GET: Amenities for Property
export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // OPTIMIZATION: Parallel database queries with minimal data selection
    const [property, totalRooms, amenityDocs] = await Promise.all([
      Property.findById(propertyId).lean().select('amenities title name'),
      Room.countDocuments({ propertyId }),
      PropertyAmenity.find({
        $or: [
          { propertyId: propertyId },
          { propertyId: new mongoose.Types.ObjectId(propertyId) }
        ]
      })
      .sort({ displayOrder: 1, amenityName: 1 })
      .lean()
      .select('amenityName amenityType category description isAvailable hasAdditionalCost additionalCost costType icon displayOrder isHighlight verificationStatus updatedAt')
    ])

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // OPTIMIZATION: Use embedded amenities if no separate amenity documents found
    if (amenityDocs.length === 0 && property.amenities && property.amenities.length > 0) {
      const embeddedAmenities = property.amenities.map((amenityName: string, index: number) => ({
        _id: `embedded_${index}`,
        amenityName: amenityName,
        category: getAmenityCategory(amenityName),
        description: `${amenityName} amenity`,
        isAvailable: true,
        hasAdditionalCost: false,
        icon: getAmenityIcon(amenityName),
        displayOrder: index,
        isHighlight: false,
        updatedAt: new Date()
      }))

      return NextResponse.json({
        success: true,
        data: embeddedAmenities.map(amenity => ({
          id: amenity._id,
          name: amenity.amenityName,
          category: amenity.category,
          description: amenity.description,
          isAvailable: amenity.isAvailable,
          hasAdditionalCost: amenity.hasAdditionalCost,
          icon: amenity.icon,
          isHighlight: amenity.isHighlight,
          lastUpdated: amenity.updatedAt,
          coverage: Math.round((1 / totalRooms) * 100)
        })),
        meta: {
          totalAmenities: embeddedAmenities.length,
          totalRooms: totalRooms,
          source: 'embedded'
        }
      })
    }

    // OPTIMIZATION: Transform amenities data efficiently
    const amenitiesData = amenityDocs.map(amenity => ({
      id: amenity._id,
      name: amenity.amenityName,
      category: amenity.category || getAmenityCategory(amenity.amenityName),
      description: amenity.description || `${amenity.amenityName} amenity`,
      isAvailable: amenity.isAvailable ?? true,
      hasAdditionalCost: amenity.hasAdditionalCost || false,
      icon: amenity.icon || getAmenityIcon(amenity.amenityName),
      isHighlight: amenity.isHighlight || false,
      lastUpdated: amenity.updatedAt || new Date(),
      coverage: totalRooms > 0 ? Math.round((1 / totalRooms) * 100) : 0
    }))

    return NextResponse.json({
      success: true,
      data: amenitiesData,
      meta: {
        totalAmenities: amenitiesData.length,
        totalRooms: totalRooms,
        source: 'database'
      }
    })

  } catch (error) {
    console.error('Amenities API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch amenities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// OPTIMIZED POST: Create Amenity
export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const data = await request.json()

    const newAmenity = new PropertyAmenity({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      amenityName: data.name,
      amenityType: data.type || 'basic',
      category: data.category || 'property',
      description: data.description || '',
      isAvailable: data.isAvailable ?? true,
      hasAdditionalCost: data.hasAdditionalCost || false,
      additionalCost: data.additionalCost || 0,
      costType: data.costType || 'per_use',
      icon: data.icon || getAmenityIcon(data.name),
      displayOrder: data.displayOrder || 0,
      isHighlight: data.isHighlight || false,
      verificationRequired: data.verificationRequired || false,
      verificationStatus: 'verified',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const savedAmenity = await newAmenity.save()

    return NextResponse.json({
      success: true,
      data: {
        id: savedAmenity._id,
        name: savedAmenity.amenityName,
        category: savedAmenity.category,
        description: savedAmenity.description,
        isAvailable: savedAmenity.isAvailable,
        hasAdditionalCost: savedAmenity.hasAdditionalCost,
        icon: savedAmenity.icon,
        isHighlight: savedAmenity.isHighlight,
        lastUpdated: savedAmenity.updatedAt
      }
    })

  } catch (error) {
    console.error('❌ [Amenities] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create amenity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}