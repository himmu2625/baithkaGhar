import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";

// Helper function to get date range based on period
function getDateRange(period: string): { startDate: Date } {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '3m':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30); // Default to 30 days
  }
  
  return { startDate };
}

// Function to calculate percentage growth compared to previous period
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const dynamic = 'force-dynamic';

// Return real-time analytics data
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';
    
    // Connect to database
    await connectMongo();
    
    // Validate token
    let token
    try {
      token = await getToken({ req, secret: authOptions.secret })
      console.log('API: Token retrieval result:', token ? 'Token found' : 'No token found')
    } catch (tokenError) {
      console.error('API: Error retrieving token:', tokenError)
      return NextResponse.json(
        { success: false, message: "Token retrieval error", details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 401 }
      )
    }
    
    // For debugging purposes, temporarily allow access without authentication
    if (!token || !token.id) {
      console.log('API: No valid token found, but proceeding for debugging')
    } else {
      // Check if user is admin or super_admin
      if (token.role !== 'admin' && token.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, message: "Unauthorized - Admin access required" },
          { status: 401 }
        );
      }
    }
    
    // Get date ranges for current and previous periods
    const { startDate } = getDateRange(period);
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    // Calculate previous period (same length as current period)
    switch (period) {
      case '7d':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case '30d':
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        break;
      case '3m':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        break;
      case '1y':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    console.log(`Analytics period: ${period}, start date: ${startDate.toISOString()}`);
    console.log(`Previous period: ${previousStartDate.toISOString()} to ${previousEndDate.toISOString()}`);
    
    // Fetch all data in parallel for better performance
    const [
      totalUsers,
      newUsers,
      previousPeriodUsers,
      userRoleDistribution,
      totalProperties,
      newProperties,
      previousPeriodProperties,
      propertyStatusDistribution,
      totalBookings,
      newBookings,
      previousPeriodBookings,
      bookingStatusDistribution,
      totalRevenue,
      newRevenue,
      previousPeriodRevenue
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      
      // Properties
      Property.countDocuments(),
      Property.countDocuments({ createdAt: { $gte: startDate } }),
      Property.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Property.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Bookings
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.countDocuments({ createdAt: { $gte: previousStartDate, $lt: startDate } }),
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Revenue (assuming bookings have a 'totalPrice' field)
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: previousStartDate, $lt: startDate } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);
    
    // Prepare response data
    const totalRevenueValue = totalRevenue.length ? totalRevenue[0].total : 0;
    const newRevenueValue = newRevenue.length ? newRevenue[0].total : 0;
    const previousRevenueValue = previousPeriodRevenue.length ? previousPeriodRevenue[0].total : 0;
    
    return NextResponse.json({
      success: true,
      users: {
        total: totalUsers,
        new: newUsers,
        growth: calculateGrowth(newUsers, previousPeriodUsers),
        roleDistribution: userRoleDistribution.map(item => ({
          role: item._id || "unknown",
          count: item.count
        }))
      },
      properties: {
        total: totalProperties,
        new: newProperties,
        growth: calculateGrowth(newProperties, previousPeriodProperties),
        statusDistribution: propertyStatusDistribution.map(item => ({
          status: item._id || "unknown",
          count: item.count
        }))
      },
      bookings: {
        total: totalBookings,
        new: newBookings,
        growth: calculateGrowth(newBookings, previousPeriodBookings),
        statusDistribution: bookingStatusDistribution.map(item => ({
          status: item._id || "unknown",
          count: item.count
        }))
      },
      revenue: {
        total: totalRevenueValue,
        new: newRevenueValue,
        growth: calculateGrowth(newRevenueValue, previousRevenueValue),
        pending: Booking.aggregate([
          { $match: { status: "pending" } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]).then(result => result.length ? result[0].total : 0)
      }
    });
  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
