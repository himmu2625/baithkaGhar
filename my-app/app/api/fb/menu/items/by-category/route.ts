import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get menu items by category
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const sortBy = searchParams.get('sortBy') || 'displayOrder'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1

    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { success: false, message: "Valid category ID is required as query parameter" },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await MenuCategory.findById(categoryId)
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Menu category not found" },
        { status: 404 }
      )
    }

    // Build query
    const query: any = { categoryId: new Types.ObjectId(categoryId) }
    if (!includeInactive) {
      query.isAvailable = true
      query.isActive = true
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder
    if (sortBy !== 'displayOrder') {
      sort.displayOrder = 1 // Secondary sort by display order
    }

    const items = await MenuItem.find(query)
      .populate('categoryId', 'name categoryType')
      .populate('modifiers', 'name type options')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort(sort)
      .lean() as any[]

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
      ingredients: item.ingredients || [],
      modifiers: item.modifiers || [],
      availability: item.availability || {},
      spiceLevel: item.spiceLevel || 'mild',
      portionSize: item.portionSize || 'regular',
      tags: item.tags || [],
      popularity: item.popularity || 0,
      ratings: item.ratings || { averageRating: 0, totalReviews: 0 },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      lastUpdatedBy: item.lastUpdatedBy
    }))

    return NextResponse.json({
      success: true,
      items: formattedItems,
      total: formattedItems.length,
      category: {
        id: category._id.toString(),
        name: category.name,
        categoryType: category.categoryType
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