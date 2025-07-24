"use client"

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Tag, 
  Percent, 
  Clock, 
  Gift, 
  Sparkles,
  ChevronRight,
  Calendar,
  Users,
  DollarSign
} from "lucide-react";

interface Promotion {
  _id: string;
  name: string;
  type: string;
  discountType: string;
  discountValue: number;
  displaySettings: {
    title: string;
    subtitle?: string;
    badgeText?: string;
    urgencyMessage?: string;
    highlightColor?: string;
  };
  conditions: {
    validFrom: string;
    validTo: string;
    minStayNights?: number;
    minBookingAmount?: number;
    advanceBookingDays?: {
      min?: number;
      max?: number;
    };
  };
}

interface ApplicablePromotion extends Promotion {
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  savings: string;
}

interface ActivePromotionsBadgeProps {
  propertyId: string;
  bookingDetails?: {
    checkInDate: Date;
    checkOutDate: Date;
    guests: number;
    rooms: number;
    totalAmount: number;
  };
  className?: string;
  showInline?: boolean;
  onPromotionSelect?: (promotion: ApplicablePromotion) => void;
}

export function ActivePromotionsBadge({ 
  propertyId, 
  bookingDetails, 
  className = "",
  showInline = false,
  onPromotionSelect 
}: ActivePromotionsBadgeProps) {
  const [promotions, setPromotions] = useState<ApplicablePromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (propertyId && bookingDetails) {
      fetchApplicablePromotions();
    }
  }, [propertyId, bookingDetails]);

  const fetchApplicablePromotions = async () => {
    if (!bookingDetails) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        propertyId,
        checkInDate: bookingDetails.checkInDate.toISOString(),
        checkOutDate: bookingDetails.checkOutDate.toISOString(),
        guests: bookingDetails.guests.toString(),
        rooms: bookingDetails.rooms.toString(),
        totalAmount: bookingDetails.totalAmount.toString()
      });

      const response = await fetch(`/api/promotions/applicable?${params}`);
      const data = await response.json();

      if (data.success) {
        setPromotions(data.promotions);
      }
    } catch (error) {
      console.error('Error fetching applicable promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'last_minute': return <Clock className="h-4 w-4" />;
      case 'early_bird': return <Calendar className="h-4 w-4" />;
      case 'long_stay': return <Calendar className="h-4 w-4" />;
      case 'volume': return <Users className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getDiscountIcon = (discountType: string) => {
    switch (discountType) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <DollarSign className="h-4 w-4" />;
      case 'buy_x_get_y': return <Gift className="h-4 w-4" />;
      case 'free_nights': return <Calendar className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const formatDiscountText = (promotion: ApplicablePromotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% OFF`;
      case 'fixed_amount':
        return `₹${promotion.discountValue} OFF`;
      case 'buy_x_get_y':
        return `Buy & Get Free`;
      case 'free_nights':
        return `${promotion.discountValue} Free Nights`;
      default:
        return 'Special Offer';
    }
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  const topPromotion = promotions[0];

  // Inline display for property pages
  if (showInline) {
    return (
      <div className={`space-y-2 ${className}`}>
        {promotions.slice(0, 3).map((promotion) => (
          <div
            key={promotion._id}
            className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onPromotionSelect?.(promotion)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-full text-white"
                  style={{ backgroundColor: promotion.displaySettings.highlightColor || '#ef4444' }}
                >
                  {getPromotionIcon(promotion.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-white"
                      style={{ backgroundColor: promotion.displaySettings.highlightColor || '#ef4444' }}
                    >
                      {promotion.displaySettings.badgeText || formatDiscountText(promotion)}
                    </Badge>
                    {promotion.displaySettings.urgencyMessage && (
                      <span className="text-xs text-red-600 font-medium">
                        {promotion.displaySettings.urgencyMessage}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 mt-1">
                    {promotion.displaySettings.title}
                  </h4>
                  {promotion.displaySettings.subtitle && (
                    <p className="text-sm text-gray-600">{promotion.displaySettings.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  Save ₹{promotion.discountAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {promotion.discountPercentage.toFixed(1)}% off
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {promotions.length > 3 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                View {promotions.length - 3} More Offers
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  All Available Promotions
                </DialogTitle>
              </DialogHeader>
              <PromotionsList 
                promotions={promotions} 
                onSelect={(promotion) => {
                  onPromotionSelect?.(promotion);
                  setDialogOpen(false);
                }} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Badge display for search results and checkout
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className={`cursor-pointer ${className}`}>
          <Badge 
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-colors px-3 py-1 text-sm font-medium"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {promotions.length} Active Promotion{promotions.length > 1 ? 's' : ''}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Badge>
          
          {/* Preview of top promotion */}
          <div className="mt-2 text-xs text-green-600 font-medium">
            Save up to ₹{topPromotion.discountAmount.toLocaleString()} • {topPromotion.displaySettings.title}
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Available Promotions
          </DialogTitle>
        </DialogHeader>
        <PromotionsList 
          promotions={promotions} 
          onSelect={(promotion) => {
            onPromotionSelect?.(promotion);
            setDialogOpen(false);
          }} 
        />
      </DialogContent>
    </Dialog>
  );
}

// Separate component for promotions list
function PromotionsList({ 
  promotions, 
  onSelect 
}: { 
  promotions: ApplicablePromotion[]; 
  onSelect?: (promotion: ApplicablePromotion) => void;
}) {
  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'last_minute': return <Clock className="h-5 w-5" />;
      case 'early_bird': return <Calendar className="h-5 w-5" />;
      case 'long_stay': return <Calendar className="h-5 w-5" />;
      case 'volume': return <Users className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {promotions.map((promotion, index) => (
        <Card 
          key={promotion._id} 
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            index === 0 ? 'ring-2 ring-green-500 ring-opacity-50' : ''
          }`}
          onClick={() => onSelect?.(promotion)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div 
                  className="p-2 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: promotion.displaySettings.highlightColor || '#ef4444' }}
                >
                  {getPromotionIcon(promotion.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      className="text-white"
                      style={{ backgroundColor: promotion.displaySettings.highlightColor || '#ef4444' }}
                    >
                      {promotion.displaySettings.badgeText || 'Special Offer'}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Best Deal
                      </Badge>
                    )}
                    {promotion.displaySettings.urgencyMessage && (
                      <Badge variant="destructive" className="animate-pulse">
                        {promotion.displaySettings.urgencyMessage}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">
                    {promotion.displaySettings.title}
                  </h3>
                  
                  {promotion.displaySettings.subtitle && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {promotion.displaySettings.subtitle}
                    </p>
                  )}
                  
                  {/* Promotion conditions */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {promotion.conditions.minStayNights && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Min {promotion.conditions.minStayNights} nights</span>
                      </div>
                    )}
                    {promotion.conditions.minBookingAmount && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Min ₹{promotion.conditions.minBookingAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {promotion.conditions.advanceBookingDays?.min && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Book {promotion.conditions.advanceBookingDays.min}+ days ahead</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-green-600">
                  ₹{promotion.discountAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {promotion.discountPercentage.toFixed(1)}% savings
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Final: ₹{promotion.finalAmount.toLocaleString()}
                </div>
              </div>
            </div>
            
            {onSelect && (
              <div className="mt-3 pt-3 border-t">
                <Button className="w-full" size="sm">
                  Apply This Promotion
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {promotions.length === 0 && (
        <div className="text-center py-8">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No promotions available</h3>
          <p className="text-muted-foreground">
            No applicable promotions found for your current booking criteria.
          </p>
        </div>
      )}
    </div>
  );
}

export default ActivePromotionsBadge; 