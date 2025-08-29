/**
 * Booking forecasting and trend analysis utilities
 */

export interface BookingTrendData {
  date: string;
  bookings: number;
  revenue: number;
}

export interface ForecastResult {
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface SeasonalPattern {
  month: number;
  multiplier: number;
  confidence: number;
}

export class BookingForecaster {
  /**
   * Simple linear regression forecast for booking trends
   */
  static forecastBookings(historicalData: BookingTrendData[], daysAhead: number = 30): ForecastResult {
    if (historicalData.length < 7) {
      return {
        predicted: 0,
        confidence: 0,
        trend: 'stable',
        changePercent: 0
      };
    }

    // Convert dates to numeric values for regression
    const dataPoints = historicalData.map((point, index) => ({
      x: index,
      y: point.bookings
    }));

    // Calculate linear regression
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + (point.x * point.x), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const futureX = n + daysAhead;
    const predicted = Math.max(0, slope * futureX + intercept);

    // Calculate confidence based on R-squared
    const meanY = sumY / n;
    const totalSumSquares = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
    const residualSumSquares = dataPoints.reduce((sum, point) => {
      const predictedY = slope * point.x + intercept;
      return sum + Math.pow(point.y - predictedY, 2);
    }, 0);

    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
    const confidence = Math.max(0, Math.min(1, rSquared)) * 100;

    // Determine trend
    const recentAvg = historicalData.slice(-7).reduce((sum, point) => sum + point.bookings, 0) / 7;
    const olderAvg = historicalData.slice(-14, -7).reduce((sum, point) => sum + point.bookings, 0) / 7;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;
    
    if (olderAvg > 0) {
      changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
    }

    return {
      predicted: Math.round(predicted),
      confidence: Math.round(confidence),
      trend,
      changePercent: Math.round(changePercent)
    };
  }

  /**
   * Revenue forecasting with seasonal adjustments
   */
  static forecastRevenue(
    historicalData: BookingTrendData[], 
    seasonalPatterns: SeasonalPattern[] = [],
    daysAhead: number = 30
  ): ForecastResult {
    if (historicalData.length < 7) {
      return {
        predicted: 0,
        confidence: 0,
        trend: 'stable',
        changePercent: 0
      };
    }

    // Apply similar linear regression to revenue data
    const dataPoints = historicalData.map((point, index) => ({
      x: index,
      y: point.revenue
    }));

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + (point.x * point.x), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    let predicted = Math.max(0, slope * (n + daysAhead) + intercept);

    // Apply seasonal adjustment if patterns provided
    if (seasonalPatterns.length > 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysAhead);
      const targetMonth = targetDate.getMonth() + 1;
      
      const seasonalPattern = seasonalPatterns.find(p => p.month === targetMonth);
      if (seasonalPattern) {
        predicted *= seasonalPattern.multiplier;
      }
    }

    // Calculate trend
    const recentAvg = historicalData.slice(-7).reduce((sum, point) => sum + point.revenue, 0) / 7;
    const olderAvg = historicalData.slice(-14, -7).reduce((sum, point) => sum + point.revenue, 0) / 7;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercent = 0;
    
    if (olderAvg > 0) {
      changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (changePercent > 10) trend = 'up';
      else if (changePercent < -10) trend = 'down';
    }

    return {
      predicted: Math.round(predicted),
      confidence: 75, // Simplified confidence for revenue
      trend,
      changePercent: Math.round(changePercent)
    };
  }

  /**
   * Detect seasonal booking patterns
   */
  static detectSeasonalPatterns(historicalData: BookingTrendData[]): SeasonalPattern[] {
    if (historicalData.length < 365) {
      return []; // Need at least a year of data
    }

    const monthlyData: Record<number, number[]> = {};

    // Group data by month
    historicalData.forEach(point => {
      const date = new Date(point.date);
      const month = date.getMonth() + 1;
      
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(point.bookings);
    });

    // Calculate average for each month
    const overallAverage = historicalData.reduce((sum, point) => sum + point.bookings, 0) / historicalData.length;
    
    const patterns: SeasonalPattern[] = [];
    
    Object.keys(monthlyData).forEach(monthStr => {
      const month = parseInt(monthStr);
      const monthBookings = monthlyData[month];
      const monthAverage = monthBookings.reduce((sum, val) => sum + val, 0) / monthBookings.length;
      
      const multiplier = overallAverage > 0 ? monthAverage / overallAverage : 1;
      const variance = monthBookings.reduce((sum, val) => sum + Math.pow(val - monthAverage, 2), 0) / monthBookings.length;
      const confidence = Math.max(0, Math.min(100, 100 - (variance / monthAverage) * 100));
      
      patterns.push({
        month,
        multiplier: Math.round(multiplier * 100) / 100,
        confidence: Math.round(confidence)
      });
    });

    return patterns.sort((a, b) => a.month - b.month);
  }

  /**
   * Calculate occupancy forecast
   */
  static forecastOccupancy(
    bookingTrends: BookingTrendData[],
    totalCapacity: number,
    daysAhead: number = 30
  ): ForecastResult {
    const bookingForecast = this.forecastBookings(bookingTrends, daysAhead);
    
    if (totalCapacity === 0) {
      return {
        predicted: 0,
        confidence: 0,
        trend: 'stable',
        changePercent: 0
      };
    }

    const predictedOccupancy = Math.min(100, (bookingForecast.predicted / totalCapacity) * 100);
    
    return {
      predicted: Math.round(predictedOccupancy),
      confidence: bookingForecast.confidence,
      trend: bookingForecast.trend,
      changePercent: bookingForecast.changePercent
    };
  }

  /**
   * Generate booking insights and recommendations
   */
  static generateInsights(
    historicalData: BookingTrendData[],
    forecast: ForecastResult,
    seasonalPatterns: SeasonalPattern[] = []
  ): string[] {
    const insights: string[] = [];

    // Trend insights
    if (forecast.trend === 'up' && forecast.changePercent > 20) {
      insights.push(`📈 Strong upward trend detected with ${forecast.changePercent}% growth`);
      insights.push("💡 Consider increasing rates or expanding capacity");
    } else if (forecast.trend === 'down' && forecast.changePercent < -20) {
      insights.push(`📉 Concerning downward trend detected with ${Math.abs(forecast.changePercent)}% decline`);
      insights.push("💡 Consider promotional campaigns or rate adjustments");
    }

    // Seasonal insights
    if (seasonalPatterns.length > 0) {
      const peakMonth = seasonalPatterns.reduce((max, pattern) => 
        pattern.multiplier > max.multiplier ? pattern : max
      );
      const lowMonth = seasonalPatterns.reduce((min, pattern) => 
        pattern.multiplier < min.multiplier ? pattern : min
      );

      if (peakMonth.multiplier > 1.3) {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        insights.push(`🌟 Peak season in ${monthNames[peakMonth.month]} with ${Math.round((peakMonth.multiplier - 1) * 100)}% above average`);
      }
      
      if (lowMonth.multiplier < 0.7) {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        insights.push(`❄️ Low season in ${monthNames[lowMonth.month]} with ${Math.round((1 - lowMonth.multiplier) * 100)}% below average`);
      }
    }

    // Confidence insights
    if (forecast.confidence < 50) {
      insights.push("⚠️ Low forecast confidence - data may be too volatile or insufficient");
    } else if (forecast.confidence > 80) {
      insights.push("✅ High forecast confidence - predictions are reliable");
    }

    return insights;
  }
}