/**
 * Booking Service
 * Handles all booking-related API calls
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { Booking, ApiResponse, PaginatedResponse } from '@/types';

interface CreateBookingData {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  mealPlan?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  orderId?: string;
}

interface BookingResponse {
  success: boolean;
  data?: Booking;
  booking?: Booking;
  message?: string;
}

class BookingService {
  /**
   * Get user's bookings
   */
  async getBookings(status?: string): Promise<PaginatedResponse<Booking>> {
    try {
      const response = await api.get<PaginatedResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.LIST,
        {
          params: status ? { status } : undefined,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await api.get<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.DETAIL(id)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new booking
   */
  async createBooking(data: CreateBookingData): Promise<BookingResponse> {
    try {
      const response = await api.post<BookingResponse>(
        API_ENDPOINTS.BOOKINGS.CREATE,
        data
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, reason?: string): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(
        API_ENDPOINTS.BOOKINGS.CANCEL(id),
        { reason }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate booking price
   */
  calculatePrice(
    basePrice: number,
    nights: number,
    guests: number,
    rooms: number,
    extras?: { cleaning?: number; service?: number; tax?: number }
  ): number {
    const roomTotal = basePrice * nights * rooms;
    const cleaning = extras?.cleaning || 0;
    const service = extras?.service || 0;
    const taxRate = extras?.tax || 0;

    const subtotal = roomTotal + cleaning + service;
    const tax = subtotal * (taxRate / 100);

    return subtotal + tax;
  }

  /**
   * Calculate number of nights
   */
  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export const bookingService = new BookingService();
