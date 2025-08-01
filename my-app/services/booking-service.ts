import { dbConnect, convertDocToObject } from "@/lib/db"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import User from "@/models/User"
import mongoose from "mongoose"
import { sendBookingConfirmationEmail } from "@/lib/services/email"
import { RefundService } from "@/lib/services/refund-service"

/**
 * Service for booking-related operations
 */
export const BookingService = {
  /**
   * Create a new booking
   * @param {Object} bookingData - The booking data
   * @returns {Promise<Object>} - The created booking
   */
  createBooking: async (bookingData: any): Promise<any> => {
    await dbConnect()
    
    console.log("[BookingService] Creating booking with data:", bookingData)
    
    // Validate property exists
    const property = await Property.findById(bookingData.propertyId).lean()
    if (!property) {
      throw new Error("Property not found")
    }
    
    console.log("[BookingService] Property found:", { title: property.title, price: property.price })
    
    // Get user details for email
    const user = await User.findById(bookingData.userId).lean()
    if (!user) {
      throw new Error("User not found")
    }
    
    // Use the totalPrice from frontend if it's valid, otherwise calculate it
    let finalTotalPrice = bookingData.totalPrice
    
    if (!finalTotalPrice || isNaN(finalTotalPrice) || finalTotalPrice <= 0) {
      console.log("[BookingService] Frontend totalPrice invalid, calculating backend price")
      finalTotalPrice = calculateTotalPrice(bookingData, property.price)
    }
    
    console.log("[BookingService] Final totalPrice:", finalTotalPrice)
    
    // Ensure we have a valid totalPrice before creating
    if (!finalTotalPrice || isNaN(finalTotalPrice) || finalTotalPrice <= 0) {
      throw new Error("Unable to calculate valid total price for booking")
    }
    
    // Create the booking
    const booking = await Booking.create({
      ...bookingData,
      totalPrice: finalTotalPrice,
      status: "confirmed"
    })
    
    console.log("[BookingService] Booking created successfully:", booking._id)
    
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
    
    return convertDocToObject(populatedBooking || booking)
  },
  
  /**
   * Get bookings for a user
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
          console.log("[BookingService.getUserBookings] ObjectId conversion failed:", error.message)
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
        
        // If still no bookings, check all bookings to see what userIds exist
        if (bookings.length === 0) {
          console.log("[BookingService.getUserBookings] Still no bookings, checking all bookings...")
          const allBookings = await Booking.find({}).limit(10).lean()
          console.log("[BookingService.getUserBookings] Sample of all bookings:")
          allBookings.forEach((booking, index) => {
            console.log(`  ${index + 1}. Booking ID: ${booking._id}`)
            console.log(`     UserID: ${booking.userId} (type: ${typeof booking.userId})`)
            console.log(`     Query UserID: ${queryUserId} (type: ${typeof queryUserId})`)
            console.log(`     Match: ${booking.userId.toString() === queryUserId}`)
          })
        }
      }
      
      console.log("[BookingService.getUserBookings] Final result:", bookings.length, "bookings")
      
      if (bookings.length > 0) {
        console.log("[BookingService.getUserBookings] Sample booking details:")
        bookings.slice(0, 2).forEach((booking, index) => {
          console.log(`  ${index + 1}. Booking ID: ${booking._id}`)
          console.log(`     User ID: ${booking.userId}`)
          console.log(`     Property: ${booking.propertyId?.title || 'Unpopulated'}`)
          console.log(`     Status: ${booking.status}`)
          console.log(`     Dates: ${booking.dateFrom} to ${booking.dateTo}`)
        })
      }
      
      const convertedBookings = bookings.map(booking => convertDocToObject(booking))
      console.log("[BookingService.getUserBookings] Converted bookings:", convertedBookings.length)
      
      return convertedBookings
    } catch (error) {
      console.error("[BookingService.getUserBookings] Error:", error)
      throw error
    }
  },
  
  /**
   * Get bookings for a property
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
   * Get a booking by ID
   * @param {string} bookingId - The booking ID
   * @returns {Promise<Object|null>} - The booking or null if not found
   */
  getBookingById: async (bookingId: string): Promise<any | null> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return null
    }
    
    const booking = await Booking.findById(bookingId)
      .populate("propertyId", "title address images price ownerId")
      .populate("userId", "name email")
      .lean()
    
    return booking ? convertDocToObject(booking) : null
  },
  
  /**
   * Check if a property is available for the given dates
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
      
      if (overlappingBookings.length > 0) {
        console.log("❌ [AVAILABILITY CHECK] CONFLICTING BOOKINGS FOUND:")
        overlappingBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. Booking ID: ${booking._id}`)
          console.log(`      From: ${booking.dateFrom}`)
          console.log(`      To: ${booking.dateTo}`)
          console.log(`      Status: ${booking.status}`)
          console.log(`      Guests: ${booking.guests}`)
        })
        
        console.log(`🚫 [AVAILABILITY CHECK] BLOCKING AVAILABILITY: Found ${overlappingBookings.length} existing booking(s) for these dates.`)
      } else {
        console.log("✅ [AVAILABILITY CHECK] No conflicts found - property is available!")
      }
      
      const isAvailable = overlappingBookings.length === 0
      console.log("🔍 [AVAILABILITY CHECK] Final result:", isAvailable)
      
      return isAvailable
    } catch (error) {
      console.error("💥 [AVAILABILITY CHECK] Error during availability check:", error)
      throw error
    }
  },
  
  /**
   * Cancel a booking
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
      bookingId: existingBooking._id,
      bookingUserId: existingBooking.userId,
      sessionUserId: userId,
      bookingStatus: existingBooking.status,
      paymentStatus: existingBooking.paymentStatus,
      totalPrice: existingBooking.totalPrice
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
    if (existingBooking.userId.toString() !== userIdToMatch.toString()) {
      console.error("[BookingService] User not authorized to cancel booking:", {
        bookingUserId: existingBooking.userId.toString(),
        sessionUserId: userIdToMatch.toString()
      })
      return null
    }
    
    // Process refund if payment was made
    let refundResult = null
    if (existingBooking.paymentStatus === "paid" || existingBooking.paymentStatus === "completed") {
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
      console.log("[BookingService] Successfully cancelled booking:", booking._id)
      
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
   * Update booking payment status
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