/**
 * useProperties Hook
 * React Query hooks for property data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '@/services';

/**
 * Get all properties with optional filters
 */
export function useProperties(params?: any) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => propertyService.getProperties(params),
  });
}

/**
 * Search properties
 */
export function useSearchProperties(query: string, params?: any) {
  return useQuery({
    queryKey: ['properties', 'search', query, params],
    queryFn: () => propertyService.searchProperties(query, params),
    enabled: query.length > 0,
  });
}

/**
 * Get property by ID
 */
export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getPropertyById(id),
    enabled: !!id,
  });
}

/**
 * Get featured properties
 */
export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertyService.getFeaturedProperties(),
  });
}

/**
 * Check availability
 */
export function useCheckAvailability() {
  return useMutation({
    mutationFn: ({
      propertyId,
      checkIn,
      checkOut,
    }: {
      propertyId: string;
      checkIn: string;
      checkOut: string;
    }) => propertyService.checkAvailability(propertyId, checkIn, checkOut),
  });
}
