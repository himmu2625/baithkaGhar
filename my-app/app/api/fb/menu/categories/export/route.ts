import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import MenuCategory from "@/models/MenuCategory"
import MenuItem from "@/models/MenuItem"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Export menu categories
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
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeItemCount = searchParams.get('includeItemCount') === 'true'
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

    // Get menu categories
    const categories = await MenuCategory.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .lean()

    // Get item counts per category if requested
    let categoryItemCounts: Map<string, number> = new Map()
    if (includeItemCount) {
      const itemCounts = await MenuItem.aggregate([
        { $match: { propertyId: new Types.ObjectId(propertyId), isActive: true } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
      ])
      
      itemCounts.forEach(count => {
        if (count._id) {
          categoryItemCounts.set(count._id.toString(), count.count)
        }
      })
    }

    // Transform data for export
    const exportData = categories.map(category => {
      const baseData = {
        'Category ID': category._id.toString(),
        'Category Name': category.name,
        'Description': category.description || '',
        'Category Type': category.categoryType || '',
        'Display Order': category.displayOrder || 0,
        'Active': category.isActive ? 'Yes' : 'No',
        'Image URL': category.image || '',
        
        // Item count
        'Item Count': includeItemCount ? (categoryItemCounts.get(category._id.toString()) || 0) : '',
        
        // Availability information
        'All Day Available': category.availabilitySchedule?.allDay ? 'Yes' : 'No',
        'Time Slots': category.availabilitySchedule?.timeSlots?.map(slot => 
          `${slot.startTime}-${slot.endTime} (${slot.days?.join(',')})`
        ).join('; ') || '',
        
        // Legacy availability
        'Breakfast Available': category.availableTime?.breakfast ? 'Yes' : 'No',
        'Lunch Available': category.availableTime?.lunch ? 'Yes' : 'No',
        'Dinner Available': category.availableTime?.dinner ? 'Yes' : 'No',
        
        // Dietary information
        'Vegetarian Options': category.dietary?.vegetarian ? 'Yes' : 'No',
        'Vegan Options': category.dietary?.vegan ? 'Yes' : 'No',
        'Gluten Free Options': category.dietary?.glutenFree ? 'Yes' : 'No',
        'Dairy Free Options': category.dietary?.dairyFree ? 'Yes' : 'No',
        'Nut Free Options': category.dietary?.nutFree ? 'Yes' : 'No',
        'Halal Options': category.dietary?.halal ? 'Yes' : 'No',
        'Kosher Options': category.dietary?.kosher ? 'Yes' : 'No',
        'Organic Options': category.dietary?.organic ? 'Yes' : 'No',
        
        // Timestamps
        'Created At': category.createdAt ? new Date(category.createdAt).toISOString() : '',
        'Updated At': category.updatedAt ? new Date(category.updatedAt).toISOString() : '',
        
        // Additional metadata
        'Tags': category.tags?.join(', ') || '',
        'Notes': category.notes || '',
        'Color Code': category.colorCode || '',
        'Icon': category.icon || '',
        'Is Featured': category.isFeatured ? 'Yes' : 'No',
        'Sort Priority': category.sortPriority || 0
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
      totalCategories: exportData.length,
      activeCategories: categories.filter(cat => cat.isActive).length,
      categoryTypes: [...new Set(categories.map(cat => cat.categoryType).filter(Boolean))],
      averageItemsPerCategory: includeItemCount && categories.length > 0 
        ? Math.round(Array.from(categoryItemCounts.values()).reduce((sum, count) => sum + count, 0) / categories.length)
        : 0,
      mostPopularType: getMostPopularCategoryType(categories),
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
          includeInactive,
          includeItemCount,
          customFields: fields.length > 0 ? fields : null
        }
      }
    })

  } catch (error) {
    console.error('Error exporting menu categories:', error)
    return NextResponse.json(
      { success: false, message: "Failed to export menu categories" },
      { status: 500 }
    )
  }
})

function getMostPopularCategoryType(categories: any[]): string {
  const typeCounts: { [key: string]: number } = {}
  
  categories.forEach(category => {
    const type = category.categoryType || 'unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  
  let maxCount = 0
  let mostPopular = 'main_course'
  
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostPopular = type
    }
  })
  
  return mostPopular
}