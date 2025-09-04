'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Users,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReportData {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number;
}

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  dailyReports: ReportData[];
}

interface SalesReportsProps {
  propertyId: string;
  dateRange: string;
  salesData: SalesData;
}

export function SalesReports({ propertyId, dateRange, salesData }: SalesReportsProps) {
  const [activeView, setActiveView] = useState<'daily' | 'hourly' | 'comparison'>('daily');
  
  const getPeakHours = () => {
    // Mock peak hours data - would come from API
    return [
      { hour: '12:00', orders: 45, revenue: 13500 },
      { hour: '13:00', orders: 52, revenue: 15600 },
      { hour: '19:00', orders: 68, revenue: 20400 },
      { hour: '20:00', orders: 73, revenue: 21900 },
      { hour: '21:00', orders: 58, revenue: 17400 },
    ];
  };

  const getOrderTypes = () => {
    // Mock order type distribution
    return [
      { type: 'Dine-in', count: 856, revenue: 285600, percentage: 67.2 },
      { type: 'Takeaway', count: 324, revenue: 89750, percentage: 21.1 },
      { type: 'Delivery', count: 276, revenue: 96250, percentage: 11.7 },
    ];
  };

  const getPaymentMethods = () => {
    return [
      { method: 'Card', count: 658, percentage: 45.2 },
      { method: 'UPI', count: 542, percentage: 37.2 },
      { method: 'Cash', count: 256, percentage: 17.6 },
    ];
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatGrowth = (growth: number) => `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Gross Revenue</span>
              <span className="font-medium">{formatCurrency(salesData.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Taxes</span>
              <span className="font-medium">{formatCurrency(Math.round(salesData.totalRevenue * 0.18))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discounts</span>
              <span className="font-medium text-red-600">-{formatCurrency(Math.round(salesData.totalRevenue * 0.05))}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Net Revenue</span>
              <span>{formatCurrency(Math.round(salesData.totalRevenue * 0.95))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              Order Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="font-medium">{salesData.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Order Value</span>
              <span className="font-medium">{formatCurrency(salesData.averageOrderValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Orders per Day</span>
              <span className="font-medium">{Math.round(salesData.totalOrders / 30)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <div className="flex items-center space-x-1">
                {salesData.growthRate >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-medium ${salesData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatGrowth(salesData.growthRate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Performance Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Monthly Target</span>
                <span>{Math.round((salesData.totalRevenue / 500000) * 100)}%</span>
              </div>
              <Progress value={(salesData.totalRevenue / 500000) * 100} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(500000 - salesData.totalRevenue)} remaining
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Order Target</span>
                <span>{Math.round((salesData.totalOrders / 1800) * 100)}%</span>
              </div>
              <Progress value={(salesData.totalOrders / 1800) * 100} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {1800 - salesData.totalOrders} orders remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeView} onValueChange={setActiveView as (value: string) => void}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
          <TabsTrigger value="hourly">Peak Hours</TabsTrigger>
          <TabsTrigger value="comparison">Order Types</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
              <CardDescription>Revenue and order performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.dailyReports.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium w-20">
                        {new Date(day.period).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-semibold">{formatCurrency(day.revenue)}</div>
                          <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{day.orders}</div>
                          <div className="text-xs text-gray-500">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{formatCurrency(day.averageOrderValue)}</div>
                          <div className="text-xs text-gray-500">AOV</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {day.growth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${day.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatGrowth(day.growth)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Busiest times and revenue concentration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPeakHours().map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">{hour.hour}</div>
                        <div className="text-sm text-gray-500">Peak Hour #{index + 1}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="font-semibold">{hour.orders}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatCurrency(hour.revenue)}</div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                      <div className="w-24">
                        <Progress value={(hour.orders / 80) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lunch Rush</CardTitle>
                <CardDescription>12:00 PM - 3:00 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Orders</span>
                    <span className="font-medium">234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-medium">{formatCurrency(68400)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time</span>
                    <span className="font-medium">12 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Hour</span>
                    <span className="font-medium">1:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dinner Rush</CardTitle>
                <CardDescription>7:00 PM - 10:00 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Orders</span>
                    <span className="font-medium">312</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-medium">{formatCurrency(89650)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time</span>
                    <span className="font-medium">18 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Hour</span>
                    <span className="font-medium">8:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Type Distribution</CardTitle>
                <CardDescription>Breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getOrderTypes().map((type) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{type.type}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{type.count} orders</span>
                          <Badge variant="outline">{type.percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Revenue: {formatCurrency(type.revenue)}</span>
                        <span>AOV: {formatCurrency(Math.round(type.revenue / type.count))}</span>
                      </div>
                      <Progress value={type.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Customer payment preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getPaymentMethods().map((method) => (
                    <div key={method.method} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{method.method}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm">{method.count} transactions</span>
                        <Badge>{method.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Transaction Insights</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Transaction Value</span>
                      <span>{formatCurrency(salesData.averageOrderValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Transactions</span>
                      <span className="text-red-600">2.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Time</span>
                      <span>2.4 sec avg</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Comparison</CardTitle>
              <CardDescription>This week vs last week performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(salesData.totalRevenue)}</div>
                  <div className="text-sm text-blue-600 mb-2">This Week</div>
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{salesData.growthRate.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatCurrency(Math.round(salesData.totalRevenue * 0.87))}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Last Week</div>
                  <div className="text-sm text-gray-500">Baseline</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(salesData.totalRevenue - Math.round(salesData.totalRevenue * 0.87))}
                  </div>
                  <div className="text-sm text-green-600 mb-2">Difference</div>
                  <div className="text-sm text-green-600">Improvement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}