import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// POST handler - Import inventory items
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

    const { skipExisting = false, updateExisting = false, updateStock = false } = options
    
    const results = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      stockUpdated: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Valid categories for validation
    const validCategories = [
      'produce', 'meat_poultry', 'seafood', 'dairy', 'dry_goods', 'spices_condiments',
      'beverages', 'alcohol', 'frozen', 'bakery', 'cleaning_supplies', 'disposables',
      'equipment', 'utensils', 'linens', 'packaging'
    ]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      try {
        // Validate required fields
        if (!item.itemCode || typeof item.itemCode !== 'string' || item.itemCode.trim() === '') {
          results.failed++
          results.errors.push(`Row ${i + 1}: Item Code is required`)
          continue
        }

        if (!item.itemName || typeof item.itemName !== 'string' || item.itemName.trim() === '') {
          results.failed++
          results.errors.push(`Row ${i + 1}: Item Name is required`)
          continue
        }

        // Validate category
        let category = item.category?.toLowerCase().replace(/\s+/g, '_') || 'dry_goods'
        if (!validCategories.includes(category)) {
          results.warnings.push(`Row ${i + 1}: Invalid category "${item.category}", using "dry_goods"`)
          category = 'dry_goods'
        }

        // Validate numeric fields
        const numericFields = ['currentStock', 'minimumStock', 'maximumStock', 'unitCost']
        for (const field of numericFields) {
          if (item[field] !== undefined && item[field] !== '' && (isNaN(Number(item[field])) || Number(item[field]) < 0)) {
            results.failed++
            results.errors.push(`Row ${i + 1}: ${field} must be a valid non-negative number`)
            continue
          }
        }

        // Check if item already exists (by itemCode and propertyId)
        const existingItem = await FBInventory.findOne({
          propertyId: new Types.ObjectId(propertyId),
          itemCode: item.itemCode.trim().toUpperCase()
        })

        if (existingItem) {
          if (skipExisting) {
            results.skipped++
            continue
          } else if (updateExisting) {
            // Prepare update data
            const updateData = {
              itemName: item.itemName.trim(),
              category,
              subCategory: item.subCategory?.trim() || '',
              description: item.description?.trim() || '',
              units: {
                baseUnit: item.unit?.toLowerCase() || 'piece',
                purchaseUnit: item.unit?.toLowerCase() || 'piece',
                consumptionUnit: item.unit?.toLowerCase() || 'piece'
              },
              stockLevels: {
                minimumStock: Number(item.minimumStock) || 0,
                maximumStock: Number(item.maximumStock) || 100,
                reorderPoint: Number(item.minimumStock) || 0,
                reorderQuantity: Number(item.reorderQuantity) || 10
              },
              costingInfo: {
                unitCost: Number(item.unitCost) || 0
              },
              storageInfo: {
                location: {
                  warehouse: item.location?.trim() || 'Storage'
                }
              },
              lastUpdatedBy: new Types.ObjectId(token.sub),
              updatedAt: new Date()
            }

            // Update stock only if explicitly requested and current stock is provided
            if (updateStock && item.currentStock !== undefined) {
              updateData.stockLevels.currentStock = Number(item.currentStock) || 0
              updateData.stockLevels.lastStockUpdate = new Date()
              results.stockUpdated++
            }

            // Update suppliers if provided
            if (item.supplier?.trim()) {
              updateData.suppliers = [{
                supplierName: item.supplier.trim(),
                supplierItemCode: item.supplierCode?.trim() || '',
                isPrimary: true
              }]
            }

            await FBInventory.findByIdAndUpdate(existingItem._id, updateData)
            results.updated++
            continue
          } else {
            results.failed++
            results.errors.push(`Row ${i + 1}: Item with code "${item.itemCode}" already exists`)
            continue
          }
        }

        // Create new inventory item
        const newItem = new FBInventory({
          propertyId: new Types.ObjectId(propertyId),
          itemCode: item.itemCode.trim().toUpperCase(),
          itemName: item.itemName.trim(),
          category,
          subCategory: item.subCategory?.trim() || '',
          description: item.description?.trim() || '',
          
          units: {
            baseUnit: item.unit?.toLowerCase() || 'piece',
            purchaseUnit: item.unit?.toLowerCase() || 'piece',
            consumptionUnit: item.unit?.toLowerCase() || 'piece'
          },
          
          stockLevels: {
            currentStock: Number(item.currentStock) || 0,
            minimumStock: Number(item.minimumStock) || 0,
            maximumStock: Number(item.maximumStock) || 100,
            reorderPoint: Number(item.minimumStock) || 0,
            reorderQuantity: Number(item.reorderQuantity) || 10,
            reservedStock: 0,
            availableStock: Number(item.currentStock) || 0,
            lastStockUpdate: new Date()
          },
          
          costingInfo: {
            unitCost: Number(item.unitCost) || 0,
            currency: 'INR',
            totalValue: (Number(item.currentStock) || 0) * (Number(item.unitCost) || 0)
          },
          
          suppliers: item.supplier?.trim() ? [{
            supplierName: item.supplier.trim(),
            supplierItemCode: item.supplierCode?.trim() || '',
            isPrimary: true,
            unitPrice: Number(item.unitCost) || 0
          }] : [],
          
          storageInfo: {
            location: {
              warehouse: item.location?.trim() || 'Storage'
            },
            storageType: item.storageType || 'room_temperature'
          },
          
          expiryTracking: {
            isPerishable: item.isPerishable === true || item.isPerishable === 'true' || item.isPerishable === 'yes'
          },
          
          status: 'active',
          isActive: true,
          createdBy: new Types.ObjectId(token.sub),
          lastUpdatedBy: new Types.ObjectId(token.sub)
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
        skipped: results.skipped,
        stockUpdated: results.stockUpdated
      }
    })

  } catch (error) {
    console.error('Error importing inventory items:', error)
    return NextResponse.json(
      { success: false, message: "Failed to import inventory items" },
      { status: 500 }
    )
  }
})