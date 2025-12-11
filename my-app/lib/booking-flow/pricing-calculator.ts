import { PricingBreakdown, GuestSelection, RoomCategoryData } from "./types"

interface CalculatePricingParams {
  roomCategory: RoomCategoryData
  nights: number
  guestSelection: GuestSelection
  mealCost: number
  addOnsCost: number
}

export function calculatePricing({
  roomCategory,
  nights,
  guestSelection,
  mealCost,
  addOnsCost,
}: CalculatePricingParams): PricingBreakdown {
  const { rooms, adults } = guestSelection

  // Base room total
  const baseRoomTotal = roomCategory.price * nights * rooms

  // Calculate extra guest charges
  // Free guest limit is the total number of guests allowed without extra charge
  const freeGuestLimit = rooms * (roomCategory.freeExtraPersonLimit || 2)
  const chargeableExtraGuests = Math.max(0, adults - freeGuestLimit)
  const extraGuestCharge = chargeableExtraGuests * (roomCategory.extraPersonCharge || 500) * nights

  // Meal total (already calculated, only for billable adults)
  const mealTotal = mealCost

  // Add-ons total
  const addOnsTotal = addOnsCost

  // Subtotal
  const subtotal = baseRoomTotal + extraGuestCharge + mealTotal + addOnsTotal

  // Taxes (12% GST)
  const taxes = Math.round(subtotal * 0.12)

  // Service fee (5%)
  const serviceFee = Math.round(subtotal * 0.05)

  // Grand total
  const total = subtotal + taxes + serviceFee

  return {
    baseRoomTotal,
    extraGuestCharge,
    mealTotal,
    addOnsTotal,
    subtotal,
    taxes,
    serviceFee,
    total,
    extraGuests: chargeableExtraGuests,
  }
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper function to calculate effective adults (including children >5)
export function calculateEffectiveAdults(roomConfigs: any[]): number {
  return roomConfigs.reduce((sum, room) => {
    const childrenAsAdults = room.children.filter((child: any) => child.age > 5).length
    return sum + room.adults + childrenAsAdults
  }, 0)
}

// Helper function to calculate actual children (≤5 years)
export function calculateActualChildren(roomConfigs: any[]): number {
  return roomConfigs.reduce((sum, room) => {
    const childrenUnder5 = room.children.filter((child: any) => child.age <= 5).length
    return sum + childrenUnder5
  }, 0)
}
