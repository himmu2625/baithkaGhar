/**
 * Favorites Service
 * Handles favorite properties
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { Property, ApiResponse } from '@/types';

class FavoritesService {
  /**
   * Get user's favorite properties
   */
  async getFavorites(): Promise<ApiResponse<Property[]>> {
    try {
      const response = await api.get<ApiResponse<Property[]>>(
        API_ENDPOINTS.FAVORITES.LIST
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add property to favorites
   */
  async addFavorite(propertyId: string): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(
        API_ENDPOINTS.FAVORITES.ADD,
        { propertyId }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove property from favorites
   */
  async removeFavorite(propertyId: string): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(
        API_ENDPOINTS.FAVORITES.REMOVE(propertyId)
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if property is favorited
   */
  async isFavorite(propertyId: string): Promise<boolean> {
    try {
      const response = await this.getFavorites();
      if (response.success && response.data) {
        return response.data.some(prop => prop._id === propertyId);
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
