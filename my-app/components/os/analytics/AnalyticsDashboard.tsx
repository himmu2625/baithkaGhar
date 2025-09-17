'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Home,
  Wrench,
  Package,
  Download
} from 'lucide-react';
import LoadingSpinner from '@/components/os/common/LoadingSpinner';

interface AnalyticsData {
  roomUtilization: {
    daily: Array<{
      date: string;
      occupancyRate: number;
      availableRooms: number;
      occupiedRooms: number;
      maintenanceRooms: number;
      revenue: number;
    }>;
    byRoomType: Array<{
      type: string;
      utilization: number;
      revenue: number;
      count: number;
    }>;
    peakHours: Array<{
      hour: number;
      occupancy: number;
    }>;
  };
  maintenance: {
    costs: Array<{
      month: string;
      preventive: number;
      corrective: number;
      emergency: number;
    }>;
    frequency: Array<{
      type: string;
      count: number;
      avgCost: number;
      avgDuration: number;
    }>;
    downtime: Array<{
      roomId: string;
      roomNumber: string;
      hours: number;
      cost: number;
    }>;
  };
  housekeeping: {
    efficiency: Array<{
      staff: string;
      tasksCompleted: number;
      avgTime: number;
      qualityScore: number;
    }>;
    taskTypes: Array<{
      type: string;
      count: number;
      avgDuration: number;
      efficiency: number;
    }>;
    workload: Array<{
      date: string;
      totalTasks: number;
      completedTasks: number;
      overdueTasks: number;
    }>;
  };
  assets: {
    depreciation: Array<{
      category: string;
      originalValue: number;
      currentValue: number;
      depreciationRate: number;
    }>;
    lifecycle: Array<{
      assetId: string;
      name: string;
      age: number;
      condition: string;
      nextMaintenance: string;
      estimatedLife: number;
    }>;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedProperty]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/os/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange,
          propertyId: selectedProperty === 'all' ? undefined : selectedProperty
        })
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const response = await fetch('/api/os/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          dateRange,
          propertyId: selectedProperty === 'all' ? undefined : selectedProperty
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">Comprehensive insights into property operations</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              <SelectItem value="prop1">Property 1</SelectItem>
              <SelectItem value="prop2">Property 2</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Occupancy</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.roomUtilization.daily.reduce((acc, day) => acc + day.occupancyRate, 0) /
               (data?.roomUtilization.daily.length || 1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.maintenance.costs.reduce((acc, month) =>
                acc + month.preventive + month.corrective + month.emergency, 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Efficiency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data?.housekeeping.efficiency.reduce((acc, staff) =>
                acc + staff.qualityScore, 0) / (data?.housekeeping.efficiency.length || 1) || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +1.8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.assets.depreciation.reduce((acc, asset) =>
                acc + asset.currentValue, 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current depreciated value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="utilization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="utilization">Room Utilization</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Room Utilization Analytics</h2>
            <Button onClick={() => exportReport('utilization')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Occupancy Rate</CardTitle>
                <CardDescription>Occupancy percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.roomUtilization.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="occupancyRate"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Type Performance</CardTitle>
                <CardDescription>Utilization by room category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.roomUtilization.byRoomType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="utilization" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
                <CardDescription>Hourly occupancy patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.roomUtilization.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="occupancy" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Occupancy</CardTitle>
                <CardDescription>Revenue correlation with occupancy</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.roomUtilization.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="occupancyRate"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Maintenance Cost Analysis</h2>
            <Button onClick={() => exportReport('maintenance')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Maintenance Costs</CardTitle>
                <CardDescription>Breakdown by maintenance type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.maintenance.costs}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="preventive" stackId="a" fill="#82ca9d" />
                    <Bar dataKey="corrective" stackId="a" fill="#8884d8" />
                    <Bar dataKey="emergency" stackId="a" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Frequency</CardTitle>
                <CardDescription>Issues by type and cost</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.maintenance.frequency}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data?.maintenance.frequency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="housekeeping" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Housekeeping Efficiency Metrics</h2>
            <Button onClick={() => exportReport('housekeeping')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Quality scores and task completion</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.housekeeping.efficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staff" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="qualityScore" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trends</CardTitle>
                <CardDescription>Daily workload management</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.housekeeping.workload}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalTasks" stroke="#8884d8" />
                    <Line type="monotone" dataKey="completedTasks" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="overdueTasks" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Asset Depreciation Reports</h2>
            <Button onClick={() => exportReport('assets')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Depreciation by Category</CardTitle>
                <CardDescription>Current vs original value</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.assets.depreciation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="originalValue" fill="#8884d8" />
                    <Bar dataKey="currentValue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Lifecycle Management</CardTitle>
                <CardDescription>Asset conditions and maintenance schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.assets.lifecycle.map((asset, index) => (
                    <div key={asset.assetId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Age: {asset.age} years | Next maintenance: {asset.nextMaintenance}
                        </p>
                      </div>
                      <Badge
                        variant={
                          asset.condition === 'excellent' ? 'default' :
                          asset.condition === 'good' ? 'secondary' :
                          asset.condition === 'fair' ? 'outline' : 'destructive'
                        }
                      >
                        {asset.condition}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}