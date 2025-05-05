import { dbConnect, convertDocToObj } from "@/lib/db"
import Booking from "@/models/Booking"
import Property from "@/models/Property"
import mongoose from "mongoose"

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
    
    // Validate property exists
    const property = await Property.findById(bookingData.propertyId)
    if (!property) {
      throw new Error("Property not found")
    }
    
    // Create the booking
    const booking = await Booking.create({
      ...bookingData,
      totalPrice: calculateTotalPrice(bookingData, property.price)
    })
    
    return convertDocToObj(booking)
  },
  
  /**
   * Get bookings for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object[]>} - List of bookings
   */
  getUserBookings: async (userId: string): Promise<any[]> => {
    await dbConnect()
    
    const bookings = await Booking.find({ userId })
      .populate("propertyId")
      .sort({ checkInDate: -1 })
      .lean()
    
    return bookings.map(booking => convertDocToObj(booking))
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
      .sort({ checkInDate: -1 })
      .lean()
    
    return bookings.map(booking => convertDocToObj(booking))
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
      .populate("propertyId")
      .populate("userId", "name email")
      .lean()
    
    return booking ? convertDocToObj(booking) : null
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
    
    // Find any bookings that overlap with the requested dates
    const overlappingBookings = await Booking.countDocuments({
      propertyId,
      status: { $ne: "cancelled" },
      $or: [
        {
          checkInDate: { $lte: checkOut },
          checkOutDate: { $gte: checkIn }
        }
      ]
    })
    
    return overlappingBookings === 0
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
      return null
    }
    
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, userId },
      { 
        $set: { 
          status: "cancelled", 
          cancelledAt: new Date()
        } 
      },
      { new: true }
    ).lean()
    
    return booking ? convertDocToObj(booking) : null
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
    
    return booking ? convertDocToObj(booking) : null
  }
}

/**
 * Calculate the total price for a booking
 * @param {Object} bookingData - The booking data
 * @param {number} pricePerNight - Price per night
 * @returns {number} - Total price
 */
function calculateTotalPrice(bookingData: any, pricePerNight: number): number {
  const checkIn = new Date(bookingData.checkInDate)
  const checkOut = new Date(bookingData.checkOutDate)
  
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays * pricePerNight * bookingData.guests
} 