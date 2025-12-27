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
    timeframe: string;
  };
  confidence: number;
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
  // Plan-based pricing parameters
  planType?: string;
  occupancyType?: string;
  usePlanPricing?: boolean;
}

export default function DynamicPriceIndicator({
  propertyId,
  basePrice,
  checkIn,
  checkOut,
  guests = 2,
  rooms = 1,
  planType,
  occupancyType,
  usePlanPricing = false,
  className = ""
}: DynamicPriceIndicatorProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDynamicPricing();
  }, [propertyId, checkIn, checkOut, guests, rooms, planType, occupancyType, usePlanPricing]);

  const fetchDynamicPricing = async () => {
    try {
      setLoading(true);

      // Try to fetch plan-based pricing if enabled
      if (usePlanPricing && planType && occupancyType && checkIn && checkOut) {
        try {
          const response = await fetch('/api/pricing/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              propertyId,
              roomCategory: 'DELUXE ROOM', // Default room category
              checkInDate: checkIn.toISOString().split('T')[0],
              checkOutDate: checkOut.toISOString().split('T')[0],
              planType,
              occupancyType
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.pricingOptions.length > 0) {
              const planPrice = data.pricingOptions[0].pricePerNight;
              setPriceData({
                basePrice: planPrice,
                currentPrice: planPrice,
                marketAverage: basePrice,
                isDynamic: true,
                confidence: 95,
                lastUpdated: new Date()
              });
              return;
            }
          }
        } catch (planError) {
          // Silent failure - fallback to base price
        }
      }

      // Fallback to base price
      setPriceData({
        basePrice,
        currentPrice: basePrice,
        marketAverage: basePrice,
        isDynamic: false,
        confidence: 100,
        lastUpdated: new Date()
      });
    } catch (error) {
      setPriceData({
        basePrice,
        currentPrice: basePrice,
        marketAverage: basePrice,
        isDynamic: false,
        confidence: 100,
        lastUpdated: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-lg font-bold text-gray-900">
          From ₹{basePrice.toLocaleString()}
        </span>
        <span className="text-sm font-normal text-gray-600">/night</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Main Price Display */}
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-gray-900">
            From ₹{priceData.currentPrice.toLocaleString()}
          </span>
          <span className="text-sm font-normal text-gray-600">/night</span>
        </div>

        {/* Dynamic Badge */}
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
              </div>
            </TooltipContent>
          </Tooltip>
        )}

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

        {/* Market Comparison */}
        {priceData.currentPrice < priceData.marketAverage && (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="text-xs bg-green-50 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Good Value
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <div className="font-medium">Market Comparison</div>
                <div className="text-sm mt-1">
                  <div>This Property: ₹{priceData.currentPrice.toLocaleString()}</div>
                  <div>Market Avg: ₹{priceData.marketAverage.toLocaleString()}</div>
                  <div className="text-green-600 font-medium mt-1">
                    Save ₹{(priceData.marketAverage - priceData.currentPrice).toLocaleString()}
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Low Confidence Warning */}
        {priceData.confidence < 80 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Price may change
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="text-sm">Price may change based on availability and demand.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 