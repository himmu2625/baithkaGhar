'use client';

import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Heart, 
  DollarSign,
  TrendingUp,
  Star,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageSpend: number;
  satisfactionScore: number;
  retentionRate: number;
}

interface CustomerAnalyticsProps {
  propertyId: string;
  dateRange: string;
  customerData: CustomerMetrics;
}

export function CustomerAnalytics({ propertyId, dateRange, customerData }: CustomerAnalyticsProps) {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getCustomerSegments = () => {
    return [
      { segment: 'VIP Customers', count: 45, revenue: 185600, percentage: 12.5 },
      { segment: 'Regular Customers', count: 234, revenue: 456800, percentage: 62.3 },
      { segment: 'Occasional Visitors', count: 156, revenue: 89200, percentage: 25.2 },
    ];
  };

  const getAgeGroups = () => {
    return [
      { age: '18-25', count: 124, percentage: 28.5 },
      { age: '26-35', count: 187, percentage: 43.2 },
      { age: '36-45', count: 89, percentage: 20.6 },
      { age: '46+', count: 34, percentage: 7.7 },
    ];
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 border-b border-blue-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-blue-900">
              <div className="p-2 bg-blue-500/20 rounded-lg shadow-md">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold">Total Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-900 mb-2">{customerData.totalCustomers.toLocaleString()}</div>
            <p className="text-blue-600 font-medium">Active customer base</p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-500 text-sm">Growing community</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 border-b border-green-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-green-900">
              <div className="p-2 bg-green-500/20 rounded-lg shadow-md">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-bold">New Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-900 mb-2">{customerData.newCustomers}</div>
            <p className="text-green-600 font-medium">This {dateRange}</p>
            <div className="mt-4">
              <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-red-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-red-100/80 to-pink-100/80 border-b border-red-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-red-900">
              <div className="p-2 bg-red-500/20 rounded-lg shadow-md">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-bold">Retention Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-900 mb-2">{customerData.retentionRate}%</div>
            <p className="text-red-600 font-medium">Customer loyalty</p>
            <div className="mt-4">
              <div className="w-full bg-red-200/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${customerData.retentionRate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-100/80 to-pink-100/80 border-b border-purple-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-purple-900">
              <div className="p-2 bg-purple-500/20 rounded-lg shadow-md">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-bold">Avg Spend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-900 mb-2">{formatCurrency(customerData.averageSpend)}</div>
            <p className="text-purple-600 font-medium">Per customer visit</p>
            <div className="mt-4">
              <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm">
                High Value
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Customer Segmentation */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-teal-50/20 to-cyan-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-100/80 via-cyan-100/80 to-blue-100/80 border-b border-teal-200/50 backdrop-blur-sm">
          <CardTitle className="text-xl flex items-center space-x-3 text-teal-900">
            <div className="p-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <span className="font-bold">Customer Segmentation</span>
              <div className="text-sm font-normal text-teal-700 mt-1">Customer groups by spending behavior and loyalty</div>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-teal-600 font-medium">Smart Segments</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-8">
            {getCustomerSegments().map((segment, index) => (
              <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-teal-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Segment indicator */}
                <div className="absolute top-4 left-4">
                  <div className={`w-8 h-8 rounded-full shadow-lg ${
                    segment.segment === 'VIP Customers' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    segment.segment === 'Regular Customers' ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                    'bg-gradient-to-r from-green-400 to-emerald-400'
                  }`}></div>
                </div>
                
                <div className="relative p-8 pl-20">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-teal-900">{segment.segment}</h3>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge className="bg-gradient-to-r from-teal-200 to-cyan-200 text-teal-800 border-0 shadow-sm">
                            {segment.count} customers
                          </Badge>
                          <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm font-bold">
                            {segment.percentage}% share
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-teal-900">{formatCurrency(segment.revenue)}</div>
                        <div className="text-teal-600 text-sm font-medium">Total revenue</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                        <div className="text-lg font-bold text-blue-900">{formatCurrency(Math.round(segment.revenue / segment.count))}</div>
                        <div className="text-blue-600 text-sm font-medium">Avg Value</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm">
                        <div className="text-lg font-bold text-purple-900">{segment.percentage.toFixed(1)}%</div>
                        <div className="text-purple-600 text-sm font-medium">Revenue Share</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl shadow-sm">
                        <div className="text-lg font-bold text-orange-900">
                          {segment.segment === 'VIP Customers' ? 'HIGH' : 
                           segment.segment === 'Regular Customers' ? 'STABLE' : 'GROWING'}
                        </div>
                        <div className="text-orange-600 text-sm font-medium">Status</div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-teal-700">
                        <span className="font-medium">Revenue Contribution</span>
                        <span>{segment.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-teal-200/50 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ease-out ${
                            segment.segment === 'VIP Customers' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            segment.segment === 'Regular Customers' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            'bg-gradient-to-r from-green-500 to-emerald-500'
                          } shadow-md`}
                          style={{ width: `${segment.percentage}%` }}
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

      {/* Enhanced Demographics and Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 border-b border-indigo-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-indigo-900">
              <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <span className="font-bold">Age Demographics</span>
                <div className="text-sm font-normal text-indigo-700 mt-1">Customer age group distribution</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {getAgeGroups().map((group, index) => (
                <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-indigo-50/50 border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                          index === 1 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                          'bg-gradient-to-r from-purple-400 to-pink-500'
                        }`}>
                          {group.age}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-indigo-900">{group.count} customers</div>
                          <div className="text-indigo-600 text-sm font-medium">Active users</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`border-0 shadow-sm font-bold text-lg px-4 py-2 ${
                          index === 0 ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800' :
                          index === 1 ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                          index === 2 ? 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800' :
                          'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800'
                        }`}>
                          {group.percentage}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="mt-6 pt-4 border-t border-indigo-200/50">
                      <div className="w-full bg-indigo-200/50 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                            index === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            index === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            index === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                          } shadow-md`}
                          style={{ width: `${group.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-yellow-50/20 to-orange-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-red-100/80 border-b border-yellow-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-yellow-900">
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl shadow-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <span className="font-bold">Customer Satisfaction</span>
                <div className="text-sm font-normal text-yellow-700 mt-1">Overall satisfaction metrics</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center p-8 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl shadow-lg">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-8 h-8 ${i < customerData.satisfactionScore ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <div className="text-5xl font-bold text-green-600 mb-2">{customerData.satisfactionScore}</div>
                <div className="text-green-600 font-medium text-lg">Overall Rating</div>
                <div className="text-green-500 text-sm mt-2">Exceptional Experience</div>
              </div>

              <div className="space-y-4">
                {[
                  { aspect: "Food Quality", rating: 4.7, color: "from-green-500 to-emerald-500", textColor: "text-green-800" },
                  { aspect: "Service Speed", rating: 4.5, color: "from-blue-500 to-indigo-500", textColor: "text-blue-800" },
                  { aspect: "Value for Money", rating: 4.4, color: "from-purple-500 to-pink-500", textColor: "text-purple-800" },
                  { aspect: "Ambiance", rating: 4.6, color: "from-orange-500 to-red-500", textColor: "text-orange-800" }
                ].map((item, index) => (
                  <div key={index} className="space-y-3 p-4 bg-gradient-to-r from-white/60 to-yellow-50/60 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${item.textColor}`}>{item.aspect}</span>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className={`text-lg font-bold ${item.textColor}`}>{item.rating}</span>
                        <span className="text-gray-500">/5</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out shadow-sm`}
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

      {/* Enhanced Customer Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <span className="font-bold">Visit Frequency</span>
                <div className="text-sm font-normal text-green-700 mt-1">Customer visit patterns and loyalty trends</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-green-50/30 to-emerald-50/30 border-2 border-dashed border-green-300 rounded-2xl">
              <div className="text-center">
                <div className="p-6 bg-green-100 rounded-full w-fit mx-auto mb-6">
                  <BarChart3 className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Visit Frequency Analytics</h3>
                <p className="text-green-600 mb-4">Customer return patterns and loyalty insights</p>
                <div className="text-sm text-green-500 mb-6">
                  Interactive frequency analysis with visit trends
                </div>
                
                {/* Mock frequency data */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-xl shadow-sm">
                    <div className="text-lg font-bold text-green-900">Weekly</div>
                    <div className="text-green-600 text-sm">45% customers</div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-xl shadow-sm">
                    <div className="text-lg font-bold text-blue-900">Monthly</div>
                    <div className="text-blue-600 text-sm">32% customers</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-100/80 via-red-100/80 to-pink-100/80 border-b border-orange-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-orange-900">
              <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <span className="font-bold">Peak Visit Times</span>
                <div className="text-sm font-normal text-orange-700 mt-1">When customers visit most</div>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-orange-600 font-medium">High Traffic</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {[
                { time: 'Lunch (12PM-2PM)', visits: 156, percentage: 35.2, icon: '🍽️', color: 'from-yellow-400 to-orange-500', bgColor: 'from-yellow-50/80 to-orange-50/80', textColor: 'text-yellow-800' },
                { time: 'Dinner (7PM-9PM)', visits: 234, percentage: 52.8, icon: '🌙', color: 'from-blue-400 to-indigo-500', bgColor: 'from-blue-50/80 to-indigo-50/80', textColor: 'text-blue-800' },
                { time: 'Tea Time (4PM-6PM)', visits: 45, percentage: 10.2, icon: '☕', color: 'from-green-400 to-emerald-500', bgColor: 'from-green-50/80 to-emerald-50/80', textColor: 'text-green-800' },
                { time: 'Late Night (9PM+)', visits: 8, percentage: 1.8, icon: '🌃', color: 'from-purple-400 to-pink-500', bgColor: 'from-purple-50/80 to-pink-50/80', textColor: 'text-purple-800' },
              ].map((slot, index) => (
                <div key={index} className={`group relative overflow-hidden bg-gradient-to-r ${slot.bgColor} border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{slot.icon}</div>
                        <div>
                          <div className={`text-lg font-bold ${slot.textColor}`}>{slot.time}</div>
                          <div className={`text-sm font-medium ${slot.textColor} opacity-80`}>{slot.visits} visits</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`bg-gradient-to-r ${slot.bgColor} ${slot.textColor} border-0 shadow-sm font-bold text-lg px-4 py-2`}>
                          {slot.percentage}%
                        </Badge>
                        {index === 1 && (
                          <div className="mt-1">
                            <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 shadow-sm text-xs">
                              PEAK
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between text-sm ${slot.textColor} opacity-80`}>
                        <span className="font-medium">Traffic Volume</span>
                        <span>{slot.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full bg-gradient-to-r ${slot.color} transition-all duration-1000 ease-out shadow-md`}
                          style={{ width: `${slot.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Customer Insights */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-100/80 via-pink-100/80 to-red-100/80 border-b border-rose-200/50 backdrop-blur-sm">
          <CardTitle className="text-xl flex items-center space-x-3 text-rose-900">
            <div className="p-3 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-xl shadow-lg">
              <PieChart className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <span className="font-bold">Customer Insights</span>
              <div className="text-sm font-normal text-rose-700 mt-1">Key behavioral patterns and lifetime value analytics</div>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-rose-600 font-medium">Smart Analytics</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full shadow-lg">
                    <TrendingUp className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-blue-900">₹2,450</div>
                  <div className="text-blue-600 font-medium text-lg">Customer Lifetime Value</div>
                  <div className="flex items-center justify-center space-x-2">
                    <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Above Average
                    </Badge>
                  </div>
                </div>
                
                {/* Value indicator */}
                <div className="mt-6 pt-6 border-t border-blue-200/50">
                  <div className="w-full bg-blue-200/50 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full w-4/5 shadow-md"></div>
                  </div>
                  <div className="text-blue-600 text-sm mt-2 font-medium">High Value Customers</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03]">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-full shadow-lg">
                    <Calendar className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-green-900">3.2</div>
                  <div className="text-green-600 font-medium text-lg">Average Visits Per Month</div>
                  <div className="flex items-center justify-center space-x-2">
                    <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                      <Heart className="w-3 h-3 mr-1" />
                      Loyal Base
                    </Badge>
                  </div>
                </div>
                
                {/* Frequency indicator */}
                <div className="mt-6 pt-6 border-t border-green-200/50">
                  <div className="w-full bg-green-200/50 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full w-3/4 shadow-md"></div>
                  </div>
                  <div className="text-green-600 text-sm mt-2 font-medium">Strong Engagement</div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03]">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8 text-center">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-full shadow-lg">
                    <UserCheck className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-purple-900">45</div>
                  <div className="text-purple-600 font-medium text-lg">Days Between Visits</div>
                  <div className="flex items-center justify-center space-x-2">
                    <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Consistent
                    </Badge>
                  </div>
                </div>
                
                {/* Consistency indicator */}
                <div className="mt-6 pt-6 border-t border-purple-200/50">
                  <div className="w-full bg-purple-200/50 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full w-2/3 shadow-md"></div>
                  </div>
                  <div className="text-purple-600 text-sm mt-2 font-medium">Regular Patterns</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional insights summary */}
          <div className="mt-12 pt-8 border-t border-rose-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-rose-900 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                  <span>Customer Behavior Trends</span>
                </h4>
                <div className="space-y-3 text-sm text-rose-700">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>Peak dining preference:</span>
                    <Badge className="bg-gradient-to-r from-orange-200 to-red-200 text-orange-800 border-0">Dinner (52.8%)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>Most loyal age group:</span>
                    <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0">26-35 years</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>Revenue contribution:</span>
                    <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0">62.3% regulars</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-rose-900 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                  <span>Growth Opportunities</span>
                </h4>
                <div className="space-y-3 text-sm text-rose-700">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>Retention improvement:</span>
                    <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0">+2.3% potential</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>Lunch traffic boost:</span>
                    <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0">35% opportunity</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl">
                    <span>VIP program expansion:</span>
                    <Badge className="bg-gradient-to-r from-teal-200 to-cyan-200 text-teal-800 border-0">High impact</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}