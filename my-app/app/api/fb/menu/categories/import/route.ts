import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import MenuCategory from "@/models/MenuCategory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// POST handler - Import menu categories
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
    const { propertyId, categories, options = {} } = body

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, message: "Categories array is required and cannot be empty" },
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

    // Valid category types
    const validCategoryTypes = [
      'appetizer', 'main_course', 'dessert', 'beverage', 'snack', 'salad', 
      'soup', 'breakfast', 'lunch', 'dinner', 'alcoholic', 'non_alcoholic', 
      'hot_beverage', 'cold_beverage'
    ]

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      
      try {
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
          results.failed++
          results.errors.push(`Row ${i + 1}: Category name is required`)
          continue
        }

        // Validate category type if provided
        let categoryType = category.categoryType || 'main_course'
        if (!validCategoryTypes.includes(categoryType)) {
          results.warnings.push(`Row ${i + 1}: Invalid category type "${categoryType}", using "main_course"`)
          categoryType = 'main_course'
        }

        // Check if category already exists
        const existingCategory = await MenuCategory.findOne({
          propertyId: new Types.ObjectId(propertyId),
          name: { $regex: new RegExp(`^${category.name.trim()}$`, 'i') }
        })

        if (existingCategory) {
          if (skipExisting) {
            results.skipped++
            continue
          } else if (updateExisting) {
            // Update existing category
            await MenuCategory.findByIdAndUpdate(existingCategory._id, {
              name: category.name.trim(),
              description: category.description?.trim() || '',
              categoryType,
              displayOrder: Number(category.displayOrder) || 0,
              isActive: category.isActive !== undefined ? category.isActive : true,
              lastUpdatedBy: new Types.ObjectId(token.sub),
              updatedAt: new Date()
            })
            results.updated++
            continue
          } else {
            results.failed++
            results.errors.push(`Row ${i + 1}: Category "${category.name}" already exists`)
            continue
          }
        }

        // Create new category
        const newCategory = new MenuCategory({
          name: category.name.trim(),
          description: category.description?.trim() || '',
          propertyId: new Types.ObjectId(propertyId),
          categoryType,
          displayOrder: Number(category.displayOrder) || 0,
          isActive: category.isActive !== undefined ? category.isActive : true,
          image: category.image?.trim() || '',
          
          // Set default availability schedule
          availabilitySchedule: {
            allDay: true,
            timeSlots: []
          },
          
          // Legacy support
          availableTime: {
            breakfast: true,
            lunch: true,
            dinner: true,
            allDay: true
          },
          
          // Default dietary options
          dietary: {
            vegetarian: false,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
            nutFree: false,
            halal: false,
            kosher: false,
            organic: false
          },
          
          createdBy: new Types.ObjectId(token.sub),
          lastUpdatedBy: new Types.ObjectId(token.sub)
        })

        await newCategory.save()
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
        totalProcessed: categories.length,
        successful: results.imported + results.updated,
        failed: results.failed,
        skipped: results.skipped
      }
    })

  } catch (error) {
    console.error('Error importing menu categories:', error)
    return NextResponse.json(
      { success: false, message: "Failed to import menu categories" },
      { status: 500 }
    )
  }
})