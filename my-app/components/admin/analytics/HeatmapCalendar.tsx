"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addDays, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Info,
  Eye,
  EyeOff
} from "lucide-react";

interface HeatmapDataPoint {
  date: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  averageRate: number;
  totalRooms: number;
  occupiedRooms: number;
}

interface HeatmapCalendarProps {
  data: HeatmapDataPoint[];
  loading?: boolean;
  metric: 'occupancy' | 'revenue' | 'both';
  onMetricChange?: (metric: 'occupancy' | 'revenue' | 'both') => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  title?: string;
  className?: string;
}

type ColorIntensity = 'none' | 'low' | 'medium' | 'high' | 'very-high';

export function HeatmapCalendar({ 
  data, 
  loading = false, 
  metric = 'both',
  onMetricChange,
  onDateRangeChange,
  title = "Analytics Heatmap",
  className = ""
}: HeatmapCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [showTooltips, setShowTooltips] = useState(true);

  // Create a map for quick data lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    data.forEach(point => {
      map.set(point.date, point);
    });
    return map;
  }, [data]);

  // Calculate value ranges for color scaling
  const valueRanges = useMemo(() => {
    if (data.length === 0) return { occupancy: [0, 100], revenue: [0, 1000] };

    const occupancyValues = data.map(d => d.occupancyRate).filter(v => v > 0);
    const revenueValues = data.map(d => d.revenue).filter(v => v > 0);

    return {
      occupancy: [
        Math.min(...occupancyValues, 0),
        Math.max(...occupancyValues, 100)
      ],
      revenue: [
        Math.min(...revenueValues, 0),
        Math.max(...revenueValues, 1000)
      ]
    };
  }, [data]);

  // Get color intensity based on value and metric
  const getColorIntensity = (dataPoint: HeatmapDataPoint): ColorIntensity => {
    if (!dataPoint) return 'none';

    let normalizedValue = 0;

    switch (metric) {
      case 'occupancy':
        normalizedValue = valueRanges.occupancy[1] > 0 
          ? dataPoint.occupancyRate / valueRanges.occupancy[1] 
          : 0;
        break;
      case 'revenue':
        normalizedValue = valueRanges.revenue[1] > 0 
          ? dataPoint.revenue / valueRanges.revenue[1] 
          : 0;
        break;
      case 'both':
        const occupancyNorm = valueRanges.occupancy[1] > 0 
          ? dataPoint.occupancyRate / valueRanges.occupancy[1] 
          : 0;
        const revenueNorm = valueRanges.revenue[1] > 0 
          ? dataPoint.revenue / valueRanges.revenue[1] 
          : 0;
        normalizedValue = (occupancyNorm + revenueNorm) / 2;
        break;
    }

    if (normalizedValue === 0) return 'none';
    if (normalizedValue <= 0.2) return 'low';
    if (normalizedValue <= 0.4) return 'medium';
    if (normalizedValue <= 0.8) return 'high';
    return 'very-high';
  };

  // Get CSS classes for color intensity
  const getColorClasses = (intensity: ColorIntensity, isOccupancy: boolean = false): string => {
    const baseClasses = "border transition-all duration-200 hover:scale-105 cursor-pointer";
    
    if (isOccupancy) {
      switch (intensity) {
        case 'none': return `${baseClasses} bg-gray-100 border-gray-200`;
        case 'low': return `${baseClasses} bg-blue-100 border-blue-200`;
        case 'medium': return `${baseClasses} bg-blue-200 border-blue-300`;
        case 'high': return `${baseClasses} bg-blue-400 border-blue-500`;
        case 'very-high': return `${baseClasses} bg-blue-600 border-blue-700`;
        default: return `${baseClasses} bg-gray-100 border-gray-200`;
      }
    } else {
      switch (intensity) {
        case 'none': return `${baseClasses} bg-gray-100 border-gray-200`;
        case 'low': return `${baseClasses} bg-green-100 border-green-200`;
        case 'medium': return `${baseClasses} bg-green-200 border-green-300`;
        case 'high': return `${baseClasses} bg-green-400 border-green-500`;
        case 'very-high': return `${baseClasses} bg-green-600 border-green-700`;
        default: return `${baseClasses} bg-gray-100 border-gray-200`;
      }
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    if (onDateRangeChange) {
      onDateRangeChange(startOfMonth(newMonth), endOfMonth(newMonth));
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    if (onDateRangeChange) {
      onDateRangeChange(startOfMonth(newMonth), endOfMonth(newMonth));
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTooltips(!showTooltips)}
              >
                {showTooltips ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Hide Tooltips
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Show Tooltips
                  </>
                )}
              </Button>
              {onMetricChange && (
                <Select value={metric} onValueChange={onMetricChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupancy">Occupancy</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Intensity:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-xs">None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${metric === 'occupancy' ? 'bg-blue-200' : 'bg-green-200'}`}></div>
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${metric === 'occupancy' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                <span className="text-xs">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${metric === 'occupancy' ? 'bg-blue-600' : 'bg-green-600'}`}></div>
                <span className="text-xs">Very High</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dataPoint = dataMap.get(dateStr);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);
                const intensity = dataPoint ? getColorIntensity(dataPoint) : 'none';
                
                const cellContent = (
                  <div
                    key={index}
                    className={`
                      min-h-[64px] p-2 rounded-lg relative
                      ${getColorClasses(intensity, metric === 'occupancy')}
                      ${isCurrentMonth ? '' : 'opacity-40'}
                      ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                      ${hoveredDate === dateStr ? 'shadow-lg z-10' : ''}
                    `}
                    onMouseEnter={() => setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      intensity === 'very-high' ? 'text-white' : 
                      intensity === 'high' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    {dataPoint && isCurrentMonth && (
                      <div className={`text-xs space-y-1 ${
                        intensity === 'very-high' ? 'text-white' : 
                        intensity === 'high' ? 'text-white' : 'text-gray-700'
                      }`}>
                        {metric === 'occupancy' || metric === 'both' ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{dataPoint.occupancyRate.toFixed(1)}%</span>
                          </div>
                        ) : null}
                        
                        {metric === 'revenue' || metric === 'both' ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>₹{dataPoint.revenue > 1000 ? (dataPoint.revenue/1000).toFixed(1) + 'k' : dataPoint.revenue}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );

                // Wrap with tooltip if enabled and has data
                if (showTooltips && dataPoint && isCurrentMonth) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        {cellContent}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-medium">
                            {format(day, 'EEEE, MMM dd, yyyy')}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>Occupancy</span>
                              </div>
                              <div className="font-medium">
                                {dataPoint.occupancyRate.toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dataPoint.occupiedRooms}/{dataPoint.totalRooms} rooms
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>Revenue</span>
                              </div>
                              <div className="font-medium">
                                ₹{dataPoint.revenue.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {dataPoint.bookingsCount} booking{dataPoint.bookingsCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          {dataPoint.averageRate > 0 && (
                            <div className="text-xs text-muted-foreground border-t pt-2">
                              Average rate: ₹{dataPoint.averageRate.toLocaleString()}/night
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return cellContent;
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.filter(d => d.occupancyRate > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Days with Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.length > 0 ? (data.reduce((sum, d) => sum + d.occupancyRate, 0) / data.length).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Occupancy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.reduce((sum, d) => sum + d.bookingsCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 