import { connectToDatabase } from '@/lib/mongodb'

export interface ServiceRequest {
  id: string
  bookingId: string
  guestId: string
  propertyId: string
  roomNumber: string
  category: 'housekeeping' | 'maintenance' | 'amenities' | 'dining' | 'concierge' | 'transport' | 'other'
  type: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
  requestedBy: string
  requestedAt: Date
  scheduledFor?: Date
  estimatedDuration?: number
  assignedTo?: string
  acknowledgedAt?: Date
  startedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  notes?: string
  guestFeedback?: {
    rating: number
    comment?: string
    submittedAt: Date
  }
  internalNotes?: string
  cost?: number
  items?: Array<{
    name: string
    quantity: number
    unitCost?: number
  }>
}

export interface ServiceRequestResponse {
  success: boolean
  requestId?: string
  estimatedTime?: string
  error?: string
}

export interface ServiceCategory {
  category: string
  services: Array<{
    type: string
    name: string
    description: string
    estimatedDuration: number
    cost?: number
    requiresScheduling: boolean
    availableHours?: {
      start: string
      end: string
    }
  }>
}

export class GuestServiceRequestService {
  private static readonly SERVICE_CATEGORIES: ServiceCategory[] = [
    {
      category: 'housekeeping',
      services: [
        {
          type: 'room_cleaning',
          name: 'Room Cleaning',
          description: 'Complete room cleaning service',
          estimatedDuration: 45,
          requiresScheduling: true,
          availableHours: { start: '08:00', end: '18:00' }
        },
        {
          type: 'towel_change',
          name: 'Fresh Towels',
          description: 'Replace towels with fresh ones',
          estimatedDuration: 10,
          requiresScheduling: false
        },
        {
          type: 'bed_making',
          name: 'Bed Making',
          description: 'Make beds and arrange room',
          estimatedDuration: 15,
          requiresScheduling: false
        },
        {
          type: 'amenities_refill',
          name: 'Amenities Refill',
          description: 'Refill toiletries and amenities',
          estimatedDuration: 10,
          requiresScheduling: false
        }
      ]
    },
    {
      category: 'maintenance',
      services: [
        {
          type: 'ac_issue',
          name: 'Air Conditioning',
          description: 'AC not working or temperature issues',
          estimatedDuration: 30,
          requiresScheduling: true
        },
        {
          type: 'plumbing',
          name: 'Plumbing Issue',
          description: 'Water pressure, leaks, or drainage issues',
          estimatedDuration: 45,
          requiresScheduling: true
        },
        {
          type: 'electrical',
          name: 'Electrical Issue',
          description: 'Lights, outlets, or electrical problems',
          estimatedDuration: 30,
          requiresScheduling: true
        },
        {
          type: 'wifi_internet',
          name: 'WiFi/Internet',
          description: 'Internet connectivity issues',
          estimatedDuration: 20,
          requiresScheduling: false
        }
      ]
    },
    {
      category: 'amenities',
      services: [
        {
          type: 'extra_pillows',
          name: 'Extra Pillows',
          description: 'Additional pillows for comfort',
          estimatedDuration: 5,
          requiresScheduling: false
        },
        {
          type: 'extra_blankets',
          name: 'Extra Blankets',
          description: 'Additional blankets',
          estimatedDuration: 5,
          requiresScheduling: false
        },
        {
          type: 'iron_board',
          name: 'Iron & Ironing Board',
          description: 'Iron and ironing board delivery',
          estimatedDuration: 5,
          requiresScheduling: false
        },
        {
          type: 'baby_cot',
          name: 'Baby Cot',
          description: 'Baby cot setup in room',
          estimatedDuration: 15,
          requiresScheduling: true
        }
      ]
    },
    {
      category: 'dining',
      services: [
        {
          type: 'room_service',
          name: 'Room Service',
          description: 'Food delivery to room',
          estimatedDuration: 30,
          requiresScheduling: true,
          availableHours: { start: '06:00', end: '23:00' }
        },
        {
          type: 'special_dietary',
          name: 'Special Dietary Request',
          description: 'Special meal preparation for dietary needs',
          estimatedDuration: 45,
          requiresScheduling: true
        },
        {
          type: 'celebration_setup',
          name: 'Celebration Setup',
          description: 'Room decoration for special occasions',
          estimatedDuration: 60,
          cost: 2500,
          requiresScheduling: true
        }
      ]
    },
    {
      category: 'concierge',
      services: [
        {
          type: 'tour_booking',
          name: 'Tour Booking',
          description: 'Local tour and activity arrangements',
          estimatedDuration: 15,
          requiresScheduling: true
        },
        {
          type: 'restaurant_reservation',
          name: 'Restaurant Reservation',
          description: 'Book tables at local restaurants',
          estimatedDuration: 10,
          requiresScheduling: false
        },
        {
          type: 'ticket_booking',
          name: 'Event Tickets',
          description: 'Book tickets for events, shows, or attractions',
          estimatedDuration: 20,
          requiresScheduling: true
        }
      ]
    },
    {
      category: 'transport',
      services: [
        {
          type: 'airport_pickup',
          name: 'Airport Pickup',
          description: 'Airport transfer service',
          estimatedDuration: 120,
          cost: 1500,
          requiresScheduling: true
        },
        {
          type: 'local_taxi',
          name: 'Local Taxi',
          description: 'Arrange local transportation',
          estimatedDuration: 10,
          requiresScheduling: true
        },
        {
          type: 'car_rental',
          name: 'Car Rental',
          description: 'Arrange car rental services',
          estimatedDuration: 30,
          requiresScheduling: true
        }
      ]
    }
  ]

  static async getServiceCategories(): Promise<ServiceCategory[]> {
    return this.SERVICE_CATEGORIES
  }

  static async createServiceRequest(request: {
    bookingId: string
    category: string
    type: string
    description: string
    priority?: string
    scheduledFor?: Date
    items?: Array<{ name: string; quantity: number }>
  }): Promise<ServiceRequestResponse> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const booking = await Booking.findById(request.bookingId)

      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      const serviceCategory = this.SERVICE_CATEGORIES.find(cat => cat.category === request.category)
      if (!serviceCategory) {
        return { success: false, error: 'Invalid service category' }
      }

      const serviceType = serviceCategory.services.find(service => service.type === request.type)
      if (!serviceType) {
        return { success: false, error: 'Invalid service type' }
      }

      const Room = (await import('@/models/Room')).default
      const room = await Room.findById(booking.roomId)

      const requestId = `SR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const serviceRequest: ServiceRequest = {
        id: requestId,
        bookingId: request.bookingId,
        guestId: booking.userId.toString(),
        propertyId: booking.propertyId.toString(),
        roomNumber: room?.roomNumber || 'N/A',
        category: request.category as any,
        type: request.type,
        description: request.description,
        priority: (request.priority as any) || 'medium',
        status: 'pending',
        requestedBy: booking.guestName,
        requestedAt: new Date(),
        scheduledFor: request.scheduledFor,
        estimatedDuration: serviceType.estimatedDuration,
        cost: serviceType.cost,
        items: request.items
      }

      // Store the service request (you may want to create a ServiceRequest model)
      // For now, we'll store it in a collection
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')
      await collection.insertOne(serviceRequest)

      await client.close()

      // Send notifications to staff
      await this.notifyStaff(serviceRequest)

      // Send confirmation to guest
      await this.sendGuestConfirmation(serviceRequest)

      const estimatedTime = serviceType.requiresScheduling
        ? `Scheduled for ${request.scheduledFor?.toLocaleString()}`
        : `${serviceType.estimatedDuration} minutes`

      return {
        success: true,
        requestId,
        estimatedTime
      }

    } catch (error) {
      console.error('Error creating service request:', error)
      return { success: false, error: 'Failed to create service request' }
    }
  }

  static async updateRequestStatus(requestId: string, status: ServiceRequest['status'], updates?: {
    assignedTo?: string
    startedAt?: Date
    completedAt?: Date
    notes?: string
    internalNotes?: string
  }): Promise<ServiceRequestResponse> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')

      const updateData: any = {
        status,
        [`${status}At`]: new Date()
      }

      if (updates) {
        Object.assign(updateData, updates)
      }

      await collection.updateOne(
        { id: requestId },
        { $set: updateData }
      )

      await client.close()

      // Send status update to guest
      const request = await this.getServiceRequest(requestId)
      if (request) {
        await this.sendStatusUpdate(request, status)
      }

      return { success: true }

    } catch (error) {
      console.error('Error updating service request:', error)
      return { success: false, error: 'Failed to update service request' }
    }
  }

  static async getServiceRequest(requestId: string): Promise<ServiceRequest | null> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')
      const request = await collection.findOne({ id: requestId })

      await client.close()

      return request as ServiceRequest | null

    } catch (error) {
      console.error('Error fetching service request:', error)
      return null
    }
  }

  static async getGuestServiceRequests(bookingId: string): Promise<ServiceRequest[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')
      const requests = await collection.find({ bookingId }).sort({ requestedAt: -1 }).toArray()

      await client.close()

      return requests as ServiceRequest[]

    } catch (error) {
      console.error('Error fetching guest service requests:', error)
      return []
    }
  }

  static async getPropertyServiceRequests(propertyId: string, filters?: {
    status?: string
    category?: string
    priority?: string
    dateFrom?: Date
    dateTo?: Date
  }): Promise<ServiceRequest[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')

      const query: any = { propertyId }

      if (filters) {
        if (filters.status) query.status = filters.status
        if (filters.category) query.category = filters.category
        if (filters.priority) query.priority = filters.priority
        if (filters.dateFrom || filters.dateTo) {
          query.requestedAt = {}
          if (filters.dateFrom) query.requestedAt.$gte = filters.dateFrom
          if (filters.dateTo) query.requestedAt.$lte = filters.dateTo
        }
      }

      const requests = await collection.find(query).sort({ requestedAt: -1 }).toArray()

      await client.close()

      return requests as ServiceRequest[]

    } catch (error) {
      console.error('Error fetching property service requests:', error)
      return []
    }
  }

  static async submitGuestFeedback(requestId: string, feedback: {
    rating: number
    comment?: string
  }): Promise<ServiceRequestResponse> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('service_requests')

      await collection.updateOne(
        { id: requestId },
        {
          $set: {
            guestFeedback: {
              rating: feedback.rating,
              comment: feedback.comment,
              submittedAt: new Date()
            }
          }
        }
      )

      await client.close()

      return { success: true }

    } catch (error) {
      console.error('Error submitting guest feedback:', error)
      return { success: false, error: 'Failed to submit feedback' }
    }
  }

  private static async notifyStaff(request: ServiceRequest): Promise<void> {
    try {
      // Get property staff emails
      const Property = (await import('@/models/Property')).default
      const property = await Property.findById(request.propertyId)

      if (!property?.staff?.length) return

      const EmailService = (await import('./email-service')).EmailService
      const SMSService = (await import('./sms-service')).SMSService

      const subject = `New Service Request - ${request.category.toUpperCase()}`
      const message = `
        New service request received:

        Request ID: ${request.id}
        Category: ${request.category}
        Type: ${request.type}
        Priority: ${request.priority}
        Room: ${request.roomNumber}
        Guest: ${request.requestedBy}
        Description: ${request.description}

        Please acknowledge and assign this request promptly.
      `

      // Send email notifications
      for (const staff of property.staff) {
        if (staff.email && staff.notifications?.email) {
          await EmailService.sendEmail({
            to: staff.email,
            subject,
            html: message.replace(/\n/g, '<br>'),
            text: message,
            priority: request.priority === 'urgent' ? 'high' : 'normal'
          })
        }

        // Send SMS for urgent requests
        if (request.priority === 'urgent' && staff.phone && staff.notifications?.sms) {
          await SMSService.sendSMS({
            to: staff.phone,
            message: `URGENT: New ${request.category} request in room ${request.roomNumber}. ID: ${request.id}`,
            priority: 'high',
            category: 'service_request'
          })
        }
      }

    } catch (error) {
      console.error('Error notifying staff:', error)
    }
  }

  private static async sendGuestConfirmation(request: ServiceRequest): Promise<void> {
    try {
      const Booking = (await import('@/models/Booking')).default
      const booking = await Booking.findById(request.bookingId).populate('userId')

      if (!booking?.userId?.email) return

      const EmailService = (await import('./email-service')).EmailService

      const subject = 'Service Request Confirmation'
      const message = `
        Dear ${request.requestedBy},

        Your service request has been received and will be processed shortly.

        Request Details:
        - Request ID: ${request.id}
        - Service: ${request.type.replace('_', ' ').toUpperCase()}
        - Estimated Time: ${request.estimatedDuration} minutes
        ${request.scheduledFor ? `- Scheduled For: ${request.scheduledFor.toLocaleString()}` : ''}

        You will receive updates as we process your request.

        Thank you for choosing us!
      `

      await EmailService.sendEmail({
        to: booking.userId.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending guest confirmation:', error)
    }
  }

  private static async sendStatusUpdate(request: ServiceRequest, status: string): Promise<void> {
    try {
      const Booking = (await import('@/models/Booking')).default
      const booking = await Booking.findById(request.bookingId).populate('userId')

      if (!booking?.userId?.email) return

      const statusMessages = {
        acknowledged: 'Your service request has been acknowledged and assigned to our team.',
        in_progress: 'Our team is currently working on your service request.',
        completed: 'Your service request has been completed. We hope you\'re satisfied with our service!',
        cancelled: 'Your service request has been cancelled. Please contact us if you have any questions.'
      }

      const message = statusMessages[status as keyof typeof statusMessages] || `Your service request status has been updated to: ${status}`

      const EmailService = (await import('./email-service')).EmailService

      await EmailService.sendEmail({
        to: booking.userId.email,
        subject: `Service Request Update - ${request.id}`,
        html: `
          <p>Dear ${request.requestedBy},</p>
          <p>${message}</p>
          <p><strong>Request ID:</strong> ${request.id}</p>
          <p><strong>Service:</strong> ${request.type.replace('_', ' ').toUpperCase()}</p>
          ${status === 'completed' ? '<p>Please rate your experience when you have a moment.</p>' : ''}
          <p>Thank you for choosing us!</p>
        `,
        text: `Dear ${request.requestedBy},\n\n${message}\n\nRequest ID: ${request.id}\nService: ${request.type.replace('_', ' ').toUpperCase()}\n\nThank you for choosing us!`
      })

    } catch (error) {
      console.error('Error sending status update:', error)
    }
  }
}