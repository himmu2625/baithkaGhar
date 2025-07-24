"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay, isWithinInterval } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  AlertTriangle,
  Info,
  Users,
  Building,
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  price: number | { base: number };
  location: string;
  type: string;
  status: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface BulkPriceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSuccess?: () => void;
}

interface BulkUpdatePreview {
  propertyId: string;
  propertyTitle: string;
  currentPrice: number;
  newPrice: number;
  priceChange: number;
  percentageChange: number;
}

export function BulkPriceEditDialog({
  isOpen,
  onClose,
  properties,
  onSuccess
}: BulkPriceEditDialogProps) {
  const { toast } = useToast();

  // State management
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [updateType, setUpdateType] = useState<'direct_price' | 'multiplier' | 'base_price'>('multiplier');
  const [directPrice, setDirectPrice] = useState<string>('');
  const [multiplier, setMultiplier] = useState<string>('1.2');
  const [basePrice, setBasePrice] = useState<string>('');
  const [reason, setReason] = useState<'bulk_update' | 'seasonal' | 'event' | 'promotion'>('bulk_update');
  const [notes, setNotes] = useState<string>('');
  
  // Date range selection
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('range');
  
  // Loading and preview states
  const [isUpdating, setIsUpdating] = useState(false);
  const [preview, setPreview] = useState<BulkUpdatePreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Property selection helpers
  const allPropertiesSelected = selectedProperties.length === properties.length;
  const somePropertiesSelected = selectedProperties.length > 0 && selectedProperties.length < properties.length;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProperties([]);
      setDirectPrice('');
      setMultiplier('1.2');
      setBasePrice('');
      setNotes('');
      setSelectedDates([]);
      setDateRanges([]);
      setPreview([]);
      setShowPreview(false);
    }
  }, [isOpen]);

  // Calculate price change impact
  const priceImpact = useMemo(() => {
    if (preview.length === 0) return null;

    const totalCurrentValue = preview.reduce((sum, p) => sum + p.currentPrice, 0);
    const totalNewValue = preview.reduce((sum, p) => sum + p.newPrice, 0);
    const avgPercentageChange = preview.reduce((sum, p) => sum + p.percentageChange, 0) / preview.length;

    return {
      totalCurrentValue,
      totalNewValue,
      totalChange: totalNewValue - totalCurrentValue,
      avgPercentageChange,
      propertiesCount: preview.length
    };
  }, [preview]);

  // Handle property selection
  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAllProperties = () => {
    if (allPropertiesSelected) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.id));
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (calendarMode === 'single') {
      setSelectedDates(prev => {
        const isSelected = prev.some(d => isSameDay(d, date));
        if (isSelected) {
          return prev.filter(d => !isSameDay(d, date));
        } else {
          return [...prev, date];
        }
      });
    } else {
      // Range mode
      setSelectedDates(prev => {
        if (prev.length === 0) {
          return [date];
        } else if (prev.length === 1) {
          const [start] = prev;
          if (date < start) {
            return [date, start];
          } else {
            return [start, date];
          }
        } else {
          return [date];
        }
      });
    }
  };

  // Convert selected dates to date ranges
  useEffect(() => {
    if (calendarMode === 'range' && selectedDates.length === 2) {
      const [start, end] = selectedDates.sort((a, b) => a.getTime() - b.getTime());
      setDateRanges([{ startDate: start, endDate: end }]);
    } else if (calendarMode === 'single' && selectedDates.length > 0) {
      const ranges = selectedDates.map(date => ({
        startDate: date,
        endDate: date
      }));
      setDateRanges(ranges);
    } else {
      setDateRanges([]);
    }
  }, [selectedDates, calendarMode]);

  // Generate preview
  const generatePreview = async () => {
    if (selectedProperties.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one property.",
        variant: "destructive",
      });
      return;
    }

    if (updateType !== 'base_price' && dateRanges.length === 0) {
      toast({
        title: "Date Range Required",
        description: "Please select date ranges for pricing updates.",
        variant: "destructive",
      });
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        propertyIds: selectedProperties.join(','),
        multiplier: updateType === 'multiplier' ? multiplier : '1',
        directPrice: updateType === 'direct_price' ? directPrice : '0'
      });

      if (dateRanges.length > 0) {
        queryParams.set('startDate', format(dateRanges[0].startDate, 'yyyy-MM-dd'));
        queryParams.set('endDate', format(dateRanges[0].endDate, 'yyyy-MM-dd'));
      }

      const response = await fetch(`/api/admin/properties/bulk-pricing?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setPreview(data.preview || []);
        setShowPreview(true);
      } else {
        throw new Error(data.error || 'Failed to generate preview');
      }
    } catch (error) {
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Failed to generate preview",
        variant: "destructive",
      });
    }
  };

  // Execute bulk update
  const handleBulkUpdate = async () => {
    if (!showPreview || preview.length === 0) {
      toast({
        title: "Preview Required",
        description: "Please generate a preview before applying changes.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {
        propertyIds: selectedProperties,
        updateType,
        basePrice: updateType === 'base_price' ? parseFloat(basePrice) : undefined,
        dateRanges: updateType !== 'base_price' ? dateRanges.map(range => ({
          startDate: format(range.startDate, 'yyyy-MM-dd'),
          endDate: format(range.endDate, 'yyyy-MM-dd'),
          price: updateType === 'direct_price' ? parseFloat(directPrice) : undefined,
          multiplier: updateType === 'multiplier' ? parseFloat(multiplier) : undefined,
          reason
        })) : []
      };

      const response = await fetch('/api/admin/properties/bulk-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Bulk Update Successful",
          description: `Updated ${result.updatedProperties} properties with ${result.updatedDateRanges} date ranges.`,
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.error || 'Bulk update failed');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to apply bulk update",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bulk Price Editor
          </DialogTitle>
          <DialogDescription>
            Update prices for multiple properties and date ranges simultaneously
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties">
              <Building className="h-4 w-4 mr-1" />
              Properties ({selectedProperties.length})
            </TabsTrigger>
            <TabsTrigger value="dates">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Dates ({dateRanges.length})
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Percent className="h-4 w-4 mr-1" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!showPreview}>
              <TrendingUp className="h-4 w-4 mr-1" />
              Preview ({preview.length})
            </TabsTrigger>
          </TabsList>

          {/* Properties Selection Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Properties</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllProperties}
                  >
                    {allPropertiesSelected ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Select All
                      </>
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Choose which properties to update. You can filter by type, location, or status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedProperties.includes(property.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePropertyToggle(property.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedProperties.includes(property.id)}
                          onChange={() => handlePropertyToggle(property.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{property.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{property.location}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {property.type}
                            </Badge>
                            <span className="text-xs font-medium">
                              ₹{typeof property.price === 'object' ? property.price.base.toLocaleString() : property.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Date Selection Tab */}
          <TabsContent value="dates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Date Ranges</CardTitle>
                <CardDescription>
                  Choose specific dates or date ranges for pricing updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={calendarMode === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCalendarMode('range');
                      setSelectedDates([]);
                    }}
                  >
                    Date Range
                  </Button>
                  <Button
                    variant={calendarMode === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCalendarMode('single');
                      setSelectedDates([]);
                    }}
                  >
                    Individual Dates
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div>
                      {calendarMode === 'single' ? (
                        <Calendar
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates: Date[] | undefined) => {
                            setSelectedDates(Array.isArray(dates) ? dates : []);
                          }}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      ) : (
                        <Calendar
                          mode="range"
                          selected={
                            selectedDates.length === 2
                              ? { from: selectedDates[0], to: selectedDates[1] }
                              : undefined
                          }
                          onSelect={(dates: { from?: Date; to?: Date } | undefined) => {
                            if (dates && dates.from && dates.to) {
                              setSelectedDates([dates.from, dates.to]);
                            } else if (dates && dates.from) {
                              setSelectedDates([dates.from]);
                            } else {
                              setSelectedDates([]);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Selected Date Ranges</h4>
                    {dateRanges.length > 0 ? (
                      <div className="space-y-2">
                        {dateRanges.map((range, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded border"
                          >
                            <span className="text-sm">
                              {format(range.startDate, 'MMM dd, yyyy')}
                              {!isSameDay(range.startDate, range.endDate) &&
                                ` - ${format(range.endDate, 'MMM dd, yyyy')}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDateRanges(prev => prev.filter((_, i) => i !== index));
                                setSelectedDates([]);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No date ranges selected. Choose dates from the calendar.
                      </p>
                    )}

                    {calendarMode === 'range' && selectedDates.length === 1 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-700">
                          Select an end date to complete the range
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Configuration Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>
                  Choose how to update prices for the selected properties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={updateType === 'multiplier' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setUpdateType('multiplier')}
                  >
                    <Percent className="h-6 w-6 mb-1" />
                    <span className="text-sm">Multiplier</span>
                  </Button>
                  
                  <Button
                    variant={updateType === 'direct_price' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setUpdateType('direct_price')}
                  >
                    <DollarSign className="h-6 w-6 mb-1" />
                    <span className="text-sm">Direct Price</span>
                  </Button>
                  
                  <Button
                    variant={updateType === 'base_price' ? 'default' : 'outline'}
                    className="h-20 flex-col"
                    onClick={() => setUpdateType('base_price')}
                  >
                    <TrendingUp className="h-6 w-6 mb-1" />
                    <span className="text-sm">Base Price</span>
                  </Button>
                </div>

                {updateType === 'multiplier' && (
                  <div className="space-y-3">
                    <Label htmlFor="multiplier">Price Multiplier</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="10"
                      value={multiplier}
                      onChange={(e) => setMultiplier(e.target.value)}
                      placeholder="1.2"
                    />
                    <p className="text-xs text-gray-500">
                      Multiply existing prices by this factor (e.g., 1.2 = 20% increase, 0.8 = 20% decrease)
                    </p>
                  </div>
                )}

                {updateType === 'direct_price' && (
                  <div className="space-y-3">
                    <Label htmlFor="directPrice">New Price (₹)</Label>
                    <Input
                      id="directPrice"
                      type="number"
                      min="0"
                      value={directPrice}
                      onChange={(e) => setDirectPrice(e.target.value)}
                      placeholder="2500"
                    />
                    <p className="text-xs text-gray-500">
                      Set the same price for all selected properties during the selected date ranges
                    </p>
                  </div>
                )}

                {updateType === 'base_price' && (
                  <div className="space-y-3">
                    <Label htmlFor="basePrice">New Base Price (₹)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="3000"
                    />
                    <p className="text-xs text-gray-500">
                      Update the base price for all selected properties (affects all future bookings)
                    </p>
                  </div>
                )}

                {updateType !== 'base_price' && (
                  <div className="space-y-3">
                    <Label htmlFor="reason">Reason for Update</Label>
                    <Select value={reason} onValueChange={(value: any) => setReason(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bulk_update">Bulk Update</SelectItem>
                        <SelectItem value="seasonal">Seasonal Adjustment</SelectItem>
                        <SelectItem value="event">Special Event</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this bulk pricing update..."
                    rows={3}
                  />
                </div>

                <Button onClick={generatePreview} className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {showPreview && priceImpact && (
              <Card>
                <CardHeader>
                  <CardTitle>Impact Summary</CardTitle>
                  <CardDescription>
                    Review the changes before applying
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">Properties</p>
                      <p className="text-2xl font-bold text-blue-600">{priceImpact.propertiesCount}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-sm text-gray-600">Avg Change</p>
                      <p className={`text-2xl font-bold ${priceImpact.avgPercentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceImpact.avgPercentageChange > 0 ? '+' : ''}{priceImpact.avgPercentageChange.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-gray-600">Total Current</p>
                      <p className="text-2xl font-bold text-yellow-600">₹{priceImpact.totalCurrentValue.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-sm text-gray-600">Total New</p>
                      <p className="text-2xl font-bold text-purple-600">₹{priceImpact.totalNewValue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {preview.map((item) => (
                        <div
                          key={item.propertyId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.propertyTitle}</h4>
                            <p className="text-xs text-gray-500">Property ID: {item.propertyId}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">₹{item.currentPrice.toLocaleString()}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">₹{item.newPrice.toLocaleString()}</span>
                            <Badge
                              variant={item.priceChange >= 0 ? "default" : "destructive"}
                              className="min-w-[60px] text-center"
                            >
                              {item.priceChange >= 0 ? '+' : ''}
                              {item.percentageChange.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedProperties.length} properties • {dateRanges.length} date ranges
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={!showPreview || preview.length === 0 || isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 