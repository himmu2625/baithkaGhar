'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Star,
  Target,
  Award,
  Clock,
  MapPin,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsData {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    conversionRate: number;
    customerSatisfaction: number;
    period: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  bookings: {
    total: number;
    statusBreakdown: Record<string, number>;
    eventTypeBreakdown: Array<{
      _id: string;
      count: number;
      totalRevenue: number;
    }>;
    monthlyTrend: Array<{
      _id: { year: number; month: number };
      count: number;
      revenue: number;
    }>;
    growthRate: number;
  };
  leads: {
    total: number;
    conversionRate: number;
    sourceBreakdown: Array<{
      _id: string;
      count: number;
      averageScore: number;
      conversions: number;
      conversionRate: number;
    }>;
    totalConversionValue: number;
  };
  quotes: {
    total: number;
    conversionRate: number;
    totalValue: number;
    acceptedValue: number;
    averageQuoteValue: number;
  };
  feedback: {
    totalFeedbacks: number;
    completionRate: number;
    averageSatisfaction: number;
    npsScore: number;
    npsBreakdown: Record<string, number>;
  };
  revenue: {
    totalRevenue: number;
    averageBookingValue: number;
    collectionRate: number;
    revenueByEventType: Array<{
      _id: string;
      revenue: number;
      bookings: number;
      averageValue: number;
    }>;
    monthlyTrend: Array<{
      _id: { year: number; month: number };
      revenue: number;
      bookings: number;
    }>;
    growthRate: number;
  };
  venues: {
    utilizationByVenue: Array<{
      _id: string;
      bookings: number;
      revenue: number;
      averageBookingValue: number;
    }>;
    mostPopularVenue: any;
    totalVenuesUsed: number;
  };
  customers: {
    totalUniqueCustomers: number;
    repeatCustomers: {
      count: number;
      details: Array<any>;
    };
  };
  performance: {
    averageLeadTime: number;
    onTimeDeliveryRate: number;
    customerAcquisitionCost: number;
    averageLifetimeValue: number;
    averageBookingsPerCustomer: number;
  };
}

interface EventAnalyticsDashboardProps {
  propertyId: string;
}

export default function EventAnalyticsDashboard({ propertyId }: EventAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [propertyId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/analytics?propertyId=${propertyId}&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growthRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (growthRate: number) => {
    if (growthRate > 0) return 'text-green-600';
    if (growthRate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Event Analytics Dashboard</h2>
          <p className="text-gray-600">
            Analytics for {format(new Date(analytics.summary.dateRange.start), 'MMM dd')} - {format(new Date(analytics.summary.dateRange.end), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{analytics.summary.totalBookings}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.bookings.growthRate)}
                  <span className={`text-sm ml-1 ${getTrendColor(analytics.bookings.growthRate)}`}>
                    {analytics.bookings.growthRate > 0 ? '+' : ''}{analytics.bookings.growthRate}%
                  </span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.summary.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analytics.revenue.growthRate)}
                  <span className={`text-sm ml-1 ${getTrendColor(analytics.revenue.growthRate)}`}>
                    {analytics.revenue.growthRate > 0 ? '+' : ''}{analytics.revenue.growthRate}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.summary.averageBookingValue)}</p>
                <p className="text-sm text-gray-500">per event</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics.summary.conversionRate}%</p>
                <p className="text-sm text-gray-500">lead to booking</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{analytics.summary.customerSatisfaction}/10</p>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-500 ml-1">
                    NPS: {analytics.feedback.npsScore}
                  </span>
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Breakdown</CardTitle>
                <CardDescription>Distribution of bookings by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.bookings.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">{status.replace('-', ' ')}</Badge>
                        <span className="text-sm text-gray-600">{count} bookings</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {analytics.bookings.total > 0 
                            ? Math.round((count / analytics.bookings.total) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Event Type Performance</CardTitle>
                <CardDescription>Revenue and bookings by event type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.bookings.eventTypeBreakdown.slice(0, 5).map((type) => (
                    <div key={type._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type._id}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(type.totalRevenue)}</div>
                          <div className="text-xs text-gray-500">{type.count} events</div>
                        </div>
                      </div>
                      <Progress 
                        value={analytics.revenue.totalRevenue > 0 
                          ? (type.totalRevenue / analytics.revenue.totalRevenue) * 100 
                          : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Trend</CardTitle>
              <CardDescription>Monthly booking and revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.bookings.monthlyTrend.map((month) => (
                  <div key={`${month._id.year}-${month._id.month}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {format(new Date(month._id.year, month._id.month - 1), 'MMMM yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">{month.count} bookings</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(month.revenue)}</div>
                      <div className="text-sm text-gray-600">
                        Avg: {formatCurrency(month.count > 0 ? month.revenue / month.count : 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Total revenue and collection metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(analytics.revenue.totalRevenue)}
                    </div>
                    <div className="text-sm text-green-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {analytics.revenue.collectionRate}%
                    </div>
                    <div className="text-sm text-blue-600">Collection Rate</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Booking Value</span>
                    <span className="font-medium">{formatCurrency(analytics.revenue.averageBookingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className={`font-medium ${getTrendColor(analytics.revenue.growthRate)}`}>
                      {analytics.revenue.growthRate > 0 ? '+' : ''}{analytics.revenue.growthRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Event Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Event Type</CardTitle>
                <CardDescription>Revenue breakdown by different event types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.revenue.revenueByEventType.slice(0, 5).map((type) => (
                    <div key={type._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type._id}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(type.revenue)}</div>
                          <div className="text-xs text-gray-500">
                            Avg: {formatCurrency(type.averageValue)} • {type.bookings} events
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={analytics.revenue.totalRevenue > 0 
                          ? (type.revenue / analytics.revenue.totalRevenue) * 100 
                          : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Sources Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources Performance</CardTitle>
                <CardDescription>Performance metrics by lead source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.leads.sourceBreakdown.map((source) => (
                    <div key={source._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{source._id.replace('-', ' ')}</span>
                        <Badge variant="outline">{source.conversionRate}% conversion</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Leads</div>
                          <div className="font-medium">{source.count}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Conversions</div>
                          <div className="font-medium">{source.conversions}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Avg Score</div>
                          <div className="font-medium">{Math.round(source.averageScore)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lead Conversion Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Conversion Summary</CardTitle>
                <CardDescription>Overall lead performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{analytics.leads.total}</div>
                    <div className="text-sm text-blue-600">Total Leads</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{analytics.leads.conversionRate}%</div>
                    <div className="text-sm text-green-600">Conversion Rate</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Conversion Value</span>
                    <span className="font-medium">{formatCurrency(analytics.leads.totalConversionValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Value per Conversion</span>
                    <span className="font-medium">
                      {formatCurrency(
                        analytics.leads.total > 0 
                          ? analytics.leads.totalConversionValue / (analytics.leads.total * analytics.leads.conversionRate / 100)
                          : 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Overview</CardTitle>
                <CardDescription>Customer feedback and satisfaction metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{analytics.feedback.averageSatisfaction}/10</div>
                    <div className="text-sm text-yellow-600">Avg Satisfaction</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className={`text-2xl font-bold ${analytics.feedback.npsScore >= 50 ? 'text-green-700' : 
                      analytics.feedback.npsScore >= 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {analytics.feedback.npsScore}
                    </div>
                    <div className="text-sm text-purple-600">NPS Score</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Feedbacks</span>
                    <span className="font-medium">{analytics.feedback.totalFeedbacks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium">{analytics.feedback.completionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NPS Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>NPS Breakdown</CardTitle>
                <CardDescription>Distribution of customer sentiment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-700">
                      {analytics.feedback.npsBreakdown.promoter || 0}
                    </div>
                    <div className="text-sm text-green-600">Promoters</div>
                    <div className="text-xs text-gray-500">(9-10)</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-700">
                      {analytics.feedback.npsBreakdown.passive || 0}
                    </div>
                    <div className="text-sm text-yellow-600">Passives</div>
                    <div className="text-xs text-gray-500">(7-8)</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-700">
                      {analytics.feedback.npsBreakdown.detractor || 0}
                    </div>
                    <div className="text-sm text-red-600">Detractors</div>
                    <div className="text-xs text-gray-500">(0-6)</div>
                  </div>
                </div>

                {analytics.feedback.totalFeedbacks > 0 && (
                  <div className="space-y-2">
                    <Progress 
                      value={(analytics.feedback.npsBreakdown.promoter || 0) / analytics.feedback.totalFeedbacks * 100} 
                      className="h-2 bg-red-200" 
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>All Detractors</span>
                      <span>All Promoters</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Venue Utilization</CardTitle>
              <CardDescription>Performance metrics for different venues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Top Performing Venues</h4>
                  {analytics.venues.utilizationByVenue.slice(0, 5).map((venue, index) => (
                    <div key={venue._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">Venue {venue._id}</span>
                        </div>
                        <Badge variant="secondary">{venue.bookings} bookings</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Revenue</div>
                          <div className="font-medium">{formatCurrency(venue.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Avg Value</div>
                          <div className="font-medium">{formatCurrency(venue.averageBookingValue)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Venue Statistics</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Total Venues Used</div>
                      <div className="text-xl font-bold">{analytics.venues.totalVenuesUsed}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Most Popular Venue</div>
                      <div className="text-lg font-bold">
                        {analytics.venues.mostPopularVenue 
                          ? `Venue ${analytics.venues.mostPopularVenue._id}`
                          : 'N/A'
                        }
                      </div>
                      {analytics.venues.mostPopularVenue && (
                        <div className="text-sm text-gray-600">
                          {analytics.venues.mostPopularVenue.bookings} bookings
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Efficiency</CardTitle>
                <CardDescription>Key operational metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Lead Time</span>
                    <span className="font-medium">{analytics.performance.averageLeadTime} days</span>
                  </div>
                  <Progress value={Math.min(analytics.performance.averageLeadTime / 30 * 100, 100)} className="h-2 mt-1" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">On-Time Delivery</span>
                    <span className="font-medium">{analytics.performance.onTimeDeliveryRate}%</span>
                  </div>
                  <Progress value={analytics.performance.onTimeDeliveryRate} className="h-2 mt-1" />
                </div>

                <div className="pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(analytics.performance.customerAcquisitionCost)}
                    </div>
                    <div className="text-sm text-gray-600">Customer Acquisition Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Customer-related performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(analytics.performance.averageLifetimeValue)}
                  </div>
                  <div className="text-sm text-green-600">Avg Lifetime Value</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {analytics.performance.averageBookingsPerCustomer}
                  </div>
                  <div className="text-sm text-blue-600">Avg Bookings per Customer</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {analytics.customers.totalUniqueCustomers}
                  </div>
                  <div className="text-sm text-purple-600">Total Unique Customers</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Loyalty</CardTitle>
                <CardDescription>Repeat customer metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {analytics.customers.repeatCustomers.count}
                  </div>
                  <div className="text-sm text-orange-600">Repeat Customers</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Repeat Customer Rate</div>
                  <Progress 
                    value={analytics.customers.totalUniqueCustomers > 0 
                      ? (analytics.customers.repeatCustomers.count / analytics.customers.totalUniqueCustomers) * 100 
                      : 0
                    } 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {analytics.customers.totalUniqueCustomers > 0 
                      ? Math.round((analytics.customers.repeatCustomers.count / analytics.customers.totalUniqueCustomers) * 100)
                      : 0}% of customers have booked multiple events
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}