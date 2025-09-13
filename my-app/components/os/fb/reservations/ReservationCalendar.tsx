'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  User,
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
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-rose-100/80 via-pink-100/80 to-red-100/80 border-b border-rose-200/50 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <CardTitle className="text-2xl flex items-center space-x-3 text-rose-900">
            <div className="p-3 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl shadow-lg">
              <CalendarIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <span className="font-bold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <div className="text-sm font-normal text-rose-700 mt-1">Monthly reservation overview</div>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              className="border-rose-200/70 bg-white/70 hover:bg-rose-50 hover:border-rose-300 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 text-rose-600" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentMonth(new Date())}
              className="border-rose-200/70 bg-white/70 hover:bg-rose-50 hover:border-rose-300 backdrop-blur-sm font-semibold text-rose-700"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              className="border-rose-200/70 bg-white/70 hover:bg-rose-50 hover:border-rose-300 backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4 text-rose-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="p-3 text-center bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-lg shadow-sm">
              <div className="text-sm font-bold text-rose-800">{day.slice(0, 3)}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden min-h-32 p-3 border-0 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl ${
                day?.isSelected 
                  ? 'bg-gradient-to-br from-blue-100 to-indigo-200 shadow-lg border-2 border-blue-300' 
                  : day?.isToday 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-200 shadow-lg border-2 border-green-300' 
                  : 'bg-gradient-to-br from-white to-rose-50/50 hover:from-rose-50 hover:to-pink-50'
              }`}
              onClick={() => day && onDateChange(day.date)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {day && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-lg font-bold ${
                      day.isToday 
                        ? 'text-green-700' 
                        : day.isSelected 
                        ? 'text-blue-700' 
                        : 'text-rose-900'
                    }`}>
                      {day.day}
                    </span>
                    {day.reservations.length > 0 && (
                      <Badge className={`border-0 shadow-sm font-bold text-xs ${
                        day.reservations.length > 5 
                          ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800' 
                          : day.reservations.length > 2 
                          ? 'bg-gradient-to-r from-orange-200 to-yellow-200 text-orange-800'
                          : 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800'
                      }`}>
                        {day.reservations.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {day.reservations.slice(0, 3).map((reservation) => (
                      <TooltipProvider key={reservation.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`group/res relative text-xs p-2 rounded-lg text-center cursor-pointer hover:scale-105 transition-all duration-200 border-0 shadow-sm ${
                                reservation.status === 'confirmed' 
                                  ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 hover:from-green-300 hover:to-emerald-300' 
                                  : reservation.status === 'pending' 
                                  ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 hover:from-yellow-300 hover:to-orange-300'
                                  : reservation.status === 'seated' 
                                  ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 hover:from-blue-300 hover:to-indigo-300'
                                  : reservation.status === 'completed' 
                                  ? 'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 hover:from-purple-300 hover:to-pink-300'
                                  : 'bg-gradient-to-r from-gray-200 to-slate-200 text-gray-800 hover:from-gray-300 hover:to-slate-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReservationSelect(reservation);
                              }}
                            >
                              <div className="flex items-center justify-center space-x-1">
                                <Clock className="w-2 h-2" />
                                <span className="font-bold">{reservation.reservationTime}</span>
                              </div>
                              <div className="font-semibold truncate mt-1">{reservation.customerName.split(' ')[0]}</div>
                              <div className="flex items-center justify-center space-x-1 mt-1">
                                <Users className="w-2 h-2" />
                                <span>{reservation.partySize}</span>
                                {reservation.isVip && (
                                  <div className="p-0.5 bg-yellow-100 rounded-full">
                                    <Star className="w-2 h-2 text-yellow-600 fill-current" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-4">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full">
                                  <User className="w-4 h-4 text-rose-600" />
                                </div>
                                <div>
                                  <div className="font-bold text-rose-900">{reservation.customerName}</div>
                                  {reservation.isVip && <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 text-xs">VIP Guest</Badge>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>{reservation.reservationTime}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Users className="w-3 h-3 text-green-600" />
                                  <span>{reservation.partySize} people</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(reservation.status)}
                                <span className="text-sm">Status: <span className="font-semibold capitalize">{reservation.status}</span></span>
                              </div>
                              {reservation.specialRequests && (
                                <div className="text-sm bg-blue-50/80 rounded-lg p-2">
                                  <span className="font-semibold text-blue-800">Special Request:</span>
                                  <div className="text-blue-700">{reservation.specialRequests}</div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {day.reservations.length > 3 && (
                      <div className="text-xs text-rose-600 text-center font-semibold bg-rose-100/80 rounded-lg p-2 shadow-sm">
                        +{day.reservations.length - 3} more reservations
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderWeekView = () => (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <CardTitle className="text-2xl flex items-center space-x-3 text-blue-900">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="font-bold">Week of {selectedDate.toLocaleDateString()}</span>
              <div className="text-sm font-normal text-blue-700 mt-1">Weekly reservation schedule</div>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('prev')}
              className="border-blue-200/70 bg-white/70 hover:bg-blue-50 hover:border-blue-300 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 text-blue-600" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDateChange(new Date())}
              className="border-blue-200/70 bg-white/70 hover:bg-blue-50 hover:border-blue-300 backdrop-blur-sm font-semibold text-blue-700"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('next')}
              className="border-blue-200/70 bg-white/70 hover:bg-blue-50 hover:border-blue-300 backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden p-6 border-0 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
                day.isSelected 
                  ? 'bg-gradient-to-br from-indigo-100 to-purple-200 shadow-xl border-2 border-indigo-300' 
                  : day.isToday 
                  ? 'bg-gradient-to-br from-green-100 to-emerald-200 shadow-xl border-2 border-green-300' 
                  : 'bg-gradient-to-br from-white to-blue-50/50 hover:from-blue-50 hover:to-indigo-50'
              }`}
              onClick={() => onDateChange(day.date)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative">
                <div className="text-center mb-4">
                  <div className="text-sm font-bold text-blue-600 mb-1">
                    {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className={`text-2xl font-bold ${
                    day.isToday 
                      ? 'text-green-700' 
                      : day.isSelected 
                      ? 'text-indigo-700' 
                      : 'text-blue-900'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  {day.reservations.length > 0 && (
                    <Badge className={`mt-2 border-0 shadow-sm font-bold text-xs ${
                      day.reservations.length > 6 
                        ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800' 
                        : day.reservations.length > 3 
                        ? 'bg-gradient-to-r from-orange-200 to-yellow-200 text-orange-800'
                        : 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800'
                    }`}>
                      {day.reservations.length} bookings
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {day.reservations.slice(0, 5).map((reservation) => (
                    <TooltipProvider key={reservation.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`group/res relative text-xs p-3 rounded-xl cursor-pointer hover:scale-105 transition-all duration-200 border-0 shadow-md ${
                              reservation.status === 'confirmed' 
                                ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 hover:from-green-300 hover:to-emerald-300' 
                                : reservation.status === 'pending' 
                                ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 hover:from-yellow-300 hover:to-orange-300'
                                : reservation.status === 'seated' 
                                ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 hover:from-blue-300 hover:to-indigo-300'
                                : reservation.status === 'completed' 
                                ? 'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 hover:from-purple-300 hover:to-pink-300'
                                : 'bg-gradient-to-r from-gray-200 to-slate-200 text-gray-800 hover:from-gray-300 hover:to-slate-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReservationSelect(reservation);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-bold">{reservation.reservationTime}</span>
                              </div>
                              {reservation.isVip && (
                                <div className="p-1 bg-yellow-100 rounded-full">
                                  <Star className="w-3 h-3 text-yellow-600 fill-current" />
                                </div>
                              )}
                            </div>
                            <div className="font-bold text-sm mb-2">{reservation.customerName}</div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Users className="w-3 h-3" />
                                <span className="font-semibold">{reservation.partySize} guests</span>
                              </div>
                              {reservation.tableName && (
                                <Badge className="bg-white/50 text-gray-700 border-0 text-xs">
                                  {reservation.tableName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-bold text-blue-900">{reservation.customerName}</div>
                                {reservation.isVip && <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 text-xs">VIP Guest</Badge>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>{reservation.reservationTime}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="w-3 h-3 text-green-600" />
                                <span>{reservation.partySize} people</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(reservation.status)}
                              <span className="text-sm">Status: <span className="font-semibold capitalize">{reservation.status}</span></span>
                            </div>
                            {reservation.tableName && (
                              <div className="text-sm bg-indigo-50/80 rounded-lg p-2">
                                <span className="font-semibold text-indigo-800">Table:</span>
                                <span className="text-indigo-700 ml-2">{reservation.tableName}</span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {day.reservations.length > 5 && (
                    <div className="text-xs text-blue-600 text-center font-semibold bg-blue-100/80 rounded-lg p-2 shadow-sm">
                      +{day.reservations.length - 5} more reservations
                    </div>
                  )}
                  {day.reservations.length === 0 && (
                    <div className="text-center py-4 text-blue-500 text-sm">
                      No reservations
                    </div>
                  )}
                </div>
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
    <div className="space-y-8">
      {/* Enhanced View Toggle */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg shadow-md">
                <CalendarIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-900">Calendar View Options</h3>
                <p className="text-rose-600 text-sm">Choose your preferred reservation view</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/70 p-1 rounded-xl shadow-md backdrop-blur-sm">
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
                className={`transition-all duration-300 ${
                  viewType === 'month' 
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:from-rose-600 hover:to-pink-600' 
                    : 'border-rose-200/70 bg-white/70 hover:bg-rose-50 hover:border-rose-300 text-rose-700'
                }`}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Month
              </Button>
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
                className={`transition-all duration-300 ${
                  viewType === 'week' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:from-blue-600 hover:to-indigo-600' 
                    : 'border-blue-200/70 bg-white/70 hover:bg-blue-50 hover:border-blue-300 text-blue-700'
                }`}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Week
              </Button>
              <Button
                variant={viewType === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('day')}
                className={`transition-all duration-300 ${
                  viewType === 'day' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600' 
                    : 'border-green-200/70 bg-white/70 hover:bg-green-50 hover:border-green-300 text-green-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Day
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      {viewType === 'month' && renderMonthView()}
      {viewType === 'week' && renderWeekView()}
      {viewType === 'day' && renderDayView()}
    </div>
  );
}