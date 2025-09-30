import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import EnhancedRoom from "@/models/EnhancedRoom"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import dbConnect from "@/lib/db/dbConnect"
import { z } from "zod"

export const dynamic = 'force-dynamic'

// GET: Property overview dashboard
export async function GET(req: Request) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const includeForecasting = searchParams.get('forecasting') === 'true'

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }

    // Get all rooms for the property
    const rooms = await EnhancedRoom.find({ propertyId })
      .populate('currentBookingId', 'guestName checkIn checkOut bookingCode')
      .populate('housekeeping.assignedTo', 'name')
      .populate('maintenance.assignedTo', 'name')
      .lean()

    // Get today's bookings and upcoming arrivals/departures
    const todayStart = new Date(date)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const [
      todayArrivals,
      todayDepartures,
      tomorrowArrivals,
      upcomingBookings
    ] = await Promise.all([
      Booking.find({
        propertyId,
        dateFrom: { $gte: todayStart, $lt: todayEnd },
        status: { $in: ['confirmed', 'checked_in'] }
      }).populate('userId', 'name email phone').lean(),

      Booking.find({
        propertyId,
        dateTo: { $gte: todayStart, $lt: todayEnd },
        status: 'checked_in'
      }).populate('userId', 'name email phone').lean(),

      Booking.find({
        propertyId,
        dateFrom: { 
          $gte: new Date(todayEnd), 
          $lt: new Date(new Date(todayEnd).setDate(todayEnd.getDate() + 1)) 
        },
        status: { $in: ['confirmed', 'checked_in'] }
      }).populate('userId', 'name email phone').lean(),

      Booking.find({
        propertyId,
        dateFrom: { $gte: todayStart },
        status: { $in: ['confirmed', 'pending_payment'] }
      }).sort({ dateFrom: 1 }).limit(10).lean()
    ])

    // Calculate occupancy and room status statistics
    const roomStats = {
      total: rooms.length,
      available: rooms.filter(r => r.status === 'available').length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      dirty: rooms.filter(r => r.housekeeping.status === 'dirty').length,
      clean: rooms.filter(r => r.housekeeping.status === 'clean').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      outOfOrder: rooms.filter(r => r.status === 'out_of_order').length,
      blocked: rooms.filter(r => r.status === 'blocked').length
    }

    const occupancyRate = rooms.length > 0 ? 
      Math.round((roomStats.occupied / rooms.length) * 100) : 0

    // Housekeeping task summary
    const housekeepingTasks = {
      pending: rooms.filter(r => 
        r.housekeeping.status === 'dirty' || 
        r.housekeeping.status === 'inspecting'
      ).length,
      inProgress: rooms.filter(r => 
        r.housekeeping.status === 'cleaning' || 
        r.housekeeping.status === 'maintenance'
      ).length,
      completed: rooms.filter(r => r.housekeeping.status === 'clean').length,
      priority: rooms.filter(r => r.housekeeping.priority === 'urgent').length
    }

    // Maintenance summary
    const maintenanceRequests = {
      open: rooms.filter(r => 
        r.maintenance.requests && r.maintenance.requests.length > 0 &&
        r.maintenance.requests.some(req => req.status === 'open')
      ).length,
      inProgress: rooms.filter(r => 
        r.maintenance.requests && r.maintenance.requests.length > 0 &&
        r.maintenance.requests.some(req => req.status === 'in_progress')
      ).length,
      urgent: rooms.filter(r => 
        r.maintenance.requests && r.maintenance.requests.length > 0 &&
        r.maintenance.requests.some(req => req.priority === 'urgent')
      ).length
    }

    // Revenue and rate insights
    const revenueInsights = await calculateRevenueInsights(propertyId, rooms, date)

    // Forecasting data (if requested)
    let forecasting = null
    if (includeForecasting) {
      forecasting = await generateOccupancyForecast(propertyId, date)
    }

    // Alert conditions
    const alerts = []
    
    // High occupancy alert
    if (occupancyRate > 85) {
      alerts.push({
        type: 'high_occupancy',
        level: 'warning',
        message: `High occupancy rate: ${occupancyRate}%`,
        action: 'Consider adjusting rates or monitoring for overbooking'
      })
    }

    // Maintenance alerts
    if (maintenanceRequests.urgent > 0) {
      alerts.push({
        type: 'urgent_maintenance',
        level: 'critical',
        message: `${maintenanceRequests.urgent} urgent maintenance requests`,
        action: 'Immediate attention required'
      })
    }

    // Housekeeping backlog
    if (housekeepingTasks.pending > rooms.length * 0.2) {
      alerts.push({
        type: 'housekeeping_backlog',
        level: 'warning',
        message: `${housekeepingTasks.pending} rooms need cleaning`,
        action: 'Consider additional housekeeping staff'
      })
    }

    // Rooms ready for check-in
    const roomsReadyForCheckin = rooms.filter(r => 
      r.status === 'available' && 
      r.housekeeping.status === 'clean'
    ).length

    if (todayArrivals.length > roomsReadyForCheckin) {
      alerts.push({
        type: 'insufficient_ready_rooms',
        level: 'critical',
        message: `${todayArrivals.length} arrivals but only ${roomsReadyForCheckin} rooms ready`,
        action: 'Prioritize room preparation'
      })
    }

    const dashboard = {
      property: {
        id: propertyId,
        date: date,
        lastUpdated: new Date()
      },
      occupancy: {
        rate: occupancyRate,
        roomsOccupied: roomStats.occupied,
        totalRooms: roomStats.total,
        availableRooms: roomStats.available
      },
      roomStatus: roomStats,
      arrivals: {
        today: todayArrivals.length,
        tomorrow: tomorrowArrivals.length,
        details: todayArrivals.map(booking => ({
          id: booking._id,
          bookingCode: booking.bookingCode,
          guestName: (booking.userId as any)?.name || 'Guest',
          email: (booking.userId as any)?.email,
          phone: (booking.userId as any)?.phone,
          checkIn: booking.dateFrom,
          checkOut: booking.dateTo,
          roomType: booking.roomType,
          adults: booking.adults,
          children: booking.children,
          status: booking.status
        }))
      },
      departures: {
        today: todayDepartures.length,
        details: todayDepartures.map(booking => ({
          id: booking._id,
          bookingCode: booking.bookingCode,
          guestName: (booking.userId as any)?.name || 'Guest',
          checkOut: booking.dateTo,
          roomType: booking.roomType
        }))
      },
      housekeeping: housekeepingTasks,
      maintenance: maintenanceRequests,
      revenue: revenueInsights,
      alerts,
      upcomingBookings: upcomingBookings.slice(0, 5),
      forecasting,
      rooms: rooms.map(room => ({
        id: room._id,
        number: room.roomNumber,
        type: room.type,
        status: room.status,
        housekeepingStatus: room.housekeeping.status,
        housekeepingPriority: room.housekeeping.priority,
        currentGuest: room.currentBookingId ? 
          (room.currentBookingId as any)?.guestName || 'Unknown Guest' : null,
        maintenanceIssues: room.maintenance.requests ? 
          room.maintenance.requests.filter(req => req.status !== 'completed').length : 0,
        rate: room.rates.baseRate,
        availability: room.availability
      }))
    }

    return NextResponse.json(dashboard)

  } catch (error: any) {
    console.error("💥 [Property Overview] Error:", error)
    return NextResponse.json({ 
      error: "Failed to load property dashboard",
      details: error.message
    }, { status: 500 })
  }
}

async function calculateRevenueInsights(propertyId: string, rooms: any[], date: string) {
  try {
    const today = new Date(date)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get current month bookings for revenue calculation
    const monthlyBookings = await Booking.find({
      propertyId,
      dateFrom: { $gte: monthStart, $lte: monthEnd },
      status: { $in: ['confirmed', 'checked_in', 'completed'] }
    }).lean()

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => 
      sum + (booking.totalAmount || 0), 0)

    const averageRate = rooms.length > 0 ? 
      rooms.reduce((sum, room) => sum + (room.rates?.baseRate || 0), 0) / rooms.length : 0

    // Calculate RevPAR (Revenue Per Available Room)
    const daysInMonth = monthEnd.getDate()
    const revPAR = rooms.length > 0 ? 
      monthlyRevenue / (rooms.length * daysInMonth) : 0

    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      averageRate: Math.round(averageRate),
      revPAR: Math.round(revPAR),
      totalBookings: monthlyBookings.length,
      currency: 'USD'
    }
  } catch (error) {
    console.error("Revenue calculation error:", error)
    return {
      monthlyRevenue: 0,
      averageRate: 0,
      revPAR: 0,
      totalBookings: 0,
      currency: 'USD'
    }
  }
}

async function generateOccupancyForecast(propertyId: string, date: string) {
  try {
    const today = new Date(date)
    const next30Days = new Date(today)
    next30Days.setDate(next30Days.getDate() + 30)

    // Get upcoming bookings for forecasting
    const upcomingBookings = await Booking.find({
      propertyId,
      dateFrom: { $gte: today, $lte: next30Days },
      status: { $in: ['confirmed', 'pending_payment', 'checked_in'] }
    }).lean()

    // Get total rooms
    const totalRooms = await EnhancedRoom.countDocuments({ propertyId })

    // Generate daily forecast
    const forecast = []
    for (let i = 0; i < 30; i++) {
      const forecastDate = new Date(today)
      forecastDate.setDate(forecastDate.getDate() + i)
      
      const dayStart = new Date(forecastDate.setHours(0, 0, 0, 0))
      const dayEnd = new Date(forecastDate.setHours(23, 59, 59, 999))

      const occupiedRooms = upcomingBookings.filter(booking => 
        new Date(booking.dateFrom) <= dayEnd && 
        new Date(booking.dateTo) > dayStart
      ).length

      const occupancyRate = totalRooms > 0 ? 
        Math.round((occupiedRooms / totalRooms) * 100) : 0

      forecast.push({
        date: dayStart.toISOString().split('T')[0],
        occupancyRate,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms
      })
    }

    return {
      period: '30_days',
      forecast,
      averageOccupancy: Math.round(
        forecast.reduce((sum, day) => sum + day.occupancyRate, 0) / forecast.length
      ),
      peakOccupancy: Math.max(...forecast.map(day => day.occupancyRate)),
      lowOccupancy: Math.min(...forecast.map(day => day.occupancyRate))
    }
  } catch (error) {
    console.error("Forecasting error:", error)
    return null
  }
}