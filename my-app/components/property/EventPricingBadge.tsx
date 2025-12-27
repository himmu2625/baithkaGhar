"use client"

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Info, Star, TrendingUp } from "lucide-react";
import { getEventBadgeInfo } from '@/lib/utils/event-pricing-helper';

interface Event {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  impact: 'low' | 'medium' | 'high';
  suggestedPriceMultiplier: number;
  description?: string;
}

interface EventPricingBadgeProps {
  propertyId: string;
  city: string;
  region: string;
  checkInDate?: string;
  checkOutDate?: string;
  className?: string;
}

export function EventPricingBadge({ 
  propertyId, 
  city, 
  region, 
  checkInDate, 
  checkOutDate,
  className = ""
}: EventPricingBadgeProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);

  useEffect(() => {
    if (checkInDate && checkOutDate && city && region) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [checkInDate, checkOutDate, city, region]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        city,
        region,
        ...(checkInDate && { startDate: checkInDate }),
        ...(checkOutDate && { endDate: checkOutDate })
      });
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success && data.events.length > 0) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if no dates selected or loading
  if (loading || !checkInDate || !checkOutDate) {
    return null;
  }

  // Don't show if no events found
  if (events.length === 0) {
    return null;
  }

  // Get the highest impact event for the main badge
  const highestImpactEvent = events.reduce((prev, current) => {
    const impactOrder = { low: 1, medium: 2, high: 3 };
    return impactOrder[current.impact] > impactOrder[prev.impact] ? current : prev;
  });

  const badgeInfo = getEventBadgeInfo(highestImpactEvent);

  return (
    <div className={className}>
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`cursor-pointer hover:opacity-80 transition-opacity ${badgeInfo.color}`}
          >
            <Star className="h-3 w-3 mr-1" />
            Event Pricing Active
          </Badge>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Events During Your Stay
            </DialogTitle>
            <DialogDescription>
              Special events and holidays during your selected dates may affect pricing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {events.map(event => {
              const eventBadge = getEventBadgeInfo(event);
              return (
                <Card key={event._id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{eventBadge.icon}</span>
                        <div>
                          <CardTitle className="text-base">{event.name}</CardTitle>
                          <CardDescription>
                            {format(new Date(event.startDate), 'MMM dd')} - {format(new Date(event.endDate), 'MMM dd, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={eventBadge.color}>
                          {event.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={event.impact === 'high' ? 'destructive' : event.impact === 'medium' ? 'default' : 'secondary'}>
                          {event.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {event.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
            
            {/* Pricing Impact Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Pricing Impact</h4>
                    <p className="text-sm text-blue-700">
                      During special events and holidays, accommodation prices may be higher due to increased demand. 
                      This helps ensure availability and accounts for the enhanced experience during these special times.
                    </p>
                    {events.length > 1 && (
                      <p className="text-sm text-blue-700">
                        <strong>{events.length} events</strong> overlap with your selected dates.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EventPricingBadge; 