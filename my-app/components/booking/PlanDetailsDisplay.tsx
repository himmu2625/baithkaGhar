"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Utensils,
  Users,
  Home,
  Coffee,
  UtensilsCrossed,
  Check,
  IndianRupee,
  Info
} from 'lucide-react';
import { Tooltip } from 'react-tooltip';

interface PlanDetailsDisplayProps {
  booking: {
    roomCategory?: string;
    planType?: 'EP' | 'CP' | 'MAP' | 'AP';
    occupancyType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
    numberOfRooms?: number;
    basePrice?: number;
    planCharges?: number;
    occupancyCharges?: number;
    dynamicPriceAdjustment?: number;
    nightsCount?: number;
    mealPlanInclusions?: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
    };
    totalPrice?: number;
    pricePerNight?: number;
  };
  showPricingBreakdown?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// Plan type display configuration
const PLAN_CONFIG = {
  EP: {
    name: 'European Plan',
    shortName: 'EP',
    description: 'Room Only',
    icon: Home,
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  CP: {
    name: 'Continental Plan',
    shortName: 'CP',
    description: 'Room + Breakfast',
    icon: Coffee,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  MAP: {
    name: 'Modified American Plan',
    shortName: 'MAP',
    description: 'Room + Breakfast + Lunch/Dinner',
    icon: Utensils,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  AP: {
    name: 'American Plan',
    shortName: 'AP',
    description: 'All Meals Included',
    icon: UtensilsCrossed,
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  }
};

// Occupancy type display
const OCCUPANCY_CONFIG = {
  SINGLE: { name: 'Single Occupancy', guests: 1, icon: '👤' },
  DOUBLE: { name: 'Double Occupancy', guests: 2, icon: '👥' },
  TRIPLE: { name: 'Triple Occupancy', guests: 3, icon: '👨‍👩‍👦' },
  QUAD: { name: 'Quad Occupancy', guests: 4, icon: '👨‍👩‍👧‍👦' }
};

export function PlanDetailsDisplay({
  booking,
  showPricingBreakdown = false,
  variant = 'default'
}: PlanDetailsDisplayProps) {
  const planConfig = booking.planType ? PLAN_CONFIG[booking.planType] : null;
  const occupancyConfig = booking.occupancyType ? OCCUPANCY_CONFIG[booking.occupancyType] : null;
  const PlanIcon = planConfig?.icon || Home;

  // Compact variant - just badges
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {booking.roomCategory && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            {booking.roomCategory}
          </Badge>
        )}
        {planConfig && (
          <Badge variant="outline" className={`flex items-center gap-1 ${planConfig.color}`}>
            <PlanIcon className="h-3 w-3" />
            {planConfig.shortName}
          </Badge>
        )}
        {occupancyConfig && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {occupancyConfig.name}
          </Badge>
        )}
        {booking.numberOfRooms && booking.numberOfRooms > 1 && (
          <Badge variant="outline" className="flex items-center gap-1">
            {booking.numberOfRooms} Rooms
          </Badge>
        )}
      </div>
    );
  }

  // Default variant - card with details
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5 text-mediumGreen" />
          Booking Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Category */}
        {booking.roomCategory && (
          <div className="flex items-center justify-between p-3 bg-lightGreen/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md">
                <Home className="h-5 w-5 text-mediumGreen" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Room Type</p>
                <p className="font-semibold text-darkGreen capitalize">{booking.roomCategory}</p>
              </div>
            </div>
            {booking.numberOfRooms && booking.numberOfRooms > 1 && (
              <Badge variant="secondary" className="ml-2">
                {booking.numberOfRooms} Room{booking.numberOfRooms > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Meal Plan */}
        {planConfig && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md">
                <PlanIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Meal Plan</p>
                <p className="font-semibold text-blue-800">{planConfig.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{planConfig.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Meal Inclusions */}
        {booking.mealPlanInclusions && (
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-md text-center ${
              booking.mealPlanInclusions.breakfast
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <Coffee className={`h-4 w-4 mx-auto mb-1 ${
                booking.mealPlanInclusions.breakfast ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className="text-xs font-medium">Breakfast</p>
              {booking.mealPlanInclusions.breakfast && (
                <Check className="h-3 w-3 text-green-600 mx-auto mt-1" />
              )}
            </div>
            <div className={`p-2 rounded-md text-center ${
              booking.mealPlanInclusions.lunch
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <Utensils className={`h-4 w-4 mx-auto mb-1 ${
                booking.mealPlanInclusions.lunch ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className="text-xs font-medium">Lunch</p>
              {booking.mealPlanInclusions.lunch && (
                <Check className="h-3 w-3 text-green-600 mx-auto mt-1" />
              )}
            </div>
            <div className={`p-2 rounded-md text-center ${
              booking.mealPlanInclusions.dinner
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <UtensilsCrossed className={`h-4 w-4 mx-auto mb-1 ${
                booking.mealPlanInclusions.dinner ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className="text-xs font-medium">Dinner</p>
              {booking.mealPlanInclusions.dinner && (
                <Check className="h-3 w-3 text-green-600 mx-auto mt-1" />
              )}
            </div>
          </div>
        )}

        {/* Occupancy */}
        {occupancyConfig && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-md text-2xl">
                {occupancyConfig.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Occupancy</p>
                <p className="font-semibold text-purple-800">{occupancyConfig.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{occupancyConfig.guests} Guest{occupancyConfig.guests > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        {showPricingBreakdown && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="h-4 w-4 text-mediumGreen" />
                <h4 className="font-semibold text-sm">Pricing Breakdown</h4>
              </div>

              {booking.basePrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Room Rate (per night)</span>
                  <span className="font-medium">₹{booking.basePrice.toLocaleString()}</span>
                </div>
              )}

              {booking.planCharges !== undefined && booking.planCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Meal Plan Charges (per night)</span>
                  <span className="font-medium text-green-600">+₹{booking.planCharges.toLocaleString()}</span>
                </div>
              )}

              {booking.occupancyCharges !== undefined && booking.occupancyCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Extra Occupancy Charges (per night)</span>
                  <span className="font-medium text-green-600">+₹{booking.occupancyCharges.toLocaleString()}</span>
                </div>
              )}

              {booking.dynamicPriceAdjustment !== undefined && booking.dynamicPriceAdjustment !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    Seasonal Adjustment
                    <Info className="h-3 w-3" data-tooltip-id="seasonal-tip" />
                    <Tooltip id="seasonal-tip" place="top">
                      <div className="text-xs">Based on demand and season</div>
                    </Tooltip>
                  </span>
                  <span className={`font-medium ${
                    booking.dynamicPriceAdjustment > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {booking.dynamicPriceAdjustment > 0 ? '+' : ''}₹{booking.dynamicPriceAdjustment.toLocaleString()}
                  </span>
                </div>
              )}

              {booking.nightsCount && booking.nightsCount > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of Nights</span>
                    <span className="font-medium">{booking.nightsCount}</span>
                  </div>
                  {booking.pricePerNight && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price per Night (all rooms)</span>
                      <span className="font-medium">₹{booking.pricePerNight.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}

              {booking.totalPrice && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-darkGreen">Total Amount</span>
                    <span className="text-mediumGreen text-lg">₹{booking.totalPrice.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for email templates
export function PlanDetailsText({ booking }: { booking: any }) {
  const planConfig = booking.planType ? PLAN_CONFIG[booking.planType] : null;
  const occupancyConfig = booking.occupancyType ? OCCUPANCY_CONFIG[booking.occupancyType] : null;

  return `
BOOKING DETAILS:
----------------
Room Type: ${booking.roomCategory || 'Standard'}
Meal Plan: ${planConfig?.name || 'Not specified'} (${planConfig?.description || ''})
Occupancy: ${occupancyConfig?.name || 'Not specified'}
Number of Rooms: ${booking.numberOfRooms || 1}

MEAL INCLUSIONS:
----------------
Breakfast: ${booking.mealPlanInclusions?.breakfast ? '✓ Included' : '✗ Not included'}
Lunch: ${booking.mealPlanInclusions?.lunch ? '✓ Included' : '✗ Not included'}
Dinner: ${booking.mealPlanInclusions?.dinner ? '✓ Included' : '✗ Not included'}

PRICING BREAKDOWN:
------------------
Base Room Rate: ₹${booking.basePrice?.toLocaleString() || 'N/A'}
Meal Plan Charges: ${booking.planCharges ? `₹${booking.planCharges.toLocaleString()}` : 'Included'}
Extra Occupancy: ${booking.occupancyCharges ? `₹${booking.occupancyCharges.toLocaleString()}` : 'Included'}
Seasonal Adjustment: ${booking.dynamicPriceAdjustment ? `₹${booking.dynamicPriceAdjustment.toLocaleString()}` : '₹0'}
Number of Nights: ${booking.nightsCount || 'N/A'}
----------------
Total Amount: ₹${booking.totalPrice?.toLocaleString() || 'N/A'}
  `.trim();
}

export default PlanDetailsDisplay;
