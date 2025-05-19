import type React from "react"

export interface RoomCategory {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxGuests: number;
  amenities?: string[];
}

export interface PropertyDetails {
  id: string
  name: string
  description: string
  location: string
  price: number
  rating: number
  reviewCount: number
  images: string[]
  amenities: {
    name: string
    icon: React.ReactNode
  }[]
  rules: string[]
  host: {
    name: string
    image: string
    responseRate: number
    responseTime: string
    joinedDate: string
  }
  reviews: {
    id: string
    user: {
      name: string
      image: string
    }
    rating: number
    date: string
    comment: string
  }[]
  ratingBreakdown: {
    cleanliness: number
    accuracy: number
    communication: number
    location: number
    checkIn: number
    value: number
  }
  type?: string
  propertyType?: string
  categories?: RoomCategory[]
} 