'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface EventBookingFormProps {
  formData: {
    eventName: string;
    eventType: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    eventDate: Date | null;
    eventTime: string;
    guestCount: string;
  };
  updateFormData: (updates: any) => void;
  onNext: () => void;
}

const eventTypes = [
  'Wedding',
  'Birthday Party',
  'Anniversary',
  'Corporate Event',
  'Conference',
  'Workshop',
  'Product Launch',
  'Engagement',
  'Reception',
  'Cocktail Party',
  'Dinner Party',
  'Cultural Event',
  'Festival',
  'Other'
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
];

export function EventBookingForm({ formData, updateFormData, onNext }: EventBookingFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Client phone is required';
    } else if (!/^[0-9]{10}$/.test(formData.clientPhone.replace(/\s+/g, ''))) {
      newErrors.clientPhone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else if (formData.eventDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      newErrors.eventDate = 'Event date cannot be in the past';
    }

    if (!formData.eventTime) {
      newErrors.eventTime = 'Event time is required';
    }

    if (!formData.guestCount || parseInt(formData.guestCount) <= 0) {
      newErrors.guestCount = 'Guest count must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Basic Event Details</span>
        </CardTitle>
        <CardDescription>
          Enter the basic information about the event and client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Event Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="Enter event name"
                value={formData.eventName}
                onChange={(e) => updateFormData({ eventName: e.target.value })}
                className={errors.eventName ? 'border-red-500' : ''}
              />
              {errors.eventName && (
                <p className="text-sm text-red-500">{errors.eventName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select value={formData.eventType} onValueChange={(value) => updateFormData({ eventType: value })}>
                <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.eventDate ? 'border-red-500' : ''
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventDate ? format(formData.eventDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventDate || undefined}
                    onSelect={(date) => updateFormData({ eventDate: date })}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTime">Event Time *</Label>
              <Select value={formData.eventTime} onValueChange={(value) => updateFormData({ eventTime: value })}>
                <SelectTrigger className={errors.eventTime ? 'border-red-500' : ''}>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventTime && (
                <p className="text-sm text-red-500">{errors.eventTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">Expected Guests *</Label>
              <Input
                id="guestCount"
                type="number"
                placeholder="Number of guests"
                value={formData.guestCount}
                onChange={(e) => updateFormData({ guestCount: e.target.value })}
                min="1"
                className={errors.guestCount ? 'border-red-500' : ''}
              />
              {errors.guestCount && (
                <p className="text-sm text-red-500">{errors.guestCount}</p>
              )}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Client Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  value={formData.clientName}
                  onChange={(e) => updateFormData({ clientName: e.target.value })}
                  className={`pl-10 ${errors.clientName ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clientName && (
                <p className="text-sm text-red-500">{errors.clientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="Enter client email"
                  value={formData.clientEmail}
                  onChange={(e) => updateFormData({ clientEmail: e.target.value })}
                  className={`pl-10 ${errors.clientEmail ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clientEmail && (
                <p className="text-sm text-red-500">{errors.clientEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientPhone"
                  placeholder="Enter phone number"
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData({ clientPhone: e.target.value })}
                  className={`pl-10 ${errors.clientPhone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clientPhone && (
                <p className="text-sm text-red-500">{errors.clientPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {formData.eventName && formData.clientName && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Event:</strong> {formData.eventName}</p>
              <p><strong>Type:</strong> {formData.eventType}</p>
              <p><strong>Client:</strong> {formData.clientName}</p>
              <p><strong>Date:</strong> {formData.eventDate ? format(formData.eventDate, 'PPP') : 'Not selected'}</p>
              <p><strong>Time:</strong> {formData.eventTime || 'Not selected'}</p>
              <p><strong>Guests:</strong> {formData.guestCount || 'Not specified'}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button onClick={handleNext} className="px-8">
            Next: Select Venue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}