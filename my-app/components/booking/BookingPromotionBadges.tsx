"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Gift,
  Percent,
  Clock,
  Star,
  Zap,
  Users,
  Calendar,
  TrendingUp,
  Sparkles,
  Crown,
  Target,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  Timer
} from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  type: 'early_bird' | 'last_minute' | 'loyalty' | 'bulk_booking' | 'seasonal' | 'flash_sale' | 'first_time' | 'weekend_special';
  discount: {
    type: 'percentage' | 'fixed' | 'upgrade' | 'perk';
    value: number;
    description: string;
  };
  conditions: {
    minNights?: number;
    minGuests?: number;
    advanceBookingDays?: number;
    applicableRooms?: number[];
    validDates?: { start: Date; end: Date; };
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeLeft?: number; // hours until expiry
  isActive: boolean;
  autoApplied: boolean;
  priority: number;
  description: string;
  termsAndConditions?: string;
}

interface BookingPromotionBadgesProps {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  isFirstTimeUser?: boolean;
  userLoyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  className?: string;
}

export default function BookingPromotionBadges({
  propertyId,
  checkIn,
  checkOut,
  guests,
  rooms,
  isFirstTimeUser = false,
  userLoyaltyTier,
  className = ""
}: BookingPromotionBadgesProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPromotions, setAppliedPromotions] = useState<string[]>([]);

  useEffect(() => {
    fetchActivePromotions();
  }, [propertyId, checkIn, checkOut, guests, rooms]);

  const fetchActivePromotions = async () => {
    try {
      setLoading(true);

      // Try to fetch real promotions from API
      const response = await fetch(`/api/promotions/applicable?propertyId=${propertyId}&checkIn=${checkIn.toISOString()}&checkOut=${checkOut.toISOString()}&guests=${guests}&rooms=${rooms}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.promotions) {
          setPromotions(data.promotions);
          
          // Auto-apply eligible promotions
          const autoApplied = data.promotions
            .filter((p: any) => p.autoApplied)
            .map((p: any) => p.id);
          setAppliedPromotions(autoApplied);
        } else {
          // No promotions available
          setPromotions([]);
        }
      } else {
        // API not available or no promotions
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'early_bird': return <Clock className="h-4 w-4" />;
      case 'last_minute': return <Zap className="h-4 w-4" />;
      case 'loyalty': return <Star className="h-4 w-4" />;
      case 'bulk_booking': return <Users className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'flash_sale': return <Timer className="h-4 w-4" />;
      case 'first_time': return <Heart className="h-4 w-4" />;
      case 'weekend_special': return <Sparkles className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string, isApplied: boolean = false) => {
    const baseColors = {
      'critical': 'bg-red-100 text-red-800 border-red-300',
      'high': 'bg-orange-100 text-orange-800 border-orange-300',
      'medium': 'bg-blue-100 text-blue-800 border-blue-300',
      'low': 'bg-green-100 text-green-800 border-green-300'
    };

    if (isApplied) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }

    return baseColors[urgency as keyof typeof baseColors] || baseColors.low;
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    const { discount } = promotion;
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% OFF`;
      case 'fixed':
        return `₹${discount.value.toLocaleString()} OFF`;
      case 'upgrade':
        return 'FREE UPGRADE';
      case 'perk':
        return 'FREE PERK';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const togglePromotion = (promotionId: string) => {
    setAppliedPromotions(prev => {
      if (prev.includes(promotionId)) {
        return prev.filter(id => id !== promotionId);
      } else {
        return [...prev, promotionId];
      }
    });
  };

  const formatTimeLeft = (hours: number) => {
    if (hours <= 1) return `${Math.round(hours * 60)}m left`;
    if (hours < 24) return `${Math.round(hours)}h left`;
    return `${Math.round(hours / 24)}d left`;
  };

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Active Promotions Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Active Offers
          </h3>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {promotions.length} available
          </Badge>
        </div>

        {/* Promotion Badges */}
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence>
            {promotions.map((promotion, index) => {
              const isApplied = appliedPromotions.includes(promotion.id);
              
              return (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative overflow-hidden ${
                    promotion.urgency === 'critical' ? 'animate-pulse' : ''
                  }`}
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                          getUrgencyColor(promotion.urgency, isApplied)
                        } ${isApplied ? 'ring-2 ring-emerald-400' : ''}`}
                      >
                        {/* Promotion Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-white/50`}>
                              {getPromotionIcon(promotion.type)}
                            </div>
                            <div>
                              <h4 className="font-bold">{promotion.name}</h4>
                              <p className="text-sm opacity-90">{promotion.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="outline" 
                              className={`font-bold ${
                                promotion.discount.type === 'percentage' || promotion.discount.type === 'fixed'
                                  ? 'bg-white text-green-700 border-green-300'
                                  : 'bg-white text-purple-700 border-purple-300'
                              }`}
                            >
                              {getDiscountDisplay(promotion)}
                            </Badge>
                            {isApplied && (
                              <div className="mt-1">
                                <CheckCircle className="h-4 w-4 text-emerald-600 mx-auto" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Time-sensitive indicator */}
                        {promotion.timeLeft && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">
                              {formatTimeLeft(promotion.timeLeft)}
                            </span>
                          </div>
                        )}

                        {/* Auto-applied indicator */}
                        {promotion.autoApplied && isApplied && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4" />
                            <span className="font-medium">Automatically applied</span>
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-96">
                      <Card className="border-0 shadow-none">
                        <CardContent className="p-0">
                          <div className="space-y-4">
                            {/* Detailed promotion info */}
                            <div>
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                {getPromotionIcon(promotion.type)}
                                {promotion.name}
                              </h4>
                              <p className="text-muted-foreground mt-1">{promotion.description}</p>
                            </div>

                            {/* Discount details */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-medium mb-2">Discount Details</h5>
                              <p className="text-sm">{promotion.discount.description}</p>
                              <div className="mt-2">
                                <Badge className="bg-green-600 text-white text-lg">
                                  {getDiscountDisplay(promotion)}
                                </Badge>
                              </div>
                            </div>

                            {/* Conditions */}
                            {Object.keys(promotion.conditions).length > 0 && (
                              <div>
                                <h5 className="font-medium mb-2 flex items-center gap-2">
                                  <Info className="h-4 w-4" />
                                  Conditions
                                </h5>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {promotion.conditions.minNights && (
                                    <li>• Minimum {promotion.conditions.minNights} night stay</li>
                                  )}
                                  {promotion.conditions.minGuests && (
                                    <li>• Minimum {promotion.conditions.minGuests} guests</li>
                                  )}
                                  {promotion.conditions.advanceBookingDays && (
                                    <li>• Book at least {promotion.conditions.advanceBookingDays} days in advance</li>
                                  )}
                                  {promotion.conditions.applicableRooms && (
                                    <li>• Valid for {promotion.conditions.applicableRooms[0]}+ rooms</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Time urgency */}
                            {promotion.timeLeft && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-800">
                                  <Timer className="h-4 w-4" />
                                  <span className="font-medium">
                                    Limited Time: {formatTimeLeft(promotion.timeLeft)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Action button */}
                            {!promotion.autoApplied && (
                              <Button
                                onClick={() => togglePromotion(promotion.id)}
                                className={`w-full ${
                                  isApplied 
                                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } text-white`}
                              >
                                {isApplied ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Applied
                                  </>
                                ) : (
                                  <>
                                    <Target className="h-4 w-4 mr-2" />
                                    Apply Offer
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Terms */}
                            {promotion.termsAndConditions && (
                              <div className="text-xs text-muted-foreground border-t pt-3">
                                <strong>Terms & Conditions:</strong> {promotion.termsAndConditions}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </PopoverContent>
                  </Popover>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary of applied promotions */}
        {appliedPromotions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-800">
                {appliedPromotions.length} offer{appliedPromotions.length > 1 ? 's' : ''} applied
              </span>
            </div>
            <p className="text-sm text-emerald-700">
              Your discounts will be reflected in the final price calculation.
            </p>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
} 