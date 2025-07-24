import { useState, useEffect } from 'react';

export interface DynamicPricingResult {
  totalPrice: number;
  nightlyAverage: number;
  nights: number;
  dailyPrices: Array<{
    date: string;
    price: number;
    basePrice: number;
    seasonalMultiplier: number;
    weeklyMultiplier: number;
    advanceDiscount: number;
    lastMinutePremium: number;
    demandMultiplier: number;
    guestMultiplier: number;
    weekendMultiplier: number;
    holidayMultiplier: number;
    occupancy: number;
  }>;
  guests: number;
  currency: string;
  dynamicPricingEnabled: boolean;
  pricingFactors: {
    seasonalMultiplier: number;
    weeklyMultiplier: number;
    demandBasedPricing: boolean;
    advanceBookingDiscount: number;
    lastMinutePremium: number;
    guestMultiplier: number;
    weekendPremium: number;
    holidayPremium: number;
    lengthOfStayDiscount: number;
  };
}

export function useDynamicPricing(
  propertyId: string,
  startDate: string,
  endDate: string,
  guests: number = 1
) {
  const [data, setData] = useState<DynamicPricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId || !startDate || !endDate) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/properties/${propertyId}/pricing?startDate=${startDate}&endDate=${endDate}&guests=${guests}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch pricing');
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId, startDate, endDate, guests]);

  return { data, loading, error };
} 