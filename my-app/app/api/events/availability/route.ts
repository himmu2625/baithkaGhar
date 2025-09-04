import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import EventVenue from "@/models/EventVenue"
import EventBooking from "@/models/EventBooking"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Check venue availability
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const venueId = searchParams.get('venueId')
    const eventDate = searchParams.get('eventDate')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const expectedGuests = searchParams.get('expectedGuests')
    const setupStyle = searchParams.get('setupStyle')
    const excludeBookingId = searchParams.get('excludeBookingId')

    // Validate required parameters
    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!eventDate) {
      return NextResponse.json(
        { success: false, message: "Event date is required" },
        { status: 400 }
      )
    }

    // Parse and validate date and times
    let parsedEventDate: Date
    try {
      parsedEventDate = new Date(eventDate)
      if (isNaN(parsedEventDate.getTime())) {
        throw new Error("Invalid date")
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid event date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { success: false, message: "Invalid start time format. Use HH:MM" },
        { status: 400 }
      )
    }

    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, message: "Invalid end time format. Use HH:MM" },
        { status: 400 }
      )
    }

    // Validate that end time is after start time if both provided
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(`2000-01-01T${endTime}:00`)
      if (end <= start) {
        return NextResponse.json(
          { success: false, message: "End time must be after start time" },
          { status: 400 }
        )
      }
    }

    // Build venue query
    const venueQuery: any = { 
      propertyId: new Types.ObjectId(propertyId),
      isActive: true,
      'availability.isActive': true
    }

    // If specific venue requested
    if (venueId && Types.ObjectId.isValid(venueId)) {
      venueQuery._id = new Types.ObjectId(venueId)
    }

    // Capacity filter if guests and setup style provided
    if (expectedGuests && setupStyle) {
      const guestCount = parseInt(expectedGuests)
      if (guestCount > 0) {
        const capacityField = `capacity.${setupStyle}Style`
        venueQuery[capacityField] = { $gte: guestCount }
      }
    }

    // Get venues
    const venues = await EventVenue.find(venueQuery)
      .populate('equipment.equipmentId', 'name category')
      .lean() as any[] // Type assertion for lean query result

    if (venues.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No venues found matching the criteria",
        venues: [],
        availability: {
          hasAvailableVenues: false,
          totalChecked: 0
        }
      })
    }

    // Check availability for each venue
    const availabilityResults = await Promise.all(
      venues.map(async (venue) => {
        try {
          // Build booking conflict query
          const conflictQuery: any = {
            venueId: venue._id,
            eventDate: parsedEventDate,
            status: { $nin: ['cancelled', 'completed'] }
          }

          // Exclude specific booking if provided (for updates)
          if (excludeBookingId && Types.ObjectId.isValid(excludeBookingId)) {
            conflictQuery._id = { $ne: new Types.ObjectId(excludeBookingId) }
          }

          // If specific time slot provided, check for time conflicts
          if (startTime && endTime) {
            conflictQuery.$or = [
              // New booking starts during existing booking
              {
                startTime: { $lte: startTime },
                endTime: { $gt: startTime }
              },
              // New booking ends during existing booking
              {
                startTime: { $lt: endTime },
                endTime: { $gte: endTime }
              },
              // New booking encompasses existing booking
              {
                startTime: { $gte: startTime },
                endTime: { $lte: endTime }
              }
            ]
          }

          const conflictingBookings = await EventBooking.find(conflictQuery)
            .select('eventName startTime endTime status guestCount bookingNumber')
            .sort({ startTime: 1 })
            .lean()

          // Check capacity if required
          let capacityCheck = { 
            hasCapacity: true, 
            availableCapacity: venue.capacity?.seatedCapacity || 0,
            requiredCapacity: expectedGuests ? parseInt(expectedGuests) : 0
          }

          if (expectedGuests && setupStyle) {
            const guestCount = parseInt(expectedGuests)
            const capacityKey = `${setupStyle}Style` as keyof typeof venue.capacity
            const availableCapacity = venue.capacity?.[capacityKey] || 0
            capacityCheck = {
              hasCapacity: availableCapacity >= guestCount,
              availableCapacity,
              requiredCapacity: guestCount
            }
          }

          // Check maintenance schedule
          let maintenanceConflict = false
          if (venue.availability?.maintenanceSchedule) {
            maintenanceConflict = venue.availability.maintenanceSchedule.some((maintenance: any) => {
              const maintenanceStart = new Date(maintenance.startDate)
              const maintenanceEnd = new Date(maintenance.endDate)
              return parsedEventDate >= maintenanceStart && parsedEventDate <= maintenanceEnd
            })
          }

          const isAvailable = conflictingBookings.length === 0 && 
                             capacityCheck.hasCapacity && 
                             !maintenanceConflict

          // Calculate suggested time slots if not available for requested time
          let suggestedSlots: any[] = []
          if (!isAvailable && conflictingBookings.length > 0) {
            // Simple suggestion logic - find gaps between bookings
            const sortedBookings = conflictingBookings.sort((a: any, b: any) => 
              a.startTime.localeCompare(b.startTime)
            )

            // Morning slot before first booking
            if (sortedBookings[0] && sortedBookings[0].startTime > "08:00") {
              suggestedSlots.push({
                startTime: "08:00",
                endTime: sortedBookings[0].startTime,
                duration: calculateDuration("08:00", sortedBookings[0].startTime)
              })
            }

            // Slots between bookings
            for (let i = 0; i < sortedBookings.length - 1; i++) {
              const currentEnd = sortedBookings[i].endTime
              const nextStart = sortedBookings[i + 1].startTime
              const gapDuration = calculateDuration(currentEnd, nextStart)
              
              // Only suggest if gap is at least 2 hours
              if (gapDuration >= 120) {
                suggestedSlots.push({
                  startTime: currentEnd,
                  endTime: nextStart,
                  duration: gapDuration
                })
              }
            }

            // Evening slot after last booking
            const lastBooking = sortedBookings[sortedBookings.length - 1]
            if (lastBooking && lastBooking.endTime < "22:00") {
              suggestedSlots.push({
                startTime: lastBooking.endTime,
                endTime: "22:00",
                duration: calculateDuration(lastBooking.endTime, "22:00")
              })
            }
          }

          return {
            venue: {
              id: venue._id.toString(),
              name: venue.name,
              description: venue.description,
              capacity: venue.capacity,
              pricing: venue.pricing,
              amenities: venue.amenities || [],
              images: venue.images || []
            },
            availability: {
              isAvailable,
              hasTimeConflict: conflictingBookings.length > 0,
              hasCapacityIssue: !capacityCheck.hasCapacity,
              hasMaintenanceConflict: maintenanceConflict,
              conflictingBookings: conflictingBookings.map((booking: any) => ({
                id: booking._id.toString(),
                bookingNumber: booking.bookingNumber,
                eventName: booking.eventName,
                startTime: booking.startTime,
                endTime: booking.endTime,
                status: booking.status,
                guestCount: booking.guestCount
              })),
              capacityInfo: capacityCheck,
              suggestedSlots: isAvailable ? [] : suggestedSlots,
              reasonsUnavailable: [
                ...(conflictingBookings.length > 0 ? ['Time conflict with existing bookings'] : []),
                ...(!capacityCheck.hasCapacity ? [`Insufficient capacity for ${setupStyle} setup`] : []),
                ...(maintenanceConflict ? ['Venue under maintenance'] : [])
              ]
            }
          }
        } catch (error) {
          console.error(`Error checking availability for venue ${venue._id}:`, error)
          return {
            venue: {
              id: venue._id.toString(),
              name: venue.name,
              description: venue.description,
              capacity: venue.capacity,
              pricing: venue.pricing
            },
            availability: {
              isAvailable: false,
              hasTimeConflict: false,
              hasCapacityIssue: false,
              hasMaintenanceConflict: false,
              conflictingBookings: [],
              capacityInfo: { hasCapacity: false, availableCapacity: 0, requiredCapacity: 0 },
              suggestedSlots: [],
              reasonsUnavailable: ['Error checking availability']
            },
            error: 'Failed to check availability'
          }
        }
      })
    )

    // Summary statistics
    const availableVenues = availabilityResults.filter(result => result.availability.isAvailable)
    const totalConflicts = availabilityResults.reduce(
      (sum, result) => sum + result.availability.conflictingBookings.length, 
      0
    )

    return NextResponse.json({
      success: true,
      venues: availabilityResults,
      availability: {
        hasAvailableVenues: availableVenues.length > 0,
        totalChecked: venues.length,
        availableCount: availableVenues.length,
        unavailableCount: venues.length - availableVenues.length,
        totalConflicts,
        checkDate: eventDate,
        checkTime: startTime && endTime ? `${startTime} - ${endTime}` : 'All day',
        requestedCapacity: expectedGuests ? parseInt(expectedGuests) : null,
        setupStyle: setupStyle || null
      }
    })

  } catch (error: any) {
    console.error('Error checking venue availability:', error)
    return NextResponse.json(
      { success: false, message: "Failed to check venue availability" },
      { status: 500 }
    )
  }
})

// Helper function to calculate duration in minutes between two times
function calculateDuration(startTime: string, endTime: string): number {
  try {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    return Math.abs(end.getTime() - start.getTime()) / (1000 * 60)
  } catch {
    return 0
  }
}