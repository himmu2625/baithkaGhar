import { NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbConnect } from '@/lib/db'
import { z } from 'zod'
import Property from '@/models/Property'
import Activity from '@/models/Activity'

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
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await dbConnect()
    
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
    
    if (status) {
      query.status = status
    }
    
    if (featured === 'true') {
      query.featured = true
    } else if (featured === 'false') {
      query.featured = false
    }
    
    if (verified === 'true') {
      query.verified = true
    } else if (verified === 'false') {
      query.verified = false
    }
    
    if (minPrice || maxPrice) {
      query.price = {}
      
      if (minPrice) {
        query.price.$gte = parseInt(minPrice)
      }
      
      if (maxPrice) {
        query.price.$lte = parseInt(maxPrice)
      }
    }
    
    if (hostId) {
      query.hostId = hostId
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total count for pagination
    const totalProperties = await Property.countDocuments(query)
    
    // Get properties
    const propertiesResult = await Property.find(query)
      .populate('host', 'name email')
      .populate('images', 'url')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Cast to any for safely accessing properties
    const properties = propertiesResult as any[]
    
    // Transform properties to match the expected format
    const formattedProperties = properties.map(prop => {
      return {
        id: prop._id.toString(),
        title: prop.title,
        description: prop.description,
        price: prop.price,
        status: prop.status,
        featured: prop.featured,
        verified: prop.verified,
        createdAt: prop.createdAt,
        updatedAt: prop.updatedAt,
        address: prop.location?.address,
        images: prop.images?.slice(0, 1).map((img: any) => ({ url: img.url })) || [],
        host: prop.host ? {
          id: prop.host._id.toString(),
          name: prop.host.name,
          email: prop.host.email
        } : null,
        _count: {
          bookings: 0, // These would need to be calculated or fetched separately
          reviews: 0
        }
      }
    })
    
    return NextResponse.json({
      properties: formattedProperties,
      pagination: {
        total: totalProperties,
        pages: Math.ceil(totalProperties / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error('Admin properties API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

// Update property details
export async function PATCH(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await dbConnect()
    
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
      userId: (session as any).user?.id,
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