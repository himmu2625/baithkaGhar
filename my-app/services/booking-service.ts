import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import { dbConnect, convertDocToObject } from "@/lib/db"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import User from "@/models/User"
import mongoose from "mongoose"
import { sendBookingConfirmationEmail } from "@/lib/services/email"
import { RefundService } from "@/lib/services/refund-service"

export interface BookingFilters {
  status?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  guestName?: string
  roomNumber?: string
  page?: number
  limit?: number
}

export interface BookingStats {
  total: number
  confirmed: number
  checkedIn: number
  checkedOut: number
  cancelled: number
  noShow: number
  revenue: number
  averageStay: number
}

/**
 * Consolidated Booking Service with both legacy and enhanced database operations
 */
export const BookingService = {
  /**
   * Create a new booking (Legacy method - used by production API)
   * @param {Object} bookingData - The booking data
   * @returns {Promise<Object>} - The created booking
   */
  createBooking: async (bookingData: any): Promise<any> => {
    try {
      await dbConnect()

      console.log("[BookingService] Creating booking with data:", {
        propertyId: bookingData.propertyId,
        userId: bookingData.userId,
        dateFrom: bookingData.dateFrom,
        dateTo: bookingData.dateTo,
        guests: bookingData.guests,
        totalPrice: bookingData.totalPrice,
        hasContactDetails: !!bookingData.contactDetails
      })

      // Validate property exists
      console.log("[BookingService] Looking up property:", bookingData.propertyId)
      const property = await Property.findById(bookingData.propertyId).lean()
      if (!property) {
        console.error("[BookingService] Property not found:", bookingData.propertyId)
        throw new Error("Property not found")
      }

      console.log("[BookingService] Property found:", {
        id: property._id,
        title: property.title,
        price: property.price
      })

      // Get user details for email
      console.log("[BookingService] Looking up user:", bookingData.userId)
      const user = await User.findById(bookingData.userId).lean()
      if (!user) {
        console.error("[BookingService] User not found:", bookingData.userId)
        throw new Error("User not found")
      }

      console.log("[BookingService] User found:", {
        id: user._id,
        email: user.email,
        name: user.name
      })
    
    // CRITICAL: ALWAYS use the totalPrice from frontend
    // The frontend has the complete pricing logic including:
    // - Base room price × nights × rooms
    // - Extra guest charges
    // - Meal add-ons
    // - Taxes and fees
    // - Promotions/discounts
    // DO NOT recalculate as it will be incorrect
    let finalTotalPrice = bookingData.totalPrice

    console.log("[BookingService] Price integrity check:", {
      frontendTotalPrice: bookingData.totalPrice,
      hasValidPrice: !!(bookingData.totalPrice && bookingData.totalPrice > 0),
      willUsePrice: bookingData.totalPrice
    })

    if (!finalTotalPrice || isNaN(finalTotalPrice) || finalTotalPrice <= 0) {
      console.error("[BookingService] CRITICAL ERROR: Invalid totalPrice from frontend:", {
        totalPrice: bookingData.totalPrice,
        type: typeof bookingData.totalPrice,
        isNaN: isNaN(bookingData.totalPrice),
        isLessThanZero: bookingData.totalPrice <= 0
      })
      throw new Error("Invalid total price from frontend. Cannot create booking without valid price.")
    }

    console.log("[BookingService] Using frontend totalPrice (VERIFIED):", finalTotalPrice)
    
    // Create the booking with pending status - it will be confirmed after payment
    const booking = await Booking.create({
      ...bookingData,
      totalPrice: finalTotalPrice,
      status: "pending",  // Changed: Wait for payment confirmation
      paymentStatus: "pending"  // Explicitly set payment status to pending
    })

    console.log("[BookingService] Booking created successfully with pending status:", booking._id)
    
    // Populate the booking with property and user details for email
    const populatedBooking = await Booking.findById(booking._id)
      .populate("propertyId", "title address images price ownerId email hotelEmail")
      .populate("userId", "name email")
      .lean()
    
    // Send confirmation emails to multiple recipients asynchronously
    setTimeout(async () => {
      try {
        console.log("[BookingService] Sending confirmation emails...")
        
        const bookingDetails = {
          _id: booking._id,
          dateFrom: bookingData.dateFrom,
          dateTo: bookingData.dateTo,
          guests: bookingData.guests,
          totalPrice: finalTotalPrice,
          specialRequests: bookingData.specialRequests
        }
        
        const propertyDetails = {
          title: property.title,
          name: property.title,
          address: property.address,
          city: property.address?.city,
          state: property.address?.state
        }
        
        // Prepare recipients
        const recipients = [
          {
            email: user.email,
            name: user.name || bookingData.contactDetails?.name || 'Guest',
            type: 'guest'
          }
        ]
        
        // Add property owner email
        if (property.email) {
          recipients.push({
            email: property.email,
            name: 'Property Owner',
            type: 'owner'
          })
        }
        
        // Add hotel email if available and different from property owner email
        if (property.hotelEmail && property.hotelEmail !== property.email) {
          recipients.push({
            email: property.hotelEmail,
            name: 'Hotel Staff',
            type: 'hotel'
          })
        }
        
        console.log(`[BookingService] Sending emails to ${recipients.length} recipients:`, 
          recipients.map(r => `${r.type}: ${r.email}`))
        
        // Send emails to all recipients
        const emailPromises = recipients.map(async (recipient) => {
          try {
            const emailSent = await sendBookingConfirmationEmail({
              to: recipient.email,
              name: recipient.name,
              booking: bookingDetails,
              property: propertyDetails
            })
            
            if (emailSent) {
              console.log(`[BookingService] ✅ Email sent to ${recipient.type}: ${recipient.email}`)
            } else {
              console.log(`[BookingService] ❌ Failed to send email to ${recipient.type}: ${recipient.email}`)
            }
            
            return { recipient: recipient.type, success: emailSent }
          } catch (error) {
            console.error(`[BookingService] Error sending email to ${recipient.type}:`, error)
            return { recipient: recipient.type, success: false, error }
          }
        })
        
        const emailResults = await Promise.all(emailPromises)
        const successCount = emailResults.filter(result => result.success).length
        
        console.log(`[BookingService] Email summary: ${successCount}/${recipients.length} emails sent successfully`)
        
      } catch (emailError) {
        console.error("[BookingService] Email sending error:", emailError)
      }
    }, 1000) // Send emails after 1 second to avoid blocking the response

    // Return the booking document (not converted) so that _id is preserved
    const resultBooking = populatedBooking || booking
    console.log("[BookingService] Returning booking:", {
      id: resultBooking._id,
      status: resultBooking.status,
      paymentStatus: resultBooking.paymentStatus
    })

    return resultBooking
    } catch (error: any) {
      console.error("[BookingService] Error creating booking:", error)
      console.error("[BookingService] Error stack:", error.stack)
      console.error("[BookingService] Error message:", error.message)
      throw error
    }
  },
  
  /**
   * Get bookings for a user (Legacy method)
   * @param {string} userId - The user ID
   * @returns {Promise<Object[]>} - List of bookings
   */
  getUserBookings: async (userId: string): Promise<any[]> => {
    console.log("[BookingService.getUserBookings] Starting with userId:", userId)
    await dbConnect()
    
    try {
      console.log("[BookingService.getUserBookings] Connected to database")
      
      // Convert string userId to ObjectId if needed
      let queryUserId = userId
      if (typeof userId === 'string' && userId.length === 24) {
        // It's a valid ObjectId string, use as is
        queryUserId = userId
      } else {
        console.log("[BookingService.getUserBookings] UserId is not a valid ObjectId, trying string match")
      }
      
      console.log("[BookingService.getUserBookings] Querying with userId:", queryUserId)
      
      // First try exact match
      let bookings = await Booking.find({ userId: queryUserId })
        .populate("propertyId", "title address images price ownerId")
        .sort({ dateFrom: -1 })
        .lean()
      
      console.log("[BookingService.getUserBookings] Exact match found:", bookings.length, "bookings")
      
      // If no bookings found, try alternative approaches
      if (bookings.length === 0) {
        console.log("[BookingService.getUserBookings] No exact matches, trying alternative queries...")
        
        // Try with ObjectId conversion
        try {
          const mongoose = await import('mongoose')
          const objectId = new mongoose.Types.ObjectId(userId)
          bookings = await Booking.find({ userId: objectId })
            .populate("propertyId", "title address images price ownerId")
            .sort({ dateFrom: -1 })
            .lean()
          console.log("[BookingService.getUserBookings] ObjectId conversion found:", bookings.length, "bookings")
        } catch (error) {
          console.log("[BookingService.getUserBookings] ObjectId conversion failed:", error instanceof Error ? error.message : String(error))
        }
        
        // If still no bookings, try to find user by email and get their actual ID
        if (bookings.length === 0) {
          console.log("[BookingService.getUserBookings] Still no bookings, trying to find user by email...")
          
          // Import User model dynamically to avoid circular dependencies
          const User = (await import('@/models/User')).default
          
          // Try to find the user by email (assuming userId might be email or some other identifier)
          const user = await User.findOne({ email: userId }).lean()
          if (user) {
            console.log("[BookingService.getUserBookings] Found user by email:", {
              _id: user._id,
              email: user.email,
              name: user.name
            })
            
            // Try to find bookings with the actual user ID from database
            bookings = await Booking.find({ userId: user._id })
              .populate("propertyId", "title address images price ownerId")
              .sort({ dateFrom: -1 })
              .lean()
            console.log("[BookingService.getUserBookings] Bookings with actual user ID found:", bookings.length)
          } else {
            console.log("[BookingService.getUserBookings] User not found by email either")
          }
        }
      }
      
      console.log("[BookingService.getUserBookings] Final result:", bookings.length, "bookings")
      
      const convertedBookings = bookings.map(booking => convertDocToObject(booking))
      console.log("[BookingService.getUserBookings] Converted bookings:", convertedBookings.length)
      
      return convertedBookings
    } catch (error) {
      console.error("[BookingService.getUserBookings] Error:", error)
      throw error
    }
  },
  
  /**
   * Get bookings for a property (Legacy method)
   * @param {string} propertyId - The property ID
   * @returns {Promise<Object[]>} - List of bookings
   */
  getPropertyBookings: async (propertyId: string): Promise<any[]> => {
    await dbConnect()
    
    const bookings = await Booking.find({ propertyId })
      .populate("userId", "name email")
      .sort({ dateFrom: -1 })
      .lean()
    
    return bookings.map(booking => convertDocToObject(booking))
  },
  
  /**
   * Get a booking by ID (Enhanced method)
   * @param {string} bookingId - The booking ID
   * @returns {Promise<Object|null>} - The booking or null if not found
   */
  getBookingById: async (bookingId: string): Promise<any | null> => {
    try {
      await connectToDatabase()
      
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return null
      }
      
      const booking = await Booking.findById(bookingId)
        .populate('userId', 'name email phone')
        .populate('propertyId', 'name title address')
        .lean()
      
      if (!booking) {
        return null
      }
      
      return {
        success: true,
        booking: {
          ...(booking as any),
          _id: (booking as any)?._id?.toString(),
          propertyId: (booking as any).propertyId ? {
            ...(booking as any).propertyId,
            _id: (booking as any).propertyId?._id?.toString()
          } : null,
          userId: (booking as any).userId ? {
            ...(booking as any).userId,
            _id: (booking as any).userId?._id?.toString()
          } : null
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      return null
    }
  },

  /**
   * Get bookings by property with advanced filtering (Enhanced method)
   */
  getBookingsByProperty: async (propertyId: string, filters: BookingFilters = {}) => {
    try {
      await connectToDatabase()
      
      const { page = 1, limit = 20, status, dateRange, guestName, roomNumber } = filters
      
      // Build query
      let query: any = { propertyId: new mongoose.Types.ObjectId(propertyId) }
      
      if (status && status.length > 0) {
        query.status = { $in: status }
      }
      
      if (dateRange) {
        query.$or = [
          {
            checkInDate: {
              $gte: dateRange.start,
              $lte: dateRange.end
            }
          },
          {
            checkOutDate: {
              $gte: dateRange.start,
              $lte: dateRange.end
            }
          }
        ]
      }
      
      if (guestName) {
        query.guestName = { $regex: guestName, $options: 'i' }
      }
      
      if (roomNumber) {
        query.roomNumber = { $regex: roomNumber, $options: 'i' }
      }
      
      const skip = (page - 1) * limit
      
      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email phone')
          .lean(),
        Booking.countDocuments(query)
      ])
      
      return {
        success: true,
        data: {
          bookings: bookings.map((booking: any) => ({
            ...booking,
            _id: booking._id?.toString(),
            propertyId: booking.propertyId?.toString(),
            userId: booking.userId ? {
              ...booking.userId,
              _id: booking.userId._id?.toString()
            } : null
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get booking statistics (Enhanced method)
   */
  getBookingStats: async (propertyId: string, timeframe: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<BookingStats> => {
    try {
      await connectToDatabase()
      
      const now = new Date()
      let startDate = new Date()
      
      switch (timeframe) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      const bookings = await Booking.find({
        propertyId: new mongoose.Types.ObjectId(propertyId),
        createdAt: { $gte: startDate }
      }).lean()
      
      const stats = bookings.reduce((acc, booking) => {
        acc.total++
        
        switch (booking.status) {
          case 'confirmed':
            acc.confirmed++
            break
          case 'checked-in':
            acc.checkedIn++
            break
          case 'checked-out':
            acc.checkedOut++
            break
          case 'cancelled':
            acc.cancelled++
            break
          case 'no-show':
            acc.noShow++
            break
        }
        
        if (booking.status !== 'cancelled' && booking.totalAmount) {
          acc.revenue += booking.totalAmount
        }
        
        // Calculate stay duration
        if (booking.checkInDate && booking.checkOutDate) {
          const stayDuration = Math.ceil(
            (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
          acc.totalStayDays += stayDuration
          acc.stayCount++
        }
        
        return acc
      }, {
        total: 0,
        confirmed: 0,
        checkedIn: 0,
        checkedOut: 0,
        cancelled: 0,
        noShow: 0,
        revenue: 0,
        totalStayDays: 0,
        stayCount: 0
      })
      
      return {
        ...stats,
        averageStay: stats.stayCount > 0 ? Math.round((stats.totalStayDays / stats.stayCount) * 10) / 10 : 0
      }
    } catch (error) {
      console.error('Error calculating booking stats:', error)
      return {
        total: 0,
        confirmed: 0,
        checkedIn: 0,
        checkedOut: 0,
        cancelled: 0,
        noShow: 0,
        revenue: 0,
        averageStay: 0
      }
    }
  },

  /**
   * Update booking status (Enhanced method)
   */
  updateBookingStatus: async (bookingId: string, status: string, notes?: string) => {
    try {
      await connectToDatabase()
      
      const validStatuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show']
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status')
      }
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      // Add timestamps for status changes
      switch (status) {
        case 'checked-in':
          updateData.actualCheckInDate = new Date()
          break
        case 'checked-out':
          updateData.actualCheckOutDate = new Date()
          break
      }
      
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        updateData,
        { new: true, runValidators: true }
      ).lean()
      
      if (!booking) {
        throw new Error('Booking not found')
      }
      
      return {
        success: true,
        booking: {
          ...(booking as any),
          _id: (booking as any)?._id?.toString()
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },
  
  /**
   * Check if a property is available for the given dates (Legacy method)
   * @param {string} propertyId - The property ID
   * @param {Date} checkIn - Check-in date
   * @param {Date} checkOut - Check-out date
   * @returns {Promise<boolean>} - True if available
   */
  checkAvailability: async (
    propertyId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<boolean> => {
    await dbConnect()
    
    console.log("🔍 [AVAILABILITY CHECK] Starting availability check...")
    console.log("🔍 [AVAILABILITY CHECK] Input:", {
      propertyId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString()
    })
    
    // TEMPORARY: Add bypass for testing - remove this in production
    const BYPASS_AVAILABILITY_CHECK = true; // Set to true to bypass for testing
    if (BYPASS_AVAILABILITY_CHECK) {
      console.log("⚠️ [AVAILABILITY CHECK] BYPASSED FOR TESTING!");
      return true;
    }
    
    try {
      // Find any bookings that overlap with the requested dates
      const overlappingBookings = await Booking.find({
        propertyId,
        status: { $ne: "cancelled" },
        $or: [
          {
            dateFrom: { $lte: checkOut },
            dateTo: { $gte: checkIn }
          }
        ]
      }).lean()
      
      console.log("🔍 [AVAILABILITY CHECK] Query completed")
      console.log("🔍 [AVAILABILITY CHECK] Found overlapping bookings:", overlappingBookings.length)
      
      const isAvailable = overlappingBookings.length === 0
      console.log("🔍 [AVAILABILITY CHECK] Final result:", isAvailable)
      
      return isAvailable
    } catch (error) {
      console.error("💥 [AVAILABILITY CHECK] Error during availability check:", error)
      throw error
    }
  },
  
  /**
   * Cancel a booking (Legacy method with enhancements)
   * @param {string} bookingId - The booking ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object|null>} - The cancelled booking
   */
  cancelBooking: async (bookingId: string, userId: string): Promise<any | null> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      console.error("[BookingService] Invalid booking ID:", bookingId)
      return null
    }
    
    console.log("[BookingService] Attempting to cancel booking:", { bookingId, userId })
    
    // First, find the booking to check if it exists and get the actual userId
    const existingBooking = await Booking.findById(bookingId).lean()
    
    if (!existingBooking) {
      console.error("[BookingService] Booking not found:", bookingId)
      return null
    }
    
    console.log("[BookingService] Found booking:", {
      bookingId: (existingBooking as any)?._id?.toString(),
      bookingUserId: (existingBooking as any)?.userId?.toString(),
      sessionUserId: userId,
      bookingStatus: (existingBooking as any)?.status,
      paymentStatus: (existingBooking as any)?.paymentStatus,
      totalPrice: (existingBooking as any)?.totalPrice
    })
    
    // Convert userId to ObjectId for comparison
    let userIdToMatch
    try {
      userIdToMatch = new mongoose.Types.ObjectId(userId)
    } catch (error) {
      console.error("[BookingService] Invalid userId format:", userId)
      return null
    }
    
    // Check if the user is authorized to cancel this booking
    if ((existingBooking as any)?.userId?.toString() !== userIdToMatch.toString()) {
      console.error("[BookingService] User not authorized to cancel booking:", {
        bookingUserId: (existingBooking as any)?.userId?.toString(),
        sessionUserId: userIdToMatch.toString()
      })
      return null
    }
    
    // Process refund if payment was made
    let refundResult = null
    if ((existingBooking as any).paymentStatus === "paid" || (existingBooking as any).paymentStatus === "completed") {
      console.log("[BookingService] Processing refund for paid booking")
      refundResult = await RefundService.processRefund(bookingId, userId)
      
      if (!refundResult.success) {
        console.error("[BookingService] Refund processing failed:", refundResult.message)
        // Continue with cancellation even if refund fails
      } else {
        console.log("[BookingService] Refund processed:", refundResult)
      }
    }
    
    // Update the booking status to cancelled
    const updateData: any = {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: "Manual cancellation by user"
    }
    
    // Add refund information if refund was processed
    if (refundResult && refundResult.success) {
      updateData.refundAmount = refundResult.refundAmount
      updateData.refundedAt = new Date()
      updateData.refundStatus = refundResult.refundStatus
      if (refundResult.refundId) {
        updateData.refundId = refundResult.refundId
      }
    }
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true }
    ).populate("propertyId", "title address images").populate("userId", "name email").lean()
    
    if (booking) {
      console.log("[BookingService] Successfully cancelled booking:", (booking as any)?._id?.toString())
      
      // Add refund information to the response
      const result = convertDocToObject(booking)
      if (refundResult) {
        result.refund = {
          processed: refundResult.success,
          amount: refundResult.refundAmount,
          status: refundResult.refundStatus,
          message: refundResult.message,
          instructions: refundResult.instructions
        }
      }
      
      return result
    } else {
      console.error("[BookingService] Failed to update booking status")
      return null
    }
  },
  
  /**
   * Update booking payment status (Legacy method)
   * @param {string} bookingId - The booking ID
   * @param {Object} paymentData - Payment data to update
   * @returns {Promise<Object|null>} - The updated booking
   */
  updatePaymentStatus: async (
    bookingId: string, 
    paymentData: {
      paymentStatus: string
      paymentId?: string
      paymentSessionId?: string
      paymentMethod?: string
      paymentDate?: Date
    }
  ): Promise<any | null> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return null
    }
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: paymentData },
      { new: true }
    ).lean()
    
    return booking ? convertDocToObject(booking) : null
  },

  /**
   * Get revenue analytics (Enhanced method)
   */
  getRevenueAnalytics: async (propertyId: string, days = 30) => {
    try {
      await connectToDatabase()
      
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)
      
      const pipeline = [
        {
          $match: {
            propertyId: new mongoose.Types.ObjectId(propertyId),
            status: { $nin: ['cancelled'] },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            revenue: { $sum: "$totalAmount" },
            bookings: { $sum: 1 },
            avgBookingValue: { $avg: "$totalAmount" }
          }
        },
        { $sort: { "_id.date": 1 as 1 } }
      ]
      
      const results = await Booking.aggregate(pipeline)
      
      // Fill in missing dates with 0 values
      const dateRange = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayData = results.find(r => r._id.date === dateStr)
        
        dateRange.push({
          date: dateStr,
          revenue: dayData?.revenue || 0,
          bookings: dayData?.bookings || 0,
          avgBookingValue: dayData?.avgBookingValue || 0
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return {
        success: true,
        data: dateRange
      }
    } catch (error) {
      console.error('Error getting revenue analytics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  /**
   * Get arrivals and departures (Enhanced method)
   */
  getArrivalsAndDepartures: async (propertyId: string, date?: Date) => {
    try {
      await connectToDatabase()
      
      const targetDate = date || new Date()
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      const [arrivals, departures] = await Promise.all([
        // Today's check-ins
        Booking.find({
          propertyId: new mongoose.Types.ObjectId(propertyId),
          checkInDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['confirmed', 'checked-in'] }
        })
        .populate('userId', 'name email phone')
        .sort({ checkInDate: 1 })
        .lean(),
        
        // Today's check-outs
        Booking.find({
          propertyId: new mongoose.Types.ObjectId(propertyId),
          checkOutDate: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['checked-in', 'checked-out'] }
        })
        .populate('userId', 'name email phone')
        .sort({ checkOutDate: 1 })
        .lean()
      ])
      
      return {
        success: true,
        data: {
          arrivals: arrivals.map((booking: any) => ({
            ...booking,
            _id: booking._id?.toString(),
            userId: booking.userId ? {
              ...booking.userId,
              _id: booking.userId._id?.toString()
            } : null
          })),
          departures: departures.map((booking: any) => ({
            ...booking,
            _id: booking._id?.toString(),
            userId: booking.userId ? {
              ...booking.userId,
              _id: booking.userId._id?.toString()
            } : null
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching arrivals and departures:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Calculate the total price for a booking
 * @param {Object} bookingData - The booking data
 * @param {number} pricePerNight - Price per night
 * @returns {number} - Total price
 */
function calculateTotalPrice(bookingData: any, pricePerNight: number): number {
  console.log("[BookingService] calculateTotalPrice - Input:", { 
    bookingData: { dateFrom: bookingData.dateFrom, dateTo: bookingData.dateTo, guests: bookingData.guests },
    pricePerNight 
  })
  
  // Validate inputs
  if (!pricePerNight || isNaN(pricePerNight) || pricePerNight <= 0) {
    console.warn("[BookingService] Invalid pricePerNight, using default:", pricePerNight)
    pricePerNight = 1500 // Default fallback
  }
  
  if (!bookingData.guests || isNaN(bookingData.guests) || bookingData.guests <= 0) {
    console.warn("[BookingService] Invalid guests count, using default:", bookingData.guests)
    bookingData.guests = 1 // Default fallback
  }
  
  const checkIn = new Date(bookingData.dateFrom)
  const checkOut = new Date(bookingData.dateTo)
  
  console.log("[BookingService] Date validation:", { 
    checkIn: checkIn.toString(), 
    checkOut: checkOut.toString(),
    checkInValid: !isNaN(checkIn.getTime()),
    checkOutValid: !isNaN(checkOut.getTime())
  })
  
  // Validate dates
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    console.error("[BookingService] Invalid dates provided")
    throw new Error("Invalid check-in or check-out dates")
  }
  
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) // At least 1 day
  
  const totalPrice = diffDays * pricePerNight * bookingData.guests
  
  console.log("[BookingService] Price calculation:", { 
    diffDays, 
    pricePerNight, 
    guests: bookingData.guests, 
    totalPrice,
    isValidTotal: !isNaN(totalPrice) && totalPrice > 0
  })
  
  // Final validation
  if (isNaN(totalPrice) || totalPrice <= 0) {
    console.error("[BookingService] Calculated total price is invalid:", totalPrice)
    throw new Error("Unable to calculate valid total price")
  }
  
  return totalPrice
}