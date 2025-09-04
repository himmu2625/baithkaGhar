import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all menu categories for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required as query parameter" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    if (!includeInactive) {
      query.isActive = true
    }

    const categories = await MenuCategory.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ displayOrder: 1, name: 1 })
      .lean() as any[]

    // Transform categories for frontend
    const formattedCategories = categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      description: category.description || '',
      categoryType: category.categoryType,
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive,
      availabilitySchedule: category.availabilitySchedule,
      image: category.image || null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy,
      lastUpdatedBy: category.lastUpdatedBy
    }))

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
      total: formattedCategories.length
    })
  } catch (error) {
    console.error('Error fetching menu categories:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu categories" },
      { status: 500 }
    )
  }
})

// Schema for category creation validation
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().optional(),
  categoryType: z.enum(['food', 'beverage', 'dessert', 'special']),
  displayOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  availabilitySchedule: z.object({
    allDay: z.boolean().default(true),
    timeSlots: z.array(z.object({
      startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
      days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    }))
  }).optional(),
  image: z.string().url().optional()
})