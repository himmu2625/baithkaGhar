/**
 * Property Types
 * Shared types matching the backend Property model
 */

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyPrice {
  base: number;
  cleaning?: number;
  service?: number;
  tax?: number;
}

export interface MealOption {
  enabled: boolean;
  pricePerPerson: number;
  description?: string;
}

export interface MealPricing {
  breakfast?: MealOption;
  lunchDinner?: MealOption;
  allMeals?: MealOption;
}

export interface RoomRestrictions {
  maxGuestsPerRoom: number;
  extraPersonCharge: number;
  allowExtraGuests: boolean;
}

export interface Property {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  location: string;
  googleMapLink?: string;
  locationCoords?: {
    lat?: number;
    lng?: number;
  };
  address: PropertyAddress;
  price: PropertyPrice;
  mealPricing?: MealPricing;
  roomRestrictions?: RoomRestrictions;
  images?: string[];
  amenities?: string[];
  propertyType?: string;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  available?: boolean;
  createdAt: string;
  updatedAt: string;
}
