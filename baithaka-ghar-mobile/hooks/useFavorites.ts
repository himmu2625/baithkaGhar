/**
 * useFavorites Hook
 * React Query hooks for favorites
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '@/services';

/**
 * Get user's favorites
 */
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getFavorites(),
  });
}

/**
 * Add to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => favoritesService.addFavorite(propertyId),
    onSuccess: () => {
      // Invalidate favorites list to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

/**
 * Remove from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => favoritesService.removeFavorite(propertyId),
    onSuccess: () => {
      // Invalidate favorites list to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

/**
 * Check if property is favorited
 */
export function useIsFavorite(propertyId: string) {
  const { data: favorites } = useFavorites();

  if (!favorites?.data) return false;

  return favorites.data.some((prop) => prop._id === propertyId);
}
