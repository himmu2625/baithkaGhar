'use client';

import React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date and time',
  disabled = false,
  className,
  showTime = true,
  minDate,
  maxDate,
  required = false
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState('');

  React.useEffect(() => {
    if (value && showTime) {
      setTimeValue(format(value, 'HH:mm'));
    }
  }, [value, showTime]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    if (showTime && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(selectedDate);
        newDate.setHours(hours, minutes);
        onChange(newDate);
      } else {
        onChange(selectedDate);
      }
    } else {
      onChange(selectedDate);
    }

    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    if (value) {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(value);
        newDate.setHours(hours, minutes);
        onChange(newDate);
      }
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              showTime ? (
                format(value, 'PPP p')
              ) : (
                format(value, 'PPP')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
          {showTime && (
            <div className="p-3 border-t">
              <Label htmlFor="time" className="text-sm font-medium">
                Time
              </Label>
              <div className="flex items-center mt-2 gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={timeValue} onValueChange={handleTimeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="p-3 border-t">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
              size="sm"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  label,
  className,
  disabled = false
}: {
  startTime?: string;
  endTime?: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex items-center gap-2 mt-2">
        <Select value={startTime} onValueChange={onStartTimeChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Start time" />
          </SelectTrigger>
          <SelectContent>
            {generateTimeOptions().map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">to</span>
        <Select value={endTime} onValueChange={onEndTimeChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="End time" />
          </SelectTrigger>
          <SelectContent>
            {generateTimeOptions().map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}