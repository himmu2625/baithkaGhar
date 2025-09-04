'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Receipt,
  Users,
  Clock,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  salesByHour: {
    hour: number;
    sales: number;
    orders: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  serverPerformance: {
    serverId: string;
    serverName: string;
    orders: number;
    sales: number;
    commission: number;
  }[];
  dailyComparison: {
    today: number;
    yesterday: number;
    change: number;
  };
}

interface SalesReportingProps {
  salesData: SalesData;
  onRefresh?: () => void;
  onExportReport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

export default function SalesReporting({ 
  salesData, 
  onRefresh, 
  onExportReport 
}: SalesReportingProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <AlertCircle className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Reporting & Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button variant="outline" onClick={() => onExportReport?.('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {selectedPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.totalSales.toLocaleString()}</div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(salesData.dailyComparison.change)}`}>
              {getChangeIcon(salesData.dailyComparison.change)}
              {salesData.dailyComparison.change > 0 ? '+' : ''}{salesData.dailyComparison.change}% vs yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalOrders}</div>
            <div className="text-sm text-muted-foreground">
              orders processed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.averageOrderValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              per order
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData.salesByHour.reduce((peak, current) => 
                current.sales > peak.sales ? current : peak
              ).hour}:00
            </div>
            <div className="text-sm text-muted-foreground">
              busiest time
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hourly Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {salesData.salesByHour.map(hour => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm">{hour.hour}:00 - {hour.hour + 1}:00</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="bg-primary h-2 rounded"
                          style={{ 
                            width: `${(hour.sales / Math.max(...salesData.salesByHour.map(h => h.sales))) * 100}px` 
                          }}
                        />
                        <span className="text-sm font-medium w-16 text-right">
                          ${hour.sales.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Today</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${salesData.dailyComparison.today.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Yesterday</p>
                    <p className="text-2xl font-bold text-gray-600">
                      ${salesData.dailyComparison.yesterday.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-gray-600" />
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p className={`text-xl font-bold ${getChangeColor(salesData.dailyComparison.change)}`}>
                    {salesData.dailyComparison.change > 0 ? '+' : ''}
                    {salesData.dailyComparison.change}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topSellingItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${item.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Performance & Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.serverPerformance
                  .sort((a, b) => b.sales - a.sales)
                  .map((server, index) => (
                    <div key={server.serverId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          <Badge variant={index === 0 ? 'default' : 'outline'}>
                            #{index + 1}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{server.serverName}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {server.serverId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="font-bold">{server.orders}</p>
                          <p className="text-xs text-muted-foreground">Orders</p>
                        </div>
                        <div>
                          <p className="font-bold text-green-600">
                            ${server.sales.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Sales</p>
                        </div>
                        <div>
                          <p className="font-bold text-blue-600">
                            ${server.commission.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Commission</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.salesByPaymentMethod.map(payment => (
                  <div key={payment.method} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{payment.method}</span>
                      <span className="text-sm text-muted-foreground">
                        {payment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${payment.percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-green-600">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onExportReport?.('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => onExportReport?.('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => onExportReport?.('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}