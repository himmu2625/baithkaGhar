"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Target, 
  Zap,
  Info,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  BarChart3
} from "lucide-react";

interface PriceData {
  basePrice: number;
  currentPrice: number;
  marketAverage: number;
  isDynamic: boolean;
  priceChange?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    timeframe: string; // e.g., "vs yesterday", "vs last week"
  };
  confidence: number; // 0-100, how confident we are in the price
  lastUpdated: Date;
}

interface DynamicPriceIndicatorProps {
  propertyId: string;
  basePrice: number;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  rooms?: number;
  className?: string;
}

export default function DynamicPriceIndicator({
  propertyId,
  basePrice,
  checkIn,
  checkOut,
  guests = 2,
  rooms = 1,
  className = ""
}: DynamicPriceIndicatorProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  useEffect(() => {
    fetchDynamicPricing();
  }, [propertyId, checkIn, checkOut, guests, rooms]);

  const fetchDynamicPricing = async () => {
    try {
      setLoading(true);

      // Mock data for demonstration - replace with actual API call
      const mockPriceData: PriceData = {
        basePrice,
        currentPrice: Math.round(basePrice * (0.85 + Math.random() * 0.3)), // ±15% variation
        marketAverage: Math.round(basePrice * 1.12), // 12% higher market average
        isDynamic: Math.random() > 0.3, // 70% chance of dynamic pricing
        priceChange: Math.random() > 0.5 ? {
          direction: Math.random() > 0.6 ? 'down' : 'up',
          percentage: Math.round(Math.random() * 15 + 5), // 5-20% change
          timeframe: Math.random() > 0.5 ? 'vs yesterday' : 'vs last week'
        } : undefined,
        confidence: Math.round(Math.random() * 20 + 75), // 75-95% confidence
        lastUpdated: new Date()
      };

      setPriceData(mockPriceData);
    } catch (error) {
      console.error('Error fetching dynamic pricing:', error);
      // Fallback to static data
      setPriceData({
        basePrice,
        currentPrice: basePrice,
        marketAverage: basePrice * 1.1,
        isDynamic: false,
        confidence: 90,
        lastUpdated: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriceComparisonStatus = () => {
    if (!priceData) return 'neutral';
    
    const priceDiff = ((priceData.currentPrice - priceData.marketAverage) / priceData.marketAverage) * 100;
    
    if (priceDiff <= -15) return 'excellent';
    if (priceDiff <= -5) return 'good';
    if (priceDiff <= 5) return 'fair';
    return 'high';
  };

  const getComparisonColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-700 bg-green-100 border-green-300';
      case 'good': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      case 'fair': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getComparisonText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent Deal';
      case 'good': return 'Good Value';
      case 'fair': return 'Fair Price';
      case 'high': return 'Above Average';
      default: return 'Market Price';
    }
  };

  const getComparisonIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <Target className="h-3 w-3" />;
      case 'good': return <CheckCircle className="h-3 w-3" />;
      case 'fair': return <BarChart3 className="h-3 w-3" />;
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      default: return <DollarSign className="h-3 w-3" />;
    }
  };

  const getSavingsAmount = () => {
    if (!priceData) return 0;
    return Math.max(0, priceData.marketAverage - priceData.currentPrice);
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!priceData) return null;

  const comparisonStatus = getPriceComparisonStatus();
  const savingsAmount = getSavingsAmount();

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        {/* Main Price Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-gray-900">
              From ₹{priceData.currentPrice.toLocaleString()}
            </span>
            {priceData.isDynamic && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Dynamic
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-medium mb-1">Dynamic Pricing Active</p>
                    <p className="text-sm">Price adjusts based on demand, seasonality, and booking patterns.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {priceData.lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Price Change Indicator */}
          {priceData.priceChange && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
            >
              {priceData.priceChange.direction === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                priceData.priceChange.direction === 'down' ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceData.priceChange.percentage}% {priceData.priceChange.timeframe}
              </span>
            </motion.div>
          )}
        </div>

        {/* Market Comparison & Savings */}
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger>
              <Badge 
                className={`text-xs ${getComparisonColor(comparisonStatus)} hover:shadow-md transition-shadow cursor-pointer`}
              >
                {getComparisonIcon(comparisonStatus)}
                <span className="ml-1">{getComparisonText(comparisonStatus)}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs space-y-2">
                <div className="font-medium">Market Comparison</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">This Property:</div>
                    <div className="font-medium">₹{priceData.currentPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Market Avg:</div>
                    <div className="font-medium">₹{priceData.marketAverage.toLocaleString()}</div>
                  </div>
                </div>
                {savingsAmount > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    You save ₹{savingsAmount.toLocaleString()} vs market average
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Confidence: {priceData.confidence}%
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Savings Highlight */}
          {savingsAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-green-600 font-medium"
            >
              Save ₹{savingsAmount.toLocaleString()}
            </motion.div>
          )}
        </div>

        {/* Additional Info for Dynamic Pricing */}
        {priceData.isDynamic && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Price updates in real-time</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="text-sm">
                    This property uses dynamic pricing that adjusts based on:
                  </p>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• Current demand and booking trends</li>
                    <li>• Seasonal factors and local events</li>
                    <li>• Advanced booking timing</li>
                    <li>• Market competition analysis</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Book early or check different dates for better rates.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Low Confidence Warning */}
        {priceData.confidence < 80 && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Price may change based on availability</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 