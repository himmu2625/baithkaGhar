'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Star,
  Phone,
  CheckCircle,
  AlertCircle,
  XCircle,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  tableId?: string;
  tableName?: string;
  section?: string;
  specialRequests?: string;
  occasion?: string;
  isVip: boolean;
  source: 'phone' | 'online' | 'walk_in' | 'app';
  depositRequired: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  remindersSent: number;
  lastReminderTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  confirmedAt?: string;
}

interface TimeSlot {
  time: string;
  availableTables: number;
  totalCapacity: number;
  reservations: Reservation[];
  isAvailable: boolean;
}

interface ReservationCalendarProps {
  propertyId: string;
  reservations: Reservation[];
  timeSlots: TimeSlot[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onReservationSelect: (reservation: Reservation) => void;
  onReservationStatusUpdate: (reservationId: string, status: string) => void;
}

export function ReservationCalendar({
  propertyId,
  reservations,
  timeSlots,
  selectedDate,
  onDateChange,
  onReservationSelect,
  onReservationStatusUpdate,
}: ReservationCalendarProps) {
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const dayReservations = reservations.filter(r => r.reservationDate === dateString);
      
      days.push({
        date,
        day,
        reservations: dayReservations,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate.toISOString().split('T')[0],
      });
    }
    
    return days;
  }, [currentMonth, reservations, selectedDate]);

  // Generate week view data
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayReservations = reservations.filter(r => r.reservationDate === dateString);
      
      days.push({
        date,
        reservations: dayReservations,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate.toISOString().split('T')[0],
      });
    }
    
    return days;
  }, [selectedDate, reservations]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'seated': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'seated': return <Users className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'no_show': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const renderMonthView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-1 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                day?.isSelected ? 'bg-blue-50 border-blue-300' : ''
              } ${day?.isToday ? 'bg-green-50 border-green-300' : ''}`}
              onClick={() => day && onDateChange(day.date)}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-green-600' : day.isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.day}
                    </span>
                    {day.reservations.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {day.reservations.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {day.reservations.slice(0, 2).map((reservation) => (
                      <TooltipProvider key={reservation.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`text-xs p-1 rounded text-center cursor-pointer hover:opacity-80 ${getStatusColor(reservation.status)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReservationSelect(reservation);
                              }}
                            >
                              {reservation.reservationTime} {reservation.customerName.split(' ')[0]}
                              {reservation.isVip && <Star className="w-2 h-2 inline ml-1" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-medium">{reservation.customerName}</div>
                              <div className="text-sm">
                                {reservation.reservationTime} • {reservation.partySize} people
                              </div>
                              <div className="text-sm">Status: {reservation.status}</div>
                              {reservation.specialRequests && (
                                <div className="text-sm">Special: {reservation.specialRequests}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {day.reservations.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.reservations.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderWeekView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            Week of {selectedDate.toLocaleDateString()}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                day.isSelected ? 'bg-blue-50 border-blue-300' : ''
              } ${day.isToday ? 'bg-green-50 border-green-300' : ''}`}
              onClick={() => onDateChange(day.date)}
            >
              <div className="text-center mb-3">
                <div className="text-sm font-medium text-gray-500">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${
                  day.isToday ? 'text-green-600' : day.isSelected ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.date.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {day.reservations.slice(0, 4).map((reservation) => (
                  <TooltipProvider key={reservation.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 ${getStatusColor(reservation.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReservationSelect(reservation);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{reservation.reservationTime}</span>
                            {reservation.isVip && <Star className="w-3 h-3" />}
                          </div>
                          <div className="font-medium">{reservation.customerName}</div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{reservation.partySize}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-medium">{reservation.customerName}</div>
                          <div className="text-sm">
                            {reservation.reservationTime} • {reservation.partySize} people
                          </div>
                          <div className="text-sm">Status: {reservation.status}</div>
                          {reservation.tableName && (
                            <div className="text-sm">Table: {reservation.tableName}</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {day.reservations.length > 4 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{day.reservations.length - 4} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderDayView = () => {
    const dayReservations = reservations.filter(r => r.reservationDate === selectedDate.toISOString().split('T')[0]);
    const sortedReservations = dayReservations.sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {dayReservations.length} reservations scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot.time} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="text-lg font-medium w-16">{slot.time}</div>
                  <div className="flex-1">
                    {slot.reservations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {slot.reservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className={`p-2 rounded-lg cursor-pointer hover:opacity-80 ${getStatusColor(reservation.status)}`}
                            onClick={() => onReservationSelect(reservation)}
                          >
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(reservation.status)}
                              <span className="font-medium">{reservation.customerName}</span>
                              <Badge variant="outline">{reservation.partySize}p</Badge>
                              {reservation.isVip && <Star className="w-3 h-3 text-yellow-500" />}
                            </div>
                            {reservation.tableName && (
                              <div className="text-xs text-gray-600 mt-1">
                                Table: {reservation.tableName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">No reservations</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {slot.availableTables} tables available
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Day Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dayReservations.length}</div>
                <div className="text-sm text-blue-600">Total Reservations</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {dayReservations.filter(r => r.status === 'confirmed').length}
                </div>
                <div className="text-sm text-green-600">Confirmed</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Status Breakdown</h4>
              {[
                { status: 'pending', label: 'Pending', count: dayReservations.filter(r => r.status === 'pending').length },
                { status: 'confirmed', label: 'Confirmed', count: dayReservations.filter(r => r.status === 'confirmed').length },
                { status: 'seated', label: 'Seated', count: dayReservations.filter(r => r.status === 'seated').length },
                { status: 'completed', label: 'Completed', count: dayReservations.filter(r => r.status === 'completed').length },
                { status: 'cancelled', label: 'Cancelled', count: dayReservations.filter(r => r.status === 'cancelled').length }
              ].map(({ status, label, count }) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span>{label}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Peak Hours</h4>
              <div className="text-sm text-gray-600">
                {timeSlots
                  .filter(slot => slot.reservations.length > 0)
                  .sort((a, b) => b.reservations.length - a.reservations.length)
                  .slice(0, 3)
                  .map(slot => (
                    <div key={slot.time} className="flex justify-between">
                      <span>{slot.time}</span>
                      <span>{slot.reservations.length} reservations</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">VIP Guests</h4>
              <div className="space-y-1">
                {dayReservations
                  .filter(r => r.isVip)
                  .map(reservation => (
                    <div key={reservation.id} className="flex items-center justify-between text-sm p-2 bg-yellow-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{reservation.customerName}</span>
                      </div>
                      <span>{reservation.reservationTime}</span>
                    </div>
                  ))
                }
                {dayReservations.filter(r => r.isVip).length === 0 && (
                  <div className="text-gray-500 text-sm">No VIP guests today</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={viewType === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('month')}
        >
          Month
        </Button>
        <Button
          variant={viewType === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('week')}
        >
          Week
        </Button>
        <Button
          variant={viewType === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('day')}
        >
          Day
        </Button>
      </div>

      {/* Calendar Views */}
      {viewType === 'month' && renderMonthView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'day' && renderDayView()}
    </div>
  );
}