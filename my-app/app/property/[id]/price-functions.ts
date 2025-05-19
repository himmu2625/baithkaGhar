import { PropertyDetails, RoomCategory } from './types';

// Get price for a specific category ID
export function getCategoryPrice(property: PropertyDetails | null, categoryId: string | null): number {
  if (!property?.categories || !categoryId) return property?.price || 0;
  
  const category = property.categories.find(cat => cat.id === categoryId);
  return category?.price || property.price;
}

// Calculate total price based on category, nights and rooms
export function calculateTotalPriceForCategory(
  property: PropertyDetails | null, 
  categoryId: string | null,
  nights: number,
  rooms: number
): number {
  if (!property || nights <= 0) return 0;
  
  // Get price for selected category
  const basePrice = getCategoryPrice(property, categoryId);
  
  // Calculate total
  return basePrice * nights * rooms;
}

// Get category object by ID
export function getCategoryById(
  property: PropertyDetails | null,
  categoryId: string | null
): RoomCategory | null {
  if (!property?.categories || !categoryId) return null;
  return property.categories.find(cat => cat.id === categoryId) || null;
} 