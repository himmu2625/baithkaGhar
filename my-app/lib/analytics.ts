import { dbConnect } from "./db"
import mongoose, { Schema, model, Document, Model } from "mongoose"

/**
 * Analytics service for tracking user behavior and events
 */

// Interface for analytics events
export interface IAnalyticsEvent extends Document {
  eventType: string
  userId?: mongoose.Types.ObjectId
  sessionId: string
  page: string
  propertyId?: mongoose.Types.ObjectId
  bookingId?: mongoose.Types.ObjectId
  metadata?: Record<string, any>
  userAgent?: string
  ipAddress?: string
  timestamp: Date
}

// Analytics event schema
const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, index: true },
    page: { type: String, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    metadata: { type: Schema.Types.Mixed },
    userAgent: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
)

// Prevent model redefinition error during hot reloading in development
let AnalyticsEvent: Model<IAnalyticsEvent>
try {
  AnalyticsEvent = mongoose.model<IAnalyticsEvent>("AnalyticsEvent")
} catch {
  AnalyticsEvent = mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema)
}

// Event types
export enum EventType {
  PAGE_VIEW = "page_view",
  PROPERTY_VIEW = "property_view",
  SEARCH = "search",
  BOOKING_STARTED = "booking_started",
  BOOKING_COMPLETED = "booking_completed",
  BOOKING_CANCELLED = "booking_cancelled",
  USER_SIGNUP = "user_signup",
  USER_LOGIN = "user_login",
  CONTACT_FORM = "contact_form",
  ERROR = "error",
}

// Interface for tracking event
export interface TrackEventParams {
  eventType: EventType | string
  userId?: string
  sessionId: string
  page: string
  propertyId?: string
  bookingId?: string
  metadata?: Record<string, any>
  userAgent?: string
  ipAddress?: string
}

/**
 * Track an analytics event
 * @param params - Event parameters
 * @returns Tracking success status
 */
export async function trackEvent(params: TrackEventParams): Promise<boolean> {
  try {
    await dbConnect()
    
    const eventData: Partial<IAnalyticsEvent> = {
      eventType: params.eventType,
      sessionId: params.sessionId,
      page: params.page,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
      timestamp: new Date(),
    }
    
    // Add optional fields if provided
    if (params.userId) {
      eventData.userId = new mongoose.Types.ObjectId(params.userId)
    }
    
    if (params.propertyId) {
      eventData.propertyId = new mongoose.Types.ObjectId(params.propertyId)
    }
    
    if (params.bookingId) {
      eventData.bookingId = new mongoose.Types.ObjectId(params.bookingId)
    }
    
    await AnalyticsEvent.create(eventData)
    
    return true
  } catch (error) {
    console.error("Error tracking event:", error)
    // Don't throw an error to prevent disrupting the main application flow
    return false
  }
}

/**
 * Track a page view
 * @param sessionId - Session ID
 * @param page - Page URL
 * @param userId - Optional user ID
 * @param userAgent - User agent string
 * @param ipAddress - IP address
 * @returns Tracking success status
 */
export async function trackPageView(
  sessionId: string,
  page: string,
  userId?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  return trackEvent({
    eventType: EventType.PAGE_VIEW,
    sessionId,
    page,
    userId,
    userAgent,
    ipAddress,
  })
}

/**
 * Track a property view
 * @param sessionId - Session ID
 * @param propertyId - Property ID
 * @param userId - Optional user ID
 * @param userAgent - User agent string
 * @param ipAddress - IP address
 * @returns Tracking success status
 */
export async function trackPropertyView(
  sessionId: string,
  propertyId: string,
  userId?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  return trackEvent({
    eventType: EventType.PROPERTY_VIEW,
    sessionId,
    page: `/properties/${propertyId}`,
    propertyId,
    userId,
    userAgent,
    ipAddress,
  })
}

/**
 * Track a search event
 * @param sessionId - Session ID
 * @param searchQuery - Search query parameters
 * @param resultsCount - Number of search results
 * @param userId - Optional user ID
 * @param userAgent - User agent string
 * @param ipAddress - IP address
 * @returns Tracking success status
 */
export async function trackSearch(
  sessionId: string,
  searchQuery: Record<string, any>,
  resultsCount: number,
  userId?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  return trackEvent({
    eventType: EventType.SEARCH,
    sessionId,
    page: "/search",
    userId,
    userAgent,
    ipAddress,
    metadata: {
      query: searchQuery,
      resultsCount,
    },
  })
}

/**
 * Get popular properties based on view counts
 * @param days - Number of days to look back
 * @param limit - Number of properties to return
 * @returns List of popular properties with view counts
 */
export async function getPopularProperties(
  days: number = 30,
  limit: number = 5
): Promise<Array<{ propertyId: string; views: number }>> {
  try {
    await dbConnect()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const results = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: EventType.PROPERTY_VIEW,
          timestamp: { $gte: startDate },
          propertyId: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$propertyId",
          views: { $sum: 1 },
        },
      },
      {
        $sort: { views: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          propertyId: "$_id",
          views: 1,
          _id: 0,
        },
      },
    ])
    
    return results.map(item => ({
      propertyId: item.propertyId.toString(),
      views: item.views,
    }))
  } catch (error) {
    console.error("Error getting popular properties:", error)
    return []
  }
}

/**
 * Get user activity summary
 * @param userId - User ID
 * @param days - Number of days to look back
 * @returns Summary of user activity
 */
export async function getUserActivity(
  userId: string,
  days: number = 30
): Promise<Record<string, number>> {
  try {
    await dbConnect()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const userObjId = new mongoose.Types.ObjectId(userId)
    
    const results = await AnalyticsEvent.aggregate([
      {
        $match: {
          userId: userObjId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
    ])
    
    const activity: Record<string, number> = {}
    results.forEach(item => {
      activity[item._id] = item.count
    })
    
    return activity
  } catch (error) {
    console.error("Error getting user activity:", error)
    return {}
  }
} 