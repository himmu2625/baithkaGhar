import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import MenuItem from "@/models/MenuItem"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// POST handler - Import menu items
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
    const body = await req.json()
    const { propertyId, items, options = {} } = body

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Items array is required and cannot be empty" },
        { status: 400 }
      )
    }

    const { skipExisting = false, updateExisting = false } = options
    
    const results = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Get all existing categories for this property
    const categories = await MenuCategory.find({
      propertyId: new Types.ObjectId(propertyId)
    }).lean()

    const categoryMap = new Map()
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id)
    })

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      try {
        // Find or create category
        let categoryId: Types.ObjectId
        const categoryName = item.categoryName?.trim()
        
        if (!categoryName) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Category name is required`)
          continue
        }

        const categoryKey = categoryName.toLowerCase()
        if (categoryMap.has(categoryKey)) {
          categoryId = categoryMap.get(categoryKey)
        } else {
          // Create new category
          const newCategory = new MenuCategory({
            name: categoryName,
            propertyId: new Types.ObjectId(propertyId),
            displayOrder: categories.length,
            isActive: true,
            createdBy: new Types.ObjectId(token.sub),
            categoryType: 'main_course' // Default category type
          })

          const savedCategory = await newCategory.save()
          categoryId = savedCategory._id
          categoryMap.set(categoryKey, categoryId)
          
          results.warnings.push(`Row ${i + 1}: Created new category "${categoryName}"`)
        }

        // Check if item already exists
        const existingItem = await MenuItem.findOne({
          propertyId: new Types.ObjectId(propertyId),
          name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') }
        })

        if (existingItem) {
          if (skipExisting) {
            results.skipped++
            continue
          } else if (updateExisting) {
            // Update existing item
            await MenuItem.findByIdAndUpdate(existingItem._id, {
              ...item,
              categoryId,
              propertyId: new Types.ObjectId(propertyId),
              lastUpdatedBy: new Types.ObjectId(token.sub),
              updatedAt: new Date()
            })
            results.updated++
            continue
          } else {
            results.failed++
            results.errors.push(`Row ${i + 1}: Item "${item.name}" already exists`)
            continue
          }
        }

        // Create new menu item
        const newItem = new MenuItem({
          ...item,
          categoryId,
          propertyId: new Types.ObjectId(propertyId),
          createdBy: new Types.ObjectId(token.sub),
          lastUpdatedBy: new Types.ObjectId(token.sub),
          // Set default availability schedule
          availabilitySchedule: {
            allDay: true,
            timeSlots: []
          }
        })

        await newItem.save()
        results.imported++

      } catch (error) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    results.success = results.failed === 0

    return NextResponse.json({
      success: true,
      importResults: results,
      summary: {
        totalProcessed: items.length,
        successful: results.imported + results.updated,
        failed: results.failed,
        skipped: results.skipped
      }
    })

  } catch (error) {
    console.error('Error importing menu items:', error)
    return NextResponse.json(
      { success: false, message: "Failed to import menu items" },
      { status: 500 }
    )
  }
})