import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import EnhancedRoom from "@/models/EnhancedRoom"
import Booking from "@/models/Booking"
import dbConnect from "@/lib/db/dbConnect"
import { z } from "zod"

export const dynamic = 'force-dynamic'

// Rate update schema
const rateUpdateSchema = z.object({
  baseRate: z.number().min(0),
  seasonalRates: z.array(z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    multiplier: z.number().min(0),
    fixedRate: z.number().min(0).optional()
  })).optional(),
  occupancyRates: z.array(z.object({
    threshold: z.number().min(0).max(100),
    multiplier: z.number().min(0)
  })).optional(),
  weekendMultiplier: z.number().min(0).optional(),
  minimumStay: z.number().min(1).optional(),
  maximumStay: z.number().min(1).optional()
})

// Availability update schema
const availabilityUpdateSchema = z.object({
  blockedDates: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string(),
    note: z.string().optional()
  })).optional(),
  restrictions: z.array(z.object({
    date: z.string(),
    minimumStay: z.number().min(1).optional(),
    maximumStay: z.number().min(1).optional(),
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional()
  })).optional()
})

// Bulk rate update schema
const bulkRateUpdateSchema = z.object({
  roomIds: z.array(z.string()),
  rateType: z.enum(['base', 'seasonal', 'occupancy', 'weekend']),
  operation: z.enum(['set', 'increase', 'decrease']),
  value: z.number(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string()
  }).optional()
})

// GET: Room rates and inventory for specific property
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const roomType = searchParams.get('roomType')

    const propertyId = params.id

    console.log(`📊 [Inventory Management] Loading rates for property ${propertyId}`)

    // Build room filter
    const roomFilter: any = { propertyId }
    if (roomType && roomType !== 'all') {
      roomFilter.type = roomType
    }

    // Get rooms with current rates and availability
    const rooms = await EnhancedRoom.find(roomFilter)
      .populate('currentBookingId', 'checkIn checkOut bookingCode')
      .lean()

    // Get occupancy data for the date range
    const occupancyData = await calculateOccupancyRates(propertyId, startDate, endDate)

    // Get booking history for revenue analysis
    const bookingHistory = await Booking.find({
      propertyId,
      dateFrom: { 
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      },
      status: { $in: ['confirmed', 'checked_in', 'completed'] }
    }).lean()

    // Calculate rate performance metrics
    const ratePerformance = await calculateRatePerformance(rooms, bookingHistory, occupancyData)

    // Generate calendar data for the date range
    const calendar = generateRateCalendar(rooms, startDate, endDate, occupancyData)

    // Calculate competitive insights
    const competitiveInsights = await generateCompetitiveInsights(propertyId, roomType)

    // Rate optimization suggestions
    const optimizationSuggestions = generateOptimizationSuggestions(
      ratePerformance, 
      occupancyData, 
      calendar
    )

    const inventory = {
      property: {
        id: propertyId,
        dateRange: { startDate, endDate },
        lastUpdated: new Date()
      },
      rooms: rooms.map(room => ({
        id: room._id,
        number: room.roomNumber,
        type: room.type,
        status: room.status,
        currentRate: room.rates.baseRate,
        rates: room.rates,
        availability: room.availability,
        occupancy: occupancyData.roomOccupancy[room._id.toString()] || {
          rate: 0,
          bookedNights: 0,
          availableNights: 0
        },
        performance: ratePerformance.roomPerformance[room._id.toString()] || {
          averageRate: room.rates.baseRate,
          revenue: 0,
          bookings: 0,
          revPAR: 0
        }
      })),
      calendar,
      performance: ratePerformance,
      occupancy: occupancyData.summary,
      competitive: competitiveInsights,
      suggestions: optimizationSuggestions
    }

    return NextResponse.json(inventory)

  } catch (error: any) {
    console.error("💥 [Inventory Management] Error:", error)
    return NextResponse.json({ 
      error: "Failed to load inventory data",
      details: error.message
    }, { status: 500 })
  }
}

// PUT: Update room rates
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, roomId, ...updateData } = body

    console.log(`📝 [Inventory Management] ${action} update for property ${params.id}`)

    switch (action) {
      case 'update_rate':
        const rateValidation = rateUpdateSchema.safeParse(updateData)
        if (!rateValidation.success) {
          return NextResponse.json({
            error: "Invalid rate data",
            details: rateValidation.error.format()
          }, { status: 400 })
        }

        await EnhancedRoom.findByIdAndUpdate(roomId, {
          $set: {
            'rates.baseRate': rateValidation.data.baseRate,
            'rates.seasonalRates': rateValidation.data.seasonalRates || [],
            'rates.occupancyRates': rateValidation.data.occupancyRates || [],
            'rates.weekendMultiplier': rateValidation.data.weekendMultiplier || 1.0,
            'availability.minimumStay': rateValidation.data.minimumStay || 1,
            'availability.maximumStay': rateValidation.data.maximumStay || 30,
            updatedAt: new Date()
          }
        })
        break

      case 'update_availability':
        const availabilityValidation = availabilityUpdateSchema.safeParse(updateData)
        if (!availabilityValidation.success) {
          return NextResponse.json({
            error: "Invalid availability data",
            details: availabilityValidation.error.format()
          }, { status: 400 })
        }

        await EnhancedRoom.findByIdAndUpdate(roomId, {
          $set: {
            'availability.blockedDates': availabilityValidation.data.blockedDates || [],
            'availability.restrictions': availabilityValidation.data.restrictions || [],
            updatedAt: new Date()
          }
        })
        break

      case 'bulk_rate_update':
        const bulkValidation = bulkRateUpdateSchema.safeParse(updateData)
        if (!bulkValidation.success) {
          return NextResponse.json({
            error: "Invalid bulk update data",
            details: bulkValidation.error.format()
          }, { status: 400 })
        }

        await performBulkRateUpdate(bulkValidation.data)
        break

      default:
        return NextResponse.json({
          error: "Invalid action"
        }, { status: 400 })
    }

    // Log the update
    console.log(`✅ [Inventory Management] ${action} completed successfully`)

    return NextResponse.json({ 
      success: true,
      message: `${action} completed successfully`,
      timestamp: new Date()
    })

  } catch (error: any) {
    console.error("💥 [Inventory Management] Update error:", error)
    return NextResponse.json({ 
      error: "Failed to update inventory",
      details: error.message
    }, { status: 500 })
  }
}

// Helper Functions

async function calculateOccupancyRates(propertyId: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Get all bookings in date range
  const bookings = await Booking.find({
    propertyId,
    $or: [
      { dateFrom: { $gte: start, $lte: end } },
      { dateTo: { $gte: start, $lte: end } },
      { dateFrom: { $lte: start }, dateTo: { $gte: end } }
    ],
    status: { $in: ['confirmed', 'checked_in', 'completed'] }
  }).lean()

  // Get total rooms
  const totalRooms = await EnhancedRoom.countDocuments({ propertyId })
  
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const totalRoomNights = totalRooms * totalDays
  const bookedRoomNights = bookings.reduce((sum, booking) => {
    const bookingStart = new Date(Math.max(booking.dateFrom.getTime(), start.getTime()))
    const bookingEnd = new Date(Math.min(booking.dateTo.getTime(), end.getTime()))
    const nights = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24))
    return sum + Math.max(0, nights)
  }, 0)

  const occupancyRate = totalRoomNights > 0 ? (bookedRoomNights / totalRoomNights) * 100 : 0

  // Calculate room-level occupancy
  const roomOccupancy: { [key: string]: any } = {}
  const rooms = await EnhancedRoom.find({ propertyId }).lean()
  
  for (const room of rooms) {
    const roomBookings = bookings.filter(booking => 
      booking.roomDetails && booking.roomDetails.some((rd: any) => rd.roomId === room._id.toString())
    )
    
    const roomBookedNights = roomBookings.reduce((sum, booking) => {
      const bookingStart = new Date(Math.max(booking.dateFrom.getTime(), start.getTime()))
      const bookingEnd = new Date(Math.min(booking.dateTo.getTime(), end.getTime()))
      const nights = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24))
      return sum + Math.max(0, nights)
    }, 0)

    roomOccupancy[room._id.toString()] = {
      rate: totalDays > 0 ? (roomBookedNights / totalDays) * 100 : 0,
      bookedNights: roomBookedNights,
      availableNights: totalDays - roomBookedNights
    }
  }

  return {
    summary: {
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalRoomNights,
      bookedRoomNights,
      availableRoomNights: totalRoomNights - bookedRoomNights
    },
    roomOccupancy
  }
}

async function calculateRatePerformance(rooms: any[], bookingHistory: any[], occupancyData: any) {
  const totalRevenue = bookingHistory.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
  const totalBookings = bookingHistory.length
  const averageRate = totalBookings > 0 ? totalRevenue / totalBookings : 0

  // Room-level performance
  const roomPerformance: { [key: string]: any } = {}
  
  for (const room of rooms) {
    const roomBookings = bookingHistory.filter(booking =>
      booking.roomDetails && booking.roomDetails.some((rd: any) => rd.roomId === room._id.toString())
    )
    
    const roomRevenue = roomBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const roomOccupancy = occupancyData.roomOccupancy[room._id.toString()]?.rate || 0
    const revPAR = roomRevenue / 90 // Revenue per available room for 90 days

    roomPerformance[room._id.toString()] = {
      revenue: roomRevenue,
      bookings: roomBookings.length,
      averageRate: roomBookings.length > 0 ? roomRevenue / roomBookings.length : 0,
      revPAR: Math.round(revPAR * 100) / 100,
      occupancyRate: roomOccupancy
    }
  }

  return {
    overall: {
      totalRevenue: Math.round(totalRevenue),
      totalBookings,
      averageRate: Math.round(averageRate),
      revPAR: Math.round((totalRevenue / 90) / rooms.length * 100) / 100
    },
    roomPerformance
  }
}

function generateRateCalendar(rooms: any[], startDate: string, endDate: string, occupancyData: any) {
  const calendar = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    
    // Calculate dynamic rates based on occupancy and seasonal factors
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    calendar.push({
      date: dateStr,
      dayOfWeek,
      isWeekend,
      rates: rooms.map(room => {
        let rate = room.rates.baseRate
        
        // Apply weekend multiplier
        if (isWeekend && room.rates.weekendMultiplier) {
          rate *= room.rates.weekendMultiplier
        }
        
        // Apply seasonal rates
        if (room.rates.seasonalRates) {
          const applicableRate = room.rates.seasonalRates.find((sr: any) => {
            const seasonStart = new Date(sr.startDate)
            const seasonEnd = new Date(sr.endDate)
            return date >= seasonStart && date <= seasonEnd
          })
          
          if (applicableRate) {
            rate = applicableRate.fixedRate || (rate * applicableRate.multiplier)
          }
        }
        
        return {
          roomId: room._id,
          roomNumber: room.roomNumber,
          type: room.type,
          rate: Math.round(rate),
          available: !room.availability.blockedDates?.some((blocked: any) => {
            const blockStart = new Date(blocked.startDate)
            const blockEnd = new Date(blocked.endDate)
            return date >= blockStart && date <= blockEnd
          })
        }
      })
    })
  }
  
  return calendar
}

async function generateCompetitiveInsights(propertyId: string, roomType?: string) {
  // This would integrate with external APIs for competitive data
  // For now, return mock data
  return {
    averageMarketRate: 150,
    competitorRates: [
      { name: "Competitor A", rate: 145, occupancy: 75 },
      { name: "Competitor B", rate: 155, occupancy: 82 },
      { name: "Competitor C", rate: 140, occupancy: 68 }
    ],
    marketPosition: "competitive", // competitive, above_market, below_market
    priceAdvantage: 5, // Percentage difference from market average
    recommendations: [
      "Consider increasing rates by 3-5% based on strong occupancy",
      "Weekend rates can be optimized for better RevPAR"
    ]
  }
}

function generateOptimizationSuggestions(
  performance: any, 
  occupancy: any, 
  calendar: any[]
) {
  const suggestions = []
  
  // High occupancy, suggest rate increases
  if (occupancy.summary.occupancyRate > 85) {
    suggestions.push({
      type: "rate_increase",
      priority: "high",
      message: "High occupancy (>85%) suggests rates can be increased",
      action: "Consider 5-10% rate increase",
      expectedImpact: "Increase RevPAR by 5-8%"
    })
  }
  
  // Low occupancy, suggest rate decreases or promotions
  if (occupancy.summary.occupancyRate < 60) {
    suggestions.push({
      type: "rate_decrease",
      priority: "medium", 
      message: "Low occupancy (<60%) may benefit from competitive pricing",
      action: "Consider 3-5% rate decrease or promotional offers",
      expectedImpact: "Increase bookings by 10-15%"
    })
  }
  
  // Weekend optimization
  const weekendDays = calendar.filter(day => day.isWeekend)
  const weekendAvgRate = weekendDays.length > 0 ? 
    weekendDays.reduce((sum, day) => sum + day.rates[0]?.rate || 0, 0) / weekendDays.length : 0
  const weekdayDays = calendar.filter(day => !day.isWeekend)
  const weekdayAvgRate = weekdayDays.length > 0 ?
    weekdayDays.reduce((sum, day) => sum + day.rates[0]?.rate || 0, 0) / weekdayDays.length : 0
  
  if (weekendAvgRate / weekdayAvgRate < 1.15) {
    suggestions.push({
      type: "weekend_optimization",
      priority: "medium",
      message: "Weekend rates could be optimized for better revenue",
      action: "Increase weekend rates by 15-20%",
      expectedImpact: "Improve weekend RevPAR significantly"
    })
  }
  
  return suggestions
}

async function performBulkRateUpdate(updateData: any) {
  const { roomIds, rateType, operation, value, dateRange } = updateData
  
  for (const roomId of roomIds) {
    const room = await EnhancedRoom.findById(roomId)
    if (!room) continue
    
    let updateField = ''
    let currentValue = 0
    
    switch (rateType) {
      case 'base':
        updateField = 'rates.baseRate'
        currentValue = room.rates.baseRate
        break
      case 'weekend':
        updateField = 'rates.weekendMultiplier'
        currentValue = room.rates.weekendMultiplier || 1.0
        break
      default:
        continue
    }
    
    let newValue = currentValue
    switch (operation) {
      case 'set':
        newValue = value
        break
      case 'increase':
        newValue = currentValue + value
        break
      case 'decrease':
        newValue = Math.max(0, currentValue - value)
        break
    }
    
    await EnhancedRoom.findByIdAndUpdate(roomId, {
      $set: {
        [updateField]: newValue,
        updatedAt: new Date()
      }
    })
  }
}