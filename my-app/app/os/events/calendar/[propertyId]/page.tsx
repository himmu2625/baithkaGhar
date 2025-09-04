'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Clock, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  venue: string;
  startTime: string;
  endTime: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  type: string;
}

export default function EventCalendarPage({ params }: { params: { propertyId: string } }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const events: Event[] = [
    {
      id: '1',
      title: 'Wedding Reception',
      venue: 'Grand Ballroom',
      startTime: '18:00',
      endTime: '23:00',
      guests: 150,
      status: 'confirmed',
      type: 'Wedding'
    },
    {
      id: '2',
      title: 'Corporate Meeting',
      venue: 'Conference Room A',
      startTime: '09:00',
      endTime: '17:00',
      guests: 50,
      status: 'pending',
      type: 'Corporate'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Calendar</h1>
          <p className="text-muted-foreground">Manage and view your event schedule</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === 'month' ? 'default' : 'outline'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'outline'}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button 
            variant={view === 'day' ? 'default' : 'outline'}
            onClick={() => setView('day')}
          >
            Day
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium text-sm p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - 6);
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                  const hasEvents = i === 15 || i === 20;
                  
                  return (
                    <div
                      key={i}
                      className={`
                        p-2 h-20 border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                        ${hasEvents ? 'border-primary' : 'border-border'}
                        hover:bg-muted
                      `}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {date.getDate()}
                      </div>
                      {hasEvents && (
                        <div className="mt-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {event.guests} guests
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-medium">12 events</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmed</span>
                <span className="font-medium text-green-600">8</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-medium text-yellow-600">3</span>
              </div>
              <div className="flex justify-between">
                <span>Cancelled</span>
                <span className="font-medium text-red-600">1</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}