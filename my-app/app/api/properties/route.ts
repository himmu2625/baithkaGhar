import { NextRequest, NextResponse } from "next/server"
import { PropertyService } from "@/services/property-service"
import { dbHandler } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import Property from "@/models/Property"
import User from "@/models/User"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for properties
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const city = url.searchParams.get('city')
    const searchParams = url.searchParams
    
    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") as 'asc' | 'desc' || 'desc'
    
    const filter: Record<string, any> = {}
    
    // Apply city filter if provided
    if (city) {
      filter['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') }
    }
    
    // Additional filters can be added here
    const type = searchParams.get('type')
    if (type) {
      filter.type = type
    }
    
    const minPrice = searchParams.get('minPrice')
    if (minPrice) {
      filter.price = { ...filter.price, $gte: parseInt(minPrice) }
    }
    
    const maxPrice = searchParams.get('maxPrice')
    if (maxPrice) {
      filter.price = { ...filter.price, $lte: parseInt(maxPrice) }
    }
    
    const bedrooms = searchParams.get('bedrooms')
    if (bedrooms) {
      filter.bedrooms = parseInt(bedrooms)
    }
    
    const bathrooms = searchParams.get('bathrooms')
    if (bathrooms) {
      filter.bathrooms = parseInt(bathrooms)
    }
    
    // Regular listing with filters
    const result = await PropertyService.getAllProperties({
      page,
      limit,
      sortBy,
      sortOrder,
      filter
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
})

// POST handler to create a property (protected)
export const POST = dbHandler(async (req: NextRequest) => {
  const session = await getSession()
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    
    // Add owner ID from session
    body.ownerId = session.user.id
    
    // Validate required fields
    const requiredFields = ["title", "description", "type", "location", "price", "bedrooms", "bathrooms", "maxGuests"]
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }
    
    const property = await PropertyService.createProperty(body)
    
    return NextResponse.json(property, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/properties:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
})
