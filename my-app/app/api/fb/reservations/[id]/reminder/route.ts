import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// POST handler - Send reservation reminder
export const POST = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

    const { propertyId, method = 'sms', customMessage = null } = body

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Find the reservation
    const reservation = await Reservation.findOne({
      _id: new Types.ObjectId(reservationId),
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    })
    .populate('tableAssignment.assignedTableId', 'number section')
    .lean()

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found or doesn't belong to this property" },
        { status: 404 }
      )
    }

    // Check if reservation is in a valid status for reminders
    const validStatusesForReminders = ['confirmed', 'pending']
    if (!validStatusesForReminders.includes(reservation.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot send reminder for reservation with status: ${reservation.status}` },
        { status: 400 }
      )
    }

    // Check if customer has contact information
    const customerPhone = reservation.customer?.contactInfo?.phone
    const customerEmail = reservation.customer?.contactInfo?.email
    
    if (method === 'sms' && !customerPhone) {
      return NextResponse.json(
        { success: false, message: "Customer phone number is required for SMS reminders" },
        { status: 400 }
      )
    }

    if (method === 'email' && !customerEmail) {
      return NextResponse.json(
        { success: false, message: "Customer email is required for email reminders" },
        { status: 400 }
      )
    }

    // Generate reminder content
    const customerName = reservation.customer?.contactInfo?.name || 'Valued Customer'
    const reservationDate = reservation.reservationDetails?.reservationDate 
      ? new Date(reservation.reservationDetails.reservationDate).toLocaleDateString()
      : 'N/A'
    const reservationTime = reservation.reservationDetails?.reservationTime || 'N/A'
    const tableName = reservation.tableAssignment?.assignedTableId?.number 
      ? `Table ${reservation.tableAssignment.assignedTableId.number}`
      : 'Your reserved table'
    const partySize = reservation.reservationDetails?.partySize || 0

    const defaultMessage = customMessage || (
      method === 'sms' 
        ? `Hi ${customerName}, this is a reminder for your reservation on ${reservationDate} at ${reservationTime} for ${partySize} guests at ${tableName}. We look forward to seeing you! Reply STOP to opt out.`
        : method === 'email'
        ? `Dear ${customerName},\n\nThis is a friendly reminder about your upcoming reservation:\n\nDate: ${reservationDate}\nTime: ${reservationTime}\nParty Size: ${partySize}\nTable: ${tableName}\n\nWe look forward to welcoming you!\n\nBest regards,\nThe Restaurant Team`
        : `Reminder: Your reservation on ${reservationDate} at ${reservationTime} for ${partySize} guests.`
    )

    // In a real implementation, you would integrate with SMS/Email services
    // For now, we'll simulate sending the reminder and update the database
    
    try {
      // Simulate sending reminder (replace with actual SMS/Email service integration)
      const reminderSent = await simulateReminderSend(method, customerPhone, customerEmail, defaultMessage)
      
      if (!reminderSent.success) {
        return NextResponse.json(
          { success: false, message: `Failed to send ${method} reminder: ${reminderSent.error}` },
          { status: 500 }
        )
      }

      // Update reservation with reminder notification using the model method
      const reservationDoc = await Reservation.findById(reservationId)
      if (reservationDoc) {
        await reservationDoc.sendNotification('reminder', method, defaultMessage)
      }

      // Get updated notification count
      const updatedReservation = await Reservation.findById(reservationId).lean()
      const reminderCount = updatedReservation?.communications?.notifications?.filter(n => n.type === 'reminder').length || 0

      return NextResponse.json({
        success: true,
        message: `${method.toUpperCase()} reminder sent successfully`,
        reminderDetails: {
          method,
          sentTo: method === 'sms' ? customerPhone : customerEmail,
          sentAt: new Date().toISOString(),
          content: defaultMessage,
          totalRemindersSent: reminderCount
        },
        reservation: {
          id: reservationId,
          customerName,
          remindersSent: reminderCount,
          lastReminderTime: new Date().toISOString()
        }
      })

    } catch (sendError) {
      console.error('Error sending reminder:', sendError)
      return NextResponse.json(
        { success: false, message: `Failed to send ${method} reminder` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error processing reminder request:', error)
    return NextResponse.json(
      { success: false, message: "Failed to send reminder" },
      { status: 500 }
    )
  }
})

// Simulate reminder sending (replace with actual SMS/Email service integration)
async function simulateReminderSend(
  method: string, 
  phone: string | undefined, 
  email: string | undefined, 
  message: string
): Promise<{ success: boolean; error?: string }> {
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate success/failure (90% success rate)
  const shouldSucceed = Math.random() > 0.1
  
  if (!shouldSucceed) {
    return {
      success: false,
      error: `Failed to deliver ${method} to ${method === 'sms' ? phone : email}`
    }
  }

  // Log the simulated reminder (in production, this would be actual SMS/Email sending)
  console.log(`[SIMULATED ${method.toUpperCase()} REMINDER]`)
  console.log(`To: ${method === 'sms' ? phone : email}`)
  console.log(`Message: ${message}`)
  console.log(`Sent at: ${new Date().toISOString()}`)
  
  return { success: true }
}

// GET handler - Get reminder history for a reservation
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

    // Find reservation and get reminder history
    const reservation = await Reservation.findById(reservationId)
      .select('communications.notifications timeline.reminderSent customer.contactInfo')
      .lean()

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      )
    }

    // Filter reminder notifications
    const reminders = reservation.communications?.notifications?.filter(n => n.type === 'reminder') || []
    
    const reminderHistory = reminders.map(reminder => ({
      id: reminder._id?.toString() || '',
      method: reminder.method,
      sentAt: reminder.sentAt?.toISOString() || '',
      status: reminder.status,
      content: reminder.content || '',
      deliveryStatus: reminder.status === 'delivered' ? 'Delivered' : 
                     reminder.status === 'failed' ? 'Failed' : 'Sent'
    }))

    return NextResponse.json({
      success: true,
      reminderHistory,
      summary: {
        totalReminders: reminders.length,
        lastReminderSent: reservation.timeline?.reminderSent?.toISOString() || null,
        customerPhone: reservation.customer?.contactInfo?.phone || null,
        customerEmail: reservation.customer?.contactInfo?.email || null,
        canSendReminders: ['confirmed', 'pending'].includes(reservation.status || '')
      }
    })

  } catch (error) {
    console.error('Error fetching reminder history:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch reminder history" },
      { status: 500 }
    )
  }
})