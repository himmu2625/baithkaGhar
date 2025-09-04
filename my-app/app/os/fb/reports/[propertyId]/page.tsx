'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  Clock,
  Package,
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileText,
  PieChart,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { SalesReports } from '@/components/os/fb/reports/SalesReports';
import { InventoryReports } from '@/components/os/fb/reports/InventoryReports';
import { MenuPerformance } from '@/components/os/fb/reports/MenuPerformance';
import { CustomerAnalytics } from '@/components/os/fb/reports/CustomerAnalytics';
import { ImportExportButtons } from '@/components/ui/import-export/ImportExportButtons';
import { ImportResult } from '@/lib/utils/fileProcessor';

interface ReportData {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growth: number;
}

interface MenuItemPerformance {
  id: string;
  name: string;
  category: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  profitMargin: number;
  popularityTrend: 'up' | 'down' | 'stable';
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageSpend: number;
  satisfactionScore: number;
  retentionRate: number;
}

interface InventoryMetrics {
  totalValue: number;
  wastePercentage: number;
  stockTurnover: number;
  topConsumingItems: Array<{
    name: string;
    consumed: number;
    value: number;
  }>;
  lowStockAlerts: number;
}

interface ReportsStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growthRate: number;
  topSellingItems: MenuItemPerformance[];
  customerMetrics: CustomerMetrics;
  inventoryMetrics: InventoryMetrics;
  dailyReports: ReportData[];
  weeklyReports: ReportData[];
  monthlyReports: ReportData[];
}

export default function FBReports() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [reportsData, setReportsData] = useState<ReportsStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    growthRate: 0,
    topSellingItems: [],
    customerMetrics: {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      averageSpend: 0,
      satisfactionScore: 0,
      retentionRate: 0,
    },
    inventoryMetrics: {
      totalValue: 0,
      wastePercentage: 0,
      stockTurnover: 0,
      topConsumingItems: [],
      lowStockAlerts: 0,
    },
    dailyReports: [],
    weeklyReports: [],
    monthlyReports: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        
        const [salesRes, inventoryRes, menuRes, customerRes] = await Promise.all([
          fetch(`/api/fb/reports/sales?propertyId=${propertyId}&period=${dateRange}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/reports/inventory?propertyId=${propertyId}&period=${dateRange}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/reports/menu-performance?propertyId=${propertyId}&period=${dateRange}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/reports/customer-analytics?propertyId=${propertyId}&period=${dateRange}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (!salesRes.ok || !inventoryRes.ok || !menuRes.ok || !customerRes.ok) {
          const errorMsg = `Failed to fetch reports data: Sales(${salesRes.status}), Inventory(${inventoryRes.status}), Menu(${menuRes.status}), Customer(${customerRes.status})`;
          throw new Error(errorMsg);
        }

        const [salesData, inventoryData, menuData, customerData] = await Promise.all([
          salesRes.json(),
          inventoryRes.json(),
          menuRes.json(),
          customerRes.json()
        ]);
        
        if (salesData.success && inventoryData.success && menuData.success && customerData.success) {
          setReportsData({
            totalRevenue: salesData.totalRevenue || 0,
            totalOrders: salesData.totalOrders || 0,
            averageOrderValue: salesData.averageOrderValue || 0,
            growthRate: salesData.growthRate || 0,
            topSellingItems: menuData.topItems || [],
            customerMetrics: customerData.metrics || reportsData.customerMetrics,
            inventoryMetrics: inventoryData.metrics || reportsData.inventoryMetrics,
            dailyReports: salesData.dailyReports || [],
            weeklyReports: salesData.weeklyReports || [],
            monthlyReports: salesData.monthlyReports || [],
          });
        } else {
          throw new Error('API returned error responses');
        }
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchReportsData();
    }
  }, [propertyId, session, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/fb/reports/export?propertyId=${propertyId}&period=${dateRange}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fb-report-${dateRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
      // For development, show mock export
      alert(`Export to ${format.toUpperCase()} would be generated here`);
    }
  };

  const handleImportReportData = async (result: ImportResult, transformedData: any[]) => {
    try {
      const response = await fetch(`/api/fb/reports/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          propertyId,
          reportData: transformedData,
          period: dateRange,
          options: {
            skipExisting: false,
            updateExisting: true
          }
        })
      });

      if (response.ok) {
        const importResult = await response.json();
        alert(`Import completed: ${importResult.importResults.imported} imported, ${importResult.importResults.updated} updated, ${importResult.importResults.failed} failed`);
        
        // Refresh reports data
        // Add refresh logic here when API is available
        handleRefresh();
      } else {
        alert('Import failed. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">F&B Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive analytics and performance reports</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange as (value: string) => void}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <ImportExportButtons
            importTitle="Import Report Data"
            importDescription="Upload report data from Excel, CSV, or JSON file"
            importType="menu-items"
            onImportComplete={handleImportReportData}
            exportTitle="Export Reports"
            exportDescription="Download reports in your preferred format"
            exportData={[
              ...reportsData.dailyReports,
              ...reportsData.weeklyReports,
              ...reportsData.monthlyReports,
              ...reportsData.topSellingItems
            ]}
            exportFields={[
              { key: 'period', label: 'Period', required: true },
              { key: 'revenue', label: 'Revenue', required: true },
              { key: 'orders', label: 'Orders' },
              { key: 'averageOrderValue', label: 'Average Order Value' },
              { key: 'growth', label: 'Growth Rate' }
            ]}
            exportFilename="fb-reports"
            splitButtons={true}
          />
          
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportsData.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs">
              {reportsData.growthRate >= 0 ? (
                <div className="flex items-center text-green-600">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{reportsData.growthRate.toFixed(1)}%</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>{reportsData.growthRate.toFixed(1)}%</span>
                </div>
              )}
              <span className="text-muted-foreground">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(reportsData.totalOrders / 30)} avg per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportsData.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              Per customer transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.customerMetrics.satisfactionScore}/5</div>
            <p className="text-xs text-muted-foreground">
              {reportsData.customerMetrics.retentionRate}% retention rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Items</CardTitle>
            <CardDescription>Best selling menu items by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData.topSellingItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.totalOrders} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{item.totalRevenue.toLocaleString()}</div>
                    <div className="flex items-center space-x-1">
                      {item.popularityTrend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : item.popularityTrend === 'down' ? (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                      <span className="text-xs text-gray-500">{item.profitMargin}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Analytics</CardTitle>
            <CardDescription>Customer behavior and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Customers</span>
              <span className="font-medium">{reportsData.customerMetrics.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Customers</span>
              <span className="font-medium text-green-600">{reportsData.customerMetrics.newCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Returning Customers</span>
              <span className="font-medium text-blue-600">{reportsData.customerMetrics.returningCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Spend</span>
              <span className="font-medium">₹{reportsData.customerMetrics.averageSpend}</span>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>Retention Rate</span>
                <span>{reportsData.customerMetrics.retentionRate}%</span>
              </div>
              <Progress value={reportsData.customerMetrics.retentionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Insights</CardTitle>
            <CardDescription>Stock performance and waste metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Inventory Value</span>
              <span className="font-medium">₹{reportsData.inventoryMetrics.totalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Stock Turnover</span>
              <span className="font-medium">{reportsData.inventoryMetrics.stockTurnover}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Waste Percentage</span>
              <span className="font-medium text-red-600">{reportsData.inventoryMetrics.wastePercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Low Stock Alerts</span>
              <Badge variant="destructive">{reportsData.inventoryMetrics.lowStockAlerts}</Badge>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Top Consuming Items</div>
              <div className="space-y-2">
                {reportsData.inventoryMetrics.topConsumingItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{item.consumed} units</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="menu">Menu Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>

        {/* Sales Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <SalesReports
            propertyId={propertyId}
            dateRange={dateRange}
            salesData={{
              totalRevenue: reportsData.totalRevenue,
              totalOrders: reportsData.totalOrders,
              averageOrderValue: reportsData.averageOrderValue,
              growthRate: reportsData.growthRate,
              dailyReports: reportsData.dailyReports,
            }}
          />
        </TabsContent>

        {/* Menu Performance Tab */}
        <TabsContent value="menu" className="space-y-6">
          <MenuPerformance
            propertyId={propertyId}
            dateRange={dateRange}
            menuData={{
              topSellingItems: reportsData.topSellingItems,
              categoryPerformance: [], // Would be populated with actual data
            }}
          />
        </TabsContent>

        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <InventoryReports
            propertyId={propertyId}
            dateRange={dateRange}
            inventoryData={reportsData.inventoryMetrics}
          />
        </TabsContent>

        {/* Customer Analytics Tab */}
        <TabsContent value="customers" className="space-y-6">
          <CustomerAnalytics
            propertyId={propertyId}
            dateRange={dateRange}
            customerData={reportsData.customerMetrics}
          />
        </TabsContent>
      </Tabs>

      {/* Revenue Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue performance over time</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Revenue Chart</p>
              <p className="text-sm text-gray-400">
                Integration with charting library (Chart.js, Recharts, etc.) needed
              </p>
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                {reportsData.dailyReports.slice(-7).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium">₹{(day.revenue / 1000).toFixed(0)}k</div>
                    <div className="text-gray-500">{new Date(day.period).toLocaleDateString('en', { weekday: 'short' })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}