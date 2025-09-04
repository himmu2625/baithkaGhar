import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// PATCH handler - Update reservation status
export const PATCH = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

    const reservationId = params.id
    if (!reservationId || !Types.ObjectId.isValid(reservationId)) {
      return NextResponse.json(
        { success: false, message: "Valid reservation ID is required" },
        { status: 400 }
      )
    }

    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['confirmed', 'pending', 'waitlisted', 'seated', 'no_show', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find and update the reservation
    const reservation = await Reservation.findById(reservationId)
    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      )
    }

    // Update reservation using the model method
    await reservation.updateStatus(status, token.sub)

    // Add notes if provided
    if (notes) {
      reservation.service = reservation.service || {}
      reservation.service.serviceNotes = notes
      await reservation.save()
    }

    // Get updated reservation with populated data
    const updatedReservation = await Reservation.findById(reservationId)
      .populate('tableAssignment.assignedTableId', 'number section capacity')
      .populate('lastUpdatedBy', 'name email')
      .lean()

    // Transform for response
    const responseData = {
      id: updatedReservation!._id.toString(),
      status: updatedReservation!.status,
      customerName: updatedReservation!.customer?.contactInfo?.name || '',
      customerPhone: updatedReservation!.customer?.contactInfo?.phone || '',
      customerEmail: updatedReservation!.customer?.contactInfo?.email || '',
      partySize: updatedReservation!.reservationDetails?.partySize || 0,
      reservationDate: updatedReservation!.reservationDetails?.reservationDate 
        ? new Date(updatedReservation!.reservationDetails.reservationDate).toISOString().split('T')[0] 
        : '',
      reservationTime: updatedReservation!.reservationDetails?.reservationTime || '',
      tableName: updatedReservation!.tableAssignment?.assignedTableId?.number 
        ? `Table ${updatedReservation!.tableAssignment.assignedTableId.number}` 
        : null,
      section: updatedReservation!.tableAssignment?.assignedTableId?.section || null,
      notes: updatedReservation!.service?.serviceNotes || '',
      updatedAt: updatedReservation!.updatedAt?.toISOString() || '',
      updatedBy: updatedReservation!.lastUpdatedBy,
      timeline: {
        confirmed: updatedReservation!.timeline?.confirmed?.toISOString() || null,
        seated: updatedReservation!.timeline?.seated?.toISOString() || null,
        completed: updatedReservation!.timeline?.mealCompleted?.toISOString() || null,
        cancelled: updatedReservation!.timeline?.cancelled?.toISOString() || null
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reservation status updated to ${status}`,
      reservation: responseData
    })

  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { success: false, message: "Failed to update reservation" },
      { status: 500 }
    )
  }
})

// GET handler - Get single reservation details
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectMongo()

    const reservationId = params.id
    if (!reservationId || !Types.ObjectId.isValid(reservationId)) {
      return NextResponse.json(
        { success: false, message: "Valid reservation ID is required" },
        { status: 400 }
      )
    }

    // Find reservation with populated data
    const reservation = await Reservation.findById(reservationId)
      .populate('tableAssignment.assignedTableId', 'number section capacity features')
      .populate('tableAssignment.preferredTableId', 'number section capacity features')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('service.assignedHost', 'name email')
      .populate('service.assignedWaiter', 'name email')
      .lean()

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      )
    }

    // Transform detailed reservation data
    const detailedReservation = {
      id: reservation._id.toString(),
      reservationNumber: reservation.reservationNumber,
      customer: {
        name: reservation.customer?.contactInfo?.name || '',
        phone: reservation.customer?.contactInfo?.phone || '',
        email: reservation.customer?.contactInfo?.email || '',
        alternatePhone: reservation.customer?.contactInfo?.alternatePhone || '',
        type: reservation.customer?.type || 'guest',
        preferences: {
          dietaryRestrictions: reservation.customer?.preferences?.dietaryRestrictions || [],
          allergies: reservation.customer?.preferences?.allergies || [],
          specialRequests: reservation.customer?.preferences?.specialRequests || '',
          preferredSeating: reservation.customer?.preferences?.preferredSeating || 'no_preference'
        }
      },
      reservationDetails: {
        reservationDate: reservation.reservationDetails?.reservationDate 
          ? new Date(reservation.reservationDetails.reservationDate).toISOString().split('T')[0] 
          : '',
        reservationTime: reservation.reservationDetails?.reservationTime || '',
        partySize: reservation.reservationDetails?.partySize || 0,
        duration: {
          estimated: reservation.reservationDetails?.duration?.estimated || 120,
          actual: reservation.reservationDetails?.duration?.actual || null
        },
        occasion: reservation.reservationDetails?.occasion || null,
        specialRequests: reservation.reservationDetails?.specialRequests || ''
      },
      tableAssignment: {
        assignedTable: reservation.tableAssignment?.assignedTableId ? {
          id: reservation.tableAssignment.assignedTableId._id.toString(),
          number: reservation.tableAssignment.assignedTableId.number,
          section: reservation.tableAssignment.assignedTableId.section,
          capacity: reservation.tableAssignment.assignedTableId.capacity,
          features: reservation.tableAssignment.assignedTableId.features || []
        } : null,
        preferredTable: reservation.tableAssignment?.preferredTableId ? {
          id: reservation.tableAssignment.preferredTableId._id.toString(),
          number: reservation.tableAssignment.preferredTableId.number,
          section: reservation.tableAssignment.preferredTableId.section,
          capacity: reservation.tableAssignment.preferredTableId.capacity
        } : null,
        tablePreference: reservation.tableAssignment?.tablePreference || {}
      },
      status: reservation.status,
      timeline: {
        reservationMade: reservation.timeline?.reservationMade?.toISOString() || '',
        confirmed: reservation.timeline?.confirmed?.toISOString() || null,
        reminderSent: reservation.timeline?.reminderSent?.toISOString() || null,
        customerArrived: reservation.timeline?.customerArrived?.toISOString() || null,
        seated: reservation.timeline?.seated?.toISOString() || null,
        orderTaken: reservation.timeline?.orderTaken?.toISOString() || null,
        mealCompleted: reservation.timeline?.mealCompleted?.toISOString() || null,
        departed: reservation.timeline?.departed?.toISOString() || null,
        cancelled: reservation.timeline?.cancelled?.toISOString() || null
      },
      service: {
        assignedHost: reservation.service?.assignedHost || null,
        assignedWaiter: reservation.service?.assignedWaiter || null,
        serviceNotes: reservation.service?.serviceNotes || '',
        vipTreatment: reservation.service?.vipTreatment || false,
        specialArrangements: reservation.service?.specialArrangements || [],
        checkIn: reservation.service?.checkIn || null
      },
      payment: {
        depositRequired: reservation.payment?.depositRequired || false,
        depositAmount: reservation.payment?.depositAmount || 0,
        depositPaid: reservation.payment?.depositPaid || false,
        depositDate: reservation.payment?.depositDate?.toISOString() || null,
        refundAmount: reservation.payment?.refundAmount || 0,
        cancellationFee: reservation.payment?.cancellationFee || 0
      },
      communications: {
        confirmationSent: reservation.communications?.confirmationSent || false,
        reminderSent: reservation.communications?.reminderSent || false,
        notifications: reservation.communications?.notifications || [],
        messages: reservation.communications?.customerMessages || []
      },
      businessRules: {
        source: reservation.businessRules?.source || 'unknown',
        campaignId: reservation.businessRules?.campaignId || '',
        referralCode: reservation.businessRules?.referralCode || '',
        loyaltyPoints: reservation.businessRules?.loyaltyPoints || 0
      },
      feedback: reservation.feedback || null,
      createdAt: reservation.createdAt?.toISOString() || '',
      updatedAt: reservation.updatedAt?.toISOString() || '',
      createdBy: reservation.createdBy,
      lastUpdatedBy: reservation.lastUpdatedBy
    }

    return NextResponse.json({
      success: true,
      reservation: detailedReservation
    })

  } catch (error) {
    console.error('Error fetching reservation details:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservation details" },
      { status: 500 }
    )
  }
})

// DELETE handler - Cancel reservation
export const DELETE = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

    const reservationId = params.id
    if (!reservationId || !Types.ObjectId.isValid(reservationId)) {
      return NextResponse.json(
        { success: false, message: "Valid reservation ID is required" },
        { status: 400 }
      )
    }

    // Parse request body for cancellation details
    let body = {};
    try {
      body = await req.json()
    } catch (parseError) {
      // Body is optional for DELETE
    }

    const { reason = 'Cancelled by staff', refundAmount = 0 } = body as any

    // Find and cancel the reservation
    const reservation = await Reservation.findById(reservationId)
    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      )
    }

    // Cancel using the model method
    await reservation.cancel(reason, 'restaurant', refundAmount)

    return NextResponse.json({
      success: true,
      message: "Reservation cancelled successfully",
      reservationId: reservationId,
      cancellationDetails: {
        reason,
        refundAmount,
        cancelledAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { success: false, message: "Failed to cancel reservation" },
      { status: 500 }
    )
  }
})