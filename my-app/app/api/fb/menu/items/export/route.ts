import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import MenuItem from "@/models/MenuItem"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Export menu items
export const GET = dbHandler(async (req: NextRequest) => {
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

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const categoryId = searchParams.get('categoryId')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const fields = searchParams.get('fields')?.split(',') || []

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { 
      propertyId: new Types.ObjectId(propertyId)
    }

    if (!includeInactive) {
      query.isActive = true
    }

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new Types.ObjectId(categoryId)
    }

    // Get menu items with populated category data
    const menuItems = await MenuItem.find(query)
      .populate('categoryId', 'name categoryType')
      .sort({ 'categoryId': 1, displayOrder: 1, name: 1 })
      .lean()

    // Transform data for export
    const exportData = menuItems.map(item => {
      const baseData = {
        'Item ID': item._id.toString(),
        'Item Name': item.name,
        'Description': item.description || '',
        'Category': item.categoryId?.name || 'Unknown',
        'Category Type': item.categoryId?.categoryType || '',
        'Base Price': item.basePrice || 0,
        'Cost Price': item.costPrice || 0,
        'Preparation Time (min)': item.preparationTime || 15,
        'Spicy Level': item.spicyLevel || 'none',
        'Item Type': item.itemType || 'food',
        'Display Order': item.displayOrder || 0,
        'Available': item.isAvailable ? 'Yes' : 'No',
        'Active': item.isActive ? 'Yes' : 'No',
        'Featured': item.isFeatured ? 'Yes' : 'No',
        
        // Dietary information
        'Vegetarian': item.dietary?.vegetarian ? 'Yes' : 'No',
        'Vegan': item.dietary?.vegan ? 'Yes' : 'No',
        'Gluten Free': item.dietary?.glutenFree ? 'Yes' : 'No',
        'Dairy Free': item.dietary?.dairyFree ? 'Yes' : 'No',
        'Nut Free': item.dietary?.nutFree ? 'Yes' : 'No',
        'Halal': item.dietary?.halal ? 'Yes' : 'No',
        'Kosher': item.dietary?.kosher ? 'Yes' : 'No',
        'Organic': item.dietary?.organic ? 'Yes' : 'No',
        
        // Nutritional information
        'Calories': item.nutritionalInfo?.calories || '',
        'Protein (g)': item.nutritionalInfo?.protein || '',
        'Carbs (g)': item.nutritionalInfo?.carbohydrates || '',
        'Fat (g)': item.nutritionalInfo?.fat || '',
        
        // Size variations
        'Has Sizes': item.sizes && item.sizes.length > 0 ? 'Yes' : 'No',
        'Size Options': item.sizes?.map(size => `${size.name}: ₹${size.price}`).join('; ') || '',
        
        // Availability
        'All Day Available': item.availabilitySchedule?.allDay ? 'Yes' : 'No',
        'Time Slots': item.availabilitySchedule?.timeSlots?.map(slot => 
          `${slot.startTime}-${slot.endTime} (${slot.days?.join(',')})`
        ).join('; ') || '',
        
        // Images
        'Image URLs': item.images?.join('; ') || '',
        'Primary Image': item.image || '',
        
        // Timestamps
        'Created At': item.createdAt ? new Date(item.createdAt).toISOString() : '',
        'Updated At': item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
        
        // Additional metadata
        'Tags': item.tags?.join(', ') || '',
        'Allergen Info': item.allergenInfo || '',
        'Chef Recommendations': item.chefRecommendation || '',
        'Seasonal': item.seasonal?.isSeasonalItem ? 'Yes' : 'No'
      }

      // Filter by requested fields if specified
      if (fields.length > 0) {
        const filteredData: any = {}
        fields.forEach(field => {
          const key = field.trim()
          if (key in baseData) {
            filteredData[key] = baseData[key as keyof typeof baseData]
          }
        })
        return filteredData
      }

      return baseData
    })

    // Add summary statistics
    const summary = {
      totalItems: exportData.length,
      activeItems: menuItems.filter(item => item.isActive).length,
      categories: [...new Set(menuItems.map(item => item.categoryId?.name).filter(Boolean))].length,
      averagePrice: menuItems.length > 0 
        ? Math.round(menuItems.reduce((sum, item) => sum + (item.basePrice || 0), 0) / menuItems.length)
        : 0,
      priceRange: {
        min: menuItems.length > 0 ? Math.min(...menuItems.map(item => item.basePrice || 0)) : 0,
        max: menuItems.length > 0 ? Math.max(...menuItems.map(item => item.basePrice || 0)) : 0
      },
      dietaryBreakdown: {
        vegetarian: menuItems.filter(item => item.dietary?.vegetarian).length,
        vegan: menuItems.filter(item => item.dietary?.vegan).length,
        glutenFree: menuItems.filter(item => item.dietary?.glutenFree).length,
        halal: menuItems.filter(item => item.dietary?.halal).length
      },
      exportedAt: new Date().toISOString(),
      exportedBy: token.email || token.name || 'Unknown'
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      summary,
      metadata: {
        totalRecords: exportData.length,
        fields: Object.keys(exportData[0] || {}),
        filters: {
          propertyId,
          categoryId,
          includeInactive,
          customFields: fields.length > 0 ? fields : null
        }
      }
    })

  } catch (error) {
    console.error('Error exporting menu items:', error)
    return NextResponse.json(
      { success: false, message: "Failed to export menu items" },
      { status: 500 }
    )
  }
})