/**
 * Booking Types
 * Shared types matching the backend Booking model
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface BookingGuest {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  _id: string;
  propertyId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  guestDetails: BookingGuest;
  specialRequests?: string;
  mealPlan?: string;
  bookingReference: string;
  createdAt: string;
  updatedAt: string;
}
