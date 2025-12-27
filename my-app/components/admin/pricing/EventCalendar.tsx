"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Star, 
  TrendingUp,
  Zap,
  Info,
  CheckCircle
} from "lucide-react";
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

interface EventCalendarProps {
  propertyId: string;
  city: string;
  region: string;
  basePrice: number;
  onApplyEventPricing: (eventId: string, dateRange: { start: string; end: string }, suggestedPrice: number) => void;
}

export function EventCalendar({ propertyId, city, region, basePrice, onApplyEventPricing }: EventCalendarProps) {
  const { toast } = useToast();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'local_event',
    impact: 'medium',
    suggestedPriceMultiplier: 1.2,
    description: ''
  });

  // Fetch events for the current month
  useEffect(() => {
    fetchEvents();
  }, [currentMonth, city, region]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/events?city=${encodeURIComponent(city)}&region=${encodeURIComponent(region)}&startDate=${monthStart}&endDate=${monthEnd}`
      );
      
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load events for this month",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Handle applying event pricing
  const handleApplyEventPricing = (event: Event) => {
    const suggestedPrice = Math.round(basePrice * event.suggestedPriceMultiplier);
    onApplyEventPricing(event._id, {
      start: event.startDate,
      end: event.endDate
    }, suggestedPrice);
    
    toast({
      title: "Event Pricing Applied",
      description: `Applied ${event.name} pricing: ₹${suggestedPrice} (${Math.round((event.suggestedPriceMultiplier - 1) * 100)}% increase)`,
    });
  };

  // Handle adding new event
  const handleAddEvent = async () => {
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventFormData,
          city,
          region,
          country: 'India',
          tags: []
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Event Created",
          description: `${eventFormData.name} has been added to the calendar`,
        });
        setShowAddEventDialog(false);
        setEventFormData({
          name: '',
          startDate: '',
          endDate: '',
          type: 'local_event',
          impact: 'medium',
          suggestedPriceMultiplier: 1.2,
          description: ''
        });
        fetchEvents(); // Refresh events
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    }
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for proper calendar grid
  const startPadding = monthStart.getDay();
  const paddedDays = [
    ...Array.from({ length: startPadding }, (_, i) => 
      addDays(monthStart, -(startPadding - i))
    ),
    ...calendarDays
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Event Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Event Calendar - {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEventDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {city}, {region} • Base Price: ₹{basePrice.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {paddedDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border rounded-lg transition-colors ${
                  isCurrentMonth 
                    ? isCurrentDay 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Event badges */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => {
                    const badgeInfo = getEventBadgeInfo(event);
                    return (
                      <div
                        key={event._id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDialog(true);
                        }}
                      >
                        <Badge 
                          variant="secondary" 
                          className={`text-xs p-1 w-full justify-start ${badgeInfo.color}`}
                        >
                          <span className="mr-1">{badgeInfo.icon}</span>
                          <span className="truncate">{event.name}</span>
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {dayEvents.length > 2 && (
                    <Badge variant="outline" className="text-xs p-1 w-full justify-center">
                      +{dayEvents.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800">🏖️</Badge>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800">🎉</Badge>
            <span>Festival</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">📊</Badge>
            <span>Conference</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">⚽</Badge>
            <span>Sports</span>
          </div>
        </div>
      </CardContent>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventBadgeInfo(selectedEvent).icon}
              {selectedEvent?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <div className="space-y-2">
                  <p><strong>Type:</strong> {selectedEvent.type.replace('_', ' ')}</p>
                  <p><strong>Duration:</strong> {format(new Date(selectedEvent.startDate), 'MMM dd')} - {format(new Date(selectedEvent.endDate), 'MMM dd, yyyy')}</p>
                  <p><strong>Impact:</strong> <Badge variant={selectedEvent.impact === 'high' ? 'destructive' : selectedEvent.impact === 'medium' ? 'default' : 'secondary'}>{selectedEvent.impact}</Badge></p>
                  {selectedEvent.description && <p><strong>Description:</strong> {selectedEvent.description}</p>}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Pricing Suggestion
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Base Price</p>
                    <p className="font-medium">₹{basePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Suggested Event Price</p>
                    <p className="font-medium text-green-600">
                      ₹{Math.round(basePrice * selectedEvent.suggestedPriceMultiplier).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Price Increase</p>
                    <p className="font-medium text-blue-600">
                      +{Math.round((selectedEvent.suggestedPriceMultiplier - 1) * 100)}% 
                      (₹{Math.round(basePrice * (selectedEvent.suggestedPriceMultiplier - 1)).toLocaleString()} increase)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
            {selectedEvent && (
              <Button onClick={() => {
                handleApplyEventPricing(selectedEvent);
                setShowEventDialog(false);
              }}>
                <Zap className="h-4 w-4 mr-2" />
                Apply Event Pricing
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new local event or holiday that affects pricing in {city}, {region}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Diwali Festival"
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={eventFormData.type}
                  onValueChange={(value) => setEventFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="sports">Sports Event</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="local_event">Local Event</SelectItem>
                    <SelectItem value="religious">Religious Event</SelectItem>
                    <SelectItem value="cultural">Cultural Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={eventFormData.startDate}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={eventFormData.endDate}
                  onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Impact Level</Label>
                <Select
                  value={eventFormData.impact}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setEventFormData(prev => ({ ...prev, impact: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Impact</SelectItem>
                    <SelectItem value="medium">Medium Impact</SelectItem>
                    <SelectItem value="high">High Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5"
                  value={eventFormData.suggestedPriceMultiplier}
                  onChange={(e) => setEventFormData(prev => ({ 
                    ...prev, 
                    suggestedPriceMultiplier: parseFloat(e.target.value) || 1.2 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={eventFormData.description}
                onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this event..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddEvent}
              disabled={!eventFormData.name || !eventFormData.startDate || !eventFormData.endDate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 