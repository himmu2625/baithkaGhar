import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, isAfter, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomPrice {
  startDate: string;
  endDate: string;
  price: number;
  isActive: boolean;
}

interface SeasonalRule {
  id: string;
  name: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  multiplier: number;
  isActive: boolean;
}

interface PricingCalendarProps {
  basePrice: number;
  customPrices?: Array<{
    startDate: string;
    endDate: string;
    price: number;
    reason: string;
    isActive: boolean;
  }>;
  seasonalRules?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    multiplier: number;
    isActive: boolean;
  }>;
  mode?: 'single' | 'range' | 'multiple';
  selectedDates?: Date[];
  onDateSelect?: (dates: Date[]) => void;
  minDate?: Date;
  maxDate?: Date;
  showPrices?: boolean;
  className?: string;
  blockedDates?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    isActive: boolean;
  }>;
  variant?: 'pricing' | 'blocking';
}

// Helper function to format date key for comparison
const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Helper function to calculate price for a specific date
const calculatePriceForDate = (
  date: Date, 
  basePrice: number, 
  customPrices: CustomPrice[] = [], 
  seasonalRules: SeasonalRule[] = []
): { price: number; isCustom: boolean } => {
  const dateKey = formatDateKey(date);
  
  // Check for custom pricing first (direct pricing takes priority)
  const customPrice = customPrices.find(cp => 
    cp.isActive && cp.startDate <= dateKey && cp.endDate >= dateKey
  );

  if (customPrice) {
    return { price: customPrice.price, isCustom: true };
  }

  // Apply seasonal rules if no custom price
  let finalPrice = basePrice;
  seasonalRules.forEach(rule => {
    if (rule.isActive && 
        date >= rule.dateRange.start && 
        date <= rule.dateRange.end) {
      finalPrice *= rule.multiplier;
    }
  });

  return { price: Math.round(finalPrice), isCustom: false };
};

export const PricingCalendar: React.FC<PricingCalendarProps> = ({
  basePrice,
  customPrices = [],
  seasonalRules = [],
  mode = 'single',
  selectedDates = [],
  onDateSelect,
  minDate,
  maxDate,
  showPrices = true,
  className,
  blockedDates = [],
  variant = 'pricing'
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null);

  // Generate calendar dates
  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Normalize seasonalRules to have dateRange with Date objects
  const normalizedSeasonalRules: SeasonalRule[] = useMemo(() => {
    return (seasonalRules || []).map(rule => ({
      ...rule,
      dateRange: {
        start: typeof rule.startDate === 'string' ? new Date(rule.startDate) : rule.startDate,
        end: typeof rule.endDate === 'string' ? new Date(rule.endDate) : rule.endDate,
      }
    }));
  }, [seasonalRules]);

  // Handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  // Helper function to check if a date is blocked
  const isDateBlocked = (date: Date) => {
    if (!blockedDates || !Array.isArray(blockedDates) || blockedDates.length === 0) {
      return false;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log(`🔍 Checking if ${dateStr} is blocked. Available blocked dates:`, blockedDates);
    
    const result = blockedDates.some((blocked: any) => {
      if (!blocked || blocked.isActive === false) {
        console.log(`❌ Blocked date ${blocked?.startDate} to ${blocked?.endDate} is inactive, skipping`);
        return false;
      }
      
      try {
        // Convert to Date objects for comparison
        const startDate = new Date(blocked.startDate);
        const endDate = new Date(blocked.endDate);
        
        // Normalize all dates to midnight UTC for accurate comparison
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Check if date falls within the blocked range (inclusive)
        const isBlocked = normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
        
        console.log(`📅 Comparing ${dateStr}:`, {
          normalizedDate: format(normalizedDate, 'yyyy-MM-dd'),
          normalizedStart: format(normalizedStart, 'yyyy-MM-dd'),
          normalizedEnd: format(normalizedEnd, 'yyyy-MM-dd'),
          isBlocked
        });
        
        if (isBlocked) {
          console.log(`🚫 Date ${dateStr} is BLOCKED by range ${format(normalizedStart, 'yyyy-MM-dd')} to ${format(normalizedEnd, 'yyyy-MM-dd')}`);
        }
        
        return isBlocked;
      } catch (error) {
        console.error(`❌ Error processing blocked date:`, blocked, error);
        return false;
      }
    });
    
    console.log(`📊 Final result for ${dateStr}: ${result ? 'BLOCKED' : 'NOT BLOCKED'}`);
    return result;
  };

  // Helper function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date('2025-07-24'); // Fixed "today" date as per requirements
    // Disable if not in current month
    if (date.getMonth() !== currentMonth.getMonth()) return true;
    // Past dates are always disabled
    if (date < today) return true;
    // Min/max date constraints
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    // In pricing mode, blocked dates are disabled for selection
    if (variant === 'pricing' && isDateBlocked(date)) return true;
    return false;
  };

  // Updated date selection logic with double-click deselection
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date) || !onDateSelect) return;
    // Prevent selection of dates outside the current month
    if (date.getMonth() !== currentMonth.getMonth()) return;
    // In blocking mode, allow selection of any future date
    // In pricing mode, prevent selection of blocked dates
    if (variant === 'pricing' && isDateBlocked(date)) return;
    
    const currentTime = Date.now();
    const isDoubleClick = lastClickedDate && 
                         isSameDay(lastClickedDate, date) && 
                         (currentTime - lastClickTime) < 500; // 500ms double-click threshold
    
    // Update click tracking
    setLastClickTime(currentTime);
    setLastClickedDate(date);
    
    let newSelectedDates: Date[] = [];
    
    // Handle double-click deselection
    if (isDoubleClick) {
      const isSelected = selectedDates.some(selectedDate => isSameDay(selectedDate, date));
      if (isSelected) {
        if (mode === 'single') {
          newSelectedDates = [];
        } else if (mode === 'range') {
          // If double-clicking on one of the range dates, clear the entire range
          newSelectedDates = [];
        } else if (mode === 'multiple') {
          newSelectedDates = selectedDates.filter(selectedDate => !isSameDay(selectedDate, date));
        }
        onDateSelect(newSelectedDates);
        return;
      }
    }
    
    // Normal single-click logic
    if (mode === 'single') {
      newSelectedDates = [date];
    } else if (mode === 'range') {
      if (selectedDates.length === 0 || selectedDates.length === 2) {
        newSelectedDates = [date];
      } else if (selectedDates.length === 1) {
        const startDate = selectedDates[0];
        const endDate = date;
        
        if (startDate <= endDate) {
          newSelectedDates = [startDate, endDate];
        } else {
          newSelectedDates = [endDate, startDate];
        }
      }
    } else if (mode === 'multiple') {
      const isSelected = selectedDates.some(selectedDate => isSameDay(selectedDate, date));
      if (isSelected) {
        newSelectedDates = selectedDates.filter(selectedDate => !isSameDay(selectedDate, date));
      } else {
        newSelectedDates = [...selectedDates, date];
      }
    }
    
    onDateSelect(newSelectedDates);
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    if (mode === 'range' && selectedDates.length === 2) {
      const [start, end] = selectedDates;
      return (isSameDay(date, start) || isSameDay(date, end) || 
              (isAfter(date, start) && isBefore(date, end)));
    }
    return selectedDates.some(d => isSameDay(d, date));
  };

  // Updated cell styling function
  const getCellClasses = (date: Date) => {
    const baseClasses = "h-12 w-full relative flex flex-col items-center justify-center text-xs border border-gray-200 cursor-pointer transition-all hover:bg-gray-50";
    
    const isSelected = selectedDates.some(selectedDate => isSameDay(selectedDate, date));
    const isToday = isSameDay(date, new Date('2025-07-24'));
    const isDisabled = isDateDisabled(date);
    const isBlocked = isDateBlocked(date);
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    
    let classes = baseClasses;
    
    if (isDisabled) {
      classes += " bg-gray-100 text-gray-400 cursor-not-allowed";
    } else if (isBlocked) {
      // Show all blocked dates as red, regardless of variant
      classes += " bg-red-500 text-white cursor-not-allowed";
    } else if (isSelected) {
      classes += " bg-blue-500 text-white";
    } else if (isToday) {
      classes += " bg-blue-100 text-blue-800 font-semibold";
    } else if (!isCurrentMonth) {
      classes += " text-gray-300 cursor-not-allowed";
    } else {
      classes += " hover:bg-blue-50";
    }
    
    return classes;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              // Removed: onMonthChange?.(today);
            }}
            className="text-xs h-6 px-2"
          >
            Today
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200">
            {day}
          </div>
        ))}

        {/* Calendar dates */}
        {calendarDates.map(date => {
          const { price, isCustom } = calculatePriceForDate(date, basePrice, customPrices, normalizedSeasonalRules);
          const isDisabled = isDateDisabled(date);
          const isBlocked = isDateBlocked(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Log styling information for debugging
          if (isBlocked) {
            console.log(`🎨 Applying blocked styling to ${dateStr}`);
          }

          return (
            <button
              key={dateStr}
              className={getCellClasses(date)}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled || isBlocked}
              style={isBlocked ? { backgroundColor: '#ef4444', color: 'white' } : undefined}
            >
              <div className="font-medium text-sm">
                {format(date, 'd')}
              </div>
              {showPrices && isCurrentMonth && !isDisabled && !isBlocked && (
                <div className={`text-[9px] leading-tight mt-0.5 ${
                  isCustom ? 'text-green-700 font-bold' : 'text-gray-600'
                }`}>
                  ₹{price.toLocaleString()}
                </div>
              )}
              {isBlocked && (
                <div className="text-[8px] leading-tight font-bold text-white opacity-90 mt-0.5">
                  UNAVAIL
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Custom Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 border border-blue-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}; 