// Auth API types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    name: string
    email: string
    role: string
    profileComplete: boolean
  }
  message?: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone?: string
}

export interface RegisterResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
    profileComplete: boolean
  }
  token?: string
  message?: string
}

// Property API types
export interface PropertyListRequest {
  limit?: number
  page?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  filter?: Record<string, any>
}

export interface PropertyListResponse {
  properties: PropertyResponse[]
  total: number
  pages: number
}

export interface PropertyResponse {
  id: string
  title: string
  description: string
  type: string
  location: {
    city: string
    state: string
    address: string
    zipCode: string
  }
  price: number
  images: string[]
  amenities: {
    name: string
    icon?: string
  }[]
  bedrooms: number
  bathrooms: number
  maxGuests: number
  rating: number
  reviewCount: number
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePropertyRequest {
  title: string
  description: string
  type: string
  location: {
    city: string
    state: string
    address: string
    zipCode: string
  }
  price: number
  images: string[]
  amenities: {
    name: string
    icon?: string
  }[]
  bedrooms: number
  bathrooms: number
  maxGuests: number
}

// Booking API types
export interface BookingListResponse {
  bookings: BookingResponse[]
}

export interface BookingResponse {
  id: string
  userId: string
  propertyId: string
  status: "confirmed" | "cancelled" | "completed"
  dateFrom: string
  dateTo: string
  totalPrice?: number
  createdAt: string
  updatedAt: string
  property?: PropertyResponse
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface CreateBookingRequest {
  propertyId: string
  dateFrom: string
  dateTo: string
  guests: number
}

// User API types
export interface UserResponse {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  dob?: string
  isAdmin: boolean
  profileComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  address?: string
  dob?: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Review API types
export interface ReviewResponse {
  id: string
  userId: string
  propertyId: string
  bookingId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
  }
}

export interface CreateReviewRequest {
  propertyId: string
  bookingId: string
  rating: number
  comment: string
}
