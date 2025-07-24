"use client"

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  RefreshCw,
  ArrowLeft,
  Building,
  MapPin,
  Star,
  Activity,
  PieChart,
  Target
} from "lucide-react";
import Link from 'next/link';
import { HeatmapCalendar } from '@/components/admin/analytics/HeatmapCalendar';

interface HeatmapData {
  date: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  averageRate: number;
  totalRooms: number;
  occupiedRooms: number;
}

interface PropertyAnalytics {
  totalRevenue: number;
  averageOccupancy: number;
  totalBookings: number;
  averageRate: number;
  bestDay: {
    date: string;
    revenue: number;
    occupancy: number;
  };
  worstDay: {
    date: string;
    revenue: number;
    occupancy: number;
  };
}

interface Property {
  _id: string;
  name: string;
  title: string;
  location: string;
  totalHotelRooms: string;
  rating: number;
  reviewCount: number;
  isPublished: boolean;
  verificationStatus: string;
}

export default function PropertyAnalyticsPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const { toast } = useToast();

  // State management
  const [property, setProperty] = useState<Property | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch data on component mount and when filters change
  useEffect(() => {
    if (propertyId) {
      fetchPropertyData();
      fetchAnalyticsData();
    }
  }, [propertyId, dateRange]);

  const fetchPropertyData = async () => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`);
      const data = await response.json();
      
      if (data.success) {
        setProperty(data.property);
      } else {
        throw new Error(data.error || 'Failed to fetch property data');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property data",
        variant: "destructive",
      });
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      if (!refreshing) setLoading(true);

      const params = new URLSearchParams({
        propertyId,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const response = await fetch(`/api/admin/analytics/heatmap?${params}`);
      const data = await response.json();

      if (data.success) {
        setHeatmapData(data.data);
        setAnalytics(data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const handleExportData = () => {
    if (heatmapData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = [
      ['Date', 'Occupancy Rate (%)', 'Revenue (₹)', 'Bookings Count', 'Average Rate (₹)', 'Total Rooms', 'Occupied Rooms'],
      ...heatmapData.map(d => [
        d.date,
        d.occupancyRate.toFixed(2),
        d.revenue.toString(),
        d.bookingsCount.toString(),
        d.averageRate.toString(),
        d.totalRooms.toString(),
        d.occupiedRooms.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${property?.name || 'property'}-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data has been exported to CSV",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin/properties">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Property Analytics</h1>
          </div>
          {property && (
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="font-medium">{property.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{property.rating.toFixed(1)} ({property.reviewCount} reviews)</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Property Info Card */}
      {property && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rooms</p>
                  <p className="text-xl font-bold">{property.totalHotelRooms}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-xl font-bold">{property.rating.toFixed(1)}/5</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={property.isPublished ? 'default' : 'secondary'}>
                      {property.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant={property.verificationStatus === 'approved' ? 'default' : 'destructive'}>
                      {property.verificationStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="text-xl font-bold">{property.reviewCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2">Quick ranges:</span>
            {[
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 60 days', days: 60 },
              { label: 'Last 90 days', days: 90 },
              { label: 'Last 6 months', days: 180 },
              { label: 'Last year', days: 365 }
            ].map(({ label, days }) => (
              <Button
                key={days}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(days)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{analytics.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Occupancy</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.averageOccupancy.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.totalBookings.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{analytics.averageRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Insights */}
      {analytics && (analytics.bestDay.date || analytics.worstDay.date) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.bestDay.date && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-green-800">Best Performing Day</h3>
                    <p className="text-sm text-green-600">
                      {format(new Date(analytics.bestDay.date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Target className="h-3 w-3 mr-1" />
                    Top Day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-600">Revenue</p>
                    <p className="text-lg font-bold text-green-800">
                      ₹{analytics.bestDay.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Occupancy</p>
                    <p className="text-lg font-bold text-green-800">
                      {analytics.bestDay.occupancy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.worstDay.date && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-red-800">Opportunity Day</h3>
                    <p className="text-sm text-red-600">
                      {format(new Date(analytics.worstDay.date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Improve
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-red-600">Revenue</p>
                    <p className="text-lg font-bold text-red-800">
                      ₹{analytics.worstDay.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-600">Occupancy</p>
                    <p className="text-lg font-bold text-red-800">
                      {analytics.worstDay.occupancy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />

      {/* Heatmap Visualization */}
      <Tabs defaultValue="combined" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="combined">
            <PieChart className="h-4 w-4 mr-2" />
            Combined View
          </TabsTrigger>
          <TabsTrigger value="occupancy">
            <Users className="h-4 w-4 mr-2" />
            Occupancy
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="combined" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="both"
            title="Combined Occupancy & Revenue Heatmap"
          />
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="occupancy"
            title="Occupancy Rate Heatmap"
          />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="revenue"
            title="Revenue Performance Heatmap"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 