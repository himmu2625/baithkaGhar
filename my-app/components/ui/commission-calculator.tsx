"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Percent, 
  Calendar,
  Target,
  Award,
  PieChart,
  BarChart3,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter, CurrencyCounter, PercentageCounter } from './animated-counter';
import { cn } from '@/lib/utils';

interface CommissionTier {
  name: string;
  minBookings: number;
  maxBookings?: number;
  rate: number;
  bonusRate?: number;
  color: string;
}

interface CommissionCalculation {
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bonusAmount: number;
  totalCommission: number;
  tier: CommissionTier;
  bookingCount: number;
}

interface CommissionHistory {
  id: string;
  date: string;
  bookingId: string;
  propertyName: string;
  bookingAmount: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  tier: string;
}

const COMMISSION_TIERS: CommissionTier[] = [
  { name: 'Bronze', minBookings: 0, maxBookings: 9, rate: 5, color: 'from-amber-600 to-orange-600' },
  { name: 'Silver', minBookings: 10, maxBookings: 24, rate: 7, bonusRate: 1, color: 'from-gray-400 to-gray-600' },
  { name: 'Gold', minBookings: 25, maxBookings: 49, rate: 10, bonusRate: 2, color: 'from-yellow-400 to-yellow-600' },
  { name: 'Platinum', minBookings: 50, maxBookings: 99, rate: 12, bonusRate: 3, color: 'from-purple-400 to-purple-600' },
  { name: 'Diamond', minBookings: 100, rate: 15, bonusRate: 5, color: 'from-blue-400 to-indigo-600' },
];

// Commission Calculator Component
export function CommissionCalculator({
  currentBookings = 0,
  className = '',
}: {
  currentBookings?: number;
  className?: string;
}) {
  const [bookingAmount, setBookingAmount] = useState<string>('');
  const [bookingCount, setBookingCount] = useState<number>(currentBookings);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null);

  const getCurrentTier = (bookings: number): CommissionTier => {
    return COMMISSION_TIERS.find(tier => 
      bookings >= tier.minBookings && (tier.maxBookings === undefined || bookings <= tier.maxBookings)
    ) || COMMISSION_TIERS[0];
  };

  const calculateCommission = () => {
    const amount = parseFloat(bookingAmount) || 0;
    if (amount <= 0) return;

    const tier = getCurrentTier(bookingCount);
    const baseCommissionAmount = (amount * tier.rate) / 100;
    const bonusAmount = tier.bonusRate ? (amount * tier.bonusRate) / 100 : 0;
    const totalCommission = baseCommissionAmount + bonusAmount;

    setCalculation({
      baseAmount: amount,
      commissionRate: tier.rate,
      commissionAmount: baseCommissionAmount,
      bonusAmount,
      totalCommission,
      tier,
      bookingCount,
    });
  };

  useEffect(() => {
    if (bookingAmount) {
      calculateCommission();
    }
  }, [bookingAmount, bookingCount]);

  const nextTier = COMMISSION_TIERS.find(tier => tier.minBookings > bookingCount);
  const bookingsToNextTier = nextTier ? nextTier.minBookings - bookingCount : 0;

  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          <Calculator className="w-6 h-6 mr-2 text-blue-500" />
          Commission Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="booking-amount">Booking Amount (₹)</Label>
            <Input
              id="booking-amount"
              type="number"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              placeholder="Enter booking amount"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="booking-count">Current Bookings</Label>
            <Input
              id="booking-count"
              type="number"
              value={bookingCount}
              onChange={(e) => setBookingCount(parseInt(e.target.value) || 0)}
              placeholder="Number of bookings"
              className="mt-1"
            />
          </div>
        </div>

        {/* Current Tier Display */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Tier</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`bg-gradient-to-r ${getCurrentTier(bookingCount).color} text-white`}
                >
                  {getCurrentTier(bookingCount).name}
                </Badge>
                <span className="text-sm font-medium text-gray-700">
                  {getCurrentTier(bookingCount).rate}% Commission
                </span>
              </div>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Next Tier</p>
                <p className="text-sm font-medium text-blue-600">
                  {bookingsToNextTier} bookings to {nextTier.name}
                </p>
              </div>
            )}
          </div>

          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress to {nextTier.name}</span>
                <span>{Math.round((bookingCount / nextTier.minBookings) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((bookingCount / nextTier.minBookings) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Calculation Results */}
        {calculation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <CurrencyCounter
                  amount={calculation.commissionAmount}
                  className="text-xl font-bold text-green-600"
                />
                <p className="text-sm text-gray-600">Base Commission</p>
              </div>

              {calculation.bonusAmount > 0 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <CurrencyCounter
                    amount={calculation.bonusAmount}
                    className="text-xl font-bold text-blue-600"
                  />
                  <p className="text-sm text-gray-600">Tier Bonus</p>
                </div>
              )}

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <CurrencyCounter
                  amount={calculation.totalCommission}
                  className="text-xl font-bold text-purple-600"
                />
                <p className="text-sm text-gray-600">Total Commission</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Calculation Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Booking Amount:</span>
                  <span>₹{calculation.baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Rate ({calculation.tier.name}):</span>
                  <span>{calculation.commissionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Commission:</span>
                  <span>₹{calculation.commissionAmount.toLocaleString()}</span>
                </div>
                {calculation.bonusAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tier Bonus ({calculation.tier.bonusRate}%):</span>
                    <span>₹{calculation.bonusAmount.toLocaleString()}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total Commission:</span>
                  <span>₹{calculation.totalCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Commission Tier Display
export function CommissionTiers({ 
  currentBookings = 0,
  className = '' 
}: { 
  currentBookings?: number;
  className?: string;
}) {
  const currentTier = getCurrentTier(currentBookings);

  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          <BarChart3 className="w-6 h-6 mr-2 text-purple-500" />
          Commission Tiers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {COMMISSION_TIERS.map((tier, index) => {
            const isCurrentTier = tier.name === currentTier.name;
            const isAchieved = currentBookings >= tier.minBookings;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-300",
                  isCurrentTier 
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" 
                    : isAchieved
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${tier.color} shadow-lg`}>
                      {isAchieved ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Target className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 flex items-center">
                        {tier.name}
                        {isCurrentTier && (
                          <Badge variant="secondary" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tier.minBookings}+ bookings
                        {tier.maxBookings && ` (up to ${tier.maxBookings})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{tier.rate}%</p>
                    {tier.bonusRate && (
                      <p className="text-sm text-green-600">+{tier.bonusRate}% bonus</p>
                    )}
                  </div>
                </div>
                
                {!isAchieved && currentBookings < tier.minBookings && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {tier.minBookings - currentBookings} bookings needed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${tier.color}`}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min((currentBookings / tier.minBookings) * 100, 100)}%` 
                        }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Commission History Tracker
export function CommissionHistory({ 
  history,
  className = '' 
}: { 
  history: CommissionHistory[];
  className?: string;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filteredHistory = history.filter(item => 
    filter === 'all' || item.status === filter
  );

  const totalEarnings = history
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.commissionAmount, 0);

  const pendingEarnings = history
    .filter(item => item.status === 'pending')
    .reduce((sum, item) => sum + item.commissionAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return AlertCircle;
      case 'cancelled': return AlertCircle;
      default: return Info;
    }
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-white/90 backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl font-bold">
            <PieChart className="w-6 h-6 mr-2 text-green-500" />
            Commission History
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <CurrencyCounter
              amount={totalEarnings}
              className="text-xl font-bold text-green-600"
            />
            <p className="text-sm text-gray-600">Total Earned</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <TrendingDown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <CurrencyCounter
              amount={pendingEarnings}
              className="text-xl font-bold text-yellow-600"
            />
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No commission history found</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.propertyName}</h4>
                      <p className="text-sm text-gray-600">
                        Booking #{item.bookingId} • {item.date}
                      </p>
                      <p className="text-sm text-gray-500">
                        Booking: ₹{item.bookingAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{item.commissionAmount.toLocaleString()}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getStatusColor(item.status))}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const getCurrentTier = (bookings: number): CommissionTier => {
  return COMMISSION_TIERS.find(tier => 
    bookings >= tier.minBookings && (tier.maxBookings === undefined || bookings <= tier.maxBookings)
  ) || COMMISSION_TIERS[0];
};