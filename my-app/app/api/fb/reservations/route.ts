import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import { z } from 'zod'
import Table from "@/models/Table"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

// Create a simple reservation model inline since we don't have a dedicated Reservation model
interface IReservation {
  _id?: Types.ObjectId
  propertyId: Types.ObjectId
  tableId: Types.ObjectId
  guestName: string
  guestPhone: string
  guestEmail?: string
  partySize: number
  reservationDate: Date
  reservationTime: string
  duration: number // in minutes
  specialRequests?: string
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const dynamic = 'force-dynamic';

// GET handler - Get reservations
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const tableId = searchParams.get('tableId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query for reservations
    const query: any = { propertyId: new Types.ObjectId(propertyId), isActive: true }
    
    if (status) {
      query.status = status
    }

    if (date) {
      const selectedDate = new Date(date)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      query['reservationDetails.reservationDate'] = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }

    if (tableId && Types.ObjectId.isValid(tableId)) {
      query['tableAssignment.assignedTableId'] = new Types.ObjectId(tableId)
    }

    // Get reservations with populated data
    const allReservations = await Reservation.find(query)
      .populate('tableAssignment.assignedTableId', 'number section capacity')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ 'reservationDetails.reservationDate': -1, 'reservationDetails.reservationTime': 1 })
      .lean()

    // Transform reservations to match frontend interface
    const transformedReservations = allReservations.map(reservation => ({
      id: reservation._id.toString(),
      customerName: reservation.customer?.contactInfo?.name || '',
      customerPhone: reservation.customer?.contactInfo?.phone || '',
      customerEmail: reservation.customer?.contactInfo?.email || '',
      partySize: reservation.reservationDetails?.partySize || 0,
      reservationDate: reservation.reservationDetails?.reservationDate 
        ? new Date(reservation.reservationDetails.reservationDate).toISOString().split('T')[0] 
        : '',
      reservationTime: reservation.reservationDetails?.reservationTime || '',
      duration: reservation.reservationDetails?.duration?.estimated || 120,
      status: reservation.status,
      tableId: reservation.tableAssignment?.assignedTableId?._id?.toString() || null,
      tableName: reservation.tableAssignment?.assignedTableId?.number 
        ? `Table ${reservation.tableAssignment.assignedTableId.number}` 
        : null,
      section: reservation.tableAssignment?.assignedTableId?.section || null,
      specialRequests: reservation.reservationDetails?.specialRequests || '',
      occasion: reservation.reservationDetails?.occasion || null,
      isVip: reservation.service?.vipTreatment || false,
      source: reservation.businessRules?.source || 'unknown',
      depositRequired: reservation.payment?.depositRequired || false,
      depositAmount: reservation.payment?.depositAmount || 0,
      depositPaid: reservation.payment?.depositPaid || false,
      remindersSent: reservation.communications?.notifications?.filter(n => n.type === 'reminder').length || 0,
      lastReminderTime: reservation.timeline?.reminderSent?.toISOString() || null,
      notes: reservation.service?.serviceNotes || '',
      createdAt: reservation.createdAt?.toISOString() || '',
      updatedAt: reservation.updatedAt?.toISOString() || '',
      createdBy: reservation.createdBy || null,
      confirmedAt: reservation.timeline?.confirmed?.toISOString() || null
    }))

    let filteredReservations = transformedReservations

    // Pagination
    const skip = (page - 1) * limit
    const paginatedReservations = filteredReservations.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      reservations: paginatedReservations,
      pagination: {
        page,
        limit,
        total: filteredReservations.length,
        pages: Math.ceil(filteredReservations.length / limit)
      },
      message: "Reservations fetched successfully"
    })

  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservations" },
      { status: 500 }
    )
  }
})

// POST handler - Create reservation
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

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    try {
      const validatedData = createReservationSchema.parse(body)

      // Validate property and table
      if (!validatedData.propertyId || !Types.ObjectId.isValid(validatedData.propertyId)) {
        return NextResponse.json(
          { success: false, message: "Valid property ID is required" },
          { status: 400 }
        )
      }

      let table = null
      if (validatedData.tableId) {
        // Specific table requested
        table = await Table.findOne({
          _id: new Types.ObjectId(validatedData.tableId),
          propertyId: new Types.ObjectId(validatedData.propertyId),
          isActive: true
        })

        if (!table) {
          return NextResponse.json(
            { success: false, message: "Table not found or doesn't belong to this property" },
            { status: 404 }
          )
        }

        // Check if table can accommodate party size
        if (validatedData.partySize > table.capacity) {
          return NextResponse.json(
            { success: false, message: `Table ${table.number} can only accommodate ${table.capacity} guests` },
            { status: 400 }
          )
        }
      } else {
        // Find available table for party size
        const availableTables = await Table.find({
          propertyId: new Types.ObjectId(validatedData.propertyId),
          capacity: { $gte: validatedData.partySize },
          isActive: true,
          'settings.allowOnlineReservation': true
        })
        .sort({ capacity: 1 }) // Prefer smallest suitable table
        .limit(1)

        if (availableTables.length === 0) {
          return NextResponse.json(
            { success: false, message: "No suitable tables available for the requested party size" },
            { status: 404 }
          )
        }

        table = availableTables[0]
      }

      // Check for conflicting reservations
      const conflictingReservation = await Reservation.findOne({
        propertyId: new Types.ObjectId(validatedData.propertyId),
        'tableAssignment.assignedTableId': table._id,
        'reservationDetails.reservationDate': new Date(validatedData.reservationDate),
        status: { $in: ['confirmed', 'pending', 'seated'] },
        isActive: true,
        $expr: {
          $and: [
            // Check if the new reservation time overlaps with existing ones
            {
              $let: {
                vars: {
                  newStartMinutes: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: [validatedData.reservationTime, 0, 2] } }, 60] },
                      { $toInt: { $substr: [validatedData.reservationTime, 3, 2] } }
                    ]
                  },
                  newEndMinutes: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: [validatedData.reservationTime, 0, 2] } }, 60] },
                      { $toInt: { $substr: [validatedData.reservationTime, 3, 2] } },
                      validatedData.duration || 120
                    ]
                  },
                  existingStartMinutes: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: ['$reservationDetails.reservationTime', 0, 2] } }, 60] },
                      { $toInt: { $substr: ['$reservationDetails.reservationTime', 3, 2] } }
                    ]
                  },
                  existingEndMinutes: {
                    $add: [
                      { $multiply: [{ $toInt: { $substr: ['$reservationDetails.reservationTime', 0, 2] } }, 60] },
                      { $toInt: { $substr: ['$reservationDetails.reservationTime', 3, 2] } },
                      { $ifNull: ['$reservationDetails.duration.estimated', 120] }
                    ]
                  }
                },
                in: {
                  $or: [
                    { $and: [{ $gte: ['$$newStartMinutes', '$$existingStartMinutes'] }, { $lt: ['$$newStartMinutes', '$$existingEndMinutes'] }] },
                    { $and: [{ $gt: ['$$newEndMinutes', '$$existingStartMinutes'] }, { $lte: ['$$newEndMinutes', '$$existingEndMinutes'] }] },
                    { $and: [{ $lte: ['$$newStartMinutes', '$$existingStartMinutes'] }, { $gte: ['$$newEndMinutes', '$$existingEndMinutes'] }] }
                  ]
                }
              }
            }
          ]
        }
      })

      if (conflictingReservation) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Table ${table.number} is already reserved for ${validatedData.reservationTime} on ${validatedData.reservationDate}`,
            conflictDetails: {
              existingReservationTime: conflictingReservation.reservationDetails?.reservationTime,
              customerName: conflictingReservation.customer?.contactInfo?.name
            }
          },
          { status: 409 }
        )
      }

      // Create the reservation
      const reservationData = {
        propertyId: new Types.ObjectId(validatedData.propertyId),
        customer: {
          type: 'guest',
          contactInfo: {
            name: validatedData.guestName,
            phone: validatedData.guestPhone,
            email: validatedData.guestEmail || null
          }
        },
        reservationDetails: {
          reservationDate: new Date(validatedData.reservationDate),
          reservationTime: validatedData.reservationTime,
          partySize: validatedData.partySize,
          duration: {
            estimated: validatedData.duration || 120
          },
          specialRequests: validatedData.specialRequests || null
        },
        tableAssignment: {
          assignedTableId: table._id,
          autoAssign: validatedData.tableId ? false : true
        },
        status: 'pending',
        businessRules: {
          source: 'app' // Since this is coming from the application
        },
        payment: {
          depositRequired: table.settings?.requiresDeposit || false,
          depositAmount: table.settings?.depositAmount || 0
        },
        createdBy: new Types.ObjectId(token.sub),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const newReservation = await Reservation.create(reservationData)
      
      // Populate the created reservation
      const populatedReservation = await Reservation.findById(newReservation._id)
        .populate('tableAssignment.assignedTableId', 'number section capacity')
        .populate('createdBy', 'name email')
        .lean()

      // Transform for response
      const responseReservation = {
        id: populatedReservation!._id.toString(),
        reservationNumber: populatedReservation!.reservationNumber,
        propertyId: validatedData.propertyId,
        customerName: populatedReservation!.customer?.contactInfo?.name || '',
        customerPhone: populatedReservation!.customer?.contactInfo?.phone || '',
        customerEmail: populatedReservation!.customer?.contactInfo?.email || '',
        partySize: populatedReservation!.reservationDetails?.partySize || 0,
        reservationDate: populatedReservation!.reservationDetails?.reservationDate 
          ? new Date(populatedReservation!.reservationDetails.reservationDate).toISOString().split('T')[0] 
          : '',
        reservationTime: populatedReservation!.reservationDetails?.reservationTime || '',
        duration: populatedReservation!.reservationDetails?.duration?.estimated || 120,
        specialRequests: populatedReservation!.reservationDetails?.specialRequests || '',
        status: populatedReservation!.status,
        table: populatedReservation!.tableAssignment?.assignedTableId ? {
          id: populatedReservation!.tableAssignment.assignedTableId._id.toString(),
          number: populatedReservation!.tableAssignment.assignedTableId.number,
          section: populatedReservation!.tableAssignment.assignedTableId.section,
          capacity: populatedReservation!.tableAssignment.assignedTableId.capacity
        } : null,
        depositRequired: populatedReservation!.payment?.depositRequired || false,
        depositAmount: populatedReservation!.payment?.depositAmount || 0,
        createdAt: populatedReservation!.createdAt?.toISOString() || '',
        createdBy: populatedReservation!.createdBy
      }

      return NextResponse.json({
        success: true,
        message: "Reservation created successfully",
        reservation: responseReservation
      }, { status: 201 })

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const formattedErrors = validationError.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: "Validation error", 
            errors: formattedErrors
          },
          { status: 400 }
        )
      }
      throw validationError
    }

  } catch (error: any) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { success: false, message: "Failed to create reservation" },
      { status: 500 }
    )
  }
})

// Schema for reservation creation validation
const createReservationSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  tableId: z.string().optional(), // If not provided, system will find suitable table
  guestName: z.string().min(1, "Guest name is required").max(100, "Name cannot exceed 100 characters"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  guestEmail: z.string().email().optional(),
  partySize: z.number().min(1, "Party size must be at least 1").max(20, "Party size cannot exceed 20"),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  reservationTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  duration: z.number().min(30, "Minimum reservation duration is 30 minutes").max(480, "Maximum reservation duration is 8 hours").default(120),
  specialRequests: z.string().max(500, "Special requests cannot exceed 500 characters").optional()
}).refine((data) => {
  // Validate that reservation date is not in the past
  const reservationDate = new Date(data.reservationDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return reservationDate >= today
}, {
  message: "Reservation date cannot be in the past",
  path: ["reservationDate"]
}).refine((data) => {
  // Validate business hours (example: 10:00 - 23:00)
  const [hours, minutes] = data.reservationTime.split(':').map(Number)
  const timeInMinutes = hours * 60 + minutes
  const minTime = 10 * 60 // 10:00 AM
  const maxTime = 23 * 60 // 11:00 PM
  return timeInMinutes >= minTime && timeInMinutes <= maxTime
}, {
  message: "Reservation time must be between 10:00 AM and 11:00 PM",
  path: ["reservationTime"]
})