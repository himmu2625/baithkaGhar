import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all menu items for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()
    
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const categoryType = searchParams.get('categoryType')
    const isAvailable = searchParams.get('isAvailable')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'displayOrder'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (isAvailable === 'true') {
      query.isAvailable = true
      query.isActive = true
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Filter by category type if specified
    let categoryFilter = {}
    if (categoryType) {
      const categories = await MenuCategory.find({ 
        propertyId: new Types.ObjectId(propertyId),
        categoryType,
        isActive: true 
      }).select('_id')
      categoryFilter = { categoryId: { $in: categories.map(c => c._id) } }
      Object.assign(query, categoryFilter)
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder
    if (sortBy !== 'displayOrder') {
      sort.displayOrder = 1 // Secondary sort
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .populate('categoryId', 'name categoryType')
        .populate('modifiers', 'name type options')
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() as unknown as any[],
      MenuItem.countDocuments(query)
    ])

    // Transform items for frontend
    const formattedItems = items.map(item => ({
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
      spiceLevel: item.spiceLevel || 'mild',
      portionSize: item.portionSize || 'regular',
      tags: item.tags || [],
      popularity: item.popularity || 0,
      ratings: item.ratings || { averageRating: 0, totalReviews: 0 },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu items" },
      { status: 500 }
    )
  }
})

// POST handler - Create new menu item
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

    // Validate required fields
    if (!body.propertyId || !Types.ObjectId.isValid(body.propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!body.categoryId || !Types.ObjectId.isValid(body.categoryId)) {
      return NextResponse.json(
        { success: false, message: "Valid category ID is required" },
        { status: 400 }
      )
    }

    try {
      const validatedData = menuItemSchema.parse(body)

      // Check if category exists and belongs to the property
      const category = await MenuCategory.findOne({
        _id: new Types.ObjectId(body.categoryId),
        propertyId: new Types.ObjectId(body.propertyId),
        isActive: true
      })

      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found or doesn't belong to this property" },
          { status: 404 }
        )
      }

      // Check for duplicate item name within the same category
      const existingItem = await MenuItem.findOne({
        categoryId: new Types.ObjectId(body.categoryId),
        name: validatedData.name,
        isActive: true
      })

      if (existingItem) {
        return NextResponse.json(
          { success: false, message: "A menu item with this name already exists in this category" },
          { status: 409 }
        )
      }

      // Create menu item
      const itemData = {
        ...validatedData,
        propertyId: new Types.ObjectId(body.propertyId),
        categoryId: new Types.ObjectId(body.categoryId),
        createdBy: new Types.ObjectId(token.sub),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const item = await MenuItem.create(itemData)

      // Populate the created item
      const populatedItem = await MenuItem.findById(item._id)
        .populate('categoryId', 'name categoryType')
        .populate('createdBy', 'name email')
        .lean() as any

      return NextResponse.json({
        success: true,
        message: "Menu item created successfully",
        item: {
          id: populatedItem!._id.toString(),
          name: populatedItem!.name,
          description: populatedItem!.description || '',
          basePrice: populatedItem!.basePrice,
          discountedPrice: populatedItem!.discountedPrice || null,
          preparationTime: populatedItem!.preparationTime || 0,
          isAvailable: populatedItem!.isAvailable,
          isActive: populatedItem!.isActive,
          displayOrder: populatedItem!.displayOrder || 0,
          category: populatedItem!.categoryId,
          images: populatedItem!.images || [],
          dietary: populatedItem!.dietary || {},
          nutritionalInfo: populatedItem!.nutritionalInfo || {},
          spiceLevel: populatedItem!.spiceLevel || 'mild',
          portionSize: populatedItem!.portionSize || 'regular',
          tags: populatedItem!.tags || [],
          createdAt: populatedItem!.createdAt,
          updatedAt: populatedItem!.updatedAt,
          createdBy: populatedItem!.createdBy
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
    console.error('Error creating menu item:', error)
    
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
      { success: false, message: "Failed to create menu item" },
      { status: 500 }
    )
  }
})

// Schema for menu item creation validation
const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Price cannot be negative"),
  discountedPrice: z.number().min(0).optional(),
  preparationTime: z.number().min(0).default(15),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  displayOrder: z.number().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  dietary: z.object({
    vegetarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    glutenFree: z.boolean().default(false),
    dairyFree: z.boolean().default(false),
    nutFree: z.boolean().default(false),
    halal: z.boolean().default(false),
    kosher: z.boolean().default(false)
  }).default({}),
  nutritionalInfo: z.object({
    calories: z.number().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional()
  }).default({}),
  spiceLevel: z.enum(['mild', 'medium', 'hot', 'very_hot']).default('mild'),
  portionSize: z.enum(['small', 'regular', 'large', 'extra_large']).default('regular'),
  tags: z.array(z.string()).default([]),
  ingredients: z.array(z.string()).default([]),
  modifiers: z.array(z.string()).default([])
})