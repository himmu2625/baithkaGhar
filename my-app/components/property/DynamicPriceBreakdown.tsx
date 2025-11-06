"use client"

import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Info,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Gift,
  MapPin,
  Clock,
  Star,
  Percent,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface PricingFactor {
  id: string;
  name: string;
  type: 'base' | 'increase' | 'decrease' | 'event' | 'promotion';
  amount: number;
  percentage?: number;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  confidence?: number;
  reason?: string;
}

interface PriceBreakdown {
  basePrice: number;
  finalPrice: number;
  currency: string;
  factors: PricingFactor[];
  totalSavings: number;
  totalPremium: number;
  occupancyRate?: number;
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
  lastUpdated: Date;
}

interface DynamicPriceBreakdownProps {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  roomCategory: string; // Added
  planType: string;     // Added
  occupancyType: string; // Added
  className?: string;
}

export default function DynamicPriceBreakdown({
  propertyId,
  checkIn,
  checkOut,
  guests,
  rooms,
  roomCategory,
  planType,
  occupancyType,
  className = ""
}: DynamicPriceBreakdownProps) {
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Only fetch if all required parameters are available
    if (propertyId && checkIn && checkOut && roomCategory && planType && occupancyType) {
      fetchPriceBreakdown();
    }
  }, [propertyId, checkIn, checkOut, guests, rooms, roomCategory, planType, occupancyType]);

  const fetchPriceBreakdown = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        propertyId,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        guests: guests.toString(),
        rooms: rooms.toString(),
        roomCategory,
        planType,
        occupancyType,
      }).toString();

      const response = await fetch(`/api/pricing/breakdown?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pricing breakdown');
      }
      const data = await response.json();
      if (data.success) {
        setPriceBreakdown(data.breakdown);
      } else {
        throw new Error(data.message || 'Failed to fetch pricing breakdown');
      }
    } catch (error) {
      console.error('Error fetching price breakdown:', error);
      setPriceBreakdown(null); // Clear breakdown on error
    } finally {
      setLoading(false);
    }
  };

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'peak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFactorTypeColor = (type: string) => {
    switch (type) {
      case 'base': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'increase': return 'bg-red-100 text-red-800 border-red-200';
      case 'decrease': return 'bg-green-100 text-green-800 border-green-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'promotion': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!priceBreakdown) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-muted-foreground">Unable to load price breakdown</p>
        </CardContent>
      </Card>
    );
  }

  const activeFactors = priceBreakdown.factors.filter(f => f.isActive);
  const savings = activeFactors.filter(f => f.type === 'decrease' || f.type === 'promotion').reduce((sum, f) => sum + Math.abs(f.amount), 0);
  const premiums = activeFactors.filter(f => f.type === 'increase' || f.type === 'event').reduce((sum, f) => sum + f.amount, 0);

  return (
    <TooltipProvider>
      <Card className={`${className} border-2 hover:border-blue-200 transition-colors`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Why this price?
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getDemandLevelColor(priceBreakdown.demandLevel)}>
                {priceBreakdown.demandLevel.charAt(0).toUpperCase() + priceBreakdown.demandLevel.slice(1)} Demand
              </Badge>
              {priceBreakdown.occupancyRate && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {priceBreakdown.occupancyRate}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current occupancy rate</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price Summary */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm text-blue-700 mb-1">Final Price (per night)</p>
              <p className="text-3xl font-bold text-blue-900">
                ₹{priceBreakdown.finalPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-right text-sm text-blue-600">
              <div className="flex items-center gap-1 mb-1">
                <span>Base: ₹{priceBreakdown.basePrice.toLocaleString()}</span>
              </div>
              {premiums > 0 && (
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+₹{premiums.toLocaleString()}</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <Gift className="h-3 w-3" />
                  <span>-₹{savings.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Factors - Quick View */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Active Pricing Factors:</h4>
            {activeFactors.slice(0, 3).map((factor) => (
              <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getFactorTypeColor(factor.type)}`}>
                    {factor.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${
                    factor.type === 'decrease' || factor.type === 'promotion' 
                      ? 'text-green-600' 
                      : factor.type === 'base' 
                        ? 'text-blue-600' 
                        : 'text-orange-600'
                  }`}>
                    {factor.type === 'decrease' || factor.type === 'promotion' ? '' : '+'}
                    ₹{Math.abs(factor.amount).toLocaleString()}
                  </span>
                  {factor.percentage && (
                    <p className="text-xs text-muted-foreground">
                      {factor.percentage > 0 ? '+' : ''}{factor.percentage}%
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activeFactors.length > 3 && (
              <div className="text-center">
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      View {activeFactors.length - 3} more factors
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Complete Price Breakdown
                      </DialogTitle>
                      <DialogDescription>
                        Detailed explanation of all pricing factors for {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                      {/* All Factors */}
                      {priceBreakdown.factors.map((factor) => (
                        <div 
                          key={factor.id} 
                          className={`p-4 border rounded-lg ${
                            factor.isActive ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getFactorTypeColor(factor.type)}`}>
                                {factor.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{factor.name}</h4>
                                  {factor.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <div className="w-4 h-4 border border-gray-300 rounded-full bg-gray-100" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{factor.description}</p>
                                {factor.reason && (
                                  <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                    <strong>Why:</strong> {factor.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold text-lg ${
                                factor.type === 'decrease' || factor.type === 'promotion' 
                                  ? 'text-green-600' 
                                  : factor.type === 'base' 
                                    ? 'text-blue-600' 
                                    : 'text-orange-600'
                              }`}>
                                {factor.type === 'decrease' || factor.type === 'promotion' ? '' : '+'}
                                ₹{Math.abs(factor.amount).toLocaleString()}
                              </span>
                              {factor.percentage && (
                                <p className="text-sm text-muted-foreground">
                                  {factor.percentage > 0 ? '+' : ''}{factor.percentage}%
                                </p>
                              )}
                              {factor.confidence && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-600 h-1.5 rounded-full" 
                                      style={{ width: `${factor.confidence}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{factor.confidence}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      {/* Final Calculation */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold mb-3">Price Calculation:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>₹{priceBreakdown.basePrice.toLocaleString()}</span>
                          </div>
                          {premiums > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>Total Premiums:</span>
                              <span>+₹{premiums.toLocaleString()}</span>
                            </div>
                          )}
                          {savings > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Total Savings:</span>
                              <span>-₹{savings.toLocaleString()}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Final Price:</span>
                            <span className="text-blue-600">₹{priceBreakdown.finalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {savings > 0 && (
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">You're Saving</p>
                <p className="font-bold text-green-800">₹{savings.toLocaleString()}</p>
              </div>
            )}
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 mb-1">Market Position</p>
              <p className="font-bold text-blue-800">
                {priceBreakdown.demandLevel === 'low' ? 'Great Deal' : 
                 priceBreakdown.demandLevel === 'medium' ? 'Fair Price' : 
                 priceBreakdown.demandLevel === 'high' ? 'Popular Choice' : 'Premium Dates'}
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Updated {format(priceBreakdown.lastUpdated, 'h:mm a')} • Prices may change based on availability
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
} 