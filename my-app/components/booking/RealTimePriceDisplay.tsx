"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Gift, 
  Clock, 
  Star,
  Zap,
  Target,
  Calendar,
  Users,
  CreditCard,
  Info,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Percent
} from "lucide-react";

interface PriceData {
  basePrice: number;
  nights: number;
  rooms: number;
  guests: number;
  extraGuestCharge: number;
  taxes: number;
  finalTotal: number;
  isDynamicPricing: boolean;
  savings?: {
    amount: number;
    percentage: number;
    type: 'early_booking' | 'last_minute' | 'loyalty' | 'promotion' | 'bulk';
    description: string;
  };
  premiums?: {
    amount: number;
    percentage: number;
    type: 'weekend' | 'holiday' | 'event' | 'demand';
    description: string;
  }[];
  promotions?: {
    id: string;
    name: string;
    type: 'discount' | 'upgrade' | 'perk';
    value: number;
    description: string;
    isActive: boolean;
    urgency: 'low' | 'medium' | 'high';
  }[];
}

interface RealTimePriceDisplayProps {
  priceData: PriceData;
  isLoading?: boolean;
  onPriceChange?: (newPrice: number) => void;
  className?: string;
}

export default function RealTimePriceDisplay({
  priceData,
  isLoading = false,
  onPriceChange,
  className = ""
}: RealTimePriceDisplayProps) {
  const [previousPrice, setPreviousPrice] = useState<number>(priceData.finalTotal);
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | 'none'>('none');
  const [showPriceAnimation, setShowPriceAnimation] = useState(false);

  // Track price changes for animations
  useEffect(() => {
    if (priceData.finalTotal !== previousPrice && previousPrice > 0) {
      const direction = priceData.finalTotal > previousPrice ? 'up' : 'down';
      setPriceChangeDirection(direction);
      setShowPriceAnimation(true);
      
      // Reset animation after a brief moment
      const timer = setTimeout(() => {
        setShowPriceAnimation(false);
        setPriceChangeDirection('none');
      }, 1500);
      
      onPriceChange?.(priceData.finalTotal);
      
      return () => clearTimeout(timer);
    }
    setPreviousPrice(priceData.finalTotal);
  }, [priceData.finalTotal, previousPrice, onPriceChange]);

  const totalSavings = useMemo(() => {
    let savings = 0;
    // Only add real savings that are passed as props
    if (priceData.savings && priceData.savings.amount > 0) {
      savings += priceData.savings.amount;
    }
    // Only add real promotions that are passed as props
    if (priceData.promotions) {
      savings += priceData.promotions
        .filter(p => p.isActive && p.type === 'discount' && p.value > 0)
        .reduce((sum, p) => sum + p.value, 0);
    }
    return savings;
  }, [priceData.savings, priceData.promotions]);

  const totalPremiums = useMemo(() => {
    return priceData.premiums?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }, [priceData.premiums]);

  const savingsPercentage = useMemo(() => {
    if (totalSavings === 0) return 0;
    const originalPrice = priceData.finalTotal + totalSavings;
    return Math.round((totalSavings / originalPrice) * 100);
  }, [totalSavings, priceData.finalTotal]);

  const getSavingsIcon = (type: string) => {
    switch (type) {
      case 'early_booking': return <Clock className="h-4 w-4" />;
      case 'last_minute': return <Zap className="h-4 w-4" />;
      case 'loyalty': return <Star className="h-4 w-4" />;
      case 'promotion': return <Gift className="h-4 w-4" />;
      case 'bulk': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPromotionUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <Card className={`relative overflow-hidden ${className}`}>
        {/* Price Change Animation Overlay */}
        <AnimatePresence>
          {showPriceAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-0 z-10 pointer-events-none ${
                priceChangeDirection === 'up' 
                  ? 'bg-red-500/10 border-2 border-red-300' 
                  : 'bg-green-500/10 border-2 border-green-300'
              } rounded-lg`}
            >
              <div className="absolute top-4 right-4">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    priceChangeDirection === 'up' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {priceChangeDirection === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {priceChangeDirection === 'up' ? 'Price Increased' : 'Price Decreased'}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Price Summary</span>
              {priceData.isDynamicPricing && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Dynamic
                </Badge>
              )}
            </div>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Updating...</span>
              </div>
            )}
          </CardTitle>

          {/* Savings Highlight */}
          {totalSavings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">
                    You're saving ₹{totalSavings.toLocaleString()}
                  </span>
                  {savingsPercentage > 0 && (
                    <Badge className="bg-green-600 text-white">
                      {savingsPercentage}% OFF
                    </Badge>
                  )}
                </div>
                {priceData.savings && (
                  <p className="text-sm text-green-700">
                    {priceData.savings.description}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Active Promotions */}
          {priceData.promotions && priceData.promotions.filter(p => p.isActive).length > 0 && (
            <div className="mt-3 space-y-2">
              {priceData.promotions.filter(p => p.isActive).map((promotion) => (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2 rounded-lg border ${getPromotionUrgencyColor(promotion.urgency)} ${
                    promotion.urgency === 'high' ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-white rounded">
                        {promotion.type === 'discount' ? (
                          <Percent className="h-3 w-3" />
                        ) : promotion.type === 'upgrade' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <Gift className="h-3 w-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-xs">{promotion.name}</p>
                        <p className="text-xs opacity-80">{promotion.description}</p>
                      </div>
                    </div>
                    {promotion.type === 'discount' && (
                      <Badge variant="outline" className="text-xs">
                        -₹{promotion.value.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>₹{priceData.basePrice.toLocaleString()} × {priceData.nights} nights × {priceData.rooms} room{priceData.rooms > 1 ? 's' : ''}</span>
              <span>₹{(priceData.basePrice * priceData.nights * priceData.rooms).toLocaleString()}</span>
            </div>

            {priceData.extraGuestCharge > 0 && (
              <div className="flex justify-between text-sm">
                <div>
                  <span>Extra guest charge</span>
                  <div className="text-xs text-muted-foreground">
                    ({Math.max(0, priceData.guests - (priceData.rooms * 2))} extra guest{Math.max(0, priceData.guests - (priceData.rooms * 2)) > 1 ? 's' : ''} × ₹1,000/night)
                  </div>
                </div>
                <span className="text-orange-600">+₹{priceData.extraGuestCharge.toLocaleString()}</span>
              </div>
            )}

            {/* Premium Charges */}
            {priceData.premiums && priceData.premiums.length > 0 && (
              <div className="space-y-2">
                {priceData.premiums.map((premium, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{premium.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="capitalize">{premium.type.replace('_', ' ')} premium</span>
                    </div>
                    <span className="text-orange-600">+₹{premium.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Applied Savings */}
            {totalSavings > 0 && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  {priceData.savings && getSavingsIcon(priceData.savings.type)}
                  <span>Total savings</span>
                </div>
                <span className="text-green-600 font-medium">-₹{totalSavings.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>Taxes (12%)</span>
              <span>₹{priceData.taxes.toLocaleString()}</span>
            </div>

            <Separator />

            {/* Final Total with Animation */}
            <motion.div 
              className="flex justify-between font-bold text-xl"
              animate={{ 
                scale: showPriceAnimation ? [1, 1.05, 1] : 1,
                color: showPriceAnimation 
                  ? (priceChangeDirection === 'up' ? '#ef4444' : '#22c55e')
                  : '#000000'
              }}
              transition={{ duration: 0.3 }}
            >
              <span>Total</span>
              <div className="flex items-center gap-2">
                {showPriceAnimation && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {priceChangeDirection === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    )}
                  </motion.div>
                )}
                <span>₹{priceData.finalTotal.toLocaleString()}</span>
              </div>
            </motion.div>

            {/* Price comparison with original */}
            {totalSavings > 0 && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground line-through">
                  Original: ₹{(priceData.finalTotal + totalSavings).toLocaleString()}
                </div>
                <div className="text-lg font-bold text-green-600">
                  You save: ₹{totalSavings.toLocaleString()} ({savingsPercentage}%)
                </div>
              </div>
            )}
          </div>

          {/* Price Confidence Indicator */}
          {priceData.isDynamicPricing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Price Optimization Active</span>
              </div>
              <p className="text-xs text-blue-700">
                This price is dynamically optimized based on current demand, seasonality, and booking patterns.
                Price may change based on availability.
              </p>
            </div>
          )}

          {/* Quick Price Facts */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium">Per Night</div>
              <div className="text-lg font-bold text-blue-600">₹{Math.round(priceData.finalTotal / priceData.nights).toLocaleString()}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-sm font-medium">Per Guest</div>
              <div className="text-lg font-bold text-green-600">₹{Math.round(priceData.finalTotal / priceData.guests).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 