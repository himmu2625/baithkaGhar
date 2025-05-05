import { NextRequest, NextResponse } from "next/server"
import { PropertyService } from "@/services/property-service"
import { dbHandler } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import Property from "@/models/Property"
import User from "@/models/User"

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// GET handler for properties
export const GET = dbHandler(async (req: Request) => {
  const url = new URL(req.url)
  const searchParams = url.searchParams
  
  // Parse query parameters
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "12")
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
  const locationFilter = searchParams.get("location")
  const typeFilter = searchParams.get("type")
  const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice") as string) : undefined
  const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice") as string) : undefined
  const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms") as string) : undefined
  const search = searchParams.get("search")
  
  // Build filter
  const filter: Record<string, any> = {}
  
  if (locationFilter) {
    filter["location.city"] = locationFilter
  }
  
  if (typeFilter) {
    filter.type = typeFilter
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}
    if (minPrice !== undefined) filter.price.$gte = minPrice
    if (maxPrice !== undefined) filter.price.$lte = maxPrice
  }
  
  if (bedrooms !== undefined) {
    filter.bedrooms = { $gte: bedrooms }
  }
  
  // Handle search query
  if (search) {
    const searchResults = await PropertyService.searchProperties(search)
    return NextResponse.json({ properties: searchResults, total: searchResults.length, pages: 1 })
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
})

// POST handler to create a property (protected)
export const POST = dbHandler(async (req: Request) => {
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})
