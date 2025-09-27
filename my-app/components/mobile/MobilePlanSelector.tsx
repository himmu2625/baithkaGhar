"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Utensils, Users, Check, ChevronDown, Info } from 'lucide-react';

interface Plan {
  code: string;
  name: string;
  description: string;
  inclusions: string[];
}

interface Occupancy {
  type: string;
  label: string;
  description: string;
  maxGuests: number;
}

interface MobilePlanSelectorProps {
  plans: Plan[];
  occupancies: Occupancy[];
  selectedPlan: string;
  selectedOccupancy: string;
  onPlanSelect: (plan: string) => void;
  onOccupancySelect: (occupancy: string) => void;
  className?: string;
}

export default function MobilePlanSelector({
  plans,
  occupancies,
  selectedPlan,
  selectedOccupancy,
  onPlanSelect,
  onOccupancySelect,
  className = ""
}: MobilePlanSelectorProps) {
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showOccupancyDetails, setShowOccupancyDetails] = useState(false);

  const selectedPlanData = plans.find(p => p.code === selectedPlan);
  const selectedOccupancyData = occupancies.find(o => o.type === selectedOccupancy);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Plan Selection - Mobile Optimized */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Select Your Meal Plan
        </label>

        {/* Current Selection Display */}
        <Sheet open={showPlanDetails} onOpenChange={setShowPlanDetails}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-16 flex items-center justify-between p-4 bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Utensils className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {selectedPlanData?.name || 'Select Plan'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedPlanData?.description || 'Choose your meal preferences'}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-blue-600" />
                Choose Your Meal Plan
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 pb-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedPlan === plan.code
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      onPlanSelect(plan.code);
                      setShowPlanDetails(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {plan.code}
                            </Badge>
                            {selectedPlan === plan.code && (
                              <div className="p-1 bg-blue-500 rounded-full">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 mb-1">What's included:</div>
                            {plan.inclusions.map((inclusion, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                <span>{inclusion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Occupancy Selection - Mobile Optimized */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Select Room Occupancy
        </label>

        <Sheet open={showOccupancyDetails} onOpenChange={setShowOccupancyDetails}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-16 flex items-center justify-between p-4 bg-white border-2 border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {selectedOccupancyData?.label || 'Select Occupancy'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedOccupancyData ?
                      `Max ${selectedOccupancyData.maxGuests} guests` :
                      'Choose room sharing type'
                    }
                  </div>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Choose Room Occupancy
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-3 pb-6">
              {occupancies.map((occupancy) => (
                <motion.div
                  key={occupancy.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedOccupancy === occupancy.type
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      onOccupancySelect(occupancy.type);
                      setShowOccupancyDetails(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{occupancy.label}</h3>
                            {selectedOccupancy === occupancy.type && (
                              <div className="p-1 bg-purple-500 rounded-full">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{occupancy.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum {occupancy.maxGuests} guests per room
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Selection Summary - Mobile Friendly */}
      <Card className="bg-gray-50 border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Your Selection</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Meal Plan:</span>
              <span className="font-medium text-gray-900">
                {selectedPlanData?.name || 'Not selected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Occupancy:</span>
              <span className="font-medium text-gray-900">
                {selectedOccupancyData?.label || 'Not selected'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}