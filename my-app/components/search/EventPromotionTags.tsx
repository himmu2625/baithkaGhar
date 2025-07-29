"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Calendar,
  Gift,
  Sparkles,
  Zap,
  Star,
  Clock,
  MapPin,
  Users,
  Percent,
  Crown,
  Heart,
  Music,
  Camera,
  Utensils,
  Gamepad2,
  Flame,
  Target,
  Timer
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  type: 'festival' | 'holiday' | 'concert' | 'sports' | 'conference' | 'season' | 'local' | 'cultural';
  startDate: Date;
  endDate: Date;
  impact: 'low' | 'medium' | 'high' | 'peak';
  priceMultiplier: number;
  description: string;
  location?: string;
  isActive: boolean;
}

interface Promotion {
  id: string;
  name: string;
  type: 'early_bird' | 'last_minute' | 'flash_sale' | 'loyalty' | 'first_time' | 'bulk' | 'seasonal' | 'weekend';
  discount: {
    type: 'percentage' | 'fixed' | 'upgrade' | 'perk';
    value: number;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeLeft?: number;
  conditions?: string;
  isActive: boolean;
  autoApply: boolean;
}

interface EventPromotionTagsProps {
  propertyId: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  rooms?: number;
  className?: string;
  maxTags?: number;
}

export default function EventPromotionTags({
  propertyId,
  checkIn,
  checkOut,
  guests = 2,
  rooms = 1,
  className = "",
  maxTags = 3
}: EventPromotionTagsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventPromotionData();
  }, [propertyId, checkIn, checkOut, guests, rooms]);

  const fetchEventPromotionData = async () => {
    try {
      setLoading(true);
      
      // For now, return empty arrays - no mock data
      setEvents([]);
      setPromotions([]);
    } catch (error) {
      console.error('Error fetching event/promotion data:', error);
      setEvents([]);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'festival': return <Gift className="h-3 w-3" />;
      case 'holiday': return <Calendar className="h-3 w-3" />;
      case 'concert': return <Music className="h-3 w-3" />;
      case 'sports': return <Target className="h-3 w-3" />;
      case 'conference': return <Users className="h-3 w-3" />;
      case 'season': return <Sparkles className="h-3 w-3" />;
      case 'local': return <MapPin className="h-3 w-3" />;
      case 'cultural': return <Camera className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'early_bird': return <Clock className="h-3 w-3" />;
      case 'last_minute': return <Zap className="h-3 w-3" />;
      case 'flash_sale': return <Flame className="h-3 w-3" />;
      case 'loyalty': return <Crown className="h-3 w-3" />;
      case 'first_time': return <Heart className="h-3 w-3" />;
      case 'bulk': return <Users className="h-3 w-3" />;
      case 'seasonal': return <Calendar className="h-3 w-3" />;
      case 'weekend': return <Gamepad2 className="h-3 w-3" />;
      default: return <Gift className="h-3 w-3" />;
    }
  };

  const getEventColor = (impact: string) => {
    switch (impact) {
      case 'peak': return 'bg-red-50 text-red-700 border-red-300';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const getPromotionColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-300';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-50 text-green-700 border-green-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  const getDiscountText = (promotion: Promotion) => {
    switch (promotion.discount.type) {
      case 'percentage':
        return `${promotion.discount.value}% OFF`;
      case 'fixed':
        return `₹${promotion.discount.value} OFF`;
      case 'upgrade':
        return 'Free Upgrade';
      case 'perk':
        return 'Free Perk';
      default:
        return 'Special Offer';
    }
  };

  const formatTimeLeft = (hours: number) => {
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  if (loading) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const allTags = [
    ...events.map(event => ({ type: 'event' as const, data: event })),
    ...promotions.map(promo => ({ type: 'promotion' as const, data: promo }))
  ].slice(0, maxTags);

  if (allTags.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1 ${className}`}>
        <AnimatePresence>
          {allTags.map((tag, index) => (
            <motion.div
              key={tag.data.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ delay: index * 0.1 }}
            >
              {tag.type === 'event' ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getEventColor(tag.data.impact)} hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      {getEventIcon(tag.data.type)}
                      <span className="ml-1">Event</span>
                      <span className="ml-1 font-bold">+{Math.round((tag.data.priceMultiplier - 1) * 100)}%</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <div className="font-medium mb-1">{tag.data.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{tag.data.description}</div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium">Duration:</span> {tag.data.startDate.toLocaleDateString()} - {tag.data.endDate.toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Price Impact:</span> +{Math.round((tag.data.priceMultiplier - 1) * 100)}%
                        </div>
                        {tag.data.location && (
                          <div>
                            <span className="font-medium">Location:</span> {tag.data.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPromotionColor(tag.data.urgency)} hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      {getPromotionIcon(tag.data.type)}
                      <span className="ml-1">{getDiscountText(tag.data)}</span>
                      {tag.data.timeLeft && (
                        <span className="ml-1 text-xs opacity-80">
                          {formatTimeLeft(tag.data.timeLeft)}
                        </span>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <div className="font-medium mb-1">{tag.data.name}</div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium">Discount:</span> {getDiscountText(tag.data)}
                        </div>
                        {tag.data.conditions && (
                          <div>
                            <span className="font-medium">Conditions:</span> {tag.data.conditions}
                          </div>
                        )}
                        {tag.data.timeLeft && (
                          <div className="text-orange-600 font-medium">
                            <Timer className="h-3 w-3 inline mr-1" />
                            Expires in {formatTimeLeft(tag.data.timeLeft)}
                          </div>
                        )}
                        {tag.data.autoApply && (
                          <div className="text-green-600 text-xs">
                            <Target className="h-3 w-3 inline mr-1" />
                            Automatically applied
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* "More" indicator if there are additional tags */}
        {(events.length + promotions.length) > maxTags && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                +{(events.length + promotions.length) - maxTags} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div>{events.length} events affecting pricing</div>
                <div>{promotions.length} special offers available</div>
                <div className="text-xs text-muted-foreground mt-1">
                  View property details for all offers
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 