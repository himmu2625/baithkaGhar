/**
 * Real-time WebSocket Notification System
 * Handles real-time updates for bookings, payments, and system events
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'

export interface NotificationEvent {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'payment_received' | 
        'system_alert' | 'guest_message' | 'admin_broadcast' | 'property_update' | 
        'automation_triggered' | 'overbooking_alert'
  data: any
  recipients: string[] // User IDs or 'all' for broadcast
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'booking' | 'payment' | 'system' | 'communication' | 'alert'
  metadata?: {
    propertyId?: string
    bookingId?: string
    userId?: string
    sound?: boolean
    persistent?: boolean
  }
}

export interface UserSession {
  userId: string
  socketId: string
  role: string
  connectedAt: Date
  lastSeen: Date
  preferences?: {
    notifications: boolean
    sounds: boolean
    categories: string[]
  }
}

class WebSocketNotificationManager {
  private io: SocketIOServer | null = null
  private activeSessions: Map<string, UserSession> = new Map()
  private userSockets: Map<string, Set<string>> = new Map()
  private notificationHistory: NotificationEvent[] = []
  private maxHistorySize = 1000

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1]
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
        socket.data.user = {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          role: decoded.role || 'user'
        }

        next()
      } catch (error) {
        next(new Error('Invalid authentication token'))
      }
    })

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket)
    })

    console.log('🔗 [WebSocketNotificationManager] WebSocket server initialized')
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: any) {
    const userId = socket.data.user.id
    const userRole = socket.data.user.role

    console.log(`🔗 [WebSocketNotificationManager] User ${userId} connected`)

    // Register session
    const session: UserSession = {
      userId,
      socketId: socket.id,
      role: userRole,
      connectedAt: new Date(),
      lastSeen: new Date(),
      preferences: {
        notifications: true,
        sounds: true,
        categories: ['booking', 'payment', 'system', 'communication', 'alert']
      }
    }

    this.activeSessions.set(socket.id, session)
    
    // Track user's sockets (users can have multiple tabs/devices)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socket.id)

    // Join user to their personal room
    socket.join(`user_${userId}`)

    // Join role-based rooms
    socket.join(`role_${userRole}`)

    // Join property-specific rooms if user is property owner
    if (userRole === 'property_owner') {
      // In a real implementation, you'd fetch user's properties from the database
      // socket.join(`property_${propertyId}`)
    }

    // Send recent notifications to newly connected user
    this.sendRecentNotifications(socket, userId)

    // Event handlers
    socket.on('subscribe_to_property', (propertyId: string) => {
      socket.join(`property_${propertyId}`)
      console.log(`👤 [WebSocketNotificationManager] User ${userId} subscribed to property ${propertyId}`)
    })

    socket.on('unsubscribe_from_property', (propertyId: string) => {
      socket.leave(`property_${propertyId}`)
      console.log(`👤 [WebSocketNotificationManager] User ${userId} unsubscribed from property ${propertyId}`)
    })

    socket.on('update_preferences', (preferences: any) => {
      const session = this.activeSessions.get(socket.id)
      if (session) {
        session.preferences = { ...session.preferences, ...preferences }
        console.log(`⚙️ [WebSocketNotificationManager] Updated preferences for user ${userId}`)
      }
    })

    socket.on('mark_notification_read', (notificationId: string) => {
      // In a real implementation, you'd update the database
      console.log(`✅ [WebSocketNotificationManager] User ${userId} marked notification ${notificationId} as read`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ [WebSocketNotificationManager] User ${userId} disconnected`)
      
      // Clean up session
      this.activeSessions.delete(socket.id)
      
      const userSockets = this.userSockets.get(userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          this.userSockets.delete(userId)
        }
      }
    })

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to real-time notifications',
      userId,
      timestamp: new Date(),
      activeUsers: this.getActiveUserCount()
    })
  }

  /**
   * Send recent notifications to newly connected user
   */
  private sendRecentNotifications(socket: any, userId: string) {
    const recentNotifications = this.notificationHistory
      .filter(notification => 
        notification.recipients.includes(userId) || 
        notification.recipients.includes('all')
      )
      .slice(-10) // Last 10 notifications

    if (recentNotifications.length > 0) {
      socket.emit('recent_notifications', recentNotifications)
    }
  }

  /**
   * Send notification to specific users or broadcast
   */
  async sendNotification(notification: NotificationEvent) {
    if (!this.io) {
      console.warn('⚠️ [WebSocketNotificationManager] WebSocket server not initialized')
      return
    }

    // Add to history
    this.addToHistory(notification)

    console.log(`📢 [WebSocketNotificationManager] Sending ${notification.type} notification to ${notification.recipients.length} recipients`)

    // Determine target rooms/sockets
    const targetRooms: string[] = []
    
    if (notification.recipients.includes('all')) {
      // Broadcast to all connected users
      this.io.emit('notification', this.formatNotification(notification))
    } else {
      // Send to specific users
      for (const recipientId of notification.recipients) {
        const userSockets = this.userSockets.get(recipientId)
        if (userSockets && userSockets.size > 0) {
          this.io.to(`user_${recipientId}`).emit('notification', this.formatNotification(notification))
        }
      }
    }

    // Property-specific notifications
    if (notification.metadata?.propertyId) {
      this.io.to(`property_${notification.metadata.propertyId}`).emit('notification', this.formatNotification(notification))
    }

    // Role-based notifications
    if (notification.category === 'alert' || notification.priority === 'urgent') {
      this.io.to('role_admin').emit('notification', this.formatNotification(notification))
      this.io.to('role_super_admin').emit('notification', this.formatNotification(notification))
    }
  }

  /**
   * Format notification for client consumption
   */
  private formatNotification(notification: NotificationEvent) {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type,
      title: this.getNotificationTitle(notification.type),
      message: this.getNotificationMessage(notification),
      data: notification.data,
      priority: notification.priority,
      category: notification.category,
      timestamp: notification.timestamp,
      metadata: notification.metadata,
      actions: this.getNotificationActions(notification.type)
    }
  }

  /**
   * Get notification title based on type
   */
  private getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      'booking_created': 'New Booking Received',
      'booking_updated': 'Booking Updated',
      'booking_cancelled': 'Booking Cancelled',
      'payment_received': 'Payment Received',
      'system_alert': 'System Alert',
      'guest_message': 'New Guest Message',
      'admin_broadcast': 'Admin Announcement',
      'property_update': 'Property Updated',
      'automation_triggered': 'Automation Executed',
      'overbooking_alert': 'Overbooking Alert'
    }
    return titles[type] || 'Notification'
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(notification: NotificationEvent): string {
    switch (notification.type) {
      case 'booking_created':
        return `New booking #${notification.data.bookingCode} for ${notification.data.propertyName}`
      case 'booking_updated':
        return `Booking #${notification.data.bookingCode} status changed to ${notification.data.status}`
      case 'payment_received':
        return `Payment of ₹${notification.data.amount} received for booking #${notification.data.bookingCode}`
      case 'overbooking_alert':
        return `Potential overbooking detected for ${notification.data.propertyName}`
      default:
        return notification.data.message || 'New notification'
    }
  }

  /**
   * Get available actions for notification type
   */
  private getNotificationActions(type: string): Array<{action: string, label: string}> {
    switch (type) {
      case 'booking_created':
        return [
          { action: 'view_booking', label: 'View Booking' },
          { action: 'confirm_booking', label: 'Confirm' }
        ]
      case 'booking_cancelled':
        return [
          { action: 'view_booking', label: 'View Details' },
          { action: 'process_refund', label: 'Process Refund' }
        ]
      case 'payment_received':
        return [
          { action: 'view_booking', label: 'View Booking' },
          { action: 'send_confirmation', label: 'Send Confirmation' }
        ]
      case 'overbooking_alert':
        return [
          { action: 'view_conflicts', label: 'View Conflicts' },
          { action: 'resolve_overbooking', label: 'Resolve' }
        ]
      default:
        return [{ action: 'dismiss', label: 'Dismiss' }]
    }
  }

  /**
   * Add notification to history
   */
  private addToHistory(notification: NotificationEvent) {
    this.notificationHistory.push(notification)
    
    // Keep history size manageable
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Booking-specific notifications
   */
  async notifyBookingCreated(booking: any, propertyOwners: string[] = []) {
    await this.sendNotification({
      type: 'booking_created',
      data: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode || `BK-${booking._id.toString().slice(-6).toUpperCase()}`,
        propertyName: booking.propertyId?.title || 'Unknown Property',
        guestName: booking.userId?.name || booking.contactDetails?.name,
        checkIn: booking.dateFrom,
        checkOut: booking.dateTo,
        amount: booking.totalPrice
      },
      recipients: [...propertyOwners, 'admin'],
      timestamp: new Date(),
      priority: 'medium',
      category: 'booking',
      metadata: {
        bookingId: booking._id.toString(),
        propertyId: booking.propertyId?._id?.toString(),
        sound: true,
        persistent: true
      }
    })
  }

  async notifyBookingUpdated(booking: any, oldStatus: string, newStatus: string) {
    await this.sendNotification({
      type: 'booking_updated',
      data: {
        bookingId: booking._id,
        bookingCode: booking.bookingCode || `BK-${booking._id.toString().slice(-6).toUpperCase()}`,
        oldStatus,
        newStatus,
        propertyName: booking.propertyId?.title
      },
      recipients: [booking.userId?.toString(), 'admin'],
      timestamp: new Date(),
      priority: 'medium',
      category: 'booking',
      metadata: {
        bookingId: booking._id.toString(),
        propertyId: booking.propertyId?._id?.toString()
      }
    })
  }

  async notifyPaymentReceived(payment: any, booking: any) {
    await this.sendNotification({
      type: 'payment_received',
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        bookingCode: booking.bookingCode,
        propertyName: booking.propertyId?.title
      },
      recipients: ['admin'],
      timestamp: new Date(),
      priority: 'medium',
      category: 'payment',
      metadata: {
        bookingId: booking._id.toString(),
        sound: true
      }
    })
  }

  async notifyOverbookingAlert(propertyId: string, propertyName: string, conflictDetails: any) {
    await this.sendNotification({
      type: 'overbooking_alert',
      data: {
        propertyId,
        propertyName,
        conflictDetails,
        severity: conflictDetails.riskLevel
      },
      recipients: ['admin'],
      timestamp: new Date(),
      priority: 'urgent',
      category: 'alert',
      metadata: {
        propertyId,
        sound: true,
        persistent: true
      }
    })
  }

  /**
   * System notifications
   */
  async broadcastSystemAlert(message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    await this.sendNotification({
      type: 'system_alert',
      data: { message },
      recipients: ['all'],
      timestamp: new Date(),
      priority,
      category: 'system',
      metadata: {
        sound: priority === 'urgent',
        persistent: priority === 'urgent'
      }
    })
  }

  async notifyAutomationTriggered(ruleName: string, affectedBookings: string[], results: any) {
    await this.sendNotification({
      type: 'automation_triggered',
      data: {
        ruleName,
        affectedBookings,
        results,
        summary: `${results.successful || 0} bookings processed successfully`
      },
      recipients: ['admin'],
      timestamp: new Date(),
      priority: 'low',
      category: 'system',
      metadata: {
        sound: false
      }
    })
  }

  /**
   * Get statistics about active connections
   */
  getStats() {
    const now = new Date()
    const sessions = Array.from(this.activeSessions.values())
    
    return {
      totalConnections: this.activeSessions.size,
      uniqueUsers: this.userSockets.size,
      usersByRole: sessions.reduce((acc, session) => {
        acc[session.role] = (acc[session.role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      averageSessionDuration: sessions.reduce((sum, session) => 
        sum + (now.getTime() - session.connectedAt.getTime()), 0) / sessions.length,
      notificationsInHistory: this.notificationHistory.length,
      lastNotificationTime: this.notificationHistory.length > 0 ? 
        this.notificationHistory[this.notificationHistory.length - 1].timestamp : null
    }
  }

  /**
   * Get active user count
   */
  private getActiveUserCount(): number {
    return this.userSockets.size
  }

  /**
   * Force disconnect a user (admin function)
   */
  disconnectUser(userId: string, reason: string = 'Administrative action') {
    const userSockets = this.userSockets.get(userId)
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io?.sockets.sockets.get(socketId)
        if (socket) {
          socket.emit('force_disconnect', { reason })
          socket.disconnect()
        }
      })
    }
  }

  /**
   * Clean up old notification history
   */
  cleanupHistory(maxAgeHours: number = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    const initialCount = this.notificationHistory.length
    
    this.notificationHistory = this.notificationHistory.filter(
      notification => notification.timestamp > cutoffTime
    )
    
    const removedCount = initialCount - this.notificationHistory.length
    if (removedCount > 0) {
      console.log(`🧹 [WebSocketNotificationManager] Cleaned up ${removedCount} old notifications`)
    }
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketNotificationManager()

export default WebSocketNotificationManager