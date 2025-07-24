import { useDynamicPricing } from '@/hooks/useDynamicPricing';
import { useState } from 'react';
import { Info, Calendar, Users, Percent, TrendingUp, BadgePercent, AlertTriangle, TrendingDown, Clock, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DynamicPricePreviewProps {
  propertyId: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  guests?: number;
}

export function DynamicPricePreview({ propertyId, defaultStartDate = '', defaultEndDate = '', guests = 1 }: DynamicPricePreviewProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [guestCount, setGuestCount] = useState(guests);
  const { data, loading, error } = useDynamicPricing(propertyId, startDate, endDate, guestCount);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getPriceTrend = () => {
    if (!data?.dailyPrices || data.dailyPrices.length < 2) return 'stable';
    const firstPrice = data.dailyPrices[0].price;
    const lastPrice = data.dailyPrices[data.dailyPrices.length - 1].price;
    if (lastPrice > firstPrice * 1.1) return 'increasing';
    if (lastPrice < firstPrice * 0.9) return 'decreasing';
    return 'stable';
  };

  const getOccupancyStatus = (occupancy: number) => {
    if (occupancy > 0.8) return { status: 'High', color: 'bg-red-100 text-red-800' };
    if (occupancy > 0.5) return { status: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    if (occupancy > 0.2) return { status: 'Low', color: 'bg-blue-100 text-blue-800' };
    return { status: 'Available', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs font-medium">Check-in</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-xs font-medium">Check-out</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-xs font-medium">Guests</label>
          <input type="number" min={1} value={guestCount} onChange={e => setGuestCount(Number(e.target.value))} className="border rounded p-1 w-16" />
        </div>
        <Button variant="ghost" size="icon" className="ml-2" onClick={() => setShowBreakdown(true)} aria-label="Why this price?">
          <Info className="h-5 w-5 text-blue-500" />
        </Button>
      </div>
      
      {loading && <div className="flex items-center gap-2 text-blue-500 animate-pulse"><Calendar className="h-4 w-4" /> Calculating price...</div>}
      {error && <div className="flex items-center gap-2 text-red-500"><AlertTriangle className="h-4 w-4" /> {error}</div>}
      
      {data && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-lg flex items-center gap-1">
              <BadgePercent className="h-5 w-5 text-green-600" />
              Total Price:
            </span>
            <span className="text-2xl font-bold text-green-700">₹{data.totalPrice}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-blue-400" /> Nights:</span>
              <span>{data.nights}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-400" /> Guests:</span>
              <span>{data.guests}</span>
            </div>
            <div className="flex justify-between">
              <span>Average per night:</span>
              <span>₹{data.nightlyAverage}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                {getPriceTrend() === 'increasing' ? <TrendingUp className="h-4 w-4 text-red-500" /> : 
                 getPriceTrend() === 'decreasing' ? <TrendingDown className="h-4 w-4 text-green-500" /> : 
                 <TrendingUp className="h-4 w-4 text-gray-500" />}
                Price trend:
              </span>
              <Badge variant={getPriceTrend() === 'increasing' ? 'destructive' : getPriceTrend() === 'decreasing' ? 'default' : 'secondary'}>
                {getPriceTrend()}
              </Badge>
            </div>
          </div>

          {/* Enhanced daily breakdown */}
          {data.dailyPrices && data.dailyPrices.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-blue-600 font-medium">Show daily price breakdown</summary>
              <div className="mt-2 max-h-48 overflow-y-auto text-xs space-y-2">
                {data.dailyPrices.map((day, idx) => {
                  const occupancyStatus = getOccupancyStatus(day.occupancy || 0);
                  return (
                    <div key={idx} className="border rounded p-2 bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                        <span className="font-bold">₹{day.price}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Base: ₹{day.basePrice}</div>
                        <div>Occupancy: <Badge className={occupancyStatus.color}>{occupancyStatus.status}</Badge></div>
                        {day.seasonalMultiplier !== 1 && <div>Seasonal: ×{day.seasonalMultiplier}</div>}
                        {day.weeklyMultiplier !== 1 && <div>Weekly: ×{day.weeklyMultiplier}</div>}
                        {day.demandMultiplier !== 1 && <div>Demand: ×{day.demandMultiplier}</div>}
                        {day.advanceDiscount > 0 && <div className="text-green-600">Advance: -{day.advanceDiscount}%</div>}
                        {day.lastMinutePremium > 0 && <div className="text-red-600">Last-minute: +{day.lastMinutePremium}%</div>}
                        {day.guestMultiplier !== 1 && <div>Guests: ×{day.guestMultiplier}</div>}
                        {day.weekendMultiplier !== 1 && <div>Weekend: ×{day.weekendMultiplier}</div>}
                        {day.holidayMultiplier !== 1 && <div>Holiday: ×{day.holidayMultiplier}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}
      
      {/* Enhanced Modal for price breakdown */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" /> Dynamic Pricing Breakdown
            </DialogTitle>
          </DialogHeader>
          {data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">₹{data.totalPrice}</div>
                  <div className="text-sm text-blue-600">Total Price</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">₹{data.nightlyAverage}</div>
                  <div className="text-sm text-green-600">Per Night</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Pricing Factors Applied:</h4>
                {data.pricingFactors && (
                  <div className="space-y-2 text-sm">
                    {data.pricingFactors.seasonalMultiplier !== 1 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-purple-500" /> Seasonal Multiplier</span>
                        <span className="text-purple-600">×{data.pricingFactors.seasonalMultiplier}</span>
                      </div>
                    )}
                    {data.pricingFactors.weeklyMultiplier !== 1 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-orange-500" /> Weekly Multiplier</span>
                        <span className="text-orange-600">×{data.pricingFactors.weeklyMultiplier}</span>
                      </div>
                    )}
                    {data.pricingFactors.demandBasedPricing && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-red-500" /> Demand-Based Pricing</span>
                        <span className="text-red-600">Active</span>
                      </div>
                    )}
                    {data.pricingFactors.advanceBookingDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Percent className="h-4 w-4 text-green-500" /> Advance Discount</span>
                        <span className="text-green-700">-{data.pricingFactors.advanceBookingDiscount}%</span>
                      </div>
                    )}
                    {data.pricingFactors.lastMinutePremium > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-red-500" /> Last-minute Premium</span>
                        <span className="text-red-600">+{data.pricingFactors.lastMinutePremium}%</span>
                      </div>
                    )}
                    {data.pricingFactors.guestMultiplier > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-500" /> Guest Multiplier</span>
                        <span className="text-blue-600">×{data.pricingFactors.guestMultiplier}</span>
                      </div>
                    )}
                    {data.pricingFactors.weekendPremium > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> Weekend Premium</span>
                        <span className="text-yellow-600">+{data.pricingFactors.weekendPremium}%</span>
                      </div>
                    )}
                    {data.pricingFactors.holidayPremium > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Star className="h-4 w-4 text-red-500" /> Holiday Premium</span>
                        <span className="text-red-600">+{data.pricingFactors.holidayPremium}%</span>
                      </div>
                    )}
                    {data.pricingFactors.lengthOfStayDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1"><Percent className="h-4 w-4 text-green-500" /> Length of Stay Discount</span>
                        <span className="text-green-700">-{data.pricingFactors.lengthOfStayDiscount}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-4 p-3 bg-gray-50 rounded">
                <strong>Note:</strong> Prices are calculated dynamically based on demand, seasonality, and booking patterns. 
                Final prices may vary based on availability and current market conditions.
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">No price breakdown available.</div>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full mt-4">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
