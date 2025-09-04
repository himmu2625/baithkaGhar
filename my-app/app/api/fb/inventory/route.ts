import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all inventory items for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const lowStock = searchParams.get('lowStock') === 'true'
    const expiring = searchParams.get('expiring') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { 
      propertyId: new Types.ObjectId(propertyId),
      isActive: true 
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (status && status !== 'all') {
      query.status = status
    }

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (lowStock) {
      query['alerts.lowStock'] = true
    }

    if (expiring) {
      query['alerts.nearExpiry'] = true
    }

    // Get total count
    const total = await FBInventory.countDocuments(query)

    // Get paginated results
    const inventory = await FBInventory.find(query)
      .sort({ 'alerts.lowStock': -1, 'alerts.nearExpiry': -1, itemName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Transform data for frontend compatibility
    const transformedInventory = inventory.map(item => ({
      id: item._id.toString(),
      name: item.itemName,
      description: item.description,
      category: item.category,
      subcategory: item.subCategory,
      unit: item.units.baseUnit,
      currentStock: item.stockLevels.currentStock,
      minimumStock: item.stockLevels.minimumStock,
      maximumStock: item.stockLevels.maximumStock,
      reorderLevel: item.stockLevels.reorderPoint,
      costPrice: item.costingInfo.unitCost,
      sellingPrice: item.costingInfo.standardCost,
      supplier: item.suppliers?.find(s => s.isPrimary)?.supplierName || 'N/A',
      supplierContact: item.suppliers?.find(s => s.isPrimary)?.supplierItemCode,
      location: item.storageInfo.location ? 
        `${item.storageInfo.location.warehouse || ''} ${item.storageInfo.location.section || ''}`.trim() || 'Storage' :
        'Storage',
      expiryDate: item.expiryTracking?.batches?.find(b => b.status === 'active')?.expiryDate,
      batchNumber: item.expiryTracking?.batches?.find(b => b.status === 'active')?.batchNumber,
      status: item.stockLevels.currentStock === 0 ? 'out_of_stock' :
              item.alerts.lowStock ? 'low_stock' : 'in_stock',
      isPerishable: item.expiryTracking?.isPerishable || false,
      lastRestocked: item.stockLevels.lastStockUpdate,
      lastUpdated: item.updatedAt,
      createdBy: item.createdBy?.toString(),
      notes: item.description
    }))

    return NextResponse.json({
      success: true,
      inventory: transformedInventory,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
})

// POST handler - Create new inventory item
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
    const { propertyId, ...itemData } = body

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Create new inventory item
    const inventoryItem = new FBInventory({
      propertyId: new Types.ObjectId(propertyId),
      itemCode: itemData.itemCode,
      itemName: itemData.name,
      category: itemData.category,
      subCategory: itemData.subcategory,
      description: itemData.description,
      units: {
        baseUnit: itemData.unit,
        purchaseUnit: itemData.unit,
        consumptionUnit: itemData.unit
      },
      stockLevels: {
        currentStock: itemData.currentStock || 0,
        minimumStock: itemData.minimumStock || 0,
        maximumStock: itemData.maximumStock,
        reorderPoint: itemData.reorderLevel || itemData.minimumStock || 0,
        reorderQuantity: itemData.reorderQuantity || 10
      },
      costingInfo: {
        unitCost: itemData.costPrice || 0,
        standardCost: itemData.sellingPrice
      },
      suppliers: itemData.supplier ? [{
        supplierName: itemData.supplier,
        supplierItemCode: itemData.supplierContact,
        isPrimary: true
      }] : [],
      storageInfo: {
        location: {
          warehouse: itemData.location || 'Storage'
        },
        storageType: itemData.storageType || 'room_temperature'
      },
      expiryTracking: {
        isPerishable: itemData.isPerishable || false
      },
      status: 'active',
      createdBy: new Types.ObjectId(token.sub)
    })

    await inventoryItem.save()

    return NextResponse.json({
      success: true,
      item: {
        id: inventoryItem._id.toString(),
        message: "Inventory item created successfully"
      }
    })

  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { success: false, message: "Failed to create inventory item" },
      { status: 500 }
    )
  }
})