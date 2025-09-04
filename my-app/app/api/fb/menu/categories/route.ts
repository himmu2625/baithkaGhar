import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// POST handler - Create new menu category
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    // Validate propertyId
    if (!body.propertyId || !Types.ObjectId.isValid(body.propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    try {
      const validatedData = categorySchema.parse(body)

      // Check for duplicate category name within the same property
      const existingCategory = await MenuCategory.findOne({
        propertyId: new Types.ObjectId(body.propertyId),
        name: validatedData.name,
        isActive: true
      })

      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: "A category with this name already exists for this property" },
          { status: 409 }
        )
      }

      // Create category
      const categoryData = {
        ...validatedData,
        propertyId: new Types.ObjectId(body.propertyId),
        createdBy: new Types.ObjectId(token.sub),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const category = await MenuCategory.create(categoryData)

      // Populate the created category
      const populatedCategory = await MenuCategory.findById(category._id)
        .populate('createdBy', 'name email')
        .lean() as any

      return NextResponse.json({
        success: true,
        message: "Menu category created successfully",
        category: {
          id: populatedCategory!._id.toString(),
          name: populatedCategory!.name,
          description: populatedCategory!.description || '',
          categoryType: populatedCategory!.categoryType,
          displayOrder: populatedCategory!.displayOrder,
          isActive: populatedCategory!.isActive,
          availabilitySchedule: populatedCategory!.availabilitySchedule,
          image: populatedCategory!.image,
          createdAt: populatedCategory!.createdAt,
          updatedAt: populatedCategory!.updatedAt,
          createdBy: populatedCategory!.createdBy
        }
      }, { status: 201 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error creating menu category:', error)
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
      return NextResponse.json(
        { 
          success: false, 
          message: "Database validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Failed to create menu category" },
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