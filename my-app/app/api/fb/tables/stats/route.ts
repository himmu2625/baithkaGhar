import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Table from "@/models/Table"
import Order from "@/models/Order"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get table statistics for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const period = searchParams.get('period') || 'today' // today, week, month

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let startDate = new Date()
    let endDate = new Date()

    switch (period) {
      case 'today':
        startDate = today
        endDate = tomorrow
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        endDate = tomorrow
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
    }

    // Get all active tables for the property
    const tables = await Table.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).lean() as any[]

    if (tables.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalTables: 0,
          availableTables: 0,
          occupiedTables: 0,
          reservedTables: 0,
          totalCapacity: 0,
          currentOccupancy: 0,
          occupancyRate: 0,
          averageTurnoverTime: 0,
          totalRevenue: 0
        }
      })
    }

    // Get current table statuses by checking active orders and reservations
    const [
      activeOrders,
      todayReservations,
      completedOrders,
      revenueData
    ] = await Promise.all([
      // Get active orders to determine occupied tables
      Order.find({
        tableId: { $in: tables.map(t => t._id) },
        status: { $in: ['confirmed', 'preparing', 'ready', 'served'] },
        orderType: 'dine_in'
      }).lean(),

      // Get today's reservations to determine reserved tables
      Reservation.find({
        'tableAssignment.assignedTableId': { $in: tables.map(t => t._id) },
        'reservationDetails.reservationDate': { $gte: today, $lt: tomorrow },
        status: { $in: ['confirmed', 'pending'] },
        isActive: true
      }).lean(),

      // Get completed orders for turnover calculation
      Order.find({
        tableId: { $in: tables.map(t => t._id) },
        status: 'completed',
        orderType: 'dine_in',
        'timestamps.ordered': { $gte: startDate, $lte: endDate }
      }).lean(),

      // Get revenue data
      Order.aggregate([
        {
          $match: {
            tableId: { $in: tables.map(t => t._id) },
            status: 'completed',
            orderType: 'dine_in',
            'timestamps.ordered': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' },
            totalOrders: { $sum: 1 }
          }
        }
      ])
    ])

    // Calculate table status counts
    const occupiedTableIds = new Set(activeOrders.map(order => order.tableId.toString()))
    const reservedTableIds = new Set(
      todayReservations.map(res => res.tableAssignment?.assignedTableId?.toString()).filter(Boolean)
    )

    // Remove occupied tables from reserved (since occupied takes precedence)
    reservedTableIds.forEach(tableId => {
      if (occupiedTableIds.has(tableId)) {
        reservedTableIds.delete(tableId)
      }
    })

    const occupiedTables = occupiedTableIds.size
    const reservedTables = reservedTableIds.size
    const totalTables = tables.length
    const availableTables = totalTables - occupiedTables - reservedTables

    // Calculate total capacity and current occupancy
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
    const currentOccupancy = activeOrders.reduce((sum, order) => {
      return sum + (order.guestInfo?.partySize || 1)
    }, 0)

    // Calculate occupancy rate
    const occupancyRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0

    // Calculate average turnover time
    let averageTurnoverTime = 0
    if (completedOrders.length > 0) {
      const turnoverTimes = completedOrders
        .filter(order => order.timestamps?.ordered && order.timestamps?.served)
        .map(order => {
          const orderTime = new Date(order.timestamps.ordered).getTime()
          const serveTime = new Date(order.timestamps.served).getTime()
          return (serveTime - orderTime) / (1000 * 60) // Convert to minutes
        })

      if (turnoverTimes.length > 0) {
        averageTurnoverTime = Math.round(
          turnoverTimes.reduce((sum, time) => sum + time, 0) / turnoverTimes.length
        )
      }
    }

    // Get revenue data
    const revenueStats = revenueData[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 }

    // Calculate section breakdown
    const sectionStats = {}
    tables.forEach(table => {
      if (!sectionStats[table.section]) {
        sectionStats[table.section] = {
          totalTables: 0,
          availableTables: 0,
          occupiedTables: 0,
          reservedTables: 0,
          totalCapacity: 0,
          currentOccupancy: 0
        }
      }

      const section = sectionStats[table.section]
      section.totalTables++
      section.totalCapacity += table.capacity

      const tableId = table._id.toString()
      if (occupiedTableIds.has(tableId)) {
        section.occupiedTables++
        // Add occupancy from active orders for this table
        const tableOrders = activeOrders.filter(order => order.tableId.toString() === tableId)
        section.currentOccupancy += tableOrders.reduce((sum, order) => sum + (order.guestInfo?.partySize || 1), 0)
      } else if (reservedTableIds.has(tableId)) {
        section.reservedTables++
      } else {
        section.availableTables++
      }
    })

    // Calculate peak hours from completed orders
    const hourlyStats = {}
    completedOrders.forEach(order => {
      if (order.timestamps?.ordered) {
        const hour = new Date(order.timestamps.ordered).getHours()
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
      }
    })

    const peakHour = Object.entries(hourlyStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    const stats = {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      totalCapacity,
      currentOccupancy,
      occupancyRate,
      averageTurnoverTime,
      totalRevenue: Math.round(revenueStats.totalRevenue),
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      breakdown: {
        sectionStats,
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
        totalOrders: revenueStats.totalOrders,
        averageOrderValue: Math.round(revenueStats.averageOrderValue || 0),
        tablesInService: totalTables - tables.filter(t => t.status === 'out_of_order').length,
        tablesNeedingCleaning: tables.filter(t => t.status === 'cleaning').length,
        tablesOutOfOrder: tables.filter(t => t.status === 'out_of_order').length
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching table statistics:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch table statistics" },
      { status: 500 }
    )
  }
})