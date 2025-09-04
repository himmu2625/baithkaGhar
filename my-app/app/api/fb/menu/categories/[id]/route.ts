import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import MenuCategory from "@/models/MenuCategory"
import MenuItem from "@/models/MenuItem"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get single menu category
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectMongo()
    const { id } = params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      )
    }

    const category = await MenuCategory.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Menu category not found" },
        { status: 404 }
      )
    }

    // Get item count for this category
    const itemCount = await MenuItem.countDocuments({ 
      categoryId: category._id,
      isActive: true 
    })

    const formattedCategory = {
      id: category._id.toString(),
      name: category.name,
      description: category.description || '',
      categoryType: category.categoryType,
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive,
      availabilitySchedule: category.availabilitySchedule,
      image: category.image || null,
      itemCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy,
      lastUpdatedBy: category.lastUpdatedBy
    }

    return NextResponse.json({
      success: true,
      category: formattedCategory
    })
  } catch (error) {
    console.error('Error fetching menu category:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu category" },
      { status: 500 }
    )
  }
})

// PUT handler - Update menu category
export const PUT = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
    const { id } = params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      )
    }

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

    // Check if category exists
    const existingCategory = await MenuCategory.findById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Menu category not found" },
        { status: 404 }
      )
    }

    try {
      const validatedData = updateCategorySchema.parse(body)

      // Check for duplicate category name if name is being updated
      if (validatedData.name && validatedData.name !== existingCategory.name) {
        const duplicateCategory = await MenuCategory.findOne({
          propertyId: existingCategory.propertyId,
          name: validatedData.name,
          _id: { $ne: id },
          isActive: true
        })

        if (duplicateCategory) {
          return NextResponse.json(
            { success: false, message: "A category with this name already exists for this property" },
            { status: 409 }
          )
        }
      }

      // Update category
      const updatedCategory = await MenuCategory.findByIdAndUpdate(
        id,
        {
          ...validatedData,
          lastUpdatedBy: new Types.ObjectId(token.sub),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      )
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      return NextResponse.json({
        success: true,
        message: "Menu category updated successfully",
        category: {
          id: updatedCategory!._id.toString(),
          name: updatedCategory!.name,
          description: updatedCategory!.description || '',
          categoryType: updatedCategory!.categoryType,
          displayOrder: updatedCategory!.displayOrder,
          isActive: updatedCategory!.isActive,
          availabilitySchedule: updatedCategory!.availabilitySchedule,
          image: updatedCategory!.image,
          createdAt: updatedCategory!.createdAt,
          updatedAt: updatedCategory!.updatedAt,
          createdBy: updatedCategory!.createdBy,
          lastUpdatedBy: updatedCategory!.lastUpdatedBy
        }
      })

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
    console.error('Error updating menu category:', error)
    
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
      { success: false, message: "Failed to update menu category" },
      { status: 500 }
    )
  }
})

// DELETE handler - Delete menu category (soft delete)
export const DELETE = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
    const { id } = params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await MenuCategory.findById(id)
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Menu category not found" },
        { status: 404 }
      )
    }

    // Check if there are active menu items in this category
    const activeItemsCount = await MenuItem.countDocuments({
      categoryId: id,
      isActive: true
    })

    if (activeItemsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. It contains ${activeItemsCount} active menu items. Please move or deactivate them first.`
        },
        { status: 409 }
      )
    }

    // Soft delete - mark as inactive
    await MenuCategory.findByIdAndUpdate(
      id,
      {
        isActive: false,
        lastUpdatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }
    )

    return NextResponse.json({
      success: true,
      message: "Menu category deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting menu category:', error)
    return NextResponse.json(
      { success: false, message: "Failed to delete menu category" },
      { status: 500 }
    )
  }
})

// Schema for category update validation
const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name cannot exceed 100 characters").optional(),
  description: z.string().optional(),
  categoryType: z.enum(['food', 'beverage', 'dessert', 'special']).optional(),
  displayOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
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