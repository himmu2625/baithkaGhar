import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import FBInventory from "@/models/FBInventory"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Export inventory items
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
    const category = searchParams.get('category')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true'
    const outOfStockOnly = searchParams.get('outOfStockOnly') === 'true'
    const expiringOnly = searchParams.get('expiringOnly') === 'true'
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

    if (category) {
      query.category = category
    }

    if (lowStockOnly) {
      query['alerts.lowStock'] = true
    }

    if (outOfStockOnly) {
      query['stockLevels.currentStock'] = 0
    }

    if (expiringOnly) {
      query['alerts.nearExpiry'] = true
    }

    // Get inventory items
    const inventoryItems = await FBInventory.find(query)
      .sort({ category: 1, itemName: 1 })
      .lean()

    // Transform data for export
    const exportData = inventoryItems.map(item => {
      const baseData = {
        'Item ID': item._id.toString(),
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        'Description': item.description || '',
        'Category': item.category,
        'Sub Category': item.subCategory || '',
        
        // Stock Information
        'Current Stock': item.stockLevels?.currentStock || 0,
        'Available Stock': item.stockLevels?.availableStock || 0,
        'Reserved Stock': item.stockLevels?.reservedStock || 0,
        'Minimum Stock': item.stockLevels?.minimumStock || 0,
        'Maximum Stock': item.stockLevels?.maximumStock || 0,
        'Reorder Point': item.stockLevels?.reorderPoint || 0,
        'Reorder Quantity': item.stockLevels?.reorderQuantity || 0,
        'Last Stock Update': item.stockLevels?.lastStockUpdate ? new Date(item.stockLevels.lastStockUpdate).toISOString() : '',
        
        // Units
        'Base Unit': item.units?.baseUnit || '',
        'Purchase Unit': item.units?.purchaseUnit || '',
        'Consumption Unit': item.units?.consumptionUnit || '',
        
        // Costing Information
        'Unit Cost': item.costingInfo?.unitCost || 0,
        'Average Cost': item.costingInfo?.averageCost || 0,
        'Last Purchase Price': item.costingInfo?.lastPurchasePrice || 0,
        'Standard Cost': item.costingInfo?.standardCost || 0,
        'Total Value': item.costingInfo?.totalValue || 0,
        'Currency': item.costingInfo?.currency || 'INR',
        
        // Supplier Information
        'Primary Supplier': item.suppliers?.find(s => s.isPrimary)?.supplierName || '',
        'Supplier Item Code': item.suppliers?.find(s => s.isPrimary)?.supplierItemCode || '',
        'Supplier Price': item.suppliers?.find(s => s.isPrimary)?.unitPrice || 0,
        'Supplier Lead Time': item.suppliers?.find(s => s.isPrimary)?.leadTime || '',
        'All Suppliers': item.suppliers?.map(s => `${s.supplierName} (${s.unitPrice || 0})`).join('; ') || '',
        
        // Storage Information
        'Storage Location': [
          item.storageInfo?.location?.warehouse,
          item.storageInfo?.location?.section,
          item.storageInfo?.location?.shelf
        ].filter(Boolean).join(' - ') || '',
        'Storage Type': item.storageInfo?.storageType || '',
        'Temperature Min': item.storageInfo?.storageConditions?.temperature?.min || '',
        'Temperature Max': item.storageInfo?.storageConditions?.temperature?.max || '',
        'Humidity Min': item.storageInfo?.storageConditions?.humidity?.min || '',
        'Humidity Max': item.storageInfo?.storageConditions?.humidity?.max || '',
        'Special Storage Requirements': item.storageInfo?.storageConditions?.specialRequirements || '',
        
        // Expiry Tracking
        'Is Perishable': item.expiryTracking?.isPerishable ? 'Yes' : 'No',
        'Shelf Life (days)': item.expiryTracking?.shelfLife || '',
        'Near Expiry Days': item.expiryTracking?.nearExpiryDays || 7,
        'Active Batches': item.expiryTracking?.batches?.filter(b => b.status === 'active').length || 0,
        'Next Expiry Date': getNextExpiryDate(item.expiryTracking?.batches || []),
        
        // Consumption Tracking
        'Average Daily Usage': item.consumptionTracking?.averageDailyUsage || 0,
        'Average Weekly Usage': item.consumptionTracking?.averageWeeklyUsage || 0,
        'Average Monthly Usage': item.consumptionTracking?.averageMonthlyUsage || 0,
        'Last Used Date': item.consumptionTracking?.lastUsedDate ? new Date(item.consumptionTracking.lastUsedDate).toISOString() : '',
        'Turnover Rate': item.consumptionTracking?.turnoverRate || 0,
        
        // Analytics
        'Total Purchased': item.analytics?.totalPurchased || 0,
        'Total Consumed': item.analytics?.totalConsumed || 0,
        'Total Wasted': item.analytics?.totalWasted || 0,
        'Waste Percentage': item.analytics?.wastePercentage || 0,
        'Total Purchase Cost': item.analytics?.costAnalysis?.totalPurchaseCost || 0,
        'Total Waste Cost': item.analytics?.costAnalysis?.totalWasteCost || 0,
        
        // Alerts
        'Low Stock Alert': item.alerts?.lowStock ? 'Yes' : 'No',
        'Near Expiry Alert': item.alerts?.nearExpiry ? 'Yes' : 'No',
        'Over Stock Alert': item.alerts?.overStock ? 'Yes' : 'No',
        'Quality Issue Alert': item.alerts?.qualityIssue ? 'Yes' : 'No',
        
        // Menu Usage
        'Used in Menu Items': item.menuUsage?.usedInMenuItems?.map(u => u.menuItemName).join('; ') || '',
        'Used in Recipes': item.menuUsage?.usedInRecipes?.map(u => u.recipeName).join('; ') || '',
        
        // Status and Metadata
        'Status': item.status || 'active',
        'Active': item.isActive ? 'Yes' : 'No',
        'Created At': item.createdAt ? new Date(item.createdAt).toISOString() : '',
        'Updated At': item.updatedAt ? new Date(item.updatedAt).toISOString() : '',
        
        // Quality Control
        'Requires Inspection': item.qualityControl?.requiresInspection ? 'Yes' : 'No',
        'Inspection Frequency': item.qualityControl?.inspectionFrequency || '',
        'Next Inspection Date': item.qualityControl?.nextInspectionDate ? new Date(item.qualityControl.nextInspectionDate).toISOString() : '',
        'Last Quality Rating': getLastQualityRating(item.qualityControl?.inspectionHistory || []),
        
        // Procurement
        'Auto Reorder Enabled': item.procurement?.autoReorderEnabled ? 'Yes' : 'No',
        'Pending Orders Count': item.procurement?.pendingOrders?.length || 0,
        'Last Order Date': item.procurement?.lastOrderDate ? new Date(item.procurement.lastOrderDate).toISOString() : '',
        'Order Frequency': item.procurement?.orderFrequency || ''
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

    // Calculate summary statistics
    const summary = {
      totalItems: exportData.length,
      activeItems: inventoryItems.filter(item => item.isActive).length,
      categories: [...new Set(inventoryItems.map(item => item.category))],
      totalValue: Math.round(inventoryItems.reduce((sum, item) => sum + (item.costingInfo?.totalValue || 0), 0)),
      lowStockItems: inventoryItems.filter(item => item.alerts?.lowStock).length,
      outOfStockItems: inventoryItems.filter(item => (item.stockLevels?.currentStock || 0) === 0).length,
      nearExpiryItems: inventoryItems.filter(item => item.alerts?.nearExpiry).length,
      perishableItems: inventoryItems.filter(item => item.expiryTracking?.isPerishable).length,
      averageStockValue: inventoryItems.length > 0 
        ? Math.round(inventoryItems.reduce((sum, item) => sum + (item.costingInfo?.totalValue || 0), 0) / inventoryItems.length)
        : 0,
      categoryBreakdown: getCategoryBreakdown(inventoryItems),
      stockStatusBreakdown: getStockStatusBreakdown(inventoryItems),
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
          category,
          includeInactive,
          lowStockOnly,
          outOfStockOnly,
          expiringOnly,
          customFields: fields.length > 0 ? fields : null
        }
      }
    })

  } catch (error) {
    console.error('Error exporting inventory items:', error)
    return NextResponse.json(
      { success: false, message: "Failed to export inventory items" },
      { status: 500 }
    )
  }
})

function getNextExpiryDate(batches: any[]): string {
  const activeBatches = batches.filter(batch => batch.status === 'active' && batch.expiryDate)
  if (activeBatches.length === 0) return ''
  
  const nextExpiry = activeBatches.reduce((earliest, batch) => {
    const expiryDate = new Date(batch.expiryDate)
    return expiryDate < earliest ? expiryDate : earliest
  }, new Date(activeBatches[0].expiryDate))
  
  return nextExpiry.toISOString()
}

function getLastQualityRating(inspectionHistory: any[]): number | string {
  if (inspectionHistory.length === 0) return ''
  
  const lastInspection = inspectionHistory.reduce((latest, inspection) => {
    const inspectionDate = new Date(inspection.inspectionDate)
    const latestDate = new Date(latest.inspectionDate)
    return inspectionDate > latestDate ? inspection : latest
  })
  
  return lastInspection.qualityRating || ''
}

function getCategoryBreakdown(items: any[]) {
  const breakdown: { [key: string]: { count: number; value: number } } = {}
  
  items.forEach(item => {
    const category = item.category || 'unknown'
    if (!breakdown[category]) {
      breakdown[category] = { count: 0, value: 0 }
    }
    breakdown[category].count++
    breakdown[category].value += item.costingInfo?.totalValue || 0
  })
  
  return breakdown
}

function getStockStatusBreakdown(items: any[]) {
  return {
    inStock: items.filter(item => (item.stockLevels?.currentStock || 0) > (item.stockLevels?.minimumStock || 0)).length,
    lowStock: items.filter(item => item.alerts?.lowStock).length,
    outOfStock: items.filter(item => (item.stockLevels?.currentStock || 0) === 0).length,
    overStock: items.filter(item => item.alerts?.overStock).length
  }
}