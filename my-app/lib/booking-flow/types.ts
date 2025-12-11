// Booking Flow Types
export interface ChildAge {
  id: string
  age: number
}

export interface RoomConfig {
  id: string
  adults: number
  children: ChildAge[]
}

export interface PropertyData {
  _id: string
  name: string
  city: string
  address: string
  images: string[]
  rating?: number
  reviewsCount?: number
  checkInTime?: string
}

export interface RoomCategoryData {
  _id: string
  name: string
  price: number
  maxCapacityPerRoom: number
  freeExtraPersonLimit: number
  extraPersonCharge: number
  mealPricing?: {
    EP?: number
    CP?: number
    MAP?: number
    AP?: number
  }
  images?: string[]
  amenities?: string[]
}

export interface DateSelection {
  checkIn: Date
  checkOut: Date
  nights: number
}

export interface GuestSelection {
  rooms: number
  adults: number
  children: number
  guests: number
  roomConfigurations: RoomConfig[]
}

export interface MealSelection {
  plan: "EP" | "CP" | "MAP" | "AP" | null
  cost: number
  selectedMeals?: string[]
}

export interface AddOnSelection {
  id: string
  name: string
  price: number
  selected: boolean
}

export interface PricingBreakdown {
  baseRoomTotal: number
  extraGuestCharge: number
  mealTotal: number
  addOnsTotal: number
  subtotal: number
  taxes: number
  serviceFee: number
  total: number
  extraGuests: number
}

export interface GuestInformation {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode: string
  address?: string
  idProof?: string // Stored as base64 string for serialization
}

export interface SpecialRequests {
  requests: string[]
  comments: string
}

export interface GSTDetails {
  required: boolean
  companyName: string
  gstin: string
  companyAddress: string
}

export interface PaymentDetails {
  method: "razorpay"
  orderId?: string
  paymentId?: string
  status: "pending" | "processing" | "confirmed" | "failed"
  amount: number
}

export interface BookingFlowData {
  // Step 1: Review
  propertyData: PropertyData | null
  roomCategoryData: RoomCategoryData | null
  dateSelection: DateSelection | null
  guestSelection: GuestSelection | null
  mealSelection: MealSelection
  addOns: AddOnSelection[]
  pricing: PricingBreakdown | null

  // Step 2: Guest Details
  guestInfo: GuestInformation | null
  arrivalTime: string
  specialRequests: SpecialRequests
  gstDetails: GSTDetails

  // Step 3: Payment
  payment: PaymentDetails | null

  // Meta
  bookingId?: string
  currentStep: number
  agreedToPolicies: boolean
}

export const initialBookingData: BookingFlowData = {
  propertyData: null,
  roomCategoryData: null,
  dateSelection: null,
  guestSelection: null,
  mealSelection: {
    plan: null,
    cost: 0,
  },
  addOns: [],
  pricing: null,
  guestInfo: null,
  arrivalTime: "",
  specialRequests: {
    requests: [],
    comments: "",
  },
  gstDetails: {
    required: false,
    companyName: "",
    gstin: "",
    companyAddress: "",
  },
  payment: null,
  currentStep: 1,
  agreedToPolicies: false,
}
