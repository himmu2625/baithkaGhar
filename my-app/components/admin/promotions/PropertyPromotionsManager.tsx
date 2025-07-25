"use client"

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Percent, 
  Tag, 
  Calendar,
  Users,
  Target,
  TrendingUp,
  Info,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import Link from 'next/link';

interface Promotion {
  _id: string;
  name: string;
  description?: string;
  type: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxDiscountAmount?: number;
  couponCode?: string;
  conditions: {
    validFrom: string;
    validTo: string;
    usageLimit?: number;
    usageLimitPerCustomer?: number;
    minBookingAmount?: number;
    requiresCouponCode?: boolean;
  };
  displaySettings: {
    title: string;
    badgeText?: string;
    showInSearch?: boolean;
    showOnPropertyPage?: boolean;
    showAtCheckout?: boolean;
    priority: number;
  };
  analytics: {
    usageCount: number;
    totalDiscountGiven: number;
    bookingsGenerated: number;
  };
  isActive: boolean;
  status: string;
  targetProperties?: string[];
}

interface Property {
  _id: string;
  title: string;
  location: string;
  basePrice?: number;
}

interface PropertyPromotionsManagerProps {
  propertyId: string;
  property: Property | null;
}

export function PropertyPromotionsManager({ propertyId, property }: PropertyPromotionsManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Promotion[]>([]);
  const [showQuickCoupon, setShowQuickCoupon] = useState(false);
  const [quickCouponForm, setQuickCouponForm] = useState({
    code: '',
    type: 'fixed_amount' as 'percentage' | 'fixed_amount',
    value: 1000,
    maxDiscount: 2000,
    minBooking: 2000,
    validDays: 30,
    usageLimit: 100,
    perCustomerLimit: 1
  });

  // Fetch property promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/properties/${propertyId}/promotions`);
      const data = await response.json();

      if (data.success) {
        setPromotions(data.promotions || []);
        setCoupons(data.coupons || []);
      } else {
        throw new Error(data.error || 'Failed to fetch promotions');
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create quick coupon
  const createQuickCoupon = async () => {
    try {
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + quickCouponForm.validDays);

      const couponData = {
        name: `${quickCouponForm.code} - Property Coupon`,
        description: `Property-specific coupon for ${property?.title}`,
        type: 'coupon',
        discountType: quickCouponForm.type,
        discountValue: quickCouponForm.value,
        maxDiscountAmount: quickCouponForm.type === 'percentage' ? quickCouponForm.maxDiscount : undefined,
        couponCode: quickCouponForm.code.toUpperCase(),
        couponCodeType: 'fixed',
        conditions: {
          validFrom: new Date().toISOString(),
          validTo: validTo.toISOString(),
          requiresCouponCode: true,
          usageLimit: quickCouponForm.usageLimit,
          usageLimitPerCustomer: quickCouponForm.perCustomerLimit,
          minBookingAmount: quickCouponForm.minBooking,
          applicableFor: 'specific_properties'
        },
        displaySettings: {
          title: `${quickCouponForm.type === 'percentage' ? quickCouponForm.value + '% Off' : '₹' + quickCouponForm.value + ' Off'}`,
          badgeText: quickCouponForm.type === 'percentage' ? `${quickCouponForm.value}% Off` : 'Flat Discount',
          showAtCheckout: true,
          showInSearch: false,
          showOnPropertyPage: true,
          priority: 5
        },
        isActive: true,
        status: 'active'
      };

      const response = await fetch(`/api/admin/properties/${propertyId}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Property coupon created successfully",
        });
        setShowQuickCoupon(false);
        setQuickCouponForm({
          code: '',
          type: 'fixed_amount',
          value: 1000,
          maxDiscount: 2000,
          minBooking: 2000,
          validDays: 30,
          usageLimit: 100,
          perCustomerLimit: 1
        });
        fetchPromotions();
      } else {
        throw new Error(result.error || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  // Toggle promotion for property
  const togglePromotion = async (promotionId: string, action: 'add' | 'remove') => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/promotions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId, action })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        fetchPromotions();
      } else {
        throw new Error(result.error || 'Failed to update promotion');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update promotion",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchPromotions();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading promotions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Property Promotions</h3>
          <p className="text-sm text-muted-foreground">
            Manage promotions and coupon codes for {property?.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPromotions} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showQuickCoupon} onOpenChange={setShowQuickCoupon}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Quick Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Property Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input
                    value={quickCouponForm.code}
                    onChange={(e) => setQuickCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., PROPERTY500"
                    className="uppercase"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={quickCouponForm.type}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed_amount' }))}
                    >
                      <option value="fixed_amount">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{quickCouponForm.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.value}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {quickCouponForm.type === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Max Discount (₹)</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.maxDiscount}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Booking (₹)</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.minBooking}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, minBooking: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid for (days)</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.validDays}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, validDays: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.usageLimit}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Per Customer</Label>
                    <Input
                      type="number"
                      value={quickCouponForm.perCustomerLimit}
                      onChange={(e) => setQuickCouponForm(prev => ({ ...prev, perCustomerLimit: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowQuickCoupon(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createQuickCoupon}
                    disabled={!quickCouponForm.code.trim() || quickCouponForm.value <= 0}
                  >
                    Create Coupon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Link href="/admin/promotions">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage All
            </Button>
          </Link>
        </div>
      </div>

      {/* Property-Specific Coupons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Property Coupon Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-6">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No coupon codes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create property-specific coupon codes for your guests
              </p>
              <Button onClick={() => setShowQuickCoupon(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Coupon
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="font-mono">
                          {coupon.couponCode}
                        </Badge>
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.status}
                        </Badge>
                        {coupon.discountType === 'percentage' ? (
                          <Badge variant="outline" className="text-green-600">
                            <Percent className="h-3 w-3 mr-1" />
                            {coupon.discountValue}% Off
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ₹{coupon.discountValue} Off
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{coupon.displaySettings.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Valid: {format(new Date(coupon.conditions.validFrom), 'MMM dd')} - {format(new Date(coupon.conditions.validTo), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Used: {coupon.analytics.usageCount}/{coupon.conditions.usageLimit || '∞'}</span>
                        <span>Min: ₹{coupon.conditions.minBookingAmount || 0}</span>
                        <span>Bookings: {coupon.analytics.bookingsGenerated}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.isActive}
                        onCheckedChange={(checked) => {
                          // Toggle active state
                          // This would need an API call to update the promotion
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Active Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-6">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No active promotions</h3>
              <p className="text-muted-foreground mb-4">
                No global or targeted promotions are currently active for this property
              </p>
              <Link href="/admin/promotions">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browse All Promotions
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <div key={promotion._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge>{promotion.type.replace('_', ' ')}</Badge>
                        <Badge variant={promotion.isActive ? "default" : "secondary"}>
                          {promotion.status}
                        </Badge>
                        {promotion.discountType === 'percentage' ? (
                          <Badge variant="outline" className="text-green-600">
                            <Percent className="h-3 w-3 mr-1" />
                            {promotion.discountValue}% Off
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ₹{promotion.discountValue} Off
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{promotion.displaySettings.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {promotion.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Valid: {format(new Date(promotion.conditions.validFrom), 'MMM dd')} - {format(new Date(promotion.conditions.validTo), 'MMM dd, yyyy')}</span>
                        <span>Used: {promotion.analytics.usageCount}</span>
                        <span>Revenue: ₹{promotion.analytics.totalDiscountGiven.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Priority: {promotion.displaySettings.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Property-specific promotions</strong> only apply to this property, while <strong>global promotions</strong> apply site-wide unless specifically excluded. Coupon codes created here will only work for bookings of this property.
        </AlertDescription>
      </Alert>
    </div>
  );
} 