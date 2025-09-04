import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Table from "@/models/Table"
import Order from "@/models/Order"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all tables for a property
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { propertyId: string } }) => {
  try {
    await connectMongo()
    const { propertyId } = params

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid property ID" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section')
    const status = searchParams.get('status')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const withOrders = searchParams.get('withOrders') === 'true'

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (section) {
      query.section = section
    }
    
    if (status) {
      query.status = status
    }
    
    if (!includeInactive) {
      query.isActive = true
    }

    const tables = await Table.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ section: 1, number: 1 })
      .lean() as any[]

    // Get current orders for each table if requested
    const tablesWithDetails = await Promise.all(
      tables.map(async (table) => {
        let currentOrder = null
        let orderHistory = null

        if (withOrders) {
          // Get current active order
          currentOrder = await Order.findOne({
            tableId: table._id,
            status: { $in: ['confirmed', 'preparing', 'ready'] },
            orderType: 'dine_in'
          })
          .populate('items.itemId', 'name basePrice')
          .sort({ 'timestamps.ordered': -1 })
          .lean() as any

          // Get recent order history (last 10 orders)
          orderHistory = await Order.find({
            tableId: table._id,
            orderType: 'dine_in'
          })
          .select('orderNumber status timestamps.ordered timestamps.served guestInfo.name pricing.total')
          .sort({ 'timestamps.ordered': -1 })
          .limit(10)
          .lean() as any[]
        }

        return {
          id: table._id.toString(),
          number: table.number,
          capacity: table.capacity,
          section: table.section,
          status: table.status,
          features: table.features || [],
          location: table.location || null,
          isActive: table.isActive,
          minimumSpend: table.minimumSpend || 0,
          notes: table.notes || '',
          qrCode: table.qrCode || null,
          settings: table.settings,
          currentOrder: currentOrder ? {
            id: currentOrder._id.toString(),
            orderNumber: currentOrder.orderNumber,
            status: currentOrder.status,
            guestName: currentOrder.guestInfo.name,
            totalAmount: currentOrder.pricing.total,
            orderedAt: currentOrder.timestamps.ordered,
            itemCount: currentOrder.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          } : null,
          recentOrders: orderHistory?.map((order: any) => ({
            id: order._id.toString(),
            orderNumber: order.orderNumber,
            status: order.status,
            guestName: order.guestInfo.name,
            totalAmount: order.pricing.total,
            orderedAt: order.timestamps.ordered,
            servedAt: order.timestamps.served
          })) || [],
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          createdBy: table.createdBy,
          lastUpdatedBy: table.lastUpdatedBy
        }
      })
    )

    // Get summary statistics
    const sections = Array.from(new Set(tables.map(table => table.section)))
    const sectionStats = sections.map(sectionName => {
      const sectionTables = tables.filter(table => table.section === sectionName)
      return {
        section: sectionName,
        totalTables: sectionTables.length,
        available: sectionTables.filter(table => table.status === 'available').length,
        occupied: sectionTables.filter(table => table.status === 'occupied').length,
        reserved: sectionTables.filter(table => table.status === 'reserved').length,
        cleaning: sectionTables.filter(table => table.status === 'cleaning').length,
        outOfOrder: sectionTables.filter(table => table.status === 'out_of_order').length,
        totalCapacity: sectionTables.reduce((sum, table) => sum + table.capacity, 0)
      }
    })

    const overallStats = {
      totalTables: tables.length,
      activeTables: tables.filter(table => table.isActive).length,
      totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0),
      statusBreakdown: {
        available: tables.filter(table => table.status === 'available').length,
        occupied: tables.filter(table => table.status === 'occupied').length,
        reserved: tables.filter(table => table.status === 'reserved').length,
        cleaning: tables.filter(table => table.status === 'cleaning').length,
        outOfOrder: tables.filter(table => table.status === 'out_of_order').length
      },
      sectionStats
    }

    return NextResponse.json({
      success: true,
      tables: tablesWithDetails,
      statistics: overallStats
    })

  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch tables" },
      { status: 500 }
    )
  }
})