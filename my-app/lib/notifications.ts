import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

interface CreateNotificationParams {
  userId: string;
  type: 'booking' | 'payment' | 'room' | 'review' | 'system' | 'alert';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  bookingId?: string;
  propertyId?: string;
  roomId?: string;
  link?: string;
  actionLabel?: string;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await dbConnect();

    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      priority: params.priority || 'medium',
      bookingId: params.bookingId,
      propertyId: params.propertyId,
      roomId: params.roomId,
      link: params.link,
      actionLabel: params.actionLabel,
      actionUrl: params.actionUrl,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Predefined notification templates for common scenarios
 */
export const NotificationTemplates = {
  // Booking notifications
  newBooking: (userId: string, bookingId: string, propertyId: string, guestName: string, propertyTitle: string) =>
    createNotification({
      userId,
      type: 'booking',
      title: 'New Booking Received',
      message: `${guestName} has made a new booking at ${propertyTitle}`,
      priority: 'high',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
      actionLabel: 'View Booking',
      actionUrl: `/os/bookings/${bookingId}`,
    }),

  bookingCancelled: (userId: string, bookingId: string, propertyId: string, guestName: string, propertyTitle: string) =>
    createNotification({
      userId,
      type: 'booking',
      title: 'Booking Cancelled',
      message: `${guestName}'s booking at ${propertyTitle} has been cancelled`,
      priority: 'medium',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
    }),

  upcomingCheckIn: (userId: string, bookingId: string, propertyId: string, guestName: string, checkInDate: string) =>
    createNotification({
      userId,
      type: 'booking',
      title: 'Upcoming Check-in',
      message: `${guestName} is scheduled to check in on ${checkInDate}`,
      priority: 'high',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
      actionLabel: 'View Details',
      actionUrl: `/os/bookings/${bookingId}`,
    }),

  // Payment notifications
  paymentReceived: (userId: string, bookingId: string, propertyId: string, amount: number, guestName: string) =>
    createNotification({
      userId,
      type: 'payment',
      title: 'Payment Received',
      message: `Received ₹${amount.toLocaleString('en-IN')} from ${guestName}`,
      priority: 'medium',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
    }),

  paymentPending: (userId: string, bookingId: string, propertyId: string, amount: number, guestName: string) =>
    createNotification({
      userId,
      type: 'payment',
      title: 'Payment Collection Pending',
      message: `₹${amount.toLocaleString('en-IN')} pending from ${guestName}`,
      priority: 'high',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
      actionLabel: 'Collect Payment',
      actionUrl: `/os/bookings/${bookingId}`,
    }),

  hotelPaymentCollected: (userId: string, bookingId: string, propertyId: string, amount: number, guestName: string) =>
    createNotification({
      userId,
      type: 'payment',
      title: 'Hotel Payment Collected',
      message: `Successfully collected ₹${amount.toLocaleString('en-IN')} from ${guestName}`,
      priority: 'low',
      bookingId,
      propertyId,
      link: `/os/bookings/${bookingId}`,
    }),

  // Room notifications
  roomMaintenanceRequired: (userId: string, roomId: string, propertyId: string, roomNumber: string, issue: string) =>
    createNotification({
      userId,
      type: 'room',
      title: 'Room Maintenance Required',
      message: `Room ${roomNumber}: ${issue}`,
      priority: 'high',
      roomId,
      propertyId,
      link: `/os/properties/${propertyId}/rooms`,
    }),

  roomAvailable: (userId: string, roomId: string, propertyId: string, roomNumber: string) =>
    createNotification({
      userId,
      type: 'room',
      title: 'Room Now Available',
      message: `Room ${roomNumber} is now available for booking`,
      priority: 'low',
      roomId,
      propertyId,
      link: `/os/properties/${propertyId}/rooms`,
    }),

  // Review notifications
  newReview: (userId: string, propertyId: string, guestName: string, rating: number, propertyTitle: string) =>
    createNotification({
      userId,
      type: 'review',
      title: 'New Review Received',
      message: `${guestName} left a ${rating}-star review for ${propertyTitle}`,
      priority: 'medium',
      propertyId,
      link: `/os/properties/${propertyId}`,
    }),

  // System notifications
  systemUpdate: (userId: string, title: string, message: string) =>
    createNotification({
      userId,
      type: 'system',
      title,
      message,
      priority: 'low',
    }),

  // Alert notifications
  lowOccupancy: (userId: string, propertyId: string, propertyTitle: string, occupancyRate: number) =>
    createNotification({
      userId,
      type: 'alert',
      title: 'Low Occupancy Alert',
      message: `${propertyTitle} has only ${occupancyRate}% occupancy this month`,
      priority: 'medium',
      propertyId,
      link: `/os/properties/${propertyId}`,
      actionLabel: 'View Reports',
      actionUrl: `/os/reports/analytics`,
    }),

  urgentAlert: (userId: string, title: string, message: string, link?: string) =>
    createNotification({
      userId,
      type: 'alert',
      title,
      message,
      priority: 'urgent',
      link,
    }),
};

/**
 * Bulk create notifications for multiple users
 */
export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
  try {
    await dbConnect();
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    await dbConnect();
    return await Notification.countDocuments({ userId, isRead: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}
