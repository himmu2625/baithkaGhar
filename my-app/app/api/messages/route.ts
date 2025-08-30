import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import GuestMessage from "@/models/GuestMessage"
import Booking from "@/models/Booking"
import { sendReactEmail } from "@/lib/services/email"
import { webSocketManager } from "@/lib/services/websocket-notifications"
import dbConnect from "@/lib/db/dbConnect"
import { z } from "zod"

// Schema for message validation
const messageSchema = z.object({
  bookingId: z.string(),
  recipientId: z.string(),
  recipientType: z.enum(['guest', 'admin', 'property_owner']),
  content: z.string().min(1).max(2000),
  subject: z.string().max(200).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string(),
    fileType: z.string(),
    fileSize: z.number()
  })).optional()
})

export const dynamic = 'force-dynamic';

// GET: Retrieve messages for a user or conversation
export async function GET(req: Request) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')
    const conversationWith = searchParams.get('conversationWith')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const conversations = searchParams.get('conversations') === 'true'

    const userId = session.user.id
    const userType = session.user.role === 'admin' ? 'admin' : 'guest'

    console.log(`📥 [GET /api/messages] Request from ${userId} (${userType})`)

    // Get recent conversations list
    if (conversations) {
      const recentConversations = await (GuestMessage as any).getRecentConversations(userId, userType)
      
      // Populate booking and user details
      await GuestMessage.populate(recentConversations, [
        {
          path: 'lastMessage.bookingId',
          select: 'bookingCode propertyId dateFrom dateTo',
          populate: {
            path: 'propertyId',
            select: 'title'
          }
        },
        {
          path: 'lastMessage.senderId',
          select: 'name email'
        },
        {
          path: 'lastMessage.recipientId',
          select: 'name email'
        }
      ])

      return NextResponse.json({ conversations: recentConversations })
    }

    // Get specific conversation
    if (bookingId && conversationWith) {
      const messages = await (GuestMessage as any).getConversation(
        bookingId, 
        userId, 
        conversationWith, 
        page, 
        limit
      )

      return NextResponse.json({ 
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        }
      })
    }

    // Get all messages for user (inbox view)
    const filter: any = {
      $or: [
        { senderId: userId, senderType: userType },
        { recipientId: userId, recipientType: userType }
      ]
    }

    if (unreadOnly) {
      filter.recipientId = userId
      filter.recipientType = userType
      filter.status = { $in: ['sent', 'delivered'] }
    }

    const messages = await GuestMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .populate('bookingId', 'bookingCode propertyId')
      .lean()

    const totalCount = await GuestMessage.countDocuments(filter)
    const unreadCount = await (GuestMessage as any).getUnreadCount(userId, userType)

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: (page * limit) < totalCount
      },
      unreadCount
    })

  } catch (error: any) {
    console.error("💥 [GET /api/messages] Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch messages",
      details: error.message
    }, { status: 500 })
  }
}

// POST: Send a new message
export async function POST(req: Request) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = messageSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid message data", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const messageData = validationResult.data
    const senderId = session.user.id
    const senderType = session.user.role === 'admin' ? 'admin' : 'guest'

    console.log(`📤 [POST /api/messages] Sending message from ${senderId} to ${messageData.recipientId}`)

    // Verify booking exists and user has access
    const booking = await Booking.findById(messageData.bookingId)
      .populate('userId', 'name email')
      .populate('propertyId', 'title ownerId')

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user has permission to send message for this booking
    const canSendMessage = 
      booking.userId._id.toString() === senderId || // Guest who made the booking
      session.user.role === 'admin' || // Admin
      booking.propertyId.ownerId?.toString() === senderId // Property owner

    if (!canSendMessage) {
      return NextResponse.json({ error: "No permission to send message for this booking" }, { status: 403 })
    }

    // Create the message
    const message = new GuestMessage({
      bookingId: messageData.bookingId,
      senderId,
      senderType,
      recipientId: messageData.recipientId,
      recipientType: messageData.recipientType,
      content: messageData.content,
      subject: messageData.subject,
      priority: messageData.priority,
      messageType: messageData.messageType,
      attachments: messageData.attachments || [],
      metadata: {
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        sentFromPage: req.headers.get('referer')
      }
    })

    await message.save()

    // Populate the saved message for response
    await message.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'recipientId', select: 'name email' },
      { path: 'bookingId', select: 'bookingCode propertyId' }
    ])

    console.log(`✅ [POST /api/messages] Message ${message._id} created successfully`)

    // Send real-time notification
    try {
      await webSocketManager.sendNotification({
        type: 'guest_message',
        data: {
          messageId: message._id,
          bookingCode: booking.bookingCode || `BK-${booking._id.toString().slice(-6).toUpperCase()}`,
          senderName: (message.senderId as any)?.name || 'Unknown',
          content: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
          propertyName: booking.propertyId.title
        },
        recipients: [messageData.recipientId],
        timestamp: new Date(),
        priority: messageData.priority,
        category: 'communication',
        metadata: {
          bookingId: messageData.bookingId,
          sound: ['high', 'urgent'].includes(messageData.priority),
          persistent: messageData.priority === 'urgent'
        }
      })
    } catch (notificationError) {
      console.error("📢 [POST /api/messages] Notification error:", notificationError)
    }

    // Send email notification for high/urgent priority messages
    if (['high', 'urgent'].includes(messageData.priority)) {
      try {
        const recipient = await GuestMessage.populate(message, { path: 'recipientId', select: 'email name' })
        
        if ((recipient.recipientId as any)?.email) {
          await sendReactEmail({
            to: (recipient.recipientId as any).email,
            subject: messageData.subject || `New message for booking ${booking.bookingCode}`,
            emailComponent: 'guest-message-notification'
          })
          console.log(`📧 [POST /api/messages] Email notification sent`)
        }
      } catch (emailError) {
        console.error("📧 [POST /api/messages] Email error:", emailError)
      }
    }

    // Trigger automated responses if applicable
    setTimeout(async () => {
      await triggerAutomatedResponse(message, booking)
    }, 1000)

    return NextResponse.json(message, { status: 201 })

  } catch (error: any) {
    console.error("💥 [POST /api/messages] Error:", error)
    return NextResponse.json({ 
      error: "Failed to send message",
      details: error.message
    }, { status: 500 })
  }
}

// PUT: Mark messages as read
export async function PUT(req: Request) {
  try {
    await dbConnect()
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageIds, action } = await req.json()
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "Invalid message IDs" }, { status: 400 })
    }

    const userId = session.user.id

    let updateResult
    
    switch (action) {
      case 'mark_read':
        updateResult = await (GuestMessage as any).markAsRead(messageIds, userId)
        break
        
      case 'archive':
        updateResult = await GuestMessage.updateMany(
          {
            _id: { $in: messageIds },
            recipientId: userId
          },
          {
            $set: {
              status: 'archived',
              archivedAt: new Date()
            }
          }
        )
        break
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log(`✅ [PUT /api/messages] ${action} completed for ${updateResult.modifiedCount} messages`)

    return NextResponse.json({ 
      success: true, 
      updated: updateResult.modifiedCount 
    })

  } catch (error: any) {
    console.error("💥 [PUT /api/messages] Error:", error)
    return NextResponse.json({ 
      error: "Failed to update messages",
      details: error.message
    }, { status: 500 })
  }
}

/**
 * Trigger automated responses based on message content and context
 */
async function triggerAutomatedResponse(message: any, booking: any) {
  try {
    const content = message.content.toLowerCase()
    
    // Define auto-response triggers
    const autoResponses: Array<{
      keywords: string[]
      response: string
      delay: number
      conditions?: (message: any, booking: any) => boolean
    }> = [
      {
        keywords: ['check-in', 'checkin', 'arrival', 'key'],
        response: `Hi! Your check-in time for booking ${booking.bookingCode} is at 3:00 PM. You'll receive detailed check-in instructions 24 hours before your arrival date.`,
        delay: 2000,
        conditions: (msg, bkg) => new Date(bkg.dateFrom) > new Date()
      },
      {
        keywords: ['check-out', 'checkout', 'departure', 'leaving'],
        response: `Check-out time is 11:00 AM. Please ensure all belongings are collected and room keys are returned. Thank you for staying with us!`,
        delay: 1500
      },
      {
        keywords: ['wifi', 'internet', 'password'],
        response: `The WiFi network name is "PropertyGuest" and the password is "welcome123". If you experience any connectivity issues, please let us know.`,
        delay: 1000
      },
      {
        keywords: ['parking', 'car', 'vehicle'],
        response: `Free parking is available on-site. Please display your booking confirmation on your dashboard for easy identification.`,
        delay: 1500
      },
      {
        keywords: ['cancel', 'cancellation', 'refund'],
        response: `For cancellation and refund inquiries, please note our cancellation policy. Free cancellation is available up to 24 hours before check-in. Would you like me to connect you with our support team?`,
        delay: 3000
      }
    ]

    // Check for matching auto-responses
    for (const autoResponse of autoResponses) {
      const hasKeyword = autoResponse.keywords.some(keyword => content.includes(keyword))
      const meetsConditions = !autoResponse.conditions || autoResponse.conditions(message, booking)
      
      if (hasKeyword && meetsConditions) {
        setTimeout(async () => {
          const autoReplyMessage = new GuestMessage({
            bookingId: message.bookingId,
            senderId: message.recipientId, // System responds as the recipient
            senderType: message.recipientType,
            recipientId: message.senderId,
            recipientType: message.senderType,
            content: autoResponse.response,
            messageType: 'auto_response',
            isSystemGenerated: true,
            automatedResponse: {
              triggered: true,
              responseType: 'keyword_match',
              delay: autoResponse.delay
            },
            priority: 'low'
          })

          await autoReplyMessage.save()
          
          // Send real-time notification for auto-response
          await webSocketManager.sendNotification({
            type: 'guest_message',
            data: {
              messageId: autoReplyMessage._id,
              bookingCode: booking.bookingCode,
              senderName: 'Auto-Assistant',
              content: autoResponse.response,
              isAutomatic: true
            },
            recipients: [message.senderId.toString()],
            timestamp: new Date(),
            priority: 'low',
            category: 'communication'
          })
          
          console.log(`🤖 [AutoResponse] Sent automated response for keywords: ${autoResponse.keywords.join(', ')}`)
        }, autoResponse.delay)
        
        break // Only trigger the first matching response
      }
    }
    
  } catch (error) {
    console.error("🤖 [AutoResponse] Error triggering automated response:", error)
  }
}