'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  Target,
  Users,
  ShoppingCart,
  Activity,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Clock,
  PieChart,
  LineChart,
  Eye,
  Download
} from 'lucide-react';

interface InventoryAnalytics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  fastMovingItems: FastMovingItem[];
  slowMovingItems: SlowMovingItem[];
  categoryPerformance: CategoryPerformance[];
  monthlyTrends: MonthlyTrend[];
  topSuppliers: TopSupplier[];
  stockTurnover: StockTurnover;
  wastageAnalysis: WastageAnalysis;
  seasonalTrends: SeasonalTrend[];
  profitabilityAnalysis: ProfitabilityItem[];
}

interface FastMovingItem {
  id: string;
  name: string;
  category: string;
  averageUsage: number;
  unit: string;
  trend: number;
  stockLevel: number;
}

interface SlowMovingItem {
  id: string;
  name: string;
  category: string;
  daysSinceLastMovement: number;
  currentStock: number;
  unit: string;
  value: number;
}

interface CategoryPerformance {
  category: string;
  items: number;
  totalValue: number;
  turnoverRate: number;
  profitMargin: number;
  trend: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  purchases: number;
  consumption: number;
  wastage: number;
  value: number;
}

interface TopSupplier {
  id: string;
  name: string;
  totalOrders: number;
  totalValue: number;
  reliability: number;
  items: string[];
  lastOrder: string;
}

interface StockTurnover {
  overall: number;
  byCategory: { category: string; rate: number; color: string }[];
  trend: number;
}

interface WastageAnalysis {
  totalWastage: number;
  totalValue: number;
  topWastedItems: { name: string; quantity: number; value: number; reason: string }[];
  byCategory: { category: string; percentage: number; value: number; color: string }[];
}

interface SeasonalTrend {
  period: string;
  demand: number;
  trend: 'up' | 'down' | 'stable';
  items: string[];
}

interface ProfitabilityItem {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  profitMargin: number;
  volume: number;
  totalProfit: number;
}

interface InventoryAnalyticsProps {
  analytics: InventoryAnalytics;
  onRefresh: () => void;
  onExportReport: (type: string) => void;
}

export function InventoryAnalytics({ analytics, onRefresh, onExportReport }: InventoryAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedView, setSelectedView] = useState('overview');

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const overviewMetrics = [
    {
      title: 'Total Inventory Value',
      value: formatCurrency(analytics.totalValue),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      title: 'Total Items',
      value: analytics.totalItems.toLocaleString(),
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      change: '+5.2%',
      changeType: 'positive'
    },
    {
      title: 'Low Stock Alerts',
      value: analytics.lowStockItems.toString(),
      icon: AlertTriangle,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'from-orange-50 to-amber-50',
      change: '-8.1%',
      changeType: 'negative'
    },
    {
      title: 'Stock Turnover Rate',
      value: `${analytics.stockTurnover.overall.toFixed(1)}x`,
      icon: Activity,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      change: '+3.7%',
      changeType: 'positive'
    }
  ];

  if (!analytics.fastMovingItems || analytics.fastMovingItems.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="text-center py-12">
          <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <BarChart className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">No analytics data available</h3>
          <p className="text-blue-600">Analytics will appear once you have inventory data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Inventory Analytics</h2>
          <p className="text-blue-600">Comprehensive insights into your inventory performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 bg-white shadow-sm border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-36 bg-white shadow-sm border-blue-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
              <SelectItem value="suppliers">Suppliers</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={onRefresh}
            variant="outline"
            className="bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={() => onExportReport('analytics')}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewMetrics.map((metric, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className={`p-6 bg-gradient-to-br ${metric.bgColor}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.changeType === 'positive' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-sm text-gray-600 font-medium">{metric.title}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fast & Slow Moving Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fast Moving Items */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                <CardTitle className="flex items-center space-x-3 text-green-900">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <span>Fast Moving Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analytics.fastMovingItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.category}</div>
                        <div className="text-xs text-green-600 font-medium">
                          Avg usage: {item.averageUsage} {item.unit}/day
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(item.trend)}
                          <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                            {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">Stock: {item.stockLevel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Slow Moving Items */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                <CardTitle className="flex items-center space-x-3 text-orange-900">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <span>Slow Moving Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analytics.slowMovingItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.category}</div>
                        <div className="text-xs text-orange-600 font-medium">
                          {item.daysSinceLastMovement} days inactive
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-gray-500">Stock: {item.currentStock} {item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200">
              <CardTitle className="flex items-center space-x-3 text-purple-900">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <span>Category Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.categoryPerformance.map((category) => (
                  <div key={category.category} className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-semibold text-gray-900">{category.category}</span>
                      </div>
                      {getTrendIcon(category.trend)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">{category.items}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">{formatCurrency(category.totalValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Turnover:</span>
                        <span className="font-medium">{category.turnoverRate.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-medium text-green-600">{category.profitMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedView === 'trends' && (
        <>
          {/* Monthly Trends */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <CardTitle className="flex items-center space-x-3 text-blue-900">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <LineChart className="w-5 h-5 text-blue-600" />
                </div>
                <span>Monthly Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.monthlyTrends.map((trend, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">{trend.month}</h4>
                      <Badge className="bg-blue-500 text-white">{formatCurrency(trend.value)}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Purchases</div>
                        <div className="font-semibold text-green-600">{formatCurrency(trend.purchases)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Consumption</div>
                        <div className="font-semibold text-blue-600">{formatCurrency(trend.consumption)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Wastage</div>
                        <div className="font-semibold text-red-600">{formatCurrency(trend.wastage)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wastage Analysis */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200">
              <CardTitle className="flex items-center space-x-3 text-red-900">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span>Wastage Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Top Wasted Items</h4>
                  <div className="space-y-3">
                    {analytics.wastageAnalysis.topWastedItems.map((item, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm font-semibold text-red-600">{formatCurrency(item.value)}</span>
                        </div>
                        <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                        <div className="text-xs text-red-600 mt-1">Reason: {item.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Wastage by Category</h4>
                  <div className="space-y-3">
                    {analytics.wastageAnalysis.byCategory.map((category, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="font-medium text-gray-900">{category.category}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600">{category.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="text-sm text-gray-600">{formatCurrency(category.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedView === 'suppliers' && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <CardTitle className="flex items-center space-x-3 text-green-900">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span>Top Suppliers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.topSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-green-900">{supplier.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-600">{supplier.reliability.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-medium">{supplier.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-medium text-green-600">{formatCurrency(supplier.totalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Supplied:</span>
                      <span className="font-medium">{supplier.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Order:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(supplier.lastOrder).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}