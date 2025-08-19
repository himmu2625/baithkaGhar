import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Property from '@/models/Property'
import Booking from '@/models/Booking'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id

    // Get property data
    const property = await Property.findById(propertyId).lean()
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get inventory (room types and individual rooms)
    const inventory = property.propertyUnits || []

    // Calculate total rooms
    const totalRooms = inventory.reduce((sum, unit) => sum + unit.count, 0) || 
                      (property.totalHotelRooms ? parseInt(property.totalHotelRooms) : 0)

    // Get current bookings to calculate occupied rooms
    const currentDate = new Date()
    const currentBookings = await Booking.find({
      propertyId: propertyId,
      status: 'confirmed',
      checkInDate: { $lte: currentDate },
      checkOutDate: { $gt: currentDate }
    }).lean()

    const bookedRooms = currentBookings.length

    // Calculate room statuses from property units
    let availableRooms = 0
    let maintenanceRooms = 0

    inventory.forEach(unit => {
      if (unit.roomNumbers && unit.roomNumbers.length > 0) {
        availableRooms += unit.roomNumbers.filter(room => room.status === 'available').length
        maintenanceRooms += unit.roomNumbers.filter(room => room.status === 'maintenance').length
      } else {
        // For units without individual room tracking, assume all are available minus booked
        availableRooms += Math.max(0, unit.count - bookedRooms)
      }
    })

    // If no detailed room tracking, use simple calculation
    if (!inventory.length || !inventory.some(unit => Array.isArray(unit.roomNumbers) && unit.roomNumbers.length > 0)) {
      availableRooms = Math.max(0, totalRooms - bookedRooms)
      maintenanceRooms = 0
    }

    const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0

    // Calculate average rate
    const averageRate = inventory.length > 0 
      ? inventory.reduce((sum, unit) => sum + parseInt(unit.pricing.price, 10), 0) / inventory.length
      : Number(property.price?.base ?? 0)

    const stats = {
      totalRooms,
      availableRooms,
      bookedRooms,
      maintenanceRooms,
      occupancyRate,
      averageRate: Math.round(averageRate)
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property._id,
        title: property.title,
        address: property.address
      },
      inventory,
      stats
    })
  } catch (error) {
    console.error('Error fetching inventory data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id
    const { unitCode, roomNumber, status, pricing } = await request.json()

    // Get property
    const property = await Property.findById(propertyId)
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update room status or pricing
    if (unitCode && roomNumber && status) {
      // Update individual room status
      const unitIndex = property.propertyUnits.findIndex(unit => unit.unitTypeCode === unitCode)
      
      if (unitIndex !== -1) {
        const roomIndex = property.propertyUnits[unitIndex].roomNumbers?.findIndex(
          room => room.number === roomNumber
        )
        
        if (
          roomIndex !== -1 &&
          roomIndex !== undefined &&
          property.propertyUnits[unitIndex].roomNumbers
        ) {
          property.propertyUnits[unitIndex].roomNumbers![roomIndex]!.status = status
          await property.save()
        }
      }
    }

    // Update pricing if provided
    if (unitCode && pricing) {
      const unitIndex = property.propertyUnits.findIndex(unit => unit.unitTypeCode === unitCode)
      
      if (unitIndex !== -1) {
        property.propertyUnits[unitIndex].pricing = {
          ...property.propertyUnits[unitIndex].pricing,
          ...pricing
        }
        await property.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully'
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id
    const { roomType } = await request.json()

    // Get property
    const property = await Property.findById(propertyId)
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Add new room type
    property.propertyUnits.push(roomType)
    await property.save()

    return NextResponse.json({
      success: true,
      message: 'Room type added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding room type:', error)
    return NextResponse.json(
      { error: 'Failed to add room type' },
      { status: 500 }
    )
  }
}




