import { connectToDatabase } from '@/lib/mongodb'

export interface GuestFeedback {
  id: string
  bookingId: string
  guestId: string
  propertyId: string
  type: 'stay_review' | 'service_review' | 'exit_survey' | 'custom'
  status: 'pending' | 'submitted' | 'processed' | 'responded'

  // Basic information
  guestName: string
  guestEmail: string
  roomNumber: string
  checkInDate: Date
  checkOutDate: Date
  stayDuration: number

  // Overall ratings (1-5 scale)
  overallRating: number
  cleanliness: number
  comfort: number
  service: number
  valueForMoney: number
  location: number
  amenities: number

  // Detailed feedback
  positiveAspects: string[]
  negativeAspects: string[]
  improvements: string[]
  wouldRecommend: boolean
  wouldReturnAgain: boolean

  // Written feedback
  comments: string
  privateNotes?: string

  // Additional details
  travelPurpose: 'business' | 'leisure' | 'family' | 'group' | 'other'
  guestType: 'first_time' | 'returning' | 'frequent'
  accompaniedBy: 'alone' | 'spouse' | 'family' | 'friends' | 'colleagues'

  // Experience ratings
  checkInExperience: number
  checkOutExperience: number
  staffBehavior: number
  responseTime: number

  // Facility ratings
  roomCondition: number
  bathroomCondition: number
  internetQuality: number
  foodQuality?: number
  parkingExperience?: number

  // Metadata
  submittedAt: Date
  submittedVia: 'email' | 'sms' | 'qr_code' | 'app' | 'website' | 'phone'
  language: string
  deviceType: 'mobile' | 'tablet' | 'desktop'

  // Management response
  managementResponse?: {
    message: string
    respondedBy: string
    respondedAt: Date
    actionsTaken?: string[]
  }

  // Internal processing
  processed: boolean
  processedAt?: Date
  processedBy?: string
  internalNotes?: string
  tags?: string[]
  priority: 'low' | 'medium' | 'high'
}

export interface FeedbackRequest {
  bookingId: string
  type?: string
  customQuestions?: Array<{
    question: string
    type: 'rating' | 'text' | 'multiple_choice' | 'boolean'
    options?: string[]
    required: boolean
  }>
  sendReminders?: boolean
  reminderSchedule?: {
    immediate: boolean
    afterHours: number[]
  }
}

export interface FeedbackResponse {
  success: boolean
  feedbackId?: string
  surveyUrl?: string
  error?: string
}

export interface FeedbackAnalytics {
  totalFeedbacks: number
  averageRating: number
  responseRate: number
  categoryAverages: {
    cleanliness: number
    comfort: number
    service: number
    valueForMoney: number
    location: number
    amenities: number
  }
  trends: {
    period: string
    rating: number
    count: number
  }[]
  commonIssues: {
    issue: string
    count: number
    percentage: number
  }[]
  recommendations: {
    wouldRecommend: number
    wouldReturn: number
  }
}

export class GuestFeedbackService {
  static async requestFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const booking = await Booking.findById(request.bookingId).populate('propertyId').populate('userId')

      if (!booking) {
        return { success: false, error: 'Booking not found' }
      }

      const Room = (await import('@/models/Room')).default
      const room = await Room.findById(booking.roomId)

      const feedbackId = `FB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const surveyUrl = `${process.env.NEXTAUTH_URL}/guest/feedback/${feedbackId}`

      const feedbackRequest: Partial<GuestFeedback> = {
        id: feedbackId,
        bookingId: request.bookingId,
        guestId: booking.userId._id.toString(),
        propertyId: booking.propertyId._id.toString(),
        type: (request.type as any) || 'stay_review',
        status: 'pending',
        guestName: booking.guestName,
        guestEmail: booking.userId.email,
        roomNumber: room?.roomNumber || 'N/A',
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        stayDuration: Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)),
        submittedVia: 'email',
        language: 'en',
        priority: 'medium'
      }

      // Store the feedback request
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')
      await collection.insertOne(feedbackRequest)

      await client.close()

      // Send feedback request email
      await this.sendFeedbackRequestEmail(feedbackRequest as GuestFeedback, surveyUrl)

      // Schedule reminders if requested
      if (request.sendReminders && request.reminderSchedule) {
        await this.scheduleReminders(feedbackId, request.reminderSchedule)
      }

      return {
        success: true,
        feedbackId,
        surveyUrl
      }

    } catch (error) {
      console.error('Error requesting feedback:', error)
      return { success: false, error: 'Failed to request feedback' }
    }
  }

  static async submitFeedback(feedbackId: string, feedbackData: Partial<GuestFeedback>): Promise<FeedbackResponse> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')

      const existingFeedback = await collection.findOne({ id: feedbackId })
      if (!existingFeedback) {
        await client.close()
        return { success: false, error: 'Feedback request not found' }
      }

      const updateData = {
        ...feedbackData,
        status: 'submitted',
        submittedAt: new Date(),
        deviceType: this.detectDeviceType(feedbackData.deviceType),
        processed: false
      }

      await collection.updateOne(
        { id: feedbackId },
        { $set: updateData }
      )

      await client.close()

      // Process feedback for insights
      await this.processFeedbackInsights(feedbackId)

      // Notify management for high priority issues
      if (feedbackData.overallRating && feedbackData.overallRating <= 2) {
        await this.notifyManagementLowRating(feedbackId)
      }

      // Send thank you email
      await this.sendThankYouEmail(existingFeedback.guestEmail, existingFeedback.guestName)

      return { success: true, feedbackId }

    } catch (error) {
      console.error('Error submitting feedback:', error)
      return { success: false, error: 'Failed to submit feedback' }
    }
  }

  static async getFeedback(feedbackId: string): Promise<GuestFeedback | null> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')
      const feedback = await collection.findOne({ id: feedbackId })

      await client.close()

      return feedback as GuestFeedback | null

    } catch (error) {
      console.error('Error fetching feedback:', error)
      return null
    }
  }

  static async getPropertyFeedbacks(propertyId: string, filters?: {
    status?: string
    type?: string
    ratingRange?: { min: number; max: number }
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  }): Promise<GuestFeedback[]> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')

      const query: any = { propertyId }

      if (filters) {
        if (filters.status) query.status = filters.status
        if (filters.type) query.type = filters.type
        if (filters.ratingRange) {
          query.overallRating = {
            $gte: filters.ratingRange.min,
            $lte: filters.ratingRange.max
          }
        }
        if (filters.dateFrom || filters.dateTo) {
          query.submittedAt = {}
          if (filters.dateFrom) query.submittedAt.$gte = filters.dateFrom
          if (filters.dateTo) query.submittedAt.$lte = filters.dateTo
        }
      }

      let cursor = collection.find(query).sort({ submittedAt: -1 })

      if (filters?.limit) {
        cursor = cursor.limit(filters.limit)
      }
      if (filters?.offset) {
        cursor = cursor.skip(filters.offset)
      }

      const feedbacks = await cursor.toArray()

      await client.close()

      return feedbacks as GuestFeedback[]

    } catch (error) {
      console.error('Error fetching property feedbacks:', error)
      return []
    }
  }

  static async getFeedbackAnalytics(propertyId: string, period?: {
    from: Date
    to: Date
  }): Promise<FeedbackAnalytics> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')

      const query: any = { propertyId, status: 'submitted' }

      if (period) {
        query.submittedAt = {
          $gte: period.from,
          $lte: period.to
        }
      }

      const feedbacks = await collection.find(query).toArray() as GuestFeedback[]

      await client.close()

      if (feedbacks.length === 0) {
        return {
          totalFeedbacks: 0,
          averageRating: 0,
          responseRate: 0,
          categoryAverages: {
            cleanliness: 0,
            comfort: 0,
            service: 0,
            valueForMoney: 0,
            location: 0,
            amenities: 0
          },
          trends: [],
          commonIssues: [],
          recommendations: {
            wouldRecommend: 0,
            wouldReturn: 0
          }
        }
      }

      // Calculate analytics
      const totalFeedbacks = feedbacks.length
      const averageRating = feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedbacks

      const categoryAverages = {
        cleanliness: feedbacks.reduce((sum, f) => sum + f.cleanliness, 0) / totalFeedbacks,
        comfort: feedbacks.reduce((sum, f) => sum + f.comfort, 0) / totalFeedbacks,
        service: feedbacks.reduce((sum, f) => sum + f.service, 0) / totalFeedbacks,
        valueForMoney: feedbacks.reduce((sum, f) => sum + f.valueForMoney, 0) / totalFeedbacks,
        location: feedbacks.reduce((sum, f) => sum + f.location, 0) / totalFeedbacks,
        amenities: feedbacks.reduce((sum, f) => sum + f.amenities, 0) / totalFeedbacks
      }

      // Calculate recommendation metrics
      const wouldRecommendCount = feedbacks.filter(f => f.wouldRecommend).length
      const wouldReturnCount = feedbacks.filter(f => f.wouldReturnAgain).length

      const recommendations = {
        wouldRecommend: (wouldRecommendCount / totalFeedbacks) * 100,
        wouldReturn: (wouldReturnCount / totalFeedbacks) * 100
      }

      // Analyze common issues
      const allIssues = feedbacks.flatMap(f => f.negativeAspects || [])
      const issueCount: { [key: string]: number } = {}
      allIssues.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1
      })

      const commonIssues = Object.entries(issueCount)
        .map(([issue, count]) => ({
          issue,
          count,
          percentage: (count / totalFeedbacks) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Calculate response rate (would need booking count for accurate calculation)
      // For now, using a placeholder
      const responseRate = 75 // This should be calculated based on total bookings vs feedbacks

      return {
        totalFeedbacks,
        averageRating,
        responseRate,
        categoryAverages,
        trends: [], // Would need time-series data processing
        commonIssues,
        recommendations
      }

    } catch (error) {
      console.error('Error calculating feedback analytics:', error)
      throw error
    }
  }

  static async respondToFeedback(feedbackId: string, response: {
    message: string
    respondedBy: string
    actionsTaken?: string[]
  }): Promise<FeedbackResponse> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')

      await collection.updateOne(
        { id: feedbackId },
        {
          $set: {
            managementResponse: {
              ...response,
              respondedAt: new Date()
            },
            status: 'responded'
          }
        }
      )

      await client.close()

      // Send response email to guest
      const feedback = await this.getFeedback(feedbackId)
      if (feedback) {
        await this.sendResponseEmail(feedback, response.message)
      }

      return { success: true }

    } catch (error) {
      console.error('Error responding to feedback:', error)
      return { success: false, error: 'Failed to respond to feedback' }
    }
  }

  private static async sendFeedbackRequestEmail(feedback: GuestFeedback, surveyUrl: string): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      const subject = 'How was your stay? Share your feedback'
      const message = `
        Dear ${feedback.guestName},

        Thank you for choosing us for your recent stay from ${feedback.checkInDate.toDateString()} to ${feedback.checkOutDate.toDateString()}.

        We hope you had a wonderful experience, and we would love to hear about it! Your feedback helps us improve our services and ensure future guests have an even better experience.

        Please take a few minutes to share your thoughts:
        ${surveyUrl}

        Your feedback is valuable to us and helps us serve you better.

        Thank you for your time!

        Best regards,
        The Team
      `

      await EmailService.sendEmail({
        to: feedback.guestEmail,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending feedback request email:', error)
    }
  }

  private static async sendThankYouEmail(email: string, name: string): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      const subject = 'Thank you for your feedback!'
      const message = `
        Dear ${name},

        Thank you for taking the time to share your feedback with us!

        Your input is incredibly valuable and helps us continuously improve our services. We truly appreciate guests like you who help us provide better experiences for everyone.

        We look forward to welcoming you again soon!

        Best regards,
        The Team
      `

      await EmailService.sendEmail({
        to: email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending thank you email:', error)
    }
  }

  private static async sendResponseEmail(feedback: GuestFeedback, responseMessage: string): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      const subject = 'Thank you for your feedback - Our response'
      const message = `
        Dear ${feedback.guestName},

        Thank you for your recent feedback. We wanted to personally respond to your comments:

        ${responseMessage}

        Your feedback is important to us, and we're committed to providing the best possible experience for all our guests.

        If you have any additional questions or concerns, please don't hesitate to reach out to us.

        Best regards,
        The Management Team
      `

      await EmailService.sendEmail({
        to: feedback.guestEmail,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending response email:', error)
    }
  }

  private static async notifyManagementLowRating(feedbackId: string): Promise<void> {
    try {
      const feedback = await this.getFeedback(feedbackId)
      if (!feedback) return

      const Property = (await import('@/models/Property')).default
      const property = await Property.findById(feedback.propertyId)

      if (!property?.staff?.length) return

      const EmailService = (await import('./email-service')).EmailService

      const subject = `URGENT: Low Rating Feedback - ${feedback.overallRating}/5 Stars`
      const message = `
        URGENT: Low rating feedback received

        Guest: ${feedback.guestName}
        Rating: ${feedback.overallRating}/5 stars
        Room: ${feedback.roomNumber}
        Stay: ${feedback.checkInDate.toDateString()} - ${feedback.checkOutDate.toDateString()}

        Comments: ${feedback.comments}

        Please review and respond promptly to address the guest's concerns.

        Feedback ID: ${feedbackId}
      `

      for (const staff of property.staff) {
        if (staff.email && staff.notifications?.email) {
          await EmailService.sendEmail({
            to: staff.email,
            subject,
            html: message.replace(/\n/g, '<br>'),
            text: message,
            priority: 'high'
          })
        }
      }

    } catch (error) {
      console.error('Error notifying management:', error)
    }
  }

  private static async processFeedbackInsights(feedbackId: string): Promise<void> {
    // This would implement AI-powered insights extraction
    // For now, we'll add basic processing
    try {
      const feedback = await this.getFeedback(feedbackId)
      if (!feedback) return

      const tags: string[] = []

      // Auto-tag based on ratings
      if (feedback.cleanliness <= 2) tags.push('cleanliness_issue')
      if (feedback.service <= 2) tags.push('service_issue')
      if (feedback.overallRating >= 4) tags.push('satisfied_guest')
      if (feedback.overallRating <= 2) tags.push('unhappy_guest')

      // Update with tags
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('guest_feedbacks')

      await collection.updateOne(
        { id: feedbackId },
        {
          $set: {
            tags,
            processed: true,
            processedAt: new Date()
          }
        }
      )

      await client.close()

    } catch (error) {
      console.error('Error processing feedback insights:', error)
    }
  }

  private static async scheduleReminders(feedbackId: string, schedule: { immediate: boolean; afterHours: number[] }): Promise<void> {
    // This would integrate with a job scheduler
    // For now, just log the reminder schedule
    console.log(`Scheduling reminders for feedback ${feedbackId}:`, schedule)
  }

  private static detectDeviceType(deviceType?: string): 'mobile' | 'tablet' | 'desktop' {
    // This would use user agent detection in a real implementation
    return deviceType as any || 'desktop'
  }
}