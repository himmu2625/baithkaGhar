/**
 * Property Service
 * Handles all property-related API calls
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { Property, ApiResponse, PaginatedResponse } from '@/types';

interface SearchParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
}

class PropertyService {
  /**
   * Get all properties with optional filters
   */
  async getProperties(params?: SearchParams): Promise<PaginatedResponse<Property>> {
    try {
      const response = await api.get<PaginatedResponse<Property>>(
        API_ENDPOINTS.PROPERTIES.LIST,
        { params }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search properties by location/keywords
   */
  async searchProperties(query: string, params?: SearchParams): Promise<PaginatedResponse<Property>> {
    try {
      const response = await api.get<PaginatedResponse<Property>>(
        API_ENDPOINTS.PROPERTIES.SEARCH,
        {
          params: {
            q: query,
            ...params
          }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    try {
      const response = await api.get<ApiResponse<Property>>(
        API_ENDPOINTS.PROPERTIES.DETAIL(id)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get featured properties
   */
  async getFeaturedProperties(): Promise<ApiResponse<Property[]>> {
    try {
      const response = await api.get<ApiResponse<Property[]>>(
        API_ENDPOINTS.PROPERTIES.FEATURED
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get nearby properties based on coordinates
   */
  async getNearbyProperties(lat: number, lng: number, radius: number = 10): Promise<ApiResponse<Property[]>> {
    try {
      const response = await api.get<ApiResponse<Property[]>>(
        API_ENDPOINTS.PROPERTIES.NEARBY,
        {
          params: { lat, lng, radius }
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check property availability
   */
  async checkAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<ApiResponse<{ available: boolean; message?: string }>> {
    try {
      const response = await api.post<ApiResponse<{ available: boolean; message?: string }>>(
        API_ENDPOINTS.BOOKINGS.CHECK_AVAILABILITY,
        {
          propertyId,
          checkIn,
          checkOut,
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const propertyService = new PropertyService();
