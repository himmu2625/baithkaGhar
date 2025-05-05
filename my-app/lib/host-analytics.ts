import { dbConnect } from "./db";
import HostAnalytics, { IHostAnalytics } from "@/models/HostAnalytics";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import { Types } from "mongoose";

/**
 * Host Analytics utility for tracking and analyzing property performance
 */

// Interface for analytics data responses
export interface AnalyticsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Define interfaces for our document types
interface PropertyDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  location: {
    city: string;
    state: string;
    [key: string]: any;
  };
  price: number;
  rating?: number;
  [key: string]: any;
}

interface BookingDocument {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  createdAt: Date;
  [key: string]: any;
}

interface DailyEntry {
  date: Date;
  count: number;
}

/**
 * Track a property view
 */
export async function trackPropertyView(
  propertyId: string,
  visitorId?: string
): Promise<AnalyticsResponse> {
  try {
    await dbConnect();
    
    // Get the property to find its host
    const property = await Property.findById(propertyId).select("userId").lean() as unknown as PropertyDocument;
    
    if (!property) {
      return { 
        success: false, 
        error: "Property not found" 
      };
    }
    
    const hostId = property.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create analytics record
    let analytics = await HostAnalytics.findOne({
      propertyId: new Types.ObjectId(propertyId),
      hostId: new Types.ObjectId(hostId),
    });
    
    if (!analytics) {
      analytics = new HostAnalytics({
        propertyId: new Types.ObjectId(propertyId),
        hostId: new Types.ObjectId(hostId),
        viewStats: {
          daily: [],
          totalViews: 0,
          uniqueViews: 0
        }
      });
    }
    
    // Update view stats
    let dailyEntry = analytics.viewStats.daily.find(
      (entry: DailyEntry) => entry.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );
    
    if (dailyEntry) {
      dailyEntry.count += 1;
    } else {
      analytics.viewStats.daily.push({
        date: today,
        count: 1
      });
    }
    
    analytics.viewStats.totalViews += 1;
    
    // Track unique views if visitor ID is provided
    if (visitorId) {
      // In a real implementation, you'd check if this visitor has viewed before
      // and only increment uniqueViews if they haven't
      analytics.viewStats.uniqueViews += 1;
    }
    
    analytics.lastUpdated = new Date();
    await analytics.save();
    
    return { 
      success: true,
      data: {
        propertyId,
        hostId,
        viewsToday: dailyEntry ? dailyEntry.count : 1,
        totalViews: analytics.viewStats.totalViews
      }
    };
  } catch (error: any) {
    console.error("Error tracking property view:", error);
    return { 
      success: false, 
      error: error.message || "Failed to track property view" 
    };
  }
}

/**
 * Get property dashboard stats for a host
 */
export async function getHostDashboardStats(
  hostId: string,
  timeframe: "7days" | "30days" | "90days" | "year" = "30days"
): Promise<AnalyticsResponse> {
  try {
    await dbConnect();
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Get all properties for this host
    const properties = await Property.find({ userId: hostId }).lean() as unknown as PropertyDocument[];
    
    if (!properties.length) {
      return { 
        success: true,
        data: {
          properties: [],
          totalRevenue: 0,
          totalBookings: 0,
          occupancyRate: 0,
          avgRating: 0
        }
      };
    }
    
    const propertyIds = properties.map(p => p._id);
    
    // Get bookings for these properties in the time range
    const bookings = await Booking.find({
      propertyId: { $in: propertyIds },
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean() as unknown as BookingDocument[];
    
    // Get analytics data for these properties
    const analyticsData = await HostAnalytics.find({
      hostId: new Types.ObjectId(hostId),
      propertyId: { $in: propertyIds }
    }).lean();
    
    // Calculate stats
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const totalBookings = bookings.length;
    
    // Calculate occupancy rate (simplified)
    // In a real implementation, this would be more complex, accounting for availability and calendar
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const totalAvailableDays = totalDays * properties.length;
    const bookedDays = bookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const stayDuration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      return sum + stayDuration;
    }, 0);
    
    const occupancyRate = totalAvailableDays > 0 
      ? (bookedDays / totalAvailableDays) * 100 
      : 0;
    
    // Get average rating
    const ratings = properties
      .map(p => p.rating || 0)
      .filter(rating => rating > 0);
    
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    // Prepare response data
    const responseData = {
      properties: properties.map(p => ({
        id: p._id,
        title: p.title,
        type: p.type,
        location: p.location,
        price: p.price,
        rating: p.rating || 0,
        bookings: bookings.filter(b => b.propertyId.toString() === p._id.toString()).length,
        revenue: bookings
          .filter(b => b.propertyId.toString() === p._id.toString())
          .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
      })),
      totalRevenue,
      totalBookings,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal place
      avgRating: Math.round(avgRating * 10) / 10,
      revenueTimeline: calculateRevenueTimeline(bookings, timeframe),
      bookingTimeline: calculateBookingTimeline(bookings, timeframe)
    };
    
    return { 
      success: true,
      data: responseData
    };
  } catch (error: any) {
    console.error("Error getting host dashboard stats:", error);
    return { 
      success: false, 
      error: error.message || "Failed to get dashboard stats" 
    };
  }
}

/**
 * Generate price recommendations for a property
 */
export async function generatePriceRecommendations(
  propertyId: string
): Promise<AnalyticsResponse> {
  try {
    await dbConnect();
    
    const property = await Property.findById(propertyId).lean() as unknown as PropertyDocument;
    
    if (!property) {
      return { 
        success: false, 
        error: "Property not found" 
      };
    }
    
    // Get similar properties for comparison
    const similarProperties = await Property.find({
      _id: { $ne: property._id },
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      // Location-based query would be more complex in real implementation
      "location.city": property.location.city
    }).limit(5).lean() as unknown as PropertyDocument[];
    
    // Calculate average price of similar properties
    const similarPrices = similarProperties.map(p => p.price);
    const avgPrice = similarPrices.length > 0 
      ? similarPrices.reduce((sum, price) => sum + price, 0) / similarPrices.length 
      : property.price;
    
    // For a real implementation, we would consider:
    // - Seasonal trends
    // - Day of week patterns
    // - Local events
    // - Historical booking data
    // - Market demand
    
    // Generate recommendation (simplified)
    let recommendation;
    const priceDiff = avgPrice - property.price;
    const diffPercentage = Math.round((priceDiff / property.price) * 100);
    
    if (diffPercentage > 15) {
      recommendation = {
        action: "increase",
        percentage: Math.min(diffPercentage, 30), // Cap at 30%
        reason: "Your price is significantly below similar properties"
      };
    } else if (diffPercentage < -15) {
      recommendation = {
        action: "decrease",
        percentage: Math.min(Math.abs(diffPercentage), 20), // Cap at 20%
        reason: "Your price may be too high compared to similar properties"
      };
    } else {
      recommendation = {
        action: "maintain",
        percentage: 0,
        reason: "Your pricing is competitive with similar properties"
      };
    }
    
    // In a real system, we would add much more complex logic here
    return { 
      success: true,
      data: {
        currentPrice: property.price,
        marketAverage: Math.round(avgPrice),
        recommendation,
        similarProperties: similarProperties.map(p => ({
          id: p._id,
          title: p.title,
          price: p.price,
          rating: p.rating || 0
        }))
      }
    };
  } catch (error: any) {
    console.error("Error generating price recommendations:", error);
    return { 
      success: false, 
      error: error.message || "Failed to generate price recommendations" 
    };
  }
}

/**
 * Calculate booking timeline for charts
 */
function calculateBookingTimeline(
  bookings: BookingDocument[],
  timeframe: "7days" | "30days" | "90days" | "year"
): { label: string; count: number }[] {
  const timeline: { [key: string]: number } = {};
  const now = new Date();
  
  // Initialize timeline with empty counts
  if (timeframe === "7days") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      timeline[key] = 0;
    }
  } else if (timeframe === "30days") {
    // Last 30 days in weekly intervals
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - (i * 7));
      const key = `Week ${i+1}`;
      timeline[key] = 0;
    }
  } else if (timeframe === "90days") {
    // Last 3 months
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const key = date.toLocaleDateString('en-IN', { month: 'short' });
      timeline[key] = 0;
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const key = date.toLocaleDateString('en-IN', { month: 'short' });
      timeline[key] = 0;
    }
  }
  
  // Fill timeline with actual booking counts
  bookings.forEach(booking => {
    const bookingDate = new Date(booking.createdAt);
    let key;
    
    if (timeframe === "7days") {
      key = bookingDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else if (timeframe === "30days") {
      // Determine which week this booking belongs to
      const daysDiff = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      key = `Week ${weekIndex + 1}`;
    } else {
      key = bookingDate.toLocaleDateString('en-IN', { month: 'short' });
    }
    
    if (timeline[key] !== undefined) {
      timeline[key]++;
    }
  });
  
  // Convert to array format for charts
  return Object.entries(timeline).map(([label, count]) => ({ label, count }));
}

/**
 * Calculate revenue timeline for charts
 */
function calculateRevenueTimeline(
  bookings: BookingDocument[],
  timeframe: "7days" | "30days" | "90days" | "year"
): { label: string; amount: number }[] {
  const timeline: { [key: string]: number } = {};
  const now = new Date();
  
  // Initialize timeline with empty amounts
  if (timeframe === "7days") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      timeline[key] = 0;
    }
  } else if (timeframe === "30days") {
    // Last 30 days in weekly intervals
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - (i * 7));
      const key = `Week ${i+1}`;
      timeline[key] = 0;
    }
  } else if (timeframe === "90days") {
    // Last 3 months
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const key = date.toLocaleDateString('en-IN', { month: 'short' });
      timeline[key] = 0;
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const key = date.toLocaleDateString('en-IN', { month: 'short' });
      timeline[key] = 0;
    }
  }
  
  // Fill timeline with actual revenue amounts
  bookings.forEach(booking => {
    const bookingDate = new Date(booking.createdAt);
    let key;
    
    if (timeframe === "7days") {
      key = bookingDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else if (timeframe === "30days") {
      // Determine which week this booking belongs to
      const daysDiff = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      key = `Week ${weekIndex + 1}`;
    } else {
      key = bookingDate.toLocaleDateString('en-IN', { month: 'short' });
    }
    
    if (timeline[key] !== undefined) {
      timeline[key] += (booking.totalAmount || 0);
    }
  });
  
  // Convert to array format for charts
  return Object.entries(timeline).map(([label, amount]) => ({ label, amount }));
} 