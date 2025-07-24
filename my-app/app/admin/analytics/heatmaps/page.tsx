"use client"

import React, { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  MapPin,
  Building
} from "lucide-react";
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

interface HeatmapSummary {
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
}

export default function HeatmapsAnalyticsPage() {
  const { toast } = useToast();

  // State management
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [summary, setSummary] = useState<HeatmapSummary | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [metric, setMetric] = useState<'occupancy' | 'revenue' | 'both'>('both');

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch heatmap data when filters change
  useEffect(() => {
    if (properties.length > 0) {
      fetchHeatmapData();
    }
  }, [selectedProperty, dateRange, properties]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/admin/properties');
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.properties);
      } else {
        throw new Error(data.error || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    }
  };

  const fetchHeatmapData = async () => {
    try {
      if (!refreshing) setLoading(true);

      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty })
      });

      const response = await fetch(`/api/admin/analytics/heatmap?${params}`);
      const data = await response.json();

      if (data.success) {
        setHeatmapData(data.data);
        setSummary(data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
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
    fetchHeatmapData();
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
    link.download = `heatmap-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data has been exported to CSV",
    });
  };

  const selectedPropertyName = properties.find(p => p._id === selectedProperty)?.name || 'All Properties';

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Occupancy & Revenue Heatmaps</h1>
          <p className="text-muted-foreground mt-2">
            Visualize booking patterns and revenue trends across time
          </p>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Property Filter */}
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      All Properties
                    </div>
                  </SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property._id} value={property._id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{property.name}</span>
                          <span className="text-xs text-muted-foreground">{property.location}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* Metric */}
            <div className="space-y-2">
              <Label htmlFor="metric">Display Metric</Label>
              <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupancy">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Occupancy Only
                    </div>
                  </SelectItem>
                  <SelectItem value="revenue">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Revenue Only
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Both Metrics
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
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
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{summary.totalRevenue.toLocaleString()}
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
                    {summary.averageOccupancy.toFixed(1)}%
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
                    {summary.totalBookings.toLocaleString()}
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
                    ₹{summary.averageRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Best/Worst Day Cards */}
      {summary && (summary.bestDay.date || summary.worstDay.date) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.bestDay.date && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Best Performing Day</h3>
                    <p className="text-sm text-green-600">
                      {format(new Date(summary.bestDay.date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Top Day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-green-600">Revenue</p>
                    <p className="text-lg font-bold text-green-800">
                      ₹{summary.bestDay.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Occupancy</p>
                    <p className="text-lg font-bold text-green-800">
                      {summary.bestDay.occupancy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.worstDay.date && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-800">Lowest Performing Day</h3>
                    <p className="text-sm text-red-600">
                      {format(new Date(summary.worstDay.date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Low Day
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-red-600">Revenue</p>
                    <p className="text-lg font-bold text-red-800">
                      ₹{summary.worstDay.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-600">Occupancy</p>
                    <p className="text-lg font-bold text-red-800">
                      {summary.worstDay.occupancy.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Heatmap Tabs */}
      <Tabs defaultValue="combined" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="combined">Combined View</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Only</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Only</TabsTrigger>
        </TabsList>

        <TabsContent value="combined" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="both"
            title={`${selectedPropertyName} - Combined Heatmap`}
          />
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="occupancy"
            title={`${selectedPropertyName} - Occupancy Heatmap`}
          />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <HeatmapCalendar
            data={heatmapData}
            loading={loading}
            metric="revenue"
            title={`${selectedPropertyName} - Revenue Heatmap`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 