import { NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Property from '@/models/Property'
import Booking from '@/models/Booking'
import Review from '@/models/Review'
import Activity from '@/models/Activity'

// Get dashboard statistics
export async function GET(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Connect to database
    await dbConnect()
    
    // Parse the URL to get timeframe from query parameters
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    
    // Calculate date range based on timeframe
    const now = new Date()
    let startDate = new Date()
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '3m':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    // Get user statistics
    const totalUsers = await User.countDocuments()
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    })
    
    const lastPeriodStartDate = new Date(startDate)
    const timeframeInDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    lastPeriodStartDate.setDate(lastPeriodStartDate.getDate() - timeframeInDays)
    
    const lastPeriodUsers = await User.countDocuments({
      createdAt: { 
        $gte: lastPeriodStartDate,
        $lt: startDate 
      }
    })
    
    const userChange = lastPeriodUsers === 0 
      ? 100 
      : Math.round(((newUsers - lastPeriodUsers) / lastPeriodUsers) * 100 * 10) / 10
    
    // Get property statistics
    const totalProperties = await Property.countDocuments()
    const activeProperties = await Property.countDocuments({
      status: 'active'
    })
    
    const newProperties = await Property.countDocuments({
      createdAt: { $gte: startDate }
    })
    
    const lastPeriodProperties = await Property.countDocuments({
      createdAt: { 
        $gte: lastPeriodStartDate,
        $lt: startDate 
      }
    })
    
    const propertyChange = lastPeriodProperties === 0 
      ? 100 
      : Math.round(((newProperties - lastPeriodProperties) / lastPeriodProperties) * 100 * 10) / 10
    
    // Get booking statistics
    const totalBookings = await Booking.countDocuments()
    const pendingBookings = await Booking.countDocuments({
      status: 'pending'
    })
    
    const newBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate }
    })
    
    const lastPeriodBookings = await Booking.countDocuments({
      createdAt: { 
        $gte: lastPeriodStartDate,
        $lt: startDate 
      }
    })
    
    const bookingChange = lastPeriodBookings === 0 
      ? 100 
      : Math.round(((newBookings - lastPeriodBookings) / lastPeriodBookings) * 100 * 10) / 10
    
    // Get revenue statistics
    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalAmount || 0 : 0
    
    const periodRevenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const periodRevenue = periodRevenueData.length > 0 ? periodRevenueData[0].totalAmount || 0 : 0
    
    const lastPeriodRevenueData = await Booking.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: lastPeriodStartDate,
            $lt: startDate 
          },
          status: { $in: ['confirmed', 'completed'] },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const lastPeriodRevenue = lastPeriodRevenueData.length > 0 ? lastPeriodRevenueData[0].totalAmount || 0 : 0
    
    const revenueChange = lastPeriodRevenue === 0 
      ? 100 
      : Math.round(((periodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 * 10) / 10
    
    const pendingRevenueData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          paymentStatus: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const pendingRevenue = pendingRevenueData.length > 0 ? pendingRevenueData[0].totalAmount || 0 : 0
    
    // Get rating statistics
    const ratingData = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ])
    
    const avgRating = ratingData.length > 0 ? Math.round((ratingData[0].avgRating || 0) * 10) / 10 : 0
    const reviewCount = ratingData.length > 0 ? ratingData[0].count || 0 : 0
    
    // Get recent activity
    const recentActivity = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
    
    // Format activity data
    const formattedActivity = recentActivity.map((activity: any) => ({
      id: activity._id.toString(),
      type: activity.type,
      description: activity.description,
      entity: activity.entity,
      entityId: activity.entityId,
      userName: activity.userId?.name || 'System',
      createdAt: activity.createdAt
    }))

    return NextResponse.json({
      users: { 
        total: totalUsers, 
        new: newUsers, 
        change: userChange
      },
      properties: { 
        total: totalProperties, 
        active: activeProperties, 
        change: propertyChange
      },
      bookings: { 
        total: totalBookings, 
        pending: pendingBookings, 
        change: bookingChange
      },
      revenue: { 
        total: totalRevenue, 
        pending: pendingRevenue, 
        change: revenueChange
      },
      ratings: { 
        average: avgRating, 
        count: reviewCount 
      },
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 