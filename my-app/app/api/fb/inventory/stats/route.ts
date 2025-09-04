import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get inventory statistics for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const period = searchParams.get('period') || 'month'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Get all active inventory items
    const inventoryItems = await FBInventory.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).lean()

    if (inventoryItems.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalItems: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          expiringItems: 0,
          topCategories: [],
          recentMovements: 0,
          wasteValue: 0
        }
      })
    }

    // Calculate basic statistics
    const totalItems = inventoryItems.length
    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (item.costingInfo?.totalValue || 0), 0
    )

    // Count items by status
    const lowStockItems = inventoryItems.filter(item => 
      item.alerts?.lowStock === true
    ).length

    const outOfStockItems = inventoryItems.filter(item => 
      (item.stockLevels?.currentStock || 0) === 0
    ).length

    // Check for expiring items (next 7 days)
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(now.getDate() + 7)

    const expiringItems = inventoryItems.filter(item => {
      const batches = item.expiryTracking?.batches || []
      return batches.some(batch => 
        batch.status === 'active' && 
        batch.expiryDate && 
        new Date(batch.expiryDate) <= nextWeek
      )
    }).length

    // Calculate category breakdown
    const categoryStats: { [key: string]: { count: number; value: number } } = {}
    
    inventoryItems.forEach(item => {
      const category = item.category || 'other'
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, value: 0 }
      }
      categoryStats[category].count += 1
      categoryStats[category].value += item.costingInfo?.totalValue || 0
    })

    // Convert to array and sort by value
    const topCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        value: Math.round(stats.value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Calculate recent movements (from usage history)
    let recentMovements = 0
    let totalWasteValue = 0

    // Calculate date range based on period
    const startDate = new Date()
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate.setMonth(startDate.getMonth() - 1)
    }

    inventoryItems.forEach(item => {
      const usageHistory = item.consumptionTracking?.usageHistory || []
      
      usageHistory.forEach(usage => {
        if (usage.date && new Date(usage.date) >= startDate) {
          recentMovements += 1
          
          // Calculate waste value
          if (usage.purpose === 'waste') {
            const wasteValue = Math.abs(usage.quantityUsed) * (item.costingInfo?.unitCost || 0)
            totalWasteValue += wasteValue
          }
        }
      })
    })

    const stats = {
      totalItems,
      totalValue: Math.round(totalValue),
      lowStockItems,
      outOfStockItems,
      expiringItems,
      topCategories,
      recentMovements,
      wasteValue: Math.round(totalWasteValue)
    }

    return NextResponse.json({
      success: true,
      stats,
      period,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching inventory statistics:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch inventory statistics" },
      { status: 500 }
    )
  }
})