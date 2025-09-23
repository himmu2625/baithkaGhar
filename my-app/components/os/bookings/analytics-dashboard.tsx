'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Globe,
  Download,
  Filter,
  Eye,
  RefreshCw,
  Target,
  Percent,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  PieChart,
  LineChart,
  Activity,
  Building
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    labels: string[];
    total: number;
    growth: number;
  };
  occupancy: {
    current: number;
    trend: number[];
    average: number;
    peak: number;
    low: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    patterns: {
      dayOfWeek: number[];
      hourOfDay: number[];
      monthOfYear: number[];
    };
  };
  guests: {
    demographics: {
      ageGroups: { label: string; count: number; percentage: number }[];
      countries: { name: string; count: number; flag: string }[];
      guestTypes: { type: string; count: number; percentage: number }[];
    };
    satisfaction: {
      average: number;
      reviews: number;
      distribution: number[];
    };
  };
  sources: {
    direct: number;
    ota: { name: string; bookings: number; revenue: number }[];
    referrals: number;
    repeat: number;
  };
  performance: {
    adr: number; // Average Daily Rate
    revpar: number; // Revenue Per Available Room
    los: number; // Length of Stay
    conversionRate: number;
    cancellationRate: number;
  };
}

interface AnalyticsDashboardProps {
  propertyId: string;
}

export default function AnalyticsDashboard({ propertyId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [propertyId, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        revenue: {
          daily: [45000, 52000, 48000, 61000, 55000, 67000, 58000],
          weekly: [320000, 385000, 412000, 395000],
          monthly: [1250000, 1380000, 1420000, 1510000, 1680000, 1750000],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          total: 1750000,
          growth: 12.5
        },
        occupancy: {
          current: 78.5,
          trend: [65, 70, 75, 80, 85, 78, 82],
          average: 74.2,
          peak: 95.5,
          low: 45.2
        },
        bookings: {
          total: 1248,
          confirmed: 1156,
          pending: 67,
          cancelled: 25,
          patterns: {
            dayOfWeek: [120, 180, 165, 190, 210, 245, 138], // Mon-Sun
            hourOfDay: [5, 8, 12, 18, 25, 35, 45, 52, 48, 42, 38, 35, 32, 28, 25, 22, 18, 15, 12, 8, 6, 4, 3, 2],
            monthOfYear: [95, 102, 125, 135, 165, 185, 195, 188, 170, 145, 115, 98]
          }
        },
        guests: {
          demographics: {
            ageGroups: [
              { label: '18-25', count: 156, percentage: 15.2 },
              { label: '26-35', count: 324, percentage: 31.5 },
              { label: '36-45', count: 285, percentage: 27.8 },
              { label: '46-55', count: 185, percentage: 18.0 },
              { label: '55+', count: 76, percentage: 7.4 }
            ],
            countries: [
              { name: 'India', count: 456, flag: '🇮🇳' },
              { name: 'USA', count: 123, flag: '🇺🇸' },
              { name: 'UK', count: 89, flag: '🇬🇧' },
              { name: 'Germany', count: 67, flag: '🇩🇪' },
              { name: 'Australia', count: 45, flag: '🇦🇺' }
            ],
            guestTypes: [
              { type: 'Business', count: 425, percentage: 41.4 },
              { type: 'Leisure', count: 356, percentage: 34.7 },
              { type: 'Family', count: 178, percentage: 17.3 },
              { type: 'Groups', count: 67, percentage: 6.5 }
            ]
          },
          satisfaction: {
            average: 4.6,
            reviews: 892,
            distribution: [12, 8, 15, 165, 692] // 1-5 star distribution
          }
        },
        sources: {
          direct: 385,
          ota: [
            { name: 'Booking.com', bookings: 234, revenue: 580000 },
            { name: 'Expedia', bookings: 156, revenue: 395000 },
            { name: 'Agoda', bookings: 89, revenue: 225000 },
            { name: 'MakeMyTrip', bookings: 67, revenue: 168000 }
          ],
          referrals: 124,
          repeat: 193
        },
        performance: {
          adr: 4250, // Average Daily Rate
          revpar: 3340, // Revenue Per Available Room
          los: 2.8, // Length of Stay
          conversionRate: 15.6,
          cancellationRate: 2.1
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      setExporting(true);

      // Mock export - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create download link
      const filename = `booking-analytics-${dateRange}.${format}`;
      console.log(`Exporting ${filename}...`);

      alert(`${format.toUpperCase()} export completed successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          Unable to load analytics data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">Comprehensive booking and revenue analytics</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Select onValueChange={(format) => exportData(format as 'csv' | 'pdf' | 'excel')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Excel
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  PDF
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="occupancy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Occupancy
          </TabsTrigger>
          <TabsTrigger value="guests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Guests
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Sources
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(data.revenue.total)}
                </div>
                <div className="flex items-center mt-2">
                  {data.revenue.growth > 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${data.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(Math.abs(data.revenue.growth))} vs last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Occupancy Rate</CardTitle>
                <Building className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {formatPercentage(data.occupancy.current)}
                </div>
                <Progress value={data.occupancy.current} className="mt-2" />
                <p className="text-xs text-blue-600 mt-1">
                  Average: {formatPercentage(data.occupancy.average)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {data.bookings.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {data.bookings.confirmed} confirmed
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {data.bookings.pending} pending
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700">Guest Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {data.guests.satisfaction.average}/5.0
                </div>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(data.guests.satisfaction.average)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-yellow-600 ml-2">
                    ({data.guests.satisfaction.reviews} reviews)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue.daily.map((amount, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Day {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(amount / Math.max(...data.revenue.daily)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.guests.demographics.ageGroups.map((group) => (
                    <div key={group.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{group.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {group.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue.labels.map((month, index) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-12">{month}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                            style={{
                              width: `${(data.revenue.monthly[index] / Math.max(...data.revenue.monthly)) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold w-24 text-right">
                        {formatCurrency(data.revenue.monthly[index])}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ADR (Average Daily Rate)</span>
                    <span className="font-semibold">{formatCurrency(data.performance.adr)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">RevPAR</span>
                    <span className="font-semibold">{formatCurrency(data.performance.revpar)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-semibold">{formatPercentage(data.performance.conversionRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cancellation Rate</span>
                    <span className="font-semibold">{formatPercentage(data.performance.cancellationRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Length of Stay</span>
                    <span className="font-semibold">{data.performance.los} nights</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Occupancy Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {formatPercentage(data.occupancy.current)}
                    </div>
                    <p className="text-gray-600">Current Occupancy</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatPercentage(data.occupancy.peak)}
                      </div>
                      <p className="text-xs text-gray-600">Peak</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        {formatPercentage(data.occupancy.average)}
                      </div>
                      <p className="text-xs text-gray-600">Average</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatPercentage(data.occupancy.low)}
                      </div>
                      <p className="text-xs text-gray-600">Low</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">7-Day Trend</p>
                    {data.occupancy.trend.map((rate, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Day {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={rate} className="w-24" />
                          <span className="text-sm font-medium w-12 text-right">
                            {formatPercentage(rate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Day of Week Distribution</h4>
                    <div className="space-y-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 w-8">{day}</span>
                          <div className="flex items-center gap-2 flex-1 mx-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${(data.bookings.patterns.dayOfWeek[index] / Math.max(...data.bookings.patterns.dayOfWeek)) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {data.bookings.patterns.dayOfWeek[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Guest Origins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.guests.demographics.countries.map((country) => (
                    <div key={country.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-sm font-medium">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(country.count / Math.max(...data.guests.demographics.countries.map(c => c.count))) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">
                          {country.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.guests.demographics.guestTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${type.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">
                          {formatPercentage(type.percentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Booking Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.sources.direct}</div>
                      <div className="text-sm text-green-700">Direct Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{data.sources.repeat}</div>
                      <div className="text-sm text-blue-700">Repeat Guests</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">OTA Performance</h4>
                    <div className="space-y-3">
                      {data.sources.ota.map((ota) => (
                        <div key={ota.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ota.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{ota.bookings} bookings</div>
                            <div className="text-xs text-gray-600">{formatCurrency(ota.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Guest Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">
                      {data.guests.satisfaction.average}/5.0
                    </div>
                    <p className="text-gray-600">Average Rating</p>
                    <p className="text-sm text-gray-500">
                      Based on {data.guests.satisfaction.reviews} reviews
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-3">Rating Distribution</h4>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-8">{stars}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${(data.guests.satisfaction.distribution[stars - 1] / data.guests.satisfaction.reviews) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm w-8 text-right">
                            {data.guests.satisfaction.distribution[stars - 1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">ADR</CardTitle>
                <div className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(data.performance.adr)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-600">Average Daily Rate</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">RevPAR</CardTitle>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.performance.revpar)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-600">Revenue Per Available Room</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Conversion</CardTitle>
                <div className="text-2xl font-bold text-purple-900">
                  {formatPercentage(data.performance.conversionRate)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-600">Booking Conversion Rate</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">LOS</CardTitle>
                <div className="text-2xl font-bold text-orange-900">
                  {data.performance.los} nights
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-orange-600">Average Length of Stay</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {exporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span>Exporting data...</span>
          </div>
        </div>
      )}
    </div>
  );
}