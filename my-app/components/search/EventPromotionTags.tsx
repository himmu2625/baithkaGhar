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
  timeLeft?: number; // hours
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

      // Mock data for demonstration - replace with actual API calls
      const mockEvents: Event[] = [
        {
          id: 'diwali-2024',
          name: 'Diwali Festival',
          type: 'festival',
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-05'),
          impact: 'peak',
          priceMultiplier: 1.5,
          description: 'Festival of Lights celebration with special events',
          isActive: checkIn ? isDateInRange(checkIn, new Date('2024-11-01'), new Date('2024-11-05')) : false
        },
        {
          id: 'new-year-2024',
          name: 'New Year Celebration',
          type: 'holiday',
          startDate: new Date('2024-12-30'),
          endDate: new Date('2025-01-02'),
          impact: 'peak',
          priceMultiplier: 1.8,
          description: 'Ring in the new year with special pricing',
          isActive: checkIn ? isDateInRange(checkIn, new Date('2024-12-30'), new Date('2025-01-02')) : false
        },
        {
          id: 'summer-season',
          name: 'Summer Peak',
          type: 'season',
          startDate: new Date('2024-04-15'),
          endDate: new Date('2024-06-15'),
          impact: 'high',
          priceMultiplier: 1.3,
          description: 'Peak summer season pricing',
          isActive: checkIn ? isDateInRange(checkIn, new Date('2024-04-15'), new Date('2024-06-15')) : false
        },
        {
          id: 'local-music-fest',
          name: 'Music Festival',
          type: 'concert',
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-22'),
          impact: 'medium',
          priceMultiplier: 1.25,
          description: 'Annual music festival nearby',
          location: '2km away',
          isActive: checkIn ? isDateInRange(checkIn, new Date('2024-12-20'), new Date('2024-12-22')) : false
        }
      ];

      const mockPromotions: Promotion[] = [
        {
          id: 'early-bird-special',
          name: 'Early Bird',
          type: 'early_bird',
          discount: { type: 'percentage', value: 15 },
          urgency: 'low',
          conditions: 'Book 14+ days ahead',
          isActive: checkIn ? (checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24) >= 14 : false,
          autoApply: true
        },
        {
          id: 'flash-sale-weekend',
          name: 'Flash Sale',
          type: 'flash_sale',
          discount: { type: 'percentage', value: 25 },
          urgency: 'critical',
          timeLeft: 6,
          conditions: 'Limited time offer',
          isActive: Math.random() > 0.7, // 30% chance of flash sale
          autoApply: false
        },
        {
          id: 'last-minute-deal',
          name: 'Last Minute',
          type: 'last_minute',
          discount: { type: 'percentage', value: 20 },
          urgency: 'high',
          timeLeft: 12,
          conditions: 'Book within 48 hours',
          isActive: checkIn ? (checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 2 : false,
          autoApply: true
        },
        {
          id: 'weekend-special',
          name: 'Weekend Special',
          type: 'weekend',
          discount: { type: 'fixed', value: 1000 },
          urgency: 'medium',
          conditions: 'Weekend stays only',
          isActive: checkIn ? (checkIn.getDay() === 0 || checkIn.getDay() === 6) : false,
          autoApply: true
        },
        {
          id: 'bulk-booking',
          name: 'Multi-Room',
          type: 'bulk',
          discount: { type: 'percentage', value: 10 },
          urgency: 'low',
          conditions: '3+ rooms',
          isActive: rooms >= 3,
          autoApply: true
        }
      ];

      setEvents(mockEvents.filter(event => event.isActive));
      setPromotions(mockPromotions.filter(promo => promo.isActive));

    } catch (error) {
      console.error('Error fetching event/promotion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
    return date >= start && date <= end;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'festival': return <Sparkles className="h-3 w-3" />;
      case 'holiday': return <Calendar className="h-3 w-3" />;
      case 'concert': return <Music className="h-3 w-3" />;
      case 'sports': return <Gamepad2 className="h-3 w-3" />;
      case 'conference': return <Users className="h-3 w-3" />;
      case 'season': return <Clock className="h-3 w-3" />;
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
      case 'loyalty': return <Star className="h-3 w-3" />;
      case 'first_time': return <Heart className="h-3 w-3" />;
      case 'bulk': return <Users className="h-3 w-3" />;
      case 'seasonal': return <Calendar className="h-3 w-3" />;
      case 'weekend': return <Sparkles className="h-3 w-3" />;
      default: return <Gift className="h-3 w-3" />;
    }
  };

  const getEventColor = (impact: string) => {
    switch (impact) {
      case 'peak': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPromotionColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-green-100 text-green-800 border-green-300';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getDiscountText = (promotion: Promotion) => {
    const { discount } = promotion;
    switch (discount.type) {
      case 'percentage': return `${discount.value}% OFF`;
      case 'fixed': return `₹${discount.value} OFF`;
      case 'upgrade': return 'FREE UPGRADE';
      case 'perk': return 'FREE PERK';
      default: return 'OFFER';
    }
  };

  const formatTimeLeft = (hours: number) => {
    if (hours <= 1) return `${Math.round(hours * 60)}m left`;
    if (hours < 24) return `${Math.round(hours)}h left`;
    return `${Math.round(hours / 24)}d left`;
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
                      <span className="ml-1">Event Pricing</span>
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