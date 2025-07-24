"use client"

import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building,
  BarChart3,
  Users,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Percent,
} from "lucide-react";

interface BulkPricingUpdate {
  id: string;
  timestamp: string;
  adminUser: string;
  propertiesCount: number;
  dateRangesCount: number;
  updateType: 'direct_price' | 'multiplier' | 'base_price';
  reason: string;
  avgPriceChange: number;
  totalRevueImpact: number;
  status: 'completed' | 'failed' | 'partial';
}

interface PricingMetrics {
  totalUpdates: number;
  propertiesAffected: number;
  averagePriceIncrease: number;
  revenueImpact: number;
  mostUsedReason: string;
  updatesByType: {
    direct_price: number;
    multiplier: number;
    base_price: number;
  };
  successRate: number;
}

interface BulkPricingAnalyticsProps {
  propertyId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function BulkPricingAnalytics({ propertyId, dateRange }: BulkPricingAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PricingMetrics | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<BulkPricingUpdate[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: timeRange,
        ...(propertyId && { propertyId }),
        ...(dateRange && {
          startDate: format(dateRange.start, 'yyyy-MM-dd'),
          endDate: format(dateRange.end, 'yyyy-MM-dd')
        })
      });

      const [metricsResponse, updatesResponse] = await Promise.all([
        fetch(`/api/admin/analytics/bulk-pricing?${params}`),
        fetch(`/api/admin/analytics/bulk-pricing/recent?${params}`)
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
      }

      if (updatesResponse.ok) {
        const updatesData = await updatesResponse.json();
        setRecentUpdates(updatesData.updates || []);
      }
    } catch (error) {
      console.error('Error fetching bulk pricing analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, propertyId, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Pricing Analytics</h2>
          <p className="text-muted-foreground">
            Track the impact and usage of bulk pricing operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Updates</p>
                  <p className="text-2xl font-bold">{metrics.totalUpdates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Properties Affected</p>
                  <p className="text-2xl font-bold">{metrics.propertiesAffected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  metrics.averagePriceIncrease >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {metrics.averagePriceIncrease >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Price Change</p>
                  <p className={`text-2xl font-bold ${
                    metrics.averagePriceIncrease >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.averagePriceIncrease >= 0 ? '+' : ''}{metrics.averagePriceIncrease.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue Impact</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.revenueImpact)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Update Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Types Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of bulk pricing update methods used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Multiplier Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metrics.updatesByType.multiplier}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${(metrics.updatesByType.multiplier / metrics.totalUpdates) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Direct Price Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metrics.updatesByType.direct_price}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ 
                              width: `${(metrics.updatesByType.direct_price / metrics.totalUpdates) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Base Price Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metrics.updatesByType.base_price}</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ 
                              width: `${(metrics.updatesByType.base_price / metrics.totalUpdates) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate & Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Success rate and operation efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">
                          {metrics.successRate.toFixed(1)}%
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Most Used Reason</span>
                      <Badge variant="secondary">{metrics.mostUsedReason}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Properties per Update</span>
                      <span className="text-sm font-medium">
                        {(metrics.propertiesAffected / metrics.totalUpdates).toFixed(1)} avg
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        {Math.round(metrics.successRate)}% of bulk updates completed successfully
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Trends</CardTitle>
              <CardDescription>
                Historical view of bulk pricing operations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-md h-[300px] flex items-center justify-center p-4">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Pricing trends chart</p>
                  <p className="text-xs text-gray-400 mt-1">
                    (Will be implemented with Chart.js or Recharts)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bulk Updates</CardTitle>
              <CardDescription>
                Latest bulk pricing operations and their impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentUpdates.length > 0 ? (
                <div className="space-y-3">
                  {recentUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          update.status === 'completed' ? 'bg-green-100' :
                          update.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {update.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : update.status === 'failed' ? (
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {update.updateType.replace('_', ' ').toUpperCase()} - {update.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {update.propertiesCount} properties • {update.dateRangesCount} date ranges
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          update.avgPriceChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {update.avgPriceChange >= 0 ? '+' : ''}{update.avgPriceChange.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(update.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent bulk updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 