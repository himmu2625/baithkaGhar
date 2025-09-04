import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get stock movements for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const itemId = searchParams.get('itemId')
    const movementType = searchParams.get('movementType')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

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

    if (itemId && Types.ObjectId.isValid(itemId)) {
      query._id = new Types.ObjectId(itemId)
    }

    // Get inventory items with usage history
    const inventoryItems = await FBInventory.find(query)
      .select('itemName consumptionTracking.usageHistory')
      .lean()

    // Flatten and transform usage history into movements
    const movements: any[] = []
    
    inventoryItems.forEach(item => {
      const usageHistory = item.consumptionTracking?.usageHistory || []
      
      usageHistory.forEach((usage: any, index: number) => {
        if (!movementType || usage.purpose === movementType) {
          // Calculate previous and new stock (simplified calculation)
          const movement = {
            id: `${item._id}_${index}`,
            itemId: item._id.toString(),
            itemName: item.itemName,
            movementType: usage.purpose === 'production' ? 'out' : 
                         usage.purpose === 'waste' ? 'waste' :
                         usage.quantityUsed < 0 ? 'in' : 'out',
            quantity: Math.abs(usage.quantityUsed),
            previousStock: 0, // Would need separate tracking
            newStock: 0, // Would need separate tracking  
            reason: usage.purpose || 'Usage',
            reference: usage.orderId?.toString() || usage.recipeId?.toString(),
            cost: usage.quantityUsed * 10, // Simplified cost calculation
            performedBy: usage.usedBy?.toString() || 'system',
            timestamp: usage.date,
            notes: usage.notes
          }
          movements.push(movement)
        }
      })
    })

    // Sort by timestamp descending
    movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Paginate results
    const startIndex = (page - 1) * limit
    const paginatedMovements = movements.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      movements: paginatedMovements,
      pagination: {
        current: page,
        total: Math.ceil(movements.length / limit),
        totalItems: movements.length,
        hasNext: page < Math.ceil(movements.length / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching inventory movements:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch inventory movements" },
      { status: 500 }
    )
  }
})

// POST handler - Record new stock movement
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
    const { itemId, movementType, quantity, reason, reference, notes } = body

    if (!itemId || !Types.ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { success: false, message: "Valid item ID is required" },
        { status: 400 }
      )
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid quantity is required" },
        { status: 400 }
      )
    }

    // Find the inventory item
    const inventoryItem = await FBInventory.findById(itemId)
    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found" },
        { status: 404 }
      )
    }

    const previousStock = inventoryItem.stockLevels.currentStock

    // Update stock based on movement type
    const operation = movementType === 'in' ? 'add' : 'subtract'
    const purpose = movementType === 'waste' ? 'waste' : 
                   movementType === 'out' ? 'production' : 'production'

    await inventoryItem.updateStock(quantity, operation, purpose, token.sub)

    // Record in usage history
    if (!inventoryItem.consumptionTracking) {
      inventoryItem.consumptionTracking = { usageHistory: [] }
    }

    inventoryItem.consumptionTracking.usageHistory.push({
      date: new Date(),
      quantityUsed: movementType === 'in' ? -quantity : quantity,
      purpose: purpose as any,
      usedBy: new Types.ObjectId(token.sub),
      notes: notes || reason
    })

    if (reference) {
      const lastUsage = inventoryItem.consumptionTracking.usageHistory[
        inventoryItem.consumptionTracking.usageHistory.length - 1
      ] as any
      if (Types.ObjectId.isValid(reference)) {
        lastUsage.orderId = new Types.ObjectId(reference)
      }
    }

    await inventoryItem.save()

    return NextResponse.json({
      success: true,
      movement: {
        id: inventoryItem._id.toString(),
        itemId: inventoryItem._id.toString(),
        itemName: inventoryItem.itemName,
        movementType,
        quantity,
        previousStock,
        newStock: inventoryItem.stockLevels.currentStock,
        reason: reason || 'Stock movement',
        reference,
        performedBy: token.sub,
        timestamp: new Date().toISOString(),
        notes
      }
    })

  } catch (error) {
    console.error('Error recording stock movement:', error)
    return NextResponse.json(
      { success: false, message: "Failed to record stock movement" },
      { status: 500 }
    )
  }
})