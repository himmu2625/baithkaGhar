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
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center text-green-800">
              <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span>Revenue Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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

      {/* Enhanced Detailed Analytics */}
      <Tabs value={activeView} onValueChange={setActiveView as (value: string) => void}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-lg p-1">
          <TabsTrigger 
            value="daily"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <span>Daily Breakdown</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="hourly"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-50 data-[state=active]:to-red-100 data-[state=active]:text-orange-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-orange-100 hover:to-red-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <span>Peak Hours</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="comparison"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <PieChart className="h-4 w-4 text-green-600" />
              </div>
              <span>Order Types</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
              <CardTitle className="text-xl flex items-center space-x-3 text-blue-900">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold">Daily Revenue Trend</span>
                  <div className="text-sm font-normal text-blue-700 mt-1">Comprehensive day-by-day performance analytics</div>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live Data</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {salesData.dailyReports.slice(-7).map((day, index) => (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-900">
                                {new Date(day.period).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-blue-600 text-sm font-medium">
                                Day {index + 1} of 7
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-8">
                            <div className="text-center p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                              <div className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(day.revenue)}</div>
                              <div className="text-green-600 text-sm font-medium flex items-center justify-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Revenue</span>
                              </div>
                            </div>
                            
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                              <div className="text-2xl font-bold text-blue-900 mb-1">{day.orders}</div>
                              <div className="text-blue-600 text-sm font-medium flex items-center justify-center space-x-1">
                                <ShoppingCart className="w-3 h-3" />
                                <span>Orders</span>
                              </div>
                            </div>
                            
                            <div className="text-center p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                              <div className="text-2xl font-bold text-purple-900 mb-1">{formatCurrency(day.averageOrderValue)}</div>
                              <div className="text-purple-600 text-sm font-medium flex items-center justify-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>AOV</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl shadow-lg ${
                            day.growth >= 0 
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
                              : 'bg-gradient-to-r from-red-500/20 to-pink-500/20'
                          }`}>
                            {day.growth >= 0 ? (
                              <TrendingUp className="w-6 h-6 text-green-600" />
                            ) : (
                              <TrendingDown className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${day.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatGrowth(day.growth)}
                            </div>
                            <div className={`text-sm font-medium ${day.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              Growth
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-6 pt-4 border-t border-blue-200/50">
                        <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                          <span className="font-medium">Daily Progress</span>
                          <span>{Math.round((day.revenue / Math.max(...salesData.dailyReports.map(d => d.revenue))) * 100)}%</span>
                        </div>
                        <div className="w-full bg-blue-200/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(day.revenue / Math.max(...salesData.dailyReports.map(d => d.revenue))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-8 pt-6 border-t border-blue-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-blue-900 mb-2">
                      {formatCurrency(salesData.dailyReports.reduce((sum, day) => sum + day.revenue, 0) / salesData.dailyReports.length)}
                    </div>
                    <div className="text-blue-600 font-medium">Average Daily Revenue</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {Math.round(salesData.dailyReports.reduce((sum, day) => sum + day.orders, 0) / salesData.dailyReports.length)}
                    </div>
                    <div className="text-green-600 font-medium">Average Daily Orders</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold text-orange-900 mb-2">
                      {Math.max(...salesData.dailyReports.map(d => d.orders))}
                    </div>
                    <div className="text-orange-600 font-medium">Peak Day Orders</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-6">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-100/80 via-red-100/80 to-pink-100/80 border-b border-orange-200/50 backdrop-blur-sm">
              <CardTitle className="text-xl flex items-center space-x-3 text-orange-900">
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <span className="font-bold">Peak Hours Analysis</span>
                  <div className="text-sm font-normal text-orange-700 mt-1">Discover your busiest times and revenue hotspots</div>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 font-medium">High Traffic</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {getPeakHours().map((hour, index) => (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-orange-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Peak rank indicator */}
                    <div className="absolute top-4 left-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        index === 1 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                        index === 2 ? 'bg-gradient-to-r from-red-400 to-pink-400' :
                        'bg-gradient-to-r from-gray-400 to-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="relative p-6 pl-16">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                              <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-orange-900">{hour.hour}</div>
                              <div className="text-orange-600 font-medium flex items-center space-x-2">
                                <span>Peak Hour #{index + 1}</span>
                                {index === 0 && <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 text-xs">HIGHEST</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                          <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-blue-900 mb-1">{hour.orders}</div>
                            <div className="text-blue-600 text-sm font-medium flex items-center justify-center space-x-1">
                              <ShoppingCart className="w-3 h-3" />
                              <span>Orders</span>
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-green-900 mb-1">{formatCurrency(hour.revenue)}</div>
                            <div className="text-green-600 text-sm font-medium flex items-center justify-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>Revenue</span>
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                            <div className="text-2xl font-bold text-purple-900 mb-1">{formatCurrency(Math.round(hour.revenue / hour.orders))}</div>
                            <div className="text-purple-600 text-sm font-medium flex items-center justify-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>AOV</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Activity level indicator */}
                      <div className="mt-6 pt-4 border-t border-orange-200/50">
                        <div className="flex items-center justify-between text-sm text-orange-700 mb-2">
                          <span className="font-medium">Activity Level</span>
                          <span>{Math.round((hour.orders / 80) * 100)}%</span>
                        </div>
                        <div className="w-full bg-orange-200/50 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${(hour.orders / 80) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 hover:shadow-3xl transition-all duration-500">
              <CardHeader className="bg-gradient-to-r from-amber-100/80 to-yellow-100/80 border-b border-amber-200/50">
                <CardTitle className="text-xl flex items-center space-x-3 text-amber-900">
                  <div className="p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-bold">Lunch Rush</span>
                    <div className="text-sm font-normal text-amber-700 mt-1">12:00 PM - 3:00 PM</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-amber-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Orders</span>
                    </div>
                    <span className="text-xl font-bold text-amber-900">234</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-amber-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Revenue</span>
                    </div>
                    <span className="text-xl font-bold text-green-900">{formatCurrency(68400)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-amber-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Avg Wait Time</span>
                    </div>
                    <span className="text-xl font-bold text-blue-900">12 min</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-amber-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Peak Hour</span>
                    </div>
                    <span className="text-xl font-bold text-purple-900">1:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 hover:shadow-3xl transition-all duration-500">
              <CardHeader className="bg-gradient-to-r from-indigo-100/80 to-purple-100/80 border-b border-indigo-200/50">
                <CardTitle className="text-xl flex items-center space-x-3 text-indigo-900">
                  <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-bold">Dinner Rush</span>
                    <div className="text-sm font-normal text-indigo-700 mt-1">7:00 PM - 10:00 PM</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-indigo-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-indigo-800">Orders</span>
                    </div>
                    <span className="text-xl font-bold text-indigo-900">312</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-indigo-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Revenue</span>
                    </div>
                    <span className="text-xl font-bold text-green-900">{formatCurrency(89650)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-indigo-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-800">Avg Wait Time</span>
                    </div>
                    <span className="text-xl font-bold text-red-900">18 min</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/60 to-indigo-50/60 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Peak Hour</span>
                    </div>
                    <span className="text-xl font-bold text-purple-900">8:00 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                    <PieChart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <span className="font-bold">Order Type Distribution</span>
                    <div className="text-sm font-normal text-green-700 mt-1">Service type breakdown and performance</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {getOrderTypes().map((type, index) => (
                    <div key={type.type} className="group relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Type indicator */}
                      <div className="absolute top-4 left-4">
                        <div className={`w-6 h-6 rounded-full shadow-md ${
                          type.type === 'Dine-in' ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                          type.type === 'Takeaway' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                          'bg-gradient-to-r from-purple-400 to-pink-400'
                        }`}></div>
                      </div>
                      
                      <div className="relative p-6 pl-14">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-green-900">{type.type}</h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                                  {type.count} orders
                                </Badge>
                                <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm font-bold">
                                  {type.percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-900">{formatCurrency(type.revenue)}</div>
                              <div className="text-green-600 text-sm font-medium">Revenue</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                              <div className="text-lg font-bold text-blue-900">{formatCurrency(Math.round(type.revenue / type.count))}</div>
                              <div className="text-blue-600 text-xs font-medium">Avg Order Value</div>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm">
                              <div className="text-lg font-bold text-purple-900">{((type.revenue / getOrderTypes().reduce((sum, t) => sum + t.revenue, 0)) * 100).toFixed(1)}%</div>
                              <div className="text-purple-600 text-xs font-medium">Revenue Share</div>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-green-700">
                              <span className="font-medium">Market Share</span>
                              <span>{type.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-green-200/50 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                  type.type === 'Dine-in' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                  type.type === 'Takeaway' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                  'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                                style={{ width: `${type.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-blue-900">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold">Payment Methods</span>
                    <div className="text-sm font-normal text-blue-700 mt-1">Customer payment preferences</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {getPaymentMethods().map((method, index) => (
                    <div key={method.method} className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl shadow-lg ${
                              method.method === 'Card' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' :
                              method.method === 'UPI' ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20' :
                              'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
                            }`}>
                              <DollarSign className={`w-6 h-6 ${
                                method.method === 'Card' ? 'text-green-600' :
                                method.method === 'UPI' ? 'text-orange-600' :
                                'text-purple-600'
                              }`} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-blue-900">{method.method}</h3>
                              <div className="text-blue-600 text-sm font-medium">{method.count} transactions</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-bold text-blue-900 mb-1">{method.percentage}%</div>
                            <Badge className={`border-0 shadow-sm font-bold ${
                              method.method === 'Card' ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                              method.method === 'UPI' ? 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800' :
                              'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800'
                            }`}>
                              Popular
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Usage indicator */}
                        <div className="mt-6 pt-4 border-t border-blue-200/50">
                          <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
                            <span className="font-medium">Usage Rate</span>
                            <span>{method.percentage}%</span>
                          </div>
                          <div className="w-full bg-blue-200/50 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                method.method === 'Card' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                method.method === 'UPI' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                'bg-gradient-to-r from-purple-500 to-pink-500'
                              }`}
                              style={{ width: `${method.percentage}%` }}
                            ></div>
                          </div>
                        </div>
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