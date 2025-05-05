import { NextRequest, NextResponse } from "next/server"
import { PropertyService } from "@/services/property-service"
import { dbHandler, convertDocToObj } from "@/lib/db"
import { getSession } from "@/lib/get-session"
import Property from "@/models/Property"

interface Params {
  params: {
    id: string
  }
}

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// This helper function is needed for static site generation
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

// GET handler for a specific property
export const GET = dbHandler(async (_: Request, { params }: Params) => {
  const { id } = params
  
  const property = await PropertyService.getPropertyById(id)
  
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }
  
  return NextResponse.json(property)
})

// PATCH handler to update a property (protected)
export const PATCH = dbHandler(async (req: Request, { params }: Params) => {
  const { id } = params
  const session = await getSession()
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Get the property to check ownership
  const property = await PropertyService.getPropertyById(id)
  
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }
  
  // Check if the user is the owner of the property
  if (property.ownerId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  try {
    const body = await req.json()
    
    // Update the property
    const updatedProperty = await PropertyService.updateProperty(id, body)
    
    return NextResponse.json(updatedProperty)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})

// DELETE handler to delete a property (protected)
export const DELETE = dbHandler(async (_: Request, { params }: Params) => {
  const { id } = params
  const session = await getSession()
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Get the property to check ownership
  const property = await PropertyService.getPropertyById(id)
  
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 })
  }
  
  // Check if the user is the owner of the property or an admin
  if (property.ownerId.toString() !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  try {
    // Soft delete by updating isActive to false
    const deletedProperty = await PropertyService.updateProperty(id, { isActive: false })
    
    return NextResponse.json({ success: true, message: "Property deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
})
