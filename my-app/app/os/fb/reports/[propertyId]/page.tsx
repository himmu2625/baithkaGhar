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
  UserPlus,
  UserCheck,
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
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  Heart
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
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to F&B Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Reports & Analytics</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <PieChart className="h-4 w-4" />
                    <span className="text-violet-100">Business Intelligence & Insights</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">₹{reportsData.totalRevenue.toLocaleString()}</div>
              <div className="text-violet-200 text-sm">Total Revenue</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reportsData.totalOrders}</div>
              <div className="text-violet-200 text-sm">Total Orders</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <Select value={dateRange} onValueChange={setDateRange as (value: string) => void}>
                <SelectTrigger className="w-48 border-0 bg-white/20 hover:bg-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-white backdrop-blur-sm group">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue className="text-white font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                  <SelectItem value="today" className="rounded-lg hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200 p-3 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100">
                        <Clock className="w-4 h-4 text-violet-600" />
                      </div>
                      <span className="font-medium text-violet-800">Today</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="week" className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-blue-800">Week</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="month" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-green-800">Month</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="quarter" className="rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 p-3 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100">
                        <Calendar className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="font-medium text-orange-800">Quarter</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="year" className="rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 p-3 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-purple-800">Year</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={() => handleExport('pdf')}
                className="bg-white text-violet-600 hover:bg-white/90 font-semibold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Performance Indicators - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">₹{reportsData.totalRevenue.toLocaleString()}</div>
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
              <span className="text-emerald-600">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Orders</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{reportsData.totalOrders.toLocaleString()}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">{Math.round(reportsData.totalOrders / 30)} avg per day</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Avg Order Value</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">₹{reportsData.averageOrderValue}</div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">Per customer transaction</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">Customer Satisfaction</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-amber-900 mb-1">{reportsData.customerMetrics.satisfactionScore}/5</div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-600">{reportsData.customerMetrics.retentionRate}% retention rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-yellow-50/20 to-orange-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-red-100/80 border-b border-yellow-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-yellow-900">
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <span className="font-bold">Top Performing Items</span>
                <div className="text-sm font-normal text-yellow-700 mt-1">Best selling menu items by revenue and popularity</div>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-yellow-600 font-medium">High Revenue</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {reportsData.topSellingItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="group relative overflow-hidden bg-gradient-to-r from-white to-yellow-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Ranking indicator */}
                  <div className="absolute top-4 left-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                      'bg-gradient-to-r from-blue-400 to-indigo-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="relative p-6 pl-20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-yellow-900">{item.name}</h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 shadow-sm">
                                {item.totalOrders} orders
                              </Badge>
                              <Badge className={`border-0 shadow-sm ${
                                item.profitMargin > 60 ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                                item.profitMargin > 40 ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800' :
                                'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800'
                              }`}>
                                {item.profitMargin}% margin
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-900">₹{item.totalRevenue.toLocaleString()}</div>
                            <div className="flex items-center justify-end space-x-2 mt-1">
                              {item.popularityTrend === 'up' ? (
                                <div className="flex items-center text-green-600">
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">Rising</span>
                                </div>
                              ) : item.popularityTrend === 'down' ? (
                                <div className="flex items-center text-red-600">
                                  <TrendingDown className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">Declining</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-gray-600">
                                  <div className="w-4 h-4 bg-gray-400 rounded-full mr-1" />
                                  <span className="text-sm font-medium">Stable</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                            <div className="text-lg font-bold text-blue-900">⭐ {item.averageRating}</div>
                            <div className="text-blue-600 text-sm font-medium">Rating</div>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm">
                            <div className="text-lg font-bold text-green-900">₹{Math.round(item.totalRevenue / item.totalOrders)}</div>
                            <div className="text-green-600 text-sm font-medium">Avg Price</div>
                          </div>
                          <div className="text-center p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm">
                            <div className="text-lg font-bold text-purple-900">{item.category}</div>
                            <div className="text-purple-600 text-sm font-medium">Category</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance indicator */}
                    <div className="mt-6 pt-4 border-t border-yellow-200/50">
                      <div className="flex items-center justify-between text-sm text-yellow-700 mb-2">
                        <span className="font-medium">Revenue Performance</span>
                        <span>{Math.round((item.totalRevenue / Math.max(...reportsData.topSellingItems.map(i => i.totalRevenue))) * 100)}%</span>
                      </div>
                      <div className="w-full bg-yellow-200/50 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-md ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                            'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${(item.totalRevenue / Math.max(...reportsData.topSellingItems.map(i => i.totalRevenue))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {reportsData.topSellingItems.length === 0 && (
                <div className="text-center py-12 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 rounded-2xl border-2 border-dashed border-yellow-300">
                  <div className="p-4 bg-yellow-100 rounded-full w-fit mx-auto mb-4">
                    <BarChart3 className="w-12 h-12 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">No Performance Data</h3>
                  <p className="text-yellow-600">Top performing items will appear here once sales data is available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-blue-900">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="font-bold">Customer Analytics</span>
                <div className="text-sm font-normal text-blue-700 mt-1">Customer behavior insights and engagement metrics</div>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600 font-medium">Live Analytics</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Customer overview grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full shadow-md">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-2">{reportsData.customerMetrics.totalCustomers.toLocaleString()}</div>
                    <div className="text-blue-600 font-medium">Total Customers</div>
                    <div className="mt-3">
                      <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm">
                        Active Base
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-full shadow-md">
                        <UserPlus className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">{reportsData.customerMetrics.newCustomers}</div>
                    <div className="text-green-600 font-medium">New Customers</div>
                    <div className="mt-3">
                      <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Growing
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed metrics */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-white/60 to-blue-50/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 rounded-lg">
                        <UserCheck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-indigo-900">Returning Customers</div>
                        <div className="text-indigo-600 text-sm">Loyal customer base</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-900">{reportsData.customerMetrics.returningCustomers}</div>
                      <div className="text-indigo-600 text-sm">{Math.round((reportsData.customerMetrics.returningCustomers / reportsData.customerMetrics.totalCustomers) * 100)}% of total</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-indigo-200/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-md"
                      style={{ width: `${(reportsData.customerMetrics.returningCustomers / reportsData.customerMetrics.totalCustomers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-white/60 to-purple-50/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-lg">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-900">Average Spend</div>
                        <div className="text-purple-600 text-sm">Per customer transaction</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-900">₹{reportsData.customerMetrics.averageSpend.toLocaleString()}</div>
                      <div className="text-purple-600 text-sm">Per visit average</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm">
                      High Value
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm">
                      ₹{Math.round(reportsData.customerMetrics.averageSpend * reportsData.customerMetrics.returningCustomers)} lifetime
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Enhanced retention section */}
              <div className="bg-gradient-to-r from-white/60 to-green-50/60 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-xl shadow-md">
                      <Heart className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-900">Customer Retention</div>
                      <div className="text-green-600">Loyalty and satisfaction metrics</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-green-900">{reportsData.customerMetrics.retentionRate}%</div>
                    <Badge className={`border-0 shadow-sm font-bold ${
                      reportsData.customerMetrics.retentionRate >= 80 ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                      reportsData.customerMetrics.retentionRate >= 60 ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800' :
                      'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800'
                    }`}>
                      {reportsData.customerMetrics.retentionRate >= 80 ? 'Excellent' : 
                       reportsData.customerMetrics.retentionRate >= 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-green-700 mb-2">
                    <span className="font-medium">Retention Performance</span>
                    <span>{reportsData.customerMetrics.retentionRate}%</span>
                  </div>
                  <div className="w-full bg-green-200/50 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-md"
                      style={{ width: `${reportsData.customerMetrics.retentionRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-200/50">
                    <div className="text-sm text-green-600">Satisfaction Score: <span className="font-bold text-green-800">⭐ {reportsData.customerMetrics.satisfactionScore}/5</span></div>
                    <div className="text-sm text-green-600">Customer Lifetime: <span className="font-bold text-green-800">~{Math.round(100 / (100 - reportsData.customerMetrics.retentionRate))} visits</span></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <span className="font-bold">Inventory Insights</span>
                <div className="text-sm font-normal text-green-700 mt-1">Stock performance, turnover, and optimization metrics</div>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Real-time</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Inventory overview grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-full shadow-md">
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">₹{reportsData.inventoryMetrics.totalValue.toLocaleString()}</div>
                    <div className="text-green-600 font-medium">Total Value</div>
                    <div className="mt-3">
                      <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                        Current Stock
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full shadow-md">
                        <RefreshCw className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-2">{reportsData.inventoryMetrics.stockTurnover}x</div>
                    <div className="text-blue-600 font-medium">Stock Turnover</div>
                    <div className="mt-3">
                      <Badge className={`border-0 shadow-sm ${
                        reportsData.inventoryMetrics.stockTurnover >= 4 ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                        reportsData.inventoryMetrics.stockTurnover >= 2 ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800' :
                        'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800'
                      }`}>
                        {reportsData.inventoryMetrics.stockTurnover >= 4 ? 'Excellent' : 
                         reportsData.inventoryMetrics.stockTurnover >= 2 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detailed metrics */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-white/60 to-red-50/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-red-100/80 to-pink-100/80 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-900">Waste Percentage</div>
                        <div className="text-red-600 text-sm">Food waste and loss tracking</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-900">{reportsData.inventoryMetrics.wastePercentage}%</div>
                      <div className="text-red-600 text-sm">of total inventory</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-red-200/50 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-md"
                      style={{ width: `${Math.min(reportsData.inventoryMetrics.wastePercentage * 2, 100)}%` }}
                    ></div>
                  </div>
                  
                  <Badge className={`border-0 shadow-sm font-bold ${
                    reportsData.inventoryMetrics.wastePercentage <= 5 ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                    reportsData.inventoryMetrics.wastePercentage <= 10 ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800' :
                    'bg-gradient-to-r from-red-200 to-pink-200 text-red-800'
                  }`}>
                    {reportsData.inventoryMetrics.wastePercentage <= 5 ? 'Excellent Control' : 
                     reportsData.inventoryMetrics.wastePercentage <= 10 ? 'Manageable' : 'Needs Improvement'}
                  </Badge>
                </div>
                
                <div className="bg-gradient-to-r from-white/60 to-orange-50/60 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-orange-100/80 to-red-100/80 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-900">Low Stock Alerts</div>
                        <div className="text-orange-600 text-sm">Items requiring immediate attention</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-900">{reportsData.inventoryMetrics.lowStockAlerts}</div>
                      <Badge className={`border-0 shadow-sm font-bold ${
                        reportsData.inventoryMetrics.lowStockAlerts > 10 ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800' :
                        reportsData.inventoryMetrics.lowStockAlerts > 5 ? 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800' :
                        'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800'
                      }`}>
                        {reportsData.inventoryMetrics.lowStockAlerts > 10 ? 'Critical' : 
                         reportsData.inventoryMetrics.lowStockAlerts > 5 ? 'Moderate' : 'Under Control'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top consuming items section */}
              <div className="bg-gradient-to-r from-white/60 to-purple-50/60 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-xl shadow-md">
                      <TrendingUp className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-900">Top Consuming Items</div>
                      <div className="text-purple-600">High-usage inventory items</div>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm font-bold">
                    {reportsData.inventoryMetrics.topConsumingItems.length} items tracked
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {reportsData.inventoryMetrics.topConsumingItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white/60 to-purple-50/60 border-0 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                              index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                              index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                              'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-900">{item.name}</div>
                              <div className="text-purple-600 text-sm">High consumption item</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-purple-900">{item.consumed}</div>
                            <div className="text-purple-600 text-sm">units used</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                            ₹{item.value.toLocaleString()} value
                          </Badge>
                          <div className="w-1/2 bg-purple-200/50 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                index === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}
                              style={{ width: `${Math.min((item.consumed / Math.max(...reportsData.inventoryMetrics.topConsumingItems.map(i => i.consumed))) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {reportsData.inventoryMetrics.topConsumingItems.length === 0 && (
                    <div className="text-center py-8 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl border-2 border-dashed border-purple-300">
                      <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                        <Package className="w-8 h-8 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-bold text-purple-900 mb-2">No Consumption Data</h4>
                      <p className="text-purple-600 text-sm">Top consuming items will appear here once usage data is available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Detailed Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-50 data-[state=active]:to-purple-100 data-[state=active]:text-violet-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-violet-100 hover:to-purple-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                <BarChart3 className="h-4 w-4 text-violet-600" />
              </div>
              <span>Sales Overview</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="menu" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-orange-100 data-[state=active]:text-amber-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-amber-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                <PieChart className="h-4 w-4 text-amber-600" />
              </div>
              <span>Menu Performance</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <span>Inventory Reports</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="customers" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <span>Customer Analytics</span>
            </div>
          </TabsTrigger>
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

      {/* Enhanced Revenue Trend Chart Placeholder */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-violet-800 flex items-center space-x-2">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-violet-600" />
                </div>
                <span>Revenue Trend</span>
              </CardTitle>
              <CardDescription className="text-violet-600">Daily revenue performance over time</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-violet-200/70 bg-white/70 backdrop-blur-sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-violet-200 rounded-lg bg-gradient-to-br from-violet-50/30 to-purple-50/30">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <p className="text-violet-600 mb-2 font-medium">Revenue Chart</p>
              <p className="text-sm text-violet-500">
                Integration with charting library (Chart.js, Recharts, etc.) needed
              </p>
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                {reportsData.dailyReports.slice(-7).map((day, index) => (
                  <div key={index} className="text-center p-2 bg-white/60 rounded-lg backdrop-blur-sm">
                    <div className="font-medium text-violet-800">₹{(day.revenue / 1000).toFixed(0)}k</div>
                    <div className="text-violet-600 text-xs">{new Date(day.period).toLocaleDateString('en', { weekday: 'short' })}</div>
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