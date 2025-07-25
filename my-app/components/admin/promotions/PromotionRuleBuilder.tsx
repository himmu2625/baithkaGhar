"use client"

import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Calendar as CalendarIcon,
  Percent,
  DollarSign,
  Gift,
  Users,
  Clock,
  Tag,
  Target,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface PromotionRule {
  name: string;
  description?: string;
  type: 'last_minute' | 'early_bird' | 'long_stay' | 'seasonal' | 'volume' | 'first_time' | 'repeat_customer' | 'custom';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_nights';
  discountValue: number;
  maxDiscountAmount?: number;
  minDiscountAmount?: number;
  buyXGetY?: {
    buyNights: number;
    getFreeNights: number;
    maxFreeNights?: number;
  };
  conditions: {
    validFrom: Date;
    validTo: Date;
    advanceBookingDays?: {
      min?: number;
      max?: number;
    };
    minStayNights?: number;
    maxStayNights?: number;
    minBookingAmount?: number;
    maxBookingAmount?: number;
    minGuests?: number;
    maxGuests?: number;
    minRooms?: number;
    maxRooms?: number;
    daysOfWeek?: string[];
    excludeWeekends?: boolean;
    weekendsOnly?: boolean;
    firstTimeCustomer?: boolean;
    repeatCustomer?: boolean;
    usageLimit?: number;
    usageLimitPerCustomer?: number;
    requiresCouponCode?: boolean;
  };
  displaySettings: {
    title: string;
    subtitle?: string;
    badgeText?: string;
    urgencyMessage?: string;
    highlightColor?: string;
    showInSearch?: boolean;
    showOnPropertyPage?: boolean;
    showAtCheckout?: boolean;
    priority: number;
  };
  couponCode?: string;
  isActive: boolean;
}

interface PromotionRuleBuilderProps {
  initialRule?: PromotionRule;
  onSave: (rule: PromotionRule) => void;
  onCancel: () => void;
  properties?: Array<{ _id: string; name: string; location: string; }>;
}

export function PromotionRuleBuilder({ 
  initialRule, 
  onSave, 
  onCancel, 
  properties = [] 
}: PromotionRuleBuilderProps) {
  const { toast } = useToast();

  // Quick templates for common promotion types
  const quickTemplates = [
    {
      name: 'Flat Discount Coupon',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Simple flat amount discount with coupon code (e.g., WELCOME1000)',
      template: {
        name: 'Flat Discount Coupon',
        description: 'Get flat discount on your booking',
        type: 'coupon' as const,
        discountType: 'fixed_amount' as const,
        discountValue: 1000,
        conditions: {
          requiresCouponCode: true,
          validFrom: new Date(),
          validTo: addDays(new Date(), 30),
          usageLimit: 100,
          usageLimitPerCustomer: 1,
          minBookingAmount: 2000
        },
        displaySettings: {
          title: 'Flat ₹1000 Off',
          badgeText: 'Flat Discount',
          showAtCheckout: true,
          showInSearch: false,
          showOnPropertyPage: false,
          priority: 5
        },
        couponCode: 'WELCOME1000',
        couponCodeType: 'fixed' as const,
        isActive: true
      }
    },
    {
      name: 'Percentage Coupon',
      icon: <Percent className="h-4 w-4" />,
      description: 'Percentage-based discount with coupon code (e.g., SAVE10)',
      template: {
        name: 'Percentage Discount Coupon',
        description: 'Get percentage discount on your booking',
        type: 'coupon' as const,
        discountType: 'percentage' as const,
        discountValue: 10,
        maxDiscountAmount: 2000,
        conditions: {
          requiresCouponCode: true,
          validFrom: new Date(),
          validTo: addDays(new Date(), 30),
          usageLimit: 100,
          usageLimitPerCustomer: 1,
          minBookingAmount: 1000
        },
        displaySettings: {
          title: '10% Off Coupon',
          badgeText: '10% Off',
          showAtCheckout: true,
          showInSearch: false,
          showOnPropertyPage: false,
          priority: 5
        },
        couponCode: 'SAVE10',
        couponCodeType: 'fixed' as const,
        isActive: true
      }
    },
    {
      name: 'Welcome Offer',
      icon: <Gift className="h-4 w-4" />,
      description: 'First-time customer welcome discount (e.g., NEWUSER500)',
      template: {
        name: 'Welcome Offer for New Users',
        description: 'Special discount for first-time users',
        type: 'first_time' as const,
        discountType: 'fixed_amount' as const,
        discountValue: 500,
        conditions: {
          requiresCouponCode: true,
          firstTimeCustomer: true,
          validFrom: new Date(),
          validTo: addDays(new Date(), 90),
          usageLimit: 1000,
          usageLimitPerCustomer: 1,
          minBookingAmount: 1500
        },
        displaySettings: {
          title: 'Welcome Offer - ₹500 Off',
          badgeText: 'New User Special',
          showAtCheckout: true,
          showInSearch: true,
          showOnPropertyPage: true,
          priority: 8
        },
        couponCode: 'NEWUSER500',
        couponCodeType: 'fixed' as const,
        isActive: true
      }
    }
  ];

  const applyTemplate = (template: any) => {
    setRule({
      ...template,
      conditions: {
        ...template.conditions,
        validFrom: new Date(),
        validTo: addDays(new Date(), 30)
      }
    });
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied. You can customize it further.`,
    });
  };

  const [rule, setRule] = useState<PromotionRule>(initialRule || {
    name: '',
    description: '',
    type: 'custom',
    discountType: 'percentage',
    discountValue: 10,
    conditions: {
      validFrom: new Date(),
      validTo: addDays(new Date(), 30),
    },
    displaySettings: {
      title: '',
      priority: 1,
      showInSearch: true,
      showOnPropertyPage: true,
      showAtCheckout: true,
    },
    isActive: false
  });

  const [previewData, setPreviewData] = useState({
    originalAmount: 5000,
    guests: 2,
    nights: 3,
    rooms: 1
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate preview discount
  const calculatePreviewDiscount = () => {
    const { discountType, discountValue, maxDiscountAmount, buyXGetY } = rule;
    let discountAmount = 0;

    switch (discountType) {
      case 'percentage':
        discountAmount = (previewData.originalAmount * discountValue) / 100;
        if (maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, maxDiscountAmount);
        }
        break;
      case 'fixed_amount':
        discountAmount = discountValue;
        break;
      case 'buy_x_get_y':
        if (buyXGetY && previewData.nights >= buyXGetY.buyNights) {
          const sets = Math.floor(previewData.nights / buyXGetY.buyNights);
          const freeNights = Math.min(
            sets * buyXGetY.getFreeNights,
            buyXGetY.maxFreeNights || previewData.nights
          );
          const nightlyRate = previewData.originalAmount / previewData.nights;
          discountAmount = freeNights * nightlyRate;
        }
        break;
      case 'free_nights':
        if (previewData.nights >= discountValue) {
          const nightlyRate = previewData.originalAmount / previewData.nights;
          discountAmount = discountValue * nightlyRate;
        }
        break;
    }

    return Math.min(discountAmount, previewData.originalAmount);
  };

  // Validate rule
  const validateRule = (): string[] => {
    const errors: string[] = [];

    if (!rule.name.trim()) errors.push('Promotion name is required');
    if (!rule.displaySettings.title.trim()) errors.push('Display title is required');
    if (rule.discountValue <= 0) errors.push('Discount value must be greater than 0');
    if (rule.discountType === 'percentage' && rule.discountValue > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }
    if (rule.conditions.validFrom >= rule.conditions.validTo) {
      errors.push('Valid from date must be before valid to date');
    }
    if (rule.conditions.requiresCouponCode && !rule.couponCode?.trim()) {
      errors.push('Coupon code is required when enabled');
    }

    return errors;
  };

  // Handle save
  const handleSave = () => {
    const errors = validateRule();
    setValidationErrors(errors);

    if (errors.length === 0) {
      onSave(rule);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
    }
  };

  // Update rule field
  const updateRule = (path: string, value: any) => {
    setRule(prev => {
      const newRule = { ...prev };
      const keys = path.split('.');
      let current: any = newRule;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newRule;
    });
  };

  const discountAmount = calculatePreviewDiscount();
  const finalAmount = previewData.originalAmount - discountAmount;
  const discountPercentage = (discountAmount / previewData.originalAmount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {initialRule ? 'Edit Promotion' : 'Create New Promotion'}
          </h2>
          <p className="text-muted-foreground">
            Build dynamic discount rules with advanced conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Promotion
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      {!initialRule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Quick Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Start with a pre-configured template for common discount types
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickTemplates.map((template, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
                  onClick={() => applyTemplate(template.template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Template examples:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded">WELCOME1000</code> - Flat ₹1000 discount</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">SAVE10</code> - 10% off with maximum cap</li>
                    <li>• <code className="bg-blue-100 px-1 rounded">NEWUSER500</code> - First-time user special</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="discount">Discount</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
            </TabsList>

            {/* Basic Settings */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Promotion Name</Label>
                      <Input
                        id="name"
                        value={rule.name}
                        onChange={(e) => updateRule('name', e.target.value)}
                        placeholder="e.g., Early Bird Spring Special"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Promotion Type</Label>
                      <Select value={rule.type} onValueChange={(value) => updateRule('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coupon">Coupon Code</SelectItem>
                          <SelectItem value="special_offer">Special Offer</SelectItem>
                          <SelectItem value="first_time">First-Time Customer</SelectItem>
                          <SelectItem value="repeat_customer">Repeat Customer</SelectItem>
                          <SelectItem value="early_bird">Early Bird Special</SelectItem>
                          <SelectItem value="last_minute">Last Minute Deal</SelectItem>
                          <SelectItem value="long_stay">Long Stay Discount</SelectItem>
                          <SelectItem value="seasonal">Seasonal Offer</SelectItem>
                          <SelectItem value="volume">Volume Discount</SelectItem>
                          <SelectItem value="custom">Custom Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={rule.description || ''}
                      onChange={(e) => updateRule('description', e.target.value)}
                      placeholder="Internal description for this promotion"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom">Valid From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(rule.conditions.validFrom, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={rule.conditions.validFrom}
                            onSelect={(date) => date && updateRule('conditions.validFrom', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validTo">Valid To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(rule.conditions.validTo, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={rule.conditions.validTo}
                            onSelect={(date) => date && updateRule('conditions.validTo', date)}
                            disabled={(date) => date < rule.conditions.validFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={rule.isActive}
                      onCheckedChange={(checked) => updateRule('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Activate promotion immediately</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discount Settings */}
            <TabsContent value="discount" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Discount Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <Select 
                      value={rule.discountType} 
                      onValueChange={(value) => updateRule('discountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Percentage Discount
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed_amount">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Fixed Amount
                          </div>
                        </SelectItem>
                        <SelectItem value="buy_x_get_y">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            Buy X Get Y Free
                          </div>
                        </SelectItem>
                        <SelectItem value="free_nights">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Free Nights
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rule.discountType === 'percentage' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountValue">Percentage (%)</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={rule.discountValue}
                          onChange={(e) => updateRule('discountValue', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscountAmount">Max Discount (₹)</Label>
                        <Input
                          id="maxDiscountAmount"
                          type="number"
                          min="0"
                          value={rule.maxDiscountAmount || ''}
                          onChange={(e) => updateRule('maxDiscountAmount', parseFloat(e.target.value) || undefined)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minDiscountAmount">Min Discount (₹)</Label>
                        <Input
                          id="minDiscountAmount"
                          type="number"
                          min="0"
                          value={rule.minDiscountAmount || ''}
                          onChange={(e) => updateRule('minDiscountAmount', parseFloat(e.target.value) || undefined)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}

                  {rule.discountType === 'fixed_amount' && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Discount Amount (₹)</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        step="1"
                        value={rule.discountValue}
                        onChange={(e) => updateRule('discountValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  {rule.discountType === 'buy_x_get_y' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="buyNights">Buy Nights</Label>
                        <Input
                          id="buyNights"
                          type="number"
                          min="1"
                          value={rule.buyXGetY?.buyNights || 3}
                          onChange={(e) => updateRule('buyXGetY.buyNights', parseInt(e.target.value) || 3)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="getFreeNights">Get Free Nights</Label>
                        <Input
                          id="getFreeNights"
                          type="number"
                          min="1"
                          value={rule.buyXGetY?.getFreeNights || 1}
                          onChange={(e) => updateRule('buyXGetY.getFreeNights', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxFreeNights">Max Free Nights</Label>
                        <Input
                          id="maxFreeNights"
                          type="number"
                          min="1"
                          value={rule.buyXGetY?.maxFreeNights || ''}
                          onChange={(e) => updateRule('buyXGetY.maxFreeNights', parseInt(e.target.value) || undefined)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}

                  {rule.discountType === 'free_nights' && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Free Nights</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="1"
                        value={rule.discountValue}
                        onChange={(e) => updateRule('discountValue', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conditions */}
            <TabsContent value="conditions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Booking Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stay Duration */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Stay Duration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minStayNights">Minimum Nights</Label>
                        <Input
                          id="minStayNights"
                          type="number"
                          min="1"
                          value={rule.conditions.minStayNights || ''}
                          onChange={(e) => updateRule('conditions.minStayNights', parseInt(e.target.value) || undefined)}
                          placeholder="No minimum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxStayNights">Maximum Nights</Label>
                        <Input
                          id="maxStayNights"
                          type="number"
                          min="1"
                          value={rule.conditions.maxStayNights || ''}
                          onChange={(e) => updateRule('conditions.maxStayNights', parseInt(e.target.value) || undefined)}
                          placeholder="No maximum"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Booking Amount */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Booking Amount
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minBookingAmount">Minimum Amount (₹)</Label>
                        <Input
                          id="minBookingAmount"
                          type="number"
                          min="0"
                          value={rule.conditions.minBookingAmount || ''}
                          onChange={(e) => updateRule('conditions.minBookingAmount', parseFloat(e.target.value) || undefined)}
                          placeholder="No minimum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxBookingAmount">Maximum Amount (₹)</Label>
                        <Input
                          id="maxBookingAmount"
                          type="number"
                          min="0"
                          value={rule.conditions.maxBookingAmount || ''}
                          onChange={(e) => updateRule('conditions.maxBookingAmount', parseFloat(e.target.value) || undefined)}
                          placeholder="No maximum"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advance Booking */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Advance Booking
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="advanceBookingMin">Minimum Days Ahead</Label>
                        <Input
                          id="advanceBookingMin"
                          type="number"
                          min="0"
                          value={rule.conditions.advanceBookingDays?.min || ''}
                          onChange={(e) => updateRule('conditions.advanceBookingDays.min', parseInt(e.target.value) || undefined)}
                          placeholder="No minimum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanceBookingMax">Maximum Days Ahead</Label>
                        <Input
                          id="advanceBookingMax"
                          type="number"
                          min="0"
                          value={rule.conditions.advanceBookingDays?.max || ''}
                          onChange={(e) => updateRule('conditions.advanceBookingDays.max', parseInt(e.target.value) || undefined)}
                          placeholder="No maximum"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Guests and Rooms */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Guests & Rooms
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minGuests">Min Guests</Label>
                        <Input
                          id="minGuests"
                          type="number"
                          min="1"
                          value={rule.conditions.minGuests || ''}
                          onChange={(e) => updateRule('conditions.minGuests', parseInt(e.target.value) || undefined)}
                          placeholder="Any"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxGuests">Max Guests</Label>
                        <Input
                          id="maxGuests"
                          type="number"
                          min="1"
                          value={rule.conditions.maxGuests || ''}
                          onChange={(e) => updateRule('conditions.maxGuests', parseInt(e.target.value) || undefined)}
                          placeholder="Any"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minRooms">Min Rooms</Label>
                        <Input
                          id="minRooms"
                          type="number"
                          min="1"
                          value={rule.conditions.minRooms || ''}
                          onChange={(e) => updateRule('conditions.minRooms', parseInt(e.target.value) || undefined)}
                          placeholder="Any"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxRooms">Max Rooms</Label>
                        <Input
                          id="maxRooms"
                          type="number"
                          min="1"
                          value={rule.conditions.maxRooms || ''}
                          onChange={(e) => updateRule('conditions.maxRooms', parseInt(e.target.value) || undefined)}
                          placeholder="Any"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Limits */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Limits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="usageLimit">Total Usage Limit</Label>
                        <Input
                          id="usageLimit"
                          type="number"
                          min="1"
                          value={rule.conditions.usageLimit || ''}
                          onChange={(e) => updateRule('conditions.usageLimit', parseInt(e.target.value) || undefined)}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usageLimitPerCustomer">Limit Per Customer</Label>
                        <Input
                          id="usageLimitPerCustomer"
                          type="number"
                          min="1"
                          value={rule.conditions.usageLimitPerCustomer || ''}
                          onChange={(e) => updateRule('conditions.usageLimitPerCustomer', parseInt(e.target.value) || undefined)}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Type */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Customer Requirements</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="firstTimeCustomer"
                          checked={rule.conditions.firstTimeCustomer || false}
                          onCheckedChange={(checked) => updateRule('conditions.firstTimeCustomer', checked)}
                        />
                        <Label htmlFor="firstTimeCustomer">First-time customers only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="repeatCustomer"
                          checked={rule.conditions.repeatCustomer || false}
                          onCheckedChange={(checked) => updateRule('conditions.repeatCustomer', checked)}
                        />
                        <Label htmlFor="repeatCustomer">Repeat customers only</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Coupon Code */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresCouponCode"
                        checked={rule.conditions.requiresCouponCode || false}
                        onCheckedChange={(checked) => updateRule('conditions.requiresCouponCode', checked)}
                      />
                      <Label htmlFor="requiresCouponCode">Requires coupon code</Label>
                    </div>
                    {rule.conditions.requiresCouponCode && (
                      <div className="space-y-3">
                        <Label htmlFor="couponCode">Coupon Code</Label>
                        <Input
                          id="couponCode"
                          value={rule.couponCode || ''}
                          onChange={(e) => updateRule('couponCode', e.target.value.toUpperCase())}
                          placeholder="e.g., WELCOME1000, SAVE10, NEWUSER500"
                          className="uppercase"
                        />
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Popular coupon code formats:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <span>• WELCOME{'{amount}'} (e.g., WELCOME1000)</span>
                            <span>• SAVE{'{percentage}'} (e.g., SAVE10)</span>
                            <span>• {'{name}'}{'{amount}'} (e.g., ANURAG500)</span>
                            <span>• NEWUSER{'{amount}'} (e.g., NEWUSER500)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent value="display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Display Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayTitle">Display Title</Label>
                      <Input
                        id="displayTitle"
                        value={rule.displaySettings.title}
                        onChange={(e) => updateRule('displaySettings.title', e.target.value)}
                        placeholder="e.g., Save 25% on Early Bookings!"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badgeText">Badge Text</Label>
                      <Input
                        id="badgeText"
                        value={rule.displaySettings.badgeText || ''}
                        onChange={(e) => updateRule('displaySettings.badgeText', e.target.value)}
                        placeholder="e.g., Early Bird"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={rule.displaySettings.subtitle || ''}
                      onChange={(e) => updateRule('displaySettings.subtitle', e.target.value)}
                      placeholder="Brief description shown to users"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgencyMessage">Urgency Message</Label>
                    <Input
                      id="urgencyMessage"
                      value={rule.displaySettings.urgencyMessage || ''}
                      onChange={(e) => updateRule('displaySettings.urgencyMessage', e.target.value)}
                      placeholder="e.g., Only 3 days left!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Display Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="10"
                      value={rule.displaySettings.priority}
                      onChange={(e) => updateRule('displaySettings.priority', parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">Higher numbers display more prominently</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Show promotion on:</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showInSearch"
                          checked={rule.displaySettings.showInSearch}
                          onCheckedChange={(checked) => updateRule('displaySettings.showInSearch', checked)}
                        />
                        <Label htmlFor="showInSearch">Search results</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showOnPropertyPage"
                          checked={rule.displaySettings.showOnPropertyPage}
                          onCheckedChange={(checked) => updateRule('displaySettings.showOnPropertyPage', checked)}
                        />
                        <Label htmlFor="showOnPropertyPage">Property detail pages</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showAtCheckout"
                          checked={rule.displaySettings.showAtCheckout}
                          onCheckedChange={(checked) => updateRule('displaySettings.showAtCheckout', checked)}
                        />
                        <Label htmlFor="showAtCheckout">Checkout page</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview Controls */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Original Amount</Label>
                  <Input
                    type="number"
                    value={previewData.originalAmount}
                    onChange={(e) => setPreviewData(prev => ({ 
                      ...prev, 
                      originalAmount: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Guests</Label>
                    <Input
                      type="number"
                      min="1"
                      value={previewData.guests}
                      onChange={(e) => setPreviewData(prev => ({ 
                        ...prev, 
                        guests: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nights</Label>
                    <Input
                      type="number"
                      min="1"
                      value={previewData.nights}
                      onChange={(e) => setPreviewData(prev => ({ 
                        ...prev, 
                        nights: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rooms</Label>
                    <Input
                      type="number"
                      min="1"
                      value={previewData.rooms}
                      onChange={(e) => setPreviewData(prev => ({ 
                        ...prev, 
                        rooms: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Promotion Badge Preview */}
              {rule.displaySettings.title && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      className="bg-red-500 text-white"
                      style={{ backgroundColor: rule.displaySettings.highlightColor || '#ef4444' }}
                    >
                      {rule.displaySettings.badgeText || 'Special Offer'}
                    </Badge>
                    {discountAmount > 0 && (
                      <span className="text-lg font-bold text-green-600">
                        Save ₹{discountAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{rule.displaySettings.title}</h4>
                  {rule.displaySettings.subtitle && (
                    <p className="text-sm text-gray-600">{rule.displaySettings.subtitle}</p>
                  )}
                  {rule.displaySettings.urgencyMessage && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {rule.displaySettings.urgencyMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Discount Calculation */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Original Amount:</span>
                  <span className="font-medium">₹{previewData.originalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Discount:</span>
                  <span className="font-medium">-₹{discountAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Final Amount:</span>
                  <span className="text-green-600">₹{finalAmount.toLocaleString()}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {discountPercentage.toFixed(1)}% savings
                    </Badge>
                  </div>
                )}
              </div>

              {/* Validation Status */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  {validationErrors.length === 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Ready to save</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Needs fixes</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setRule(prev => ({
                    ...prev,
                    type: 'early_bird',
                    discountType: 'percentage',
                    discountValue: 15,
                    conditions: {
                      ...prev.conditions,
                      advanceBookingDays: { min: 14 }
                    },
                    displaySettings: {
                      ...prev.displaySettings,
                      title: 'Early Bird Special - 15% Off',
                      badgeText: 'Early Bird'
                    }
                  }));
                }}
              >
                Early Bird Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setRule(prev => ({
                    ...prev,
                    type: 'last_minute',
                    discountType: 'percentage',
                    discountValue: 20,
                    conditions: {
                      ...prev.conditions,
                      advanceBookingDays: { max: 3 }
                    },
                    displaySettings: {
                      ...prev.displaySettings,
                      title: 'Last Minute Deal - 20% Off',
                      badgeText: 'Last Minute'
                    }
                  }));
                }}
              >
                Last Minute Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setRule(prev => ({
                    ...prev,
                    type: 'long_stay',
                    discountType: 'percentage',
                    discountValue: 25,
                    conditions: {
                      ...prev.conditions,
                      minStayNights: 7
                    },
                    displaySettings: {
                      ...prev.displaySettings,
                      title: 'Extended Stay - 25% Off',
                      badgeText: 'Long Stay'
                    }
                  }));
                }}
              >
                Long Stay Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 