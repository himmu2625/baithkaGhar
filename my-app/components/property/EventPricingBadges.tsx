"use client"

import React, { useState, useEffect } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Calendar,
  Sparkles,
  Gift,
  TrendingUp,
  Star,
  Zap,
  Crown,
  Heart,
  Music,
  MapPin,
  Clock,
  Users,
  Percent
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  type: 'festival' | 'holiday' | 'concert' | 'sports' | 'conference' | 'season' | 'local';
  startDate: Date;
  endDate: Date;
  impact: number; // percentage price impact
  description: string;
  location?: string;
  isSpecialOffer?: boolean;
  priceMultiplier: number;
  popularity: 'low' | 'medium' | 'high' | 'peak';
}

interface Promotion {
  id: string;
  name: string;
  type: 'early_bird' | 'last_minute' | 'loyalty' | 'bulk' | 'seasonal' | 'flash';
  startDate: Date;
  endDate: Date;
  discount: number; // percentage discount
  description: string;
  conditions?: string;
  urgency: 'low' | 'medium' | 'high';
  isActive: boolean;
}

interface EventPricingBadgesProps {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  className?: string;
}

export default function EventPricingBadges({
  propertyId,
  checkIn,
  checkOut,
  className = ""
}: EventPricingBadgesProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [propertyId, checkIn, checkOut]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockEvents: Event[] = [
        {
          id: '1',
          name: 'Diwali Festival',
          type: 'festival',
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-05'),
          impact: 45,
          description: 'Festival of Lights celebration with special events and decorations',
          priceMultiplier: 1.45,
          popularity: 'peak'
        },
        {
          id: '2',
          name: 'New Year Weekend',
          type: 'holiday',
          startDate: new Date('2024-12-30'),
          endDate: new Date('2025-01-02'),
          impact: 80,
          description: 'New Year celebration with premium pricing',
          priceMultiplier: 1.8,
          popularity: 'peak'
        },
        {
          id: '3',
          name: 'Summer Peak Season',
          type: 'season',
          startDate: new Date('2024-04-15'),
          endDate: new Date('2024-06-15'),
          impact: 25,
          description: 'Peak summer tourism season',
          priceMultiplier: 1.25,
          popularity: 'high'
        },
        {
          id: '4',
          name: 'Local Music Festival',
          type: 'concert',
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-22'),
          impact: 35,
          description: 'Annual music festival attracting visitors from across the region',
          location: '2km away',
          priceMultiplier: 1.35,
          popularity: 'high'
        }
      ];

      const mockPromotions: Promotion[] = [
        {
          id: '1',
          name: 'Early Bird Special',
          type: 'early_bird',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          discount: 15,
          description: 'Book 30 days in advance and save 15%',
          conditions: 'Valid for bookings made 30+ days in advance',
          urgency: 'low',
          isActive: true
        },
        {
          id: '2',
          name: 'Weekend Flash Sale',
          type: 'flash',
          startDate: new Date('2024-12-15'),
          endDate: new Date('2024-12-17'),
          discount: 25,
          description: 'Limited time weekend special offer',
          conditions: 'Valid for this weekend only',
          urgency: 'high',
          isActive: true
        },
        {
          id: '3',
          name: 'Loyalty Reward',
          type: 'loyalty',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          discount: 10,
          description: 'Special discount for returning guests',
          conditions: 'Available for repeat customers',
          urgency: 'low',
          isActive: true
        }
      ];

      // Filter events and promotions that overlap with the stay dates
      const relevantEvents = mockEvents.filter(event => 
        isWithinInterval(checkIn, { start: event.startDate, end: event.endDate }) ||
        isWithinInterval(checkOut, { start: event.startDate, end: event.endDate }) ||
        (checkIn <= event.startDate && checkOut >= event.endDate)
      );

      const relevantPromotions = mockPromotions.filter(promo => 
        promo.isActive &&
        (isWithinInterval(checkIn, { start: promo.startDate, end: promo.endDate }) ||
         isWithinInterval(checkOut, { start: promo.startDate, end: promo.endDate }) ||
         (checkIn <= promo.startDate && checkOut >= promo.endDate))
      );

      setEvents(relevantEvents);
      setPromotions(relevantPromotions);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'festival': return <Sparkles className="h-3 w-3" />;
      case 'holiday': return <Calendar className="h-3 w-3" />;
      case 'concert': return <Music className="h-3 w-3" />;
      case 'sports': return <Zap className="h-3 w-3" />;
      case 'conference': return <Users className="h-3 w-3" />;
      case 'season': return <TrendingUp className="h-3 w-3" />;
      case 'local': return <MapPin className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'early_bird': return <Clock className="h-3 w-3" />;
      case 'last_minute': return <Zap className="h-3 w-3" />;
      case 'loyalty': return <Star className="h-3 w-3" />;
      case 'bulk': return <Users className="h-3 w-3" />;
      case 'seasonal': return <Calendar className="h-3 w-3" />;
      case 'flash': return <Gift className="h-3 w-3" />;
      default: return <Gift className="h-3 w-3" />;
    }
  };

  const getEventColor = (impact: number, popularity: string) => {
    if (popularity === 'peak' || impact >= 50) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (popularity === 'high' || impact >= 30) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (popularity === 'medium' || impact >= 15) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPromotionColor = (urgency: string, discount: number) => {
    if (urgency === 'high' || discount >= 20) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (urgency === 'medium' || discount >= 10) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else {
      return 'bg-lime-100 text-lime-800 border-lime-200';
    }
  };

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (events.length === 0 && promotions.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {/* Event Badges */}
        {events.map((event) => (
          <Popover key={event.id}>
            <PopoverTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${getEventColor(event.impact, event.popularity)} cursor-pointer hover:shadow-md transition-shadow animate-pulse`}
              >
                {getEventIcon(event.type)}
                <span className="ml-1">Event Pricing Active</span>
                <span className="ml-1 font-bold">+{event.impact}%</span>
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{event.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {event.type.replace('_', ' ')} Event
                        </p>
                      </div>
                      <Badge className={getEventColor(event.impact, event.popularity)}>
                        {event.popularity} demand
                      </Badge>
                    </div>

                    <p className="text-sm">{event.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">
                          {format(event.startDate, 'MMM dd')} - {format(event.endDate, 'MMM dd')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price Impact:</span>
                        <p className="font-medium text-orange-600">+{event.impact}%</p>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Premium Pricing</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Due to high demand during {event.name}, prices are {event.impact}% higher than usual.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        ))}

        {/* Promotion Badges */}
        {promotions.map((promotion) => (
          <Popover key={promotion.id}>
            <PopoverTrigger asChild>
              <Badge 
                variant="outline" 
                className={`${getPromotionColor(promotion.urgency, promotion.discount)} cursor-pointer hover:shadow-md transition-shadow ${promotion.urgency === 'high' ? 'animate-bounce' : ''}`}
              >
                {getPromotionIcon(promotion.type)}
                <span className="ml-1">Special Offer</span>
                <span className="ml-1 font-bold">-{promotion.discount}%</span>
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{promotion.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {promotion.type.replace('_', ' ')} Offer
                        </p>
                      </div>
                      <Badge className={getPromotionColor(promotion.urgency, promotion.discount)}>
                        {promotion.urgency} urgency
                      </Badge>
                    </div>

                    <p className="text-sm">{promotion.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valid Until:</span>
                        <p className="font-medium">
                          {format(promotion.endDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Discount:</span>
                        <p className="font-medium text-green-600">{promotion.discount}% OFF</p>
                      </div>
                    </div>

                    {promotion.conditions && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Conditions:</span> {promotion.conditions}
                      </div>
                    )}

                    <div className={`p-3 rounded-lg ${
                      promotion.urgency === 'high' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-emerald-50 border border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">You're Saving</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Apply this {promotion.discount}% discount and save on your booking!
                        {promotion.urgency === 'high' && ' Limited time offer.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        ))}

        {/* Summary Badge for Multiple Events/Promotions */}
        {(events.length > 1 || promotions.length > 1) && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                <Crown className="h-3 w-3 mr-1" />
                {events.length + promotions.length} Active
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p>{events.length} events affecting pricing</p>
                <p>{promotions.length} special offers available</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
} 