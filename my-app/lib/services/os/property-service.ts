import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import Property from '@/models/Property'
import { ObjectId } from 'mongodb'

export interface PropertyStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  totalRevenue: number
  monthlyRevenue: number
  totalBookings: number
  activeBookings: number
  averageRating: number
  totalReviews: number
}

export class PropertyService {
  static async getPropertyById(propertyId: string) {
    try {
      await connectToDatabase()
      
      const property = await Property.findById(propertyId)
        .select('-__v')
        .lean()
      
      if (!property) {
        throw new Error('Property not found')
      }
      
      return {
        success: true,
        property: {
          ...property,
          _id: property._id.toString()
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  static async getPropertyStats(propertyId: string): Promise<PropertyStats> {
    try {
      await connectToDatabase()
      
      // Get property details
      const property = await Property.findById(propertyId).lean()
      if (!property) {
        throw new Error('Property not found')
      }
      
      // Calculate total rooms
      let totalRooms = 0
      if (property.totalHotelRooms) {
        totalRooms = parseInt(property.totalHotelRooms.toString()) || 0
      } else if (property.propertyUnits && Array.isArray(property.propertyUnits)) {
        totalRooms = property.propertyUnits.reduce((sum: number, unit: any) => {
          return sum + (parseInt(unit.count?.toString()) || 0)
        }, 0)
      }
      
      // For now, generate realistic mock data based on property
      // In production, these would come from actual bookings and reviews
      const occupancyRate = Math.random() * 0.4 + 0.6 // 60-100%
      const occupiedRooms = Math.floor(totalRooms * occupancyRate)
      const availableRooms = totalRooms - occupiedRooms
      
      const averageRoomRate = 2500 // Average room rate in INR
      const monthlyRevenue = occupiedRooms * averageRoomRate * 30 * 0.8
      const totalRevenue = monthlyRevenue * 12 * 2 // 2 years of operation
      
      const totalBookings = Math.floor(totalRevenue / (averageRoomRate * 2))
      const activeBookings = occupiedRooms
      
      const averageRating = Math.random() * 1 + 4 // 4.0-5.0
      const totalReviews = Math.floor(totalBookings * 0.3) // 30% review rate
      
      return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue),
        monthlyRevenue: Math.round(monthlyRevenue),
        totalBookings,
        activeBookings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      }
    } catch (error) {
      console.error('Error calculating property stats:', error)
      // Return default stats on error
      return {
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        occupancyRate: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalBookings: 0,
        activeBookings: 0,
        averageRating: 0,
        totalReviews: 0
      }
    }
  }
  
  static async updateProperty(propertyId: string, updates: any) {
    try {
      await connectToDatabase()
      
      const property = await Property.findByIdAndUpdate(
        propertyId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean()
      
      if (!property) {
        throw new Error('Property not found')
      }
      
      return {
        success: true,
        property: {
          ...property,
          _id: property._id.toString()
        }
      }
    } catch (error) {
      console.error('Error updating property:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  static async getPropertyDashboardData(propertyId: string) {
    try {
      await connectToDatabase()
      
      const [property, stats] = await Promise.all([
        this.getPropertyById(propertyId),
        this.getPropertyStats(propertyId)
      ])
      
      if (!property.success) {
        throw new Error('Property not found')
      }
      
      // Generate recent bookings data (mock for now)
      const recentBookings = Array.from({ length: 5 }, (_, i) => ({
        id: new ObjectId().toString(),
        guestName: `Guest ${i + 1}`,
        roomNumber: `${Math.floor(Math.random() * 200) + 100}`,
        checkIn: new Date(Date.now() + (i - 2) * 24 * 60 * 60 * 1000).toISOString(),
        checkOut: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        status: ['confirmed', 'checked-in', 'checked-out'][Math.floor(Math.random() * 3)],
        amount: Math.floor(Math.random() * 5000) + 2000
      }))
      
      // Generate revenue chart data
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 15000) + 5000,
          bookings: Math.floor(Math.random() * 10) + 2
        }
      })
      
      return {
        success: true,
        data: {
          property: property.property,
          stats,
          recentBookings,
          revenueChart: last30Days,
          alerts: [
            {
              id: '1',
              type: 'info',
              message: 'Room 205 maintenance scheduled for tomorrow',
              timestamp: new Date().toISOString()
            },
            {
              id: '2', 
              type: 'warning',
              message: 'Low inventory: Only 3 deluxe rooms available',
              timestamp: new Date().toISOString()
            }
          ]
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default PropertyService