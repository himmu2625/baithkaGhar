import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get single menu item
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectMongo()
    const { id } = params

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid menu item ID" },
        { status: 400 }
      )
    }

    const item = await MenuItem.findById(id)
      .populate('categoryId', 'name categoryType')
      .populate('modifiers', 'name type options')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      )
    }

    const formattedItem = {
      id: item._id.toString(),
      name: item.name,
      description: item.description || '',
      basePrice: item.basePrice,
      discountedPrice: item.discountedPrice || null,
      preparationTime: item.preparationTime || 0,
      isAvailable: item.isAvailable,
      isActive: item.isActive,
      displayOrder: item.displayOrder || 0,
      category: item.categoryId,
      images: item.images || [],
      dietary: item.dietary || {},
      nutritionalInfo: item.nutritionalInfo || {},
      ingredients: item.ingredients || [],
      modifiers: item.modifiers || [],
      availability: item.availability || {},
      spiceLevel: item.spiceLevel || 'mild',
      portionSize: item.portionSize || 'regular',
      tags: item.tags || [],
      popularity: item.popularity || 0,
      ratings: item.ratings || { averageRating: 0, totalReviews: 0 },
      analytics: item.analytics || {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      lastUpdatedBy: item.lastUpdatedBy
    }

    return NextResponse.json({
      success: true,
      item: formattedItem
    })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu item" },
      { status: 500 }
    )
  }
})

// PUT handler - Update menu item
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
        { success: false, message: "Invalid menu item ID" },
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

    // Check if item exists
    const existingItem = await MenuItem.findById(id)
    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      )
    }

    try {
      const validatedData = updateMenuItemSchema.parse(body)

      // Check for duplicate item name if name is being updated
      if (validatedData.name && validatedData.name !== existingItem.name) {
        const duplicateItem = await MenuItem.findOne({
          categoryId: existingItem.categoryId,
          name: validatedData.name,
          _id: { $ne: id },
          isActive: true
        })

        if (duplicateItem) {
          return NextResponse.json(
            { success: false, message: "A menu item with this name already exists in this category" },
            { status: 409 }
          )
        }
      }

      // If category is being changed, validate it
      if (validatedData.categoryId && validatedData.categoryId !== existingItem.categoryId.toString()) {
        const category = await MenuCategory.findOne({
          _id: new Types.ObjectId(validatedData.categoryId),
          propertyId: existingItem.propertyId,
          isActive: true
        })

        if (!category) {
          return NextResponse.json(
            { success: false, message: "Category not found or doesn't belong to this property" },
            { status: 404 }
          )
        }
      }

      // Update item
      const updateData: any = {
        ...validatedData,
        lastUpdatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }

      // Convert categoryId to ObjectId if provided
      if (validatedData.categoryId) {
        updateData.categoryId = new Types.ObjectId(validatedData.categoryId)
      }

      const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('categoryId', 'name categoryType')
      .populate('modifiers', 'name type options')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

      return NextResponse.json({
        success: true,
        message: "Menu item updated successfully",
        item: {
          id: updatedItem!._id.toString(),
          name: updatedItem!.name,
          description: updatedItem!.description || '',
          basePrice: updatedItem!.basePrice,
          discountedPrice: updatedItem!.discountedPrice || null,
          preparationTime: updatedItem!.preparationTime || 0,
          isAvailable: updatedItem!.isAvailable,
          isActive: updatedItem!.isActive,
          displayOrder: updatedItem!.displayOrder || 0,
          category: updatedItem!.categoryId,
          images: updatedItem!.images || [],
          dietary: updatedItem!.dietary || {},
          nutritionalInfo: updatedItem!.nutritionalInfo || {},
          spiceLevel: updatedItem!.spiceLevel || 'mild',
          portionSize: updatedItem!.portionSize || 'regular',
          tags: updatedItem!.tags || [],
          createdAt: updatedItem!.createdAt,
          updatedAt: updatedItem!.updatedAt,
          createdBy: updatedItem!.createdBy,
          lastUpdatedBy: updatedItem!.lastUpdatedBy
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
    console.error('Error updating menu item:', error)
    
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
      { success: false, message: "Failed to update menu item" },
      { status: 500 }
    )
  }
})

// DELETE handler - Delete menu item (soft delete)
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
        { success: false, message: "Invalid menu item ID" },
        { status: 400 }
      )
    }

    // Check if item exists
    const item = await MenuItem.findById(id)
    if (!item) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      )
    }

    // Check if there are pending orders with this item
    const pendingOrdersCount = await Order.countDocuments({
      'items.itemId': id,
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    })

    if (pendingOrdersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete item. It has ${pendingOrdersCount} pending orders. Please wait for orders to complete or cancel them first.`
        },
        { status: 409 }
      )
    }

    // Soft delete - mark as inactive
    await MenuItem.findByIdAndUpdate(
      id,
      {
        isActive: false,
        isAvailable: false,
        lastUpdatedBy: new Types.ObjectId(token.sub),
        updatedAt: new Date()
      }
    )

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { success: false, message: "Failed to delete menu item" },
      { status: 500 }
    )
  }
})

// Schema for menu item update validation
const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Name cannot exceed 100 characters").optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Price cannot be negative").optional(),
  discountedPrice: z.number().min(0).optional(),
  preparationTime: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  dietary: z.object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    dairyFree: z.boolean().optional(),
    nutFree: z.boolean().optional(),
    halal: z.boolean().optional(),
    kosher: z.boolean().optional()
  }).optional(),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional()
  }).optional(),
  spiceLevel: z.enum(['mild', 'medium', 'hot', 'very_hot']).optional(),
  portionSize: z.enum(['small', 'regular', 'large', 'extra_large']).optional(),
  tags: z.array(z.string()).optional(),
  ingredients: z.array(z.string()).optional(),
  modifiers: z.array(z.string()).optional()
})