import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Reservation from "@/models/Reservation"
import Table from "@/models/Table"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get available time slots for reservations
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date')
    const partySize = parseInt(searchParams.get('partySize') || '1')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      )
    }

    // Validate date format
    const reservationDate = new Date(date)
    if (isNaN(reservationDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 }
      )
    }

    // Get all active tables for the property
    const tables = await Table.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      'settings.allowOnlineReservation': true
    }).lean()

    if (tables.length === 0) {
      return NextResponse.json({
        success: true,
        slots: [],
        message: "No tables available for online reservations"
      })
    }

    // Calculate date range for the specific day
    const startOfDay = new Date(reservationDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(reservationDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all reservations for the date
    const existingReservations = await Reservation.find({
      propertyId,
      'reservationDetails.reservationDate': { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending', 'seated'] },
      isActive: true
    })
    .populate('tableAssignment.assignedTableId', 'number section capacity')
    .lean()

    // Define business hours (can be made configurable)
    const businessHours = {
      start: 10, // 10:00 AM
      end: 23,   // 11:00 PM
      interval: 30 // 30-minute intervals
    }

    // Generate time slots
    const timeSlots = []
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += businessHours.interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        timeSlots.push(timeString)
      }
    }

    // Calculate availability for each time slot
    const availabilitySlots = timeSlots.map(time => {
      // Filter tables that can accommodate the party size
      const suitableTables = tables.filter(table => table.capacity >= partySize)
      
      // Find reservations for this time slot (considering 2-hour average duration)
      const slotReservations = existingReservations.filter(reservation => {
        const reservationTime = reservation.reservationDetails?.reservationTime
        if (!reservationTime) return false
        
        const [reservationHour, reservationMinute] = reservationTime.split(':').map(Number)
        const [slotHour, slotMinute] = time.split(':').map(Number)
        
        const reservationMinutes = reservationHour * 60 + reservationMinute
        const slotMinutes = slotHour * 60 + slotMinute
        
        // Assume 2-hour duration for each reservation (120 minutes)
        const reservationDuration = reservation.reservationDetails?.duration?.estimated || 120
        const reservationEndMinutes = reservationMinutes + reservationDuration
        
        // Check if the slot overlaps with the reservation
        return (
          (slotMinutes >= reservationMinutes && slotMinutes < reservationEndMinutes) ||
          (slotMinutes + 120 > reservationMinutes && slotMinutes < reservationEndMinutes)
        )
      })

      // Count occupied tables
      const occupiedTableIds = new Set(
        slotReservations
          .map(r => r.tableAssignment?.assignedTableId?._id?.toString())
          .filter(Boolean)
      )

      // Calculate available tables
      const availableTables = suitableTables.filter(table => 
        !occupiedTableIds.has(table._id.toString())
      )

      // Calculate total capacity
      const totalCapacity = suitableTables.reduce((sum, table) => sum + table.capacity, 0)
      const occupiedCapacity = slotReservations.reduce((sum, reservation) => 
        sum + (reservation.reservationDetails?.partySize || 0), 0
      )
      const availableCapacity = totalCapacity - occupiedCapacity

      // Format reservations for this slot
      const formattedReservations = slotReservations.map(reservation => ({
        id: reservation._id.toString(),
        customerName: reservation.customer?.contactInfo?.name || 'Unknown',
        customerPhone: reservation.customer?.contactInfo?.phone || '',
        customerEmail: reservation.customer?.contactInfo?.email || '',
        partySize: reservation.reservationDetails?.partySize || 0,
        reservationDate: reservation.reservationDetails?.reservationDate || new Date(),
        reservationTime: reservation.reservationDetails?.reservationTime || '',
        duration: reservation.reservationDetails?.duration?.estimated || 120,
        status: reservation.status,
        tableName: reservation.tableAssignment?.assignedTableId?.number 
          ? `Table ${reservation.tableAssignment.assignedTableId.number}`
          : null,
        section: reservation.tableAssignment?.assignedTableId?.section || null,
        isVip: reservation.service?.vipTreatment || false,
        source: reservation.businessRules?.source || 'unknown'
      }))

      return {
        time,
        availableTables: availableTables.length,
        totalTables: suitableTables.length,
        availableCapacity,
        totalCapacity,
        reservations: formattedReservations,
        isAvailable: availableTables.length > 0,
        canAccommodatePartySize: availableCapacity >= partySize,
        suggestedTables: availableTables.slice(0, 3).map(table => ({
          id: table._id.toString(),
          number: table.number,
          section: table.section,
          capacity: table.capacity,
          features: table.features || []
        }))
      }
    })

    // Filter out past time slots for today
    const now = new Date()
    const isToday = reservationDate.toDateString() === now.toDateString()
    
    const filteredSlots = isToday 
      ? availabilitySlots.filter(slot => {
          const [hour, minute] = slot.time.split(':').map(Number)
          const slotTime = new Date(now)
          slotTime.setHours(hour, minute, 0, 0)
          
          // Only show slots at least 2 hours in the future
          return slotTime.getTime() > now.getTime() + (2 * 60 * 60 * 1000)
        })
      : availabilitySlots

    // Add summary statistics
    const summary = {
      totalSlots: filteredSlots.length,
      availableSlots: filteredSlots.filter(slot => slot.isAvailable).length,
      peakOccupancyTime: filteredSlots.reduce((peak, current) => 
        current.reservations.length > peak.reservations.length ? current : peak
      , filteredSlots[0] || { time: 'N/A', reservations: [] }),
      totalTablesForProperty: tables.length,
      suitableTablesForPartySize: tables.filter(t => t.capacity >= partySize).length
    }

    return NextResponse.json({
      success: true,
      slots: filteredSlots,
      summary,
      businessHours,
      requestedDate: date,
      requestedPartySize: partySize
    })

  } catch (error) {
    console.error('Error fetching reservation slots:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservation slots" },
      { status: 500 }
    )
  }
})