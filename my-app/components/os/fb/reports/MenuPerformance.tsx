'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  DollarSign, 
  ShoppingCart,
  Award,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MenuItemPerformance {
  id: string;
  name: string;
  category: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  profitMargin: number;
  popularityTrend: 'up' | 'down' | 'stable';
}

interface CategoryPerformance {
  category: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  itemCount: number;
}

interface MenuData {
  topSellingItems: MenuItemPerformance[];
  categoryPerformance: CategoryPerformance[];
}

interface MenuPerformanceProps {
  propertyId: string;
  dateRange: string;
  menuData: MenuData;
}

export function MenuPerformance({ propertyId, dateRange, menuData }: MenuPerformanceProps) {
  const [activeView, setActiveView] = useState<'items' | 'categories' | 'ratings'>('items');

  // Mock category data since it's not provided
  const mockCategories: CategoryPerformance[] = [
    { category: 'Main Course', totalOrders: 856, totalRevenue: 285600, averageRating: 4.7, itemCount: 24 },
    { category: 'Appetizers', totalOrders: 543, totalRevenue: 135750, averageRating: 4.5, itemCount: 18 },
    { category: 'Beverages', totalOrders: 732, totalRevenue: 58560, averageRating: 4.3, itemCount: 15 },
    { category: 'Desserts', totalOrders: 234, totalRevenue: 35100, averageRating: 4.6, itemCount: 12 },
    { category: 'Bread', totalOrders: 456, totalRevenue: 22800, averageRating: 4.4, itemCount: 8 },
  ];

  const categoryData = menuData.categoryPerformance.length > 0 ? menuData.categoryPerformance : mockCategories;

  const getLowPerformingItems = () => {
    return menuData.topSellingItems
      .filter(item => item.totalOrders < 50 || item.averageRating < 4.0)
      .sort((a, b) => a.totalOrders - b.totalOrders)
      .slice(0, 5);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menuData.topSellingItems.length > 0 && (
              <div>
                <div className="font-semibold">{menuData.topSellingItems[0].name}</div>
                <div className="text-sm text-gray-600 mb-2">{menuData.topSellingItems[0].category}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(menuData.topSellingItems[0].totalRevenue)}
                  </span>
                  <Badge variant="secondary">{menuData.topSellingItems[0].totalOrders} orders</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Best Rated
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const bestRated = menuData.topSellingItems.sort((a, b) => b.averageRating - a.averageRating)[0];
              return bestRated ? (
                <div>
                  <div className="font-semibold">{bestRated.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{bestRated.category}</div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{getRatingStars(Math.floor(bestRated.averageRating))}</div>
                    <span className="font-bold">{bestRated.averageRating}</span>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Most Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const mostProfitable = menuData.topSellingItems.sort((a, b) => b.profitMargin - a.profitMargin)[0];
              return mostProfitable ? (
                <div>
                  <div className="font-semibold">{mostProfitable.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{mostProfitable.category}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">{mostProfitable.profitMargin}%</span>
                    <Badge variant="outline">Margin</Badge>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Rising Star
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const risingStar = menuData.topSellingItems.filter(item => item.popularityTrend === 'up')[0];
              return risingStar ? (
                <div>
                  <div className="font-semibold">{risingStar.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{risingStar.category}</div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Trending Up</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No trending items</div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Detailed Analytics */}
      <Tabs value={activeView} onValueChange={setActiveView as (value: string) => void}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-lg p-1">
          <TabsTrigger 
            value="items"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-orange-100 data-[state=active]:text-amber-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-amber-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                <ShoppingCart className="h-4 w-4 text-amber-600" />
              </div>
              <span>Item Performance</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-pink-100 data-[state=active]:text-purple-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-purple-100 hover:to-pink-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <span>Category Analysis</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="ratings"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-50 data-[state=active]:to-orange-100 data-[state=active]:text-yellow-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-yellow-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
              <span>Rating Insights</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Top Performing Items */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-amber-50/20 to-orange-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-100/80 via-orange-100/80 to-red-100/80 border-b border-amber-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-amber-900">
                  <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl shadow-lg">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <span className="font-bold">Top Selling Items</span>
                    <div className="text-sm font-normal text-amber-700 mt-1">Champions driving your revenue</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {menuData.topSellingItems.slice(0, 8).map((item, index) => (
                    <div key={item.id} className="group relative overflow-hidden bg-gradient-to-r from-white to-amber-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Rank indicator */}
                      <div className="absolute top-4 left-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-slate-400' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                          'bg-gradient-to-r from-blue-400 to-indigo-400'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>
                      
                      <div className="relative p-6 pl-20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-amber-900">{item.name}</h3>
                                <div className="text-amber-600 text-sm font-medium">{item.category}</div>
                              </div>
                              {index < 3 && (
                                <Badge className={`${
                                  index === 0 ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-200 to-slate-200 text-gray-800' :
                                  'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800'
                                } border-0 shadow-sm font-bold`}>
                                  {index === 0 ? 'STAR' : index === 1 ? 'RISING' : 'POPULAR'}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-green-900">{formatCurrency(item.totalRevenue)}</div>
                                <div className="text-green-600 text-xs font-medium">Revenue</div>
                              </div>
                              <div className="text-center p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-blue-900">{item.totalOrders}</div>
                                <div className="text-blue-600 text-xs font-medium">Orders</div>
                              </div>
                              <div className="text-center p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-purple-900">{item.profitMargin}%</div>
                                <div className="text-purple-600 text-xs font-medium">Margin</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 ml-4">
                            <div className={`p-3 rounded-xl shadow-lg ${
                              item.popularityTrend === 'up' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' :
                              item.popularityTrend === 'down' ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20' :
                              'bg-gradient-to-r from-gray-500/20 to-slate-500/20'
                            }`}>
                              {getTrendIcon(item.popularityTrend)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Low Performing Items */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-red-50/20 to-pink-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-100/80 via-pink-100/80 to-orange-100/80 border-b border-red-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-red-900">
                  <div className="p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <span className="font-bold">Needs Attention</span>
                    <div className="text-sm font-normal text-red-700 mt-1">Items requiring improvement</div>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">Action Required</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {getLowPerformingItems().map((item, index) => (
                    <div key={item.id} className="group relative overflow-hidden bg-gradient-to-r from-white to-red-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-red-400">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl shadow-md">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-red-900">{item.name}</h3>
                              <div className="text-red-600 text-sm font-medium">{item.category}</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex">{getRatingStars(Math.floor(item.averageRating))}</div>
                              <span className="text-sm font-medium text-red-800">{item.averageRating}</span>
                            </div>
                            <Badge className="bg-gradient-to-r from-red-200 to-pink-200 text-red-800 border-0 shadow-sm font-bold">
                              Only {item.totalOrders} orders
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Issues breakdown */}
                        <div className="mt-4 pt-4 border-t border-red-200/50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                              <span className="text-red-700">Orders</span>
                              <span className="font-bold text-red-900">{item.totalOrders}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                              <span className="text-red-700">Revenue</span>
                              <span className="font-bold text-red-900">{formatCurrency(item.totalRevenue)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getLowPerformingItems().length === 0 && (
                    <div className="text-center py-16">
                      <div className="p-6 bg-green-100 rounded-full w-fit mx-auto mb-6">
                        <Award className="w-16 h-16 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-700 mb-2">Excellent Performance!</h3>
                      <p className="text-green-600">All menu items are performing well</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Performance Analytics */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 border-b border-indigo-200/50 backdrop-blur-sm">
              <CardTitle className="text-xl flex items-center space-x-3 text-indigo-900">
                <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <span className="font-bold">Revenue vs Orders Analysis</span>
                  <div className="text-sm font-normal text-indigo-700 mt-1">Performance correlation insights</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold text-indigo-900 mb-2">
                    {menuData.topSellingItems.length}
                  </div>
                  <div className="text-indigo-600 font-medium">Total Items Tracked</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold text-green-900 mb-2">
                    {formatCurrency(menuData.topSellingItems.reduce((sum, item) => sum + item.totalRevenue, 0) / menuData.topSellingItems.length)}
                  </div>
                  <div className="text-green-600 font-medium">Avg Revenue per Item</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold text-orange-900 mb-2">
                    {Math.round(menuData.topSellingItems.reduce((sum, item) => sum + item.totalOrders, 0) / menuData.topSellingItems.length)}
                  </div>
                  <div className="text-orange-600 font-medium">Avg Orders per Item</div>
                </div>
              </div>
              
              {/* Chart placeholder with enhanced styling */}
              <div className="h-80 flex items-center justify-center bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-2 border-dashed border-indigo-300 rounded-2xl">
                <div className="text-center">
                  <div className="p-6 bg-indigo-100 rounded-full w-fit mx-auto mb-6">
                    <BarChart3 className="w-16 h-16 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Performance Correlation Chart</h3>
                  <p className="text-indigo-600 mb-4">Revenue vs Order Volume Analysis</p>
                  <div className="text-sm text-indigo-500">
                    Integration with charting library recommended for interactive visualizations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-rose-100/80 border-b border-purple-200/50 backdrop-blur-sm">
              <CardTitle className="text-xl flex items-center space-x-3 text-purple-900">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <span className="font-bold">Category Performance</span>
                  <div className="text-sm font-normal text-purple-700 mt-1">Revenue and order distribution across menu categories</div>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-purple-600 font-medium">Live Metrics</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {categoryData.map((category, index) => {
                  const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.totalRevenue, 0);
                  const revenuePercentage = (category.totalRevenue / totalRevenue) * 100;
                  
                  return (
                    <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-purple-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Category indicator */}
                      <div className="absolute top-4 left-4">
                        <div className={`w-8 h-8 rounded-full shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                          index === 1 ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                          index === 2 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                          index === 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                          'bg-gradient-to-r from-red-400 to-pink-400'
                        }`}></div>
                      </div>
                      
                      <div className="relative p-8 pl-20">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold text-purple-900">{category.category}</h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm">
                                  {category.itemCount} items
                                </Badge>
                                <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm font-bold">
                                  {revenuePercentage.toFixed(1)}% share
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-purple-900">{formatCurrency(category.totalRevenue)}</div>
                              <div className="text-purple-600 text-sm font-medium">{category.totalOrders} orders</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm">
                              <div className="text-lg font-bold text-green-900">{revenuePercentage.toFixed(1)}%</div>
                              <div className="text-green-600 text-sm font-medium">Revenue Share</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 rounded-xl shadow-sm">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                <span className="text-lg font-bold text-yellow-900">{category.averageRating}</span>
                              </div>
                              <div className="text-yellow-600 text-sm font-medium">Avg Rating</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                              <div className="text-lg font-bold text-blue-900">
                                {formatCurrency(Math.round(category.totalRevenue / category.totalOrders))}
                              </div>
                              <div className="text-blue-600 text-sm font-medium">Avg Order Value</div>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm text-purple-700">
                              <span className="font-medium">Market Share</span>
                              <span>{revenuePercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-purple-200/50 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                                  index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                  index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                  index === 2 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                  index === 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                  'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${revenuePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Best Performing Category</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const bestCategory = categoryData.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
                  return (
                    <div className="text-center p-6">
                      <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <div className="text-2xl font-bold">{bestCategory?.category}</div>
                      <div className="text-gray-600 mb-4">{bestCategory?.itemCount} menu items</div>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatCurrency(bestCategory?.totalRevenue || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bestCategory?.totalOrders} orders • {bestCategory?.averageRating}/5 rating
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Most Popular</span>
                    <div className="text-right">
                      <div className="font-medium">{categoryData.sort((a, b) => b.totalOrders - a.totalOrders)[0]?.category}</div>
                      <div className="text-sm text-blue-600">
                        {categoryData.sort((a, b) => b.totalOrders - a.totalOrders)[0]?.totalOrders} orders
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span>Highest Rated</span>
                    <div className="text-right">
                      <div className="font-medium">{categoryData.sort((a, b) => b.averageRating - a.averageRating)[0]?.category}</div>
                      <div className="text-sm text-yellow-600">
                        {categoryData.sort((a, b) => b.averageRating - a.averageRating)[0]?.averageRating}/5 stars
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span>Largest Menu</span>
                    <div className="text-right">
                      <div className="font-medium">{categoryData.sort((a, b) => b.itemCount - a.itemCount)[0]?.category}</div>
                      <div className="text-sm text-purple-600">
                        {categoryData.sort((a, b) => b.itemCount - a.itemCount)[0]?.itemCount} items
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-yellow-50/20 to-orange-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-red-100/80 border-b border-yellow-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-yellow-900">
                  <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl shadow-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <span className="font-bold">Rating Distribution</span>
                    <div className="text-sm font-normal text-yellow-700 mt-1">Customer satisfaction breakdown</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const percentage = Math.random() * 30 + (6 - rating) * 10; // Mock data
                    return (
                      <div key={rating} className="group relative overflow-hidden bg-gradient-to-r from-white to-yellow-50/50 border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center space-x-6 p-4">
                          <div className="flex items-center space-x-2 w-20">
                            <span className="text-xl font-bold text-yellow-900">{rating}</span>
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          </div>
                          <div className="flex-1">
                            <div className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                              rating === 5 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                              rating === 4 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              rating === 3 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                              rating === 2 ? 'bg-gradient-to-r from-red-400 to-pink-500' :
                              'bg-gradient-to-r from-red-500 to-red-600'
                            } shadow-md`} style={{ width: `${percentage}%` }}>
                              <div className="h-full bg-white/20 rounded-full"></div>
                            </div>
                          </div>
                          <div className="text-right w-16">
                            <span className="text-lg font-bold text-yellow-900">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm">
                <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <span className="font-bold">Rating Insights</span>
                    <div className="text-sm font-normal text-green-700 mt-1">Key satisfaction metrics</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center p-8 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="w-8 h-8 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <div className="text-5xl font-bold text-green-600 mb-2">4.6</div>
                    <div className="text-green-600 font-medium">Overall Rating</div>
                    <div className="text-green-500 text-sm mt-1">Excellent Performance!</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-blue-900">89%</div>
                      <div className="text-blue-600 font-medium">4+ Stars</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-red-50/80 to-pink-50/80 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-red-900">2.1%</div>
                      <div className="text-red-600 font-medium">Poor Reviews</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { aspect: "Food Quality", rating: 4.7, color: "from-green-500 to-emerald-500" },
                      { aspect: "Service", rating: 4.5, color: "from-blue-500 to-indigo-500" },
                      { aspect: "Value for Money", rating: 4.4, color: "from-purple-500 to-pink-500" },
                      { aspect: "Ambiance", rating: 4.6, color: "from-orange-500 to-red-500" }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">{item.aspect}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-lg font-bold text-gray-900">{item.rating}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                            style={{ width: `${(item.rating / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
              <CardTitle className="text-xl flex items-center space-x-3 text-blue-900">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold">Recent Customer Feedback</span>
                  <div className="text-sm font-normal text-blue-700 mt-1">Latest reviews and testimonials</div>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">Live Reviews</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {[
                  { customer: "Priya S.", rating: 5, comment: "Amazing butter chicken! Best in the city. Will definitely come back.", item: "Butter Chicken", time: "2 hours ago", sentiment: "positive" },
                  { customer: "Raj M.", rating: 4, comment: "Good food but service was a bit slow during peak hours.", item: "Biryani", time: "5 hours ago", sentiment: "neutral" },
                  { customer: "Anita K.", rating: 5, comment: "Excellent paneer tikka and great ambiance. Perfect for date night!", item: "Paneer Tikka", time: "1 day ago", sentiment: "positive" },
                  { customer: "Vikram P.", rating: 3, comment: "Food was okay, but could use more spices in the dal.", item: "Dal Makhani", time: "1 day ago", sentiment: "neutral" },
                ].map((review, index) => (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Sentiment indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-3 h-3 rounded-full ${
                        review.sentiment === 'positive' ? 'bg-green-400' :
                        review.sentiment === 'negative' ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`}></div>
                    </div>
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl shadow-md ${
                            review.rating >= 4 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' :
                            review.rating >= 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' :
                            'bg-gradient-to-r from-red-500/20 to-pink-500/20'
                          }`}>
                            <Star className={`w-5 h-5 ${
                              review.rating >= 4 ? 'text-green-600' :
                              review.rating >= 3 ? 'text-yellow-600' :
                              'text-red-600'
                            } fill-current`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-blue-900">{review.customer}</span>
                              <div className="flex">
                                {Array.from({ length: review.rating }, (_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                ))}
                              </div>
                            </div>
                            <div className="text-blue-600 text-sm font-medium mt-1">{review.item}</div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
                          {review.time}
                        </Badge>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 rounded-xl border-l-4 border-blue-400">
                        <p className="text-blue-800 font-medium italic">"{review.comment}"</p>
                      </div>
                      
                      {/* Review metrics */}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge className={`border-0 shadow-sm ${
                            review.sentiment === 'positive' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' :
                            review.sentiment === 'negative' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800' :
                            'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800'
                          }`}>
                            {review.sentiment === 'positive' ? '😊 Positive' :
                             review.sentiment === 'negative' ? '😞 Negative' :
                             '😐 Neutral'}
                          </Badge>
                        </div>
                        <div className="text-blue-600">
                          {review.rating}/5 rating
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}