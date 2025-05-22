import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectMongo } from '@/lib/db/mongodb'
import { z } from 'zod'
import Property from '@/models/Property'
import Activity from '@/models/Activity'

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Define property shape for TypeScript
interface PropertyType {
  _id: any;
  title: string;
  description: string;
  price: number;
  status: string;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: { address: string };
  images?: Array<{url: string}>;
  host?: {
    _id: any;
    name: string;
    email: string;
  };
}

// Schema for property update validation
const propertyUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['draft', 'pending', 'active', 'inactive', 'rejected']).optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  adminNotes: z.string().optional()
})

// Get all properties with filtering options
export async function GET(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()
    
    if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized', session: session ? `exists but not admin: ${session.user?.role}` : 'missing' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await connectMongo()
    
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const verified = searchParams.get('verified')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const hostId = searchParams.get('hostId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Build query for filtering
    const query: any = {}
    
    // Ensure we always return properties regardless of publication status for admin
    // query.isPublished = true is NOT set here because admins should see all properties
    
    if (status) {
      query.status = status
    }
    
    if (featured === 'true') {
      query.featured = true
    } else if (featured === 'false') {
      query.featured = false
    }
    
    if (verified === 'true') {
      query.verificationStatus = 'approved'
    } else if (verified === 'false') {
      query.verificationStatus = { $ne: 'approved' }
    }
    
    if (minPrice || maxPrice) {
      query['price.base'] = {}
      
      if (minPrice) {
        query['price.base'].$gte = parseInt(minPrice)
      }
      
      if (maxPrice) {
        query['price.base'].$lte = parseInt(maxPrice)
      }
    }
    
    if (hostId) {
      query.hostId = hostId
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { 'address.country': { $regex: search, $options: 'i' } }
      ]
    }
    
    console.log('Admin property query:', JSON.stringify(query))
    
    // Get total count for pagination
    const totalProperties = await Property.countDocuments(query)
    
    // Get properties
    const propertiesResult = await Property.find(query)
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      
    console.log(`Found ${propertiesResult.length} properties`)
    
    // Transform properties to match the expected format
    const formattedProperties = propertiesResult.map((prop: any) => {
      // Extract first image URL for thumbnail
      let thumbnailUrl = null
      if (prop.categorizedImages && prop.categorizedImages.length > 0) {
        const firstCategory = prop.categorizedImages[0]
        if (firstCategory.files && firstCategory.files.length > 0) {
          thumbnailUrl = firstCategory.files[0].url
        }
      } else if (prop.legacyGeneralImages && prop.legacyGeneralImages.length > 0) {
        thumbnailUrl = prop.legacyGeneralImages[0].url
      } else if (prop.images && prop.images.length > 0) {
        thumbnailUrl = prop.images[0]
      }
      
      return {
        id: prop._id.toString(),
        title: prop.title || prop.name || 'Unnamed Property',
        propertyType: prop.propertyType || 'Unknown',
        price: {
          base: prop.price?.base || prop.pricing?.perNight || 0
        },
        status: prop.status || 'available',
        featured: prop.featured || false,
        verificationStatus: prop.verificationStatus || 'pending',
        rating: prop.rating || 0,
        reviewCount: prop.reviewCount || 0,
        bedrooms: prop.bedrooms || 0,
        bathrooms: prop.bathrooms || 0,
        createdAt: prop.createdAt,
        updatedAt: prop.updatedAt,
        address: prop.address?.city || prop.location || 'Unknown location',
        location: {
          city: prop.address?.city || 'Unknown',
          state: prop.address?.state || 'Unknown',
          country: prop.address?.country || 'Unknown'
        },
        host: prop.hostId ? {
          id: prop.hostId._id?.toString() || 'unknown',
          name: prop.hostId.name || 'Unknown Owner',
          email: prop.hostId.email || ''
        } : null,
        images: [{ url: thumbnailUrl }].filter(img => img.url)
      }
    })
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({
      properties: formattedProperties,
      pagination: {
        total: totalProperties,
        pages: Math.ceil(totalProperties / limit),
        page,
        limit
      }
    })
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Admin properties API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Update property details
export async function PATCH(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth()
    
    if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Unauthorized', session: session ? `exists but not admin: ${session.user?.role}` : 'missing' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await connectMongo()
    
    // Parse and validate request body
    const body = await req.json()
    const validationResult = propertyUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    const { id, ...updateData } = validationResult.data
    
    // Check if property exists and cast to any for type safety
    const existingPropertyResult = await Property.findById(id)
      .populate('host', 'name email')
      .lean()
    
    // Safe typecasting
    const existingProperty = existingPropertyResult as any
    
    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }
    
    // Update property
    const updatedPropertyResult = await Property.findByIdAndUpdate(
      id, 
      { $set: updateData },
      { new: true }
    ).populate('host', 'name email').lean()
    
    // Safe typecasting
    const updatedProperty = updatedPropertyResult as any
    
    if (!updatedProperty) {
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      )
    }
    
    // Format the property to match expected output
    const formattedProperty = {
      ...updatedProperty,
      id: updatedProperty._id.toString(),
      host: updatedProperty.host ? {
        id: updatedProperty.host._id.toString(),
        name: updatedProperty.host.name,
        email: updatedProperty.host.email
      } : null
    }
    
    // Log activity
    await Activity.create({
      type: 'PROPERTY_UPDATE',
      userId: session.user?.id,
      description: `Property "${updatedProperty.title}" updated by admin`,
      metadata: {
        propertyId: id,
        hostId: existingProperty.host ? existingProperty.host._id.toString() : null,
        changes: updateData
      }
    })
    
    // Send notification to host if status changed
    if (updateData.status && updateData.status !== existingProperty.status) {
      // Implementation for email notifications can be added here
      // using the email service you've previously created
    }
    
    return NextResponse.json({ property: formattedProperty })
  } catch (error) {
    console.error('Admin property update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
} 