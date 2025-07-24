"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Dot
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Info,
  Zap,
  Target,
  Eye,
  RefreshCw,
  Download,
  Sparkles,
  AlertTriangle
} from "lucide-react";

interface PriceDataPoint {
  date: string;
  price: number;
  basePrice: number;
  demandMultiplier: number;
  eventMultiplier: number;
  seasonalMultiplier: number;
  isWeekend: boolean;
  occupancyRate: number;
  events: string[];
  promotions: string[];
  competitorAvg?: number;
}

interface PriceTrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  volatility: 'low' | 'medium' | 'high';
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  recommendedBookingWindow: string;
  priceStability: number;
}

interface PriceTrendGraphProps {
  propertyId: string;
  selectedDates: { checkIn: Date; checkOut: Date; };
  className?: string;
}

export default function PriceTrendGraph({
  propertyId,
  selectedDates,
  className = ""
}: PriceTrendGraphProps) {
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<PriceTrendAnalysis | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '6m'>('30d');
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'price' | 'occupancy' | 'demand'>('price');

  useEffect(() => {
    fetchPriceTrends();
  }, [propertyId, timeRange, selectedDates]);

  const fetchPriceTrends = async () => {
    try {
      setLoading(true);

      // Calculate date range based on selection
      const endDate = new Date();
      const startDate = (() => {
        switch (timeRange) {
          case '7d': return subDays(endDate, 7);
          case '30d': return subDays(endDate, 30);
          case '90d': return subDays(endDate, 90);
          case '6m': return subDays(endDate, 180);
          default: return subDays(endDate, 30);
        }
      })();

      // Generate mock data - replace with actual API call
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const mockData: PriceDataPoint[] = days.map((day, index) => {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const basePrice = 5000;
        
        // Simulate seasonal variations
        const seasonalFactor = 1 + 0.3 * Math.sin((index / days.length) * Math.PI * 2);
        
        // Weekend premium
        const weekendFactor = isWeekend ? 1.2 : 1.0;
        
        // Random demand variations
        const demandFactor = 0.8 + Math.random() * 0.4;
        
        // Event multipliers (simulate events on certain dates)
        const eventFactor = Math.random() > 0.9 ? 1.5 : 1.0;
        
        const finalPrice = Math.round(basePrice * seasonalFactor * weekendFactor * demandFactor * eventFactor);
        
        // Simulate occupancy rate
        const occupancyRate = Math.max(30, Math.min(95, 60 + (finalPrice - basePrice) / basePrice * 50 + Math.random() * 20));
        
        return {
          date: format(day, 'yyyy-MM-dd'),
          price: finalPrice,
          basePrice,
          demandMultiplier: demandFactor,
          eventMultiplier: eventFactor,
          seasonalMultiplier: seasonalFactor,
          isWeekend,
          occupancyRate: Math.round(occupancyRate),
          events: eventFactor > 1 ? ['Local Festival'] : [],
          promotions: Math.random() > 0.8 ? ['Early Bird Discount'] : [],
          competitorAvg: finalPrice * (0.9 + Math.random() * 0.2)
        };
      });

      setPriceData(mockData);

      // Calculate analysis
      const prices = mockData.map(d => d.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Calculate trend
      const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
      const secondHalf = prices.slice(Math.floor(prices.length / 2));
      const firstAvg = firstHalf.reduce((sum, price) => sum + price, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, price) => sum + price, 0) / secondHalf.length;
      const trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      // Calculate volatility
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const volatility = variance > 1000000 ? 'high' : variance > 400000 ? 'medium' : 'low';
      
      setAnalysis({
        trend: trendPercentage > 5 ? 'increasing' : trendPercentage < -5 ? 'decreasing' : 'stable',
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        volatility,
        averagePrice: Math.round(avgPrice),
        minPrice,
        maxPrice,
        recommendedBookingWindow: trendPercentage > 10 ? 'Book Soon' : trendPercentage < -10 ? 'Wait for Better Prices' : 'Flexible Timing',
        priceStability: Math.round((1 - variance / (avgPrice * avgPrice)) * 100)
      });

    } catch (error) {
      console.error('Error fetching price trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price' || name === 'competitorAvg') {
      return [`₹${value.toLocaleString()}`, name === 'price' ? 'Property Price' : 'Market Average'];
    }
    if (name === 'occupancyRate') {
      return [`${value}%`, 'Occupancy Rate'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return format(date, timeRange === '7d' ? 'dd MMM' : 'dd/MM');
  };

  const isSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date >= selectedDates.checkIn && date <= selectedDates.checkOut;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (isSelectedDate(payload.date)) {
      return <Dot cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />;
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Price Trends
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Historical price trends to help you find the best booking time</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchPriceTrends}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Analysis Summary */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {analysis.trend === 'increasing' ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : analysis.trend === 'decreasing' ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <Target className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium">Price Trend</span>
                </div>
                <p className={`text-2xl font-bold ${
                  analysis.trend === 'increasing' ? 'text-red-600' : 
                  analysis.trend === 'decreasing' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {analysis.trend === 'increasing' ? '+' : analysis.trend === 'decreasing' ? '' : '±'}
                  {Math.abs(analysis.trendPercentage)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {analysis.trend === 'increasing' ? 'Prices rising' : 
                   analysis.trend === 'decreasing' ? 'Prices falling' : 'Stable pricing'}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Volatility</span>
                </div>
                <p className={`text-2xl font-bold ${
                  analysis.volatility === 'high' ? 'text-red-600' : 
                  analysis.volatility === 'medium' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {analysis.volatility.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  ₹{analysis.minPrice.toLocaleString()} - ₹{analysis.maxPrice.toLocaleString()}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Booking Tip</span>
                </div>
                <p className={`text-lg font-bold ${
                  analysis.recommendedBookingWindow === 'Book Soon' ? 'text-red-600' : 
                  analysis.recommendedBookingWindow === 'Wait for Better Prices' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {analysis.recommendedBookingWindow}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg: ₹{analysis.averagePrice.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Chart Tabs */}
          <Tabs value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="price">Price Trends</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
              <TabsTrigger value="demand">Demand Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                      domain={['dataMin - 500', 'dataMax + 500']}
                    />
                    <RechartsTooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    
                    {/* Selected date range highlighting */}
                    <ReferenceLine 
                      x={format(selectedDates.checkIn, 'yyyy-MM-dd')} 
                      stroke="#3b82f6" 
                      strokeDasharray="5 5"
                      label={{ value: "Check-in", position: "top" }}
                    />
                    <ReferenceLine 
                      x={format(selectedDates.checkOut, 'yyyy-MM-dd')} 
                      stroke="#3b82f6" 
                      strokeDasharray="5 5"
                      label={{ value: "Check-out", position: "top" }}
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                      dot={<CustomDot />}
                    />
                    
                    {showComparison && (
                      <Line 
                        type="monotone" 
                        dataKey="competitorAvg" 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showComparison ? 'Hide' : 'Show'} Market Comparison
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Your Dates: {format(selectedDates.checkIn, 'MMM dd')} - {format(selectedDates.checkOut, 'MMM dd')}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="occupancy" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <RechartsTooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="occupancyRate" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                    />
                    <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="5 5" label="High Demand" />
                    <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="5 5" label="Moderate" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="demand" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0.5, 2]}
                      tickFormatter={(value) => `${value.toFixed(1)}x`}
                    />
                    <RechartsTooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="demandMultiplier" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                      name="Demand Factor"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="seasonalMultiplier" 
                      stackId="2"
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.6}
                      name="Seasonal Factor"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="eventMultiplier" 
                      stackId="3"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="Event Factor"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          {/* Insights */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Price Insights for Your Dates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Selected Period Price:</span>
                <p className="font-semibold text-blue-900">
                  ₹{priceData
                    .filter(d => isSelectedDate(d.date))
                    .reduce((sum, d) => sum + d.price, 0) / 
                    Math.max(1, priceData.filter(d => isSelectedDate(d.date)).length)
                  } avg/night
                </p>
              </div>
              <div>
                <span className="text-blue-700">vs Average Price:</span>
                <p className="font-semibold text-blue-900">
                  {analysis && (
                    ((priceData.filter(d => isSelectedDate(d.date)).reduce((sum, d) => sum + d.price, 0) / 
                      Math.max(1, priceData.filter(d => isSelectedDate(d.date)).length)) > analysis.averagePrice ? 
                      '+' : '') +
                    Math.round(((priceData.filter(d => isSelectedDate(d.date)).reduce((sum, d) => sum + d.price, 0) / 
                      Math.max(1, priceData.filter(d => isSelectedDate(d.date)).length)) - analysis.averagePrice) / analysis.averagePrice * 100)
                  )}% 
                  {analysis && (
                    (priceData.filter(d => isSelectedDate(d.date)).reduce((sum, d) => sum + d.price, 0) / 
                     Math.max(1, priceData.filter(d => isSelectedDate(d.date)).length)) > analysis.averagePrice ? 
                     'above average' : 'below average'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 