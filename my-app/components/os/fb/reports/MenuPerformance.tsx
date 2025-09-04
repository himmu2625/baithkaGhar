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

      {/* Detailed Analytics */}
      <Tabs value={activeView} onValueChange={setActiveView as (value: string) => void}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Item Performance</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="ratings">Rating Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Best performers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {menuData.topSellingItems.slice(0, 8).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.totalRevenue)}</div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span>{item.totalOrders} orders</span>
                          {getTrendIcon(item.popularityTrend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Performing Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Needs Attention
                </CardTitle>
                <CardDescription>Items with low sales or ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getLowPerformingItems().map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex">{getRatingStars(Math.floor(item.averageRating))}</div>
                          <span className="text-sm">{item.averageRating}</span>
                        </div>
                        <div className="text-sm text-orange-600">
                          Only {item.totalOrders} orders
                        </div>
                      </div>
                    </div>
                  ))}
                  {getLowPerformingItems().length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Award className="w-8 h-8 mx-auto mb-2" />
                      <p>All items performing well!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Item Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Orders Correlation</CardTitle>
              <CardDescription>Relationship between order volume and revenue generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Scatter Plot Chart</p>
                  <p className="text-sm text-gray-400">Revenue vs Order Volume correlation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue and order distribution by menu categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categoryData.map((category, index) => {
                  const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.totalRevenue, 0);
                  const revenuePercentage = (category.totalRevenue / totalRevenue) * 100;
                  
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{category.category}</div>
                          <div className="text-sm text-gray-500">{category.itemCount} items</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(category.totalRevenue)}</div>
                          <div className="text-sm text-gray-500">{category.totalOrders} orders</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Revenue Share:</span>
                          <div className="font-medium">{revenuePercentage.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Rating:</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{category.averageRating}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">AOV:</span>
                          <div className="font-medium">
                            {formatCurrency(Math.round(category.totalRevenue / category.totalOrders))}
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={revenuePercentage} className="h-3" />
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
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Customer satisfaction breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const percentage = Math.random() * 30 + (6 - rating) * 10; // Mock data
                    return (
                      <div key={rating} className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 w-16">
                          <span>{rating}</span>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        </div>
                        <Progress value={percentage} className="flex-1 h-3" />
                        <span className="text-sm font-medium w-12">{percentage.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Insights</CardTitle>
                <CardDescription>Key satisfaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">4.6</div>
                    <div className="text-sm text-green-600">Overall Rating</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="font-semibold">89%</div>
                      <div className="text-gray-600">4+ Stars</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="font-semibold">2.1%</div>
                      <div className="text-gray-600">Poor Reviews</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Food Quality</span>
                      <span className="font-medium">4.7/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service</span>
                      <span className="font-medium">4.5/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value for Money</span>
                      <span className="font-medium">4.4/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ambiance</span>
                      <span className="font-medium">4.6/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Customer Feedback</CardTitle>
              <CardDescription>Latest reviews and comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { customer: "Priya S.", rating: 5, comment: "Amazing butter chicken! Best in the city. Will definitely come back.", item: "Butter Chicken", time: "2 hours ago" },
                  { customer: "Raj M.", rating: 4, comment: "Good food but service was a bit slow during peak hours.", item: "Biryani", time: "5 hours ago" },
                  { customer: "Anita K.", rating: 5, comment: "Excellent paneer tikka and great ambiance. Perfect for date night!", item: "Paneer Tikka", time: "1 day ago" },
                  { customer: "Vikram P.", rating: 3, comment: "Food was okay, but could use more spices in the dal.", item: "Dal Makhani", time: "1 day ago" },
                ].map((review, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.customer}</span>
                        <div className="flex">{getRatingStars(review.rating)}</div>
                      </div>
                      <span className="text-sm text-gray-500">{review.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">"{review.comment}"</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Item: {review.item}</span>
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