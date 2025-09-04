import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import EventVenue from "@/models/EventVenue"
import EventBooking from "@/models/EventBooking"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all event venues for a property
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
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const minCapacity = searchParams.get('minCapacity')
    const setupStyle = searchParams.get('setupStyle')
    const eventDate = searchParams.get('eventDate')
    const withAvailability = searchParams.get('withAvailability') === 'true'

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (!includeInactive) {
      query.isActive = true
      query['availability.isActive'] = true
    }

    // Capacity filter
    if (minCapacity) {
      const capacity = parseInt(minCapacity)
      if (setupStyle) {
        // Filter by specific setup style capacity
        const capacityField = `capacity.${setupStyle}Style`
        query[capacityField] = { $gte: capacity }
      } else {
        // Filter by any capacity that meets the requirement
        query.$or = [
          { 'capacity.seatedCapacity': { $gte: capacity } },
          { 'capacity.standingCapacity': { $gte: capacity } },
          { 'capacity.theatreStyle': { $gte: capacity } },
          { 'capacity.classroomStyle': { $gte: capacity } },
          { 'capacity.uShapeStyle': { $gte: capacity } },
          { 'capacity.boardroomStyle': { $gte: capacity } }
        ]
      }
    }

    const venues = await EventVenue.find(query)
      .populate('equipment.equipmentId', 'name category')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ displayOrder: 1, name: 1 })
      .lean() as any[]

    // Check availability and get booking details if requested
    const venuesWithDetails = await Promise.all(
      venues.map(async (venue) => {
        let availability = { isAvailable: true, conflictingBookings: [] as any[] }
        let upcomingBookings: any[] = []

        if (withAvailability || eventDate) {
          // Check for conflicting bookings
          const conflictQuery: any = {
            venueId: venue._id,
            status: { $nin: ['cancelled', 'completed'] }
          }

          if (eventDate) {
            const date = new Date(eventDate)
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            conflictQuery.eventDate = {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }

          const conflictingBookings = await EventBooking.find(conflictQuery)
            .select('eventName eventDate startTime endTime status guestCount')
            .sort({ eventDate: 1, startTime: 1 })
            .lean() as any[]

          availability = {
            isAvailable: conflictingBookings.length === 0,
            conflictingBookings: conflictingBookings.map((booking: any) => ({
              id: booking._id.toString(),
              eventName: booking.eventName,
              eventDate: booking.eventDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              status: booking.status,
              guestCount: booking.guestCount
            }))
          }

          // Get upcoming bookings (next 7 days)
          if (withAvailability) {
            const nextWeek = new Date()
            nextWeek.setDate(nextWeek.getDate() + 7)

            upcomingBookings = await EventBooking.find({
              venueId: venue._id,
              status: { $nin: ['cancelled', 'completed'] },
              eventDate: {
                $gte: new Date(),
                $lte: nextWeek
              }
            })
            .select('eventName eventDate startTime endTime status guestCount')
            .sort({ eventDate: 1, startTime: 1 })
            .limit(5)
            .lean() as any[]
          }
        }

        return {
          id: venue._id.toString(),
          name: venue.name,
          description: venue.description || '',
          capacity: venue.capacity,
          dimensions: venue.dimensions,
          amenities: venue.amenities || [],
          equipment: venue.equipment || [],
          images: venue.images || [],
          pricing: venue.pricing,
          availability: {
            ...venue.availability,
            ...availability
          },
          maintenanceSchedule: venue.availability?.maintenanceSchedule || [],
          displayOrder: venue.displayOrder || 0,
          isActive: venue.isActive,
          upcomingBookings: upcomingBookings.map((booking: any) => ({
            id: booking._id.toString(),
            eventName: booking.eventName,
            eventDate: booking.eventDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            guestCount: booking.guestCount
          })),
          createdAt: venue.createdAt,
          updatedAt: venue.updatedAt,
          createdBy: venue.createdBy,
          lastUpdatedBy: venue.lastUpdatedBy
        }
      })
    )

    // Get summary statistics
    const totalCapacity = venues.reduce((sum, venue) => sum + (venue.capacity?.seatedCapacity || 0), 0)
    const availableVenues = venuesWithDetails.filter(venue => venue.availability.isAvailable).length
    
    const capacityBreakdown = {
      small: venues.filter(venue => (venue.capacity?.seatedCapacity || 0) <= 50).length,
      medium: venues.filter(venue => {
        const cap = venue.capacity?.seatedCapacity || 0
        return cap > 50 && cap <= 200
      }).length,
      large: venues.filter(venue => (venue.capacity?.seatedCapacity || 0) > 200).length
    }

    return NextResponse.json({
      success: true,
      venues: venuesWithDetails,
      summary: {
        totalVenues: venues.length,
        availableVenues,
        totalCapacity,
        capacityBreakdown,
        averageCapacity: venues.length > 0 ? Math.round(totalCapacity / venues.length) : 0
      }
    })

  } catch (error) {
    console.error('Error fetching event venues:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch event venues" },
      { status: 500 }
    )
  }
})