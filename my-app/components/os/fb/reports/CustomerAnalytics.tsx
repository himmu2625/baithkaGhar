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
    <div className="space-y-6">
      {/* Customer Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.totalCustomers}</div>
            <p className="text-sm text-gray-600">Active customer base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-600" />
              New Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customerData.newCustomers}</div>
            <p className="text-sm text-gray-600">This {dateRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-600" />
              Retention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{customerData.retentionRate}%</div>
            <p className="text-sm text-gray-600">Customer loyalty</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
              Avg Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(customerData.averageSpend)}</div>
            <p className="text-sm text-gray-600">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
          <CardDescription>Customer groups by spending behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getCustomerSegments().map((segment, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{segment.segment}</div>
                    <div className="text-sm text-gray-500">{segment.count} customers</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(segment.revenue)}</div>
                    <div className="text-sm text-gray-500">Total revenue</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Revenue Share</span>
                  <span>{segment.percentage}%</span>
                </div>
                <Progress value={segment.percentage} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demographics and Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
            <CardDescription>Customer age group distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAgeGroups().map((group, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-blue-100 text-blue-800' :
                      index === 1 ? 'bg-green-100 text-green-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {group.age}
                    </div>
                    <span className="font-medium">{group.count} customers</span>
                  </div>
                  <Badge variant="outline">{group.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>Overall satisfaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  <span className="text-3xl font-bold text-green-600">{customerData.satisfactionScore}</span>
                  <span className="text-gray-500">/5</span>
                </div>
                <div className="text-sm text-green-600">Overall Rating</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Food Quality</span>
                  <span className="font-medium">4.7/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Service Speed</span>
                  <span className="font-medium">4.5/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Value for Money</span>
                  <span className="font-medium">4.4/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ambiance</span>
                  <span className="font-medium">4.6/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visit Frequency</CardTitle>
            <CardDescription>How often customers visit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Visit Frequency Chart</p>
                <p className="text-sm text-gray-400">Customer visit patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Visit Times</CardTitle>
            <CardDescription>When customers visit most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: 'Lunch (12PM-2PM)', visits: 156, percentage: 35.2 },
                { time: 'Dinner (7PM-9PM)', visits: 234, percentage: 52.8 },
                { time: 'Tea Time (4PM-6PM)', visits: 45, percentage: 10.2 },
                { time: 'Late Night (9PM+)', visits: 8, percentage: 1.8 },
              ].map((slot, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{slot.time}</div>
                    <div className="text-sm text-gray-500">{slot.visits} visits</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={slot.percentage} className="w-20 h-2" />
                    <span className="text-sm font-medium w-12">{slot.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Lifetime Value */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Insights</CardTitle>
          <CardDescription>Key customer behavior patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">₹2,450</div>
              <div className="text-sm text-blue-600">Avg Customer Lifetime Value</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">3.2</div>
              <div className="text-sm text-green-600">Avg Visits Per Month</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">45</div>
              <div className="text-sm text-purple-600">Days Avg Between Visits</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}