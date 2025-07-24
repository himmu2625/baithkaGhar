interface BookingData {
  totalPrice: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  createdAt: Date;
  dynamicPricing?: any;
  propertyId?: string;
}

interface PropertyData {
  _id: string;
  price: number;
  location: {
    city: string;
    state: string;
  };
  type: string;
  amenities: string[];
  dynamicPricing?: any;
}

interface SuggestionInput {
  property: PropertyData;
  historicalBookings: BookingData[];
  similarProperties: PropertyData[];
  marketBookings: BookingData[];
  targetDates: {
    startDate: string;
    endDate: string;
  };
  guests: number;
}

interface PriceSuggestion {
  type: 'optimal' | 'aggressive' | 'conservative' | 'seasonal' | 'event';
  suggestedPrice: number;
  confidence: number;
  reasoning: string[];
  expectedOccupancy: number;
  revenueImpact: number;
  marketPosition: 'below' | 'average' | 'above';
}

interface SuggestionResult {
  suggestions: PriceSuggestion[];
  marketAnalysis: {
    averageMarketPrice: number;
    priceRange: { min: number; max: number };
    competitorCount: number;
    demandLevel: 'low' | 'medium' | 'high';
  };
  historicalInsights: {
    averagePrice: number;
    occupancyRate: number;
    seasonalTrends: Array<{
      month: number;
      averagePrice: number;
      bookingCount: number;
    }>;
  };
  recommendations: {
    shortTerm: string[];
    longTerm: string[];
  };
}

export async function generatePriceSuggestions(input: SuggestionInput): Promise<SuggestionResult> {
  const {
    property,
    historicalBookings,
    similarProperties,
    marketBookings,
    targetDates,
    guests
  } = input;

  // Calculate market analysis
  const marketAnalysis = calculateMarketAnalysis(similarProperties, marketBookings);
  
  // Analyze historical performance
  const historicalInsights = analyzeHistoricalData(historicalBookings);
  
  // Calculate demand for target dates
  const demandForecast = calculateDemandForecast(
    historicalBookings,
    marketBookings,
    targetDates,
    guests
  );
  
  // Generate different pricing suggestions
  const suggestions: PriceSuggestion[] = [];
  
  // 1. Optimal Price (Revenue Maximization)
  const optimalPrice = calculateOptimalPrice(
    property.price,
    marketAnalysis,
    historicalInsights,
    demandForecast
  );
  
  suggestions.push({
    type: 'optimal',
    suggestedPrice: optimalPrice.price,
    confidence: optimalPrice.confidence,
    reasoning: optimalPrice.reasoning,
    expectedOccupancy: optimalPrice.occupancy,
    revenueImpact: optimalPrice.revenueImpact,
    marketPosition: getMarketPosition(optimalPrice.price, marketAnalysis.averageMarketPrice)
  });
  
  // 2. Aggressive Price (Market Share Focus)
  const aggressivePrice = calculateAggressivePrice(
    marketAnalysis.averageMarketPrice,
    historicalInsights.averagePrice
  );
  
  suggestions.push({
    type: 'aggressive',
    suggestedPrice: aggressivePrice,
    confidence: 0.75,
    reasoning: [
      'Priced 10-15% below market average',
      'Focuses on increasing booking volume',
      'Good for building reviews and reputation'
    ],
    expectedOccupancy: 0.85,
    revenueImpact: -5,
    marketPosition: 'below'
  });
  
  // 3. Conservative Price (Safety First)
  const conservativePrice = calculateConservativePrice(
    property.price,
    historicalInsights.averagePrice,
    marketAnalysis.averageMarketPrice
  );
  
  suggestions.push({
    type: 'conservative',
    suggestedPrice: conservativePrice,
    confidence: 0.90,
    reasoning: [
      'Based on proven historical performance',
      'Low risk, stable bookings',
      'Maintains consistent revenue'
    ],
    expectedOccupancy: 0.70,
    revenueImpact: 0,
    marketPosition: getMarketPosition(conservativePrice, marketAnalysis.averageMarketPrice)
  });
  
  // 4. Seasonal Price (Time-based optimization)
  const seasonalPrice = calculateSeasonalPrice(
    property.price,
    historicalInsights.seasonalTrends,
    targetDates.startDate
  );
  
  suggestions.push({
    type: 'seasonal',
    suggestedPrice: seasonalPrice.price,
    confidence: 0.80,
    reasoning: seasonalPrice.reasoning,
    expectedOccupancy: seasonalPrice.occupancy,
    revenueImpact: seasonalPrice.revenueImpact,
    marketPosition: getMarketPosition(seasonalPrice.price, marketAnalysis.averageMarketPrice)
  });
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    property,
    marketAnalysis,
    historicalInsights,
    suggestions
  );
  
  return {
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    marketAnalysis,
    historicalInsights,
    recommendations
  };
}

function calculateMarketAnalysis(similarProperties: PropertyData[], marketBookings: BookingData[]) {
  const prices = marketBookings.map(booking => {
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    return booking.totalPrice / nights;
  });
  
  const averageMarketPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  const sortedPrices = prices.sort((a, b) => a - b);
  
  return {
    averageMarketPrice: Math.round(averageMarketPrice),
    priceRange: {
      min: sortedPrices[0] || 0,
      max: sortedPrices[sortedPrices.length - 1] || 0
    },
    competitorCount: similarProperties.length,
    demandLevel: calculateDemandLevel(marketBookings)
  };
}

function analyzeHistoricalData(historicalBookings: BookingData[]) {
  if (historicalBookings.length === 0) {
    return {
      averagePrice: 0,
      occupancyRate: 0,
      seasonalTrends: []
    };
  }
  
  const totalRevenue = historicalBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const totalNights = historicalBookings.reduce((sum, booking) => {
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    return sum + nights;
  }, 0);
  
  const averagePrice = totalNights > 0 ? totalRevenue / totalNights : 0;
  
  // Calculate seasonal trends
  const monthlyData: { [key: number]: { totalPrice: number; bookingCount: number } } = {};
  
  historicalBookings.forEach(booking => {
    const month = new Date(booking.checkIn).getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = { totalPrice: 0, bookingCount: 0 };
    }
    const nights = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    monthlyData[month].totalPrice += booking.totalPrice / nights;
    monthlyData[month].bookingCount += 1;
  });
  
  const seasonalTrends = Object.entries(monthlyData).map(([month, data]) => ({
    month: parseInt(month),
    averagePrice: Math.round(data.totalPrice / data.bookingCount),
    bookingCount: data.bookingCount
  }));
  
  return {
    averagePrice: Math.round(averagePrice),
    occupancyRate: Math.min(1, historicalBookings.length / 365), // Simplified occupancy calculation
    seasonalTrends
  };
}

function calculateDemandForecast(
  historicalBookings: BookingData[],
  marketBookings: BookingData[],
  targetDates: { startDate: string; endDate: string },
  guests: number
) {
  const targetMonth = new Date(targetDates.startDate).getMonth();
  const targetDayOfWeek = new Date(targetDates.startDate).getDay();
  
  // Analyze historical demand for similar periods
  const similarPeriodBookings = historicalBookings.filter(booking => {
    const bookingMonth = new Date(booking.checkIn).getMonth();
    const bookingDayOfWeek = new Date(booking.checkIn).getDay();
    return bookingMonth === targetMonth || bookingDayOfWeek === targetDayOfWeek;
  });
  
  return {
    historicalDemand: similarPeriodBookings.length,
    isWeekend: targetDayOfWeek === 0 || targetDayOfWeek === 6,
    isPeakSeason: [11, 0, 1, 3, 4, 5, 9, 10].includes(targetMonth), // Peak months
    guestDemandFactor: guests > 4 ? 1.1 : guests < 2 ? 0.9 : 1.0
  };
}

function calculateOptimalPrice(
  basePrice: number,
  marketAnalysis: any,
  historicalInsights: any,
  demandForecast: any
) {
  let multiplier = 1.0;
  const reasoning: string[] = [];
  
  // Market position adjustment
  if (marketAnalysis.averageMarketPrice > basePrice * 1.2) {
    multiplier *= 1.15;
    reasoning.push('Market prices are significantly higher than current price');
  } else if (marketAnalysis.averageMarketPrice < basePrice * 0.8) {
    multiplier *= 0.9;
    reasoning.push('Market prices are lower, adjusting competitively');
  }
  
  // Demand-based adjustment
  if (demandForecast.isPeakSeason) {
    multiplier *= 1.1;
    reasoning.push('Peak season demand detected');
  }
  
  if (demandForecast.isWeekend) {
    multiplier *= 1.05;
    reasoning.push('Weekend premium applied');
  }
  
  // Historical performance adjustment
  if (historicalInsights.occupancyRate > 0.8) {
    multiplier *= 1.08;
    reasoning.push('High historical occupancy rate');
  } else if (historicalInsights.occupancyRate < 0.5) {
    multiplier *= 0.95;
    reasoning.push('Low occupancy, adjusting for competitiveness');
  }
  
  const suggestedPrice = Math.round(basePrice * multiplier);
  const confidence = Math.min(0.95, 0.6 + (historicalInsights.averagePrice > 0 ? 0.2 : 0) + (marketAnalysis.competitorCount > 3 ? 0.15 : 0));
  
  return {
    price: suggestedPrice,
    confidence,
    reasoning,
    occupancy: Math.min(0.9, 0.6 + (multiplier > 1 ? 0.1 : 0.2)),
    revenueImpact: Math.round(((suggestedPrice - basePrice) / basePrice) * 100)
  };
}

function calculateAggressivePrice(marketAverage: number, historicalAverage: number): number {
  const targetPrice = Math.min(marketAverage, historicalAverage || marketAverage) * 0.85;
  return Math.round(Math.max(targetPrice, marketAverage * 0.75)); // No lower than 75% of market
}

function calculateConservativePrice(basePrice: number, historicalAverage: number, marketAverage: number): number {
  if (historicalAverage > 0) {
    return Math.round((historicalAverage + basePrice) / 2);
  }
  return Math.round((basePrice + marketAverage) / 2);
}

function calculateSeasonalPrice(
  basePrice: number,
  seasonalTrends: Array<{ month: number; averagePrice: number; bookingCount: number }>,
  targetDate: string
) {
  const targetMonth = new Date(targetDate).getMonth();
  const seasonalData = seasonalTrends.find(trend => trend.month === targetMonth);
  
  if (seasonalData && seasonalData.averagePrice > 0) {
    const seasonalMultiplier = seasonalData.averagePrice / basePrice;
    return {
      price: Math.round(basePrice * Math.min(1.3, Math.max(0.8, seasonalMultiplier))),
      reasoning: [
        `Historical data shows ${seasonalData.bookingCount} bookings in this month`,
        `Average price was ₹${seasonalData.averagePrice} per night`,
        'Adjusted based on seasonal performance patterns'
      ],
      occupancy: Math.min(0.85, seasonalData.bookingCount / 10),
      revenueImpact: Math.round(((seasonalData.averagePrice - basePrice) / basePrice) * 100)
    };
  }
  
  return {
    price: basePrice,
    reasoning: ['No historical data for this season', 'Using base price as reference'],
    occupancy: 0.6,
    revenueImpact: 0
  };
}

function calculateDemandLevel(marketBookings: BookingData[]): 'low' | 'medium' | 'high' {
  const recentBookings = marketBookings.filter(booking => 
    new Date(booking.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  
  if (recentBookings.length > 50) return 'high';
  if (recentBookings.length > 20) return 'medium';
  return 'low';
}

function getMarketPosition(price: number, marketAverage: number): 'below' | 'average' | 'above' {
  if (price < marketAverage * 0.9) return 'below';
  if (price > marketAverage * 1.1) return 'above';
  return 'average';
}

function generateRecommendations(
  property: PropertyData,
  marketAnalysis: any,
  historicalInsights: any,
  suggestions: PriceSuggestion[]
): { shortTerm: string[]; longTerm: string[] } {
  const shortTerm: string[] = [];
  const longTerm: string[] = [];
  
  // Short-term recommendations
  if (marketAnalysis.demandLevel === 'high') {
    shortTerm.push('Consider increasing prices by 10-15% due to high market demand');
  }
  
  if (historicalInsights.occupancyRate < 0.5) {
    shortTerm.push('Focus on competitive pricing to increase booking volume');
  }
  
  const bestSuggestion = suggestions[0];
  if (bestSuggestion.type === 'optimal') {
    shortTerm.push(`Implement the optimal pricing strategy for maximum revenue`);
  }
  
  // Long-term recommendations
  if (marketAnalysis.competitorCount < 3) {
    longTerm.push('Limited competition - consider premium pricing strategy');
  }
  
  if (historicalInsights.seasonalTrends.length > 6) {
    longTerm.push('Implement seasonal pricing rules based on historical trends');
  }
  
  longTerm.push('Enable dynamic pricing for automated price optimization');
  longTerm.push('Monitor competitor prices weekly and adjust accordingly');
  
  return { shortTerm, longTerm };
} 