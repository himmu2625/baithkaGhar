'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  BedDouble,
  Target,
  Clock,
  Star,
  Download,
  Filter,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  IndianRupee,
  CalendarDays,
  UserCheck,
  Bed,
  Building2,
  CreditCard,
  MapPin,
  Globe,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthlyData: Array<{ month: string; revenue: number; bookings: number }>;
    channelBreakdown: Array<{ channel: string; revenue: number; percentage: number }>;
  };
  occupancy: {
    current: number;
    average: number;
    trend: number;
    dailyData: Array<{ date: string; occupancy: number; adr: number }>;
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    growth: number;
    sourceBreakdown: Array<{ source: string; count: number; percentage: number }>;
  };
  performance: {
    adr: number; // Average Daily Rate
    revpar: number; // Revenue Per Available Room
    arr: number; // Average Room Rate
    los: number; // Length of Stay
    guestSatisfaction: number;
    repeatGuests: number;
  };
  forecast: {
    nextMonth: {
      expectedRevenue: number;
      expectedOccupancy: number;
      confirmedBookings: number;
    };
    seasonal: Array<{ month: string; forecast: number; actual?: number }>;
  };
}

export default function AnalyticsPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [propertyId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/os/analytics/${propertyId}?range=${dateRange}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result.analytics);
      } else {
        // Generate sample data for demo
        setData(generateSampleAnalytics());
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setData(generateSampleAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAnalytics = (): AnalyticsData => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const channels = ['Direct', 'Booking.com', 'Expedia', 'MakeMyTrip', 'OYO'];
    const sources = ['Direct', 'OTA', 'Walk-in', 'Agent', 'Corporate'];

    return {
      revenue: {
        total: 1250000,
        growth: 15.2,
        monthlyData: months.map(month => ({
          month,
          revenue: Math.floor(Math.random() * 300000) + 150000,
          bookings: Math.floor(Math.random() * 100) + 50
        })),
        channelBreakdown: channels.map((channel, index) => ({
          channel,
          revenue: Math.floor(Math.random() * 400000) + 100000,
          percentage: Math.floor(Math.random() * 30) + 10
        }))
      },
      occupancy: {
        current: 78.5,
        average: 72.3,
        trend: 8.2,
        dailyData: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'MMM dd'),
          occupancy: Math.floor(Math.random() * 40) + 60,
          adr: Math.floor(Math.random() * 2000) + 3000
        }))
      },
      bookings: {
        total: 486,
        confirmed: 425,
        cancelled: 32,
        pending: 29,
        growth: 12.5,
        sourceBreakdown: sources.map(source => ({
          source,
          count: Math.floor(Math.random() * 150) + 50,
          percentage: Math.floor(Math.random() * 30) + 10
        }))
      },
      performance: {
        adr: 4250,
        revpar: 3335,
        arr: 4180,
        los: 2.3,
        guestSatisfaction: 4.6,
        repeatGuests: 23.5
      },
      forecast: {
        nextMonth: {
          expectedRevenue: 285000,
          expectedOccupancy: 82.0,
          confirmedBookings: 156
        },
        seasonal: months.map(month => ({
          month,
          forecast: Math.floor(Math.random() * 200000) + 200000,
          actual: Math.random() > 0.5 ? Math.floor(Math.random() * 200000) + 180000 : undefined
        }))
      }
    };
  };

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/os/analytics/${propertyId}/export?range=${dateRange}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Report exported successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to export report' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export report' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loading Analytics</h2>
            <p className="text-gray-600">Analyzing your property performance...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Performance insights and business intelligence</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900">
                    ₹{(data.revenue.total / 100000).toFixed(1)}L
                  </p>
                  <div className="flex items-center mt-1">
                    {data.revenue.growth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs ${data.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(data.revenue.growth)}% vs last period
                    </span>
                  </div>
                </div>
                <IndianRupee className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-blue-900">{data.occupancy.current}%</p>
                  <div className="flex items-center mt-1">
                    {data.occupancy.trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs ${data.occupancy.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(data.occupancy.trend)}% vs avg
                    </span>
                  </div>
                </div>
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Bookings</p>
                  <p className="text-3xl font-bold text-purple-900">{data.bookings.total}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">{data.bookings.growth}% growth</span>
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">ADR (Avg Daily Rate)</p>
                  <p className="text-3xl font-bold text-orange-900">₹{data.performance.adr}</p>
                  <p className="text-xs text-orange-600 mt-1">RevPAR: ₹{data.performance.revpar}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TabsList className="w-full grid grid-cols-5 rounded-none bg-gray-50 h-14">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="occupancy" className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Occupancy
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Forecast
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Average Daily Rate</p>
                      <p className="text-2xl font-bold text-gray-900">₹{data.performance.adr}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">RevPAR</p>
                      <p className="text-2xl font-bold text-gray-900">₹{data.performance.revpar}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Avg Length of Stay</p>
                      <p className="text-2xl font-bold text-gray-900">{data.performance.los} nights</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Guest Satisfaction</p>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-bold text-gray-900">{data.performance.guestSatisfaction}</p>
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Booking Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Confirmed</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{data.bookings.confirmed}</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({Math.round((data.bookings.confirmed / data.bookings.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Pending</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{data.bookings.pending}</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({Math.round((data.bookings.pending / data.bookings.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Cancelled</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{data.bookings.cancelled}</span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({Math.round((data.bookings.cancelled / data.bookings.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue.channelBreakdown.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100 text-blue-600' :
                          index === 1 ? 'bg-green-100 text-green-600' :
                          index === 2 ? 'bg-purple-100 text-purple-600' :
                          index === 3 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{channel.channel}</p>
                          <p className="text-sm text-gray-600">{channel.percentage}% of total revenue</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(channel.revenue / 100000).toFixed(1)}L</p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${channel.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {data.revenue.monthlyData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-600 rounded-t-sm min-h-[20px] flex items-end justify-center text-white text-xs font-medium pb-1"
                          style={{ 
                            height: `${(item.revenue / Math.max(...data.revenue.monthlyData.map(d => d.revenue))) * 200 + 20}px` 
                          }}
                        >
                          ₹{(item.revenue / 100000).toFixed(1)}L
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{item.month}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Growth</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{data.revenue.growth}%</p>
                    <p className="text-xs text-green-700">vs previous period</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Best Month</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      {data.revenue.monthlyData.reduce((max, item) => 
                        item.revenue > max.revenue ? item : max
                      ).month}
                    </p>
                    <p className="text-xs text-blue-700">
                      ₹{(data.revenue.monthlyData.reduce((max, item) => 
                        item.revenue > max.revenue ? item : max
                      ).revenue / 100000).toFixed(1)}L revenue
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IndianRupee className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Avg/Month</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      ₹{(data.revenue.monthlyData.reduce((sum, item) => sum + item.revenue, 0) / data.revenue.monthlyData.length / 100000).toFixed(1)}L
                    </p>
                    <p className="text-xs text-purple-700">average monthly revenue</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Occupancy Tab */}
          <TabsContent value="occupancy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Occupancy & ADR Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  {/* This would be replaced with a proper chart library like Recharts */}
                  <div className="flex items-end justify-between h-full gap-1">
                    {data.occupancy.dailyData.slice(-14).map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm min-h-[10px]"
                          style={{ 
                            height: `${(item.occupancy / 100) * 200}px` 
                          }}
                          title={`${item.date}: ${item.occupancy}% occupancy, ₹${item.adr} ADR`}
                        />
                        <p className="text-xs text-gray-600 mt-1 transform rotate-45 origin-left">
                          {item.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.bookings.sourceBreakdown.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === 0 ? 'bg-blue-100 text-blue-600' :
                            index === 1 ? 'bg-green-100 text-green-600' :
                            index === 2 ? 'bg-purple-100 text-purple-600' :
                            index === 3 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {source.source[0]}
                          </div>
                          <span className="font-medium">{source.source}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{source.count}</p>
                          <p className="text-sm text-gray-500">{source.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-green-700">Confirmation Rate</p>
                      <p className="text-2xl font-bold text-green-900">
                        {Math.round((data.bookings.confirmed / data.bookings.total) * 100)}%
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-red-700">Cancellation Rate</p>
                      <p className="text-2xl font-bold text-red-900">
                        {Math.round((data.bookings.cancelled / data.bookings.total) * 100)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-2">Repeat Guests</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${data.performance.repeatGuests}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-900">
                        {data.performance.repeatGuests}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Forecast vs Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {data.forecast.seasonal.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full flex flex-col gap-1">
                          <div 
                            className="w-full bg-blue-600 rounded-sm min-h-[10px]"
                            style={{ 
                              height: `${(item.forecast / Math.max(...data.forecast.seasonal.map(d => d.forecast))) * 180 + 10}px` 
                            }}
                            title={`Forecast: ₹${(item.forecast / 100000).toFixed(1)}L`}
                          />
                          {item.actual && (
                            <div 
                              className="w-full bg-green-500 rounded-sm min-h-[10px]"
                              style={{ 
                                height: `${(item.actual / Math.max(...data.forecast.seasonal.map(d => d.forecast))) * 180 + 10}px` 
                              }}
                              title={`Actual: ₹${(item.actual / 100000).toFixed(1)}L`}
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{item.month}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      <span>Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Actual</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Month Forecast</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Expected Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      ₹{(data.forecast.nextMonth.expectedRevenue / 100000).toFixed(1)}L
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bed className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Expected Occupancy</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {data.forecast.nextMonth.expectedOccupancy}%
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Confirmed Bookings</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {data.forecast.nextMonth.confirmedBookings}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}