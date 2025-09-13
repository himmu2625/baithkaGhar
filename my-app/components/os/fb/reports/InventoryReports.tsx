'use client';

import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

interface InventoryReportsProps {
  propertyId: string;
  dateRange: string;
  inventoryData: InventoryMetrics;
}

export function InventoryReports({ propertyId, dateRange, inventoryData }: InventoryReportsProps) {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <div className="space-y-8">
      {/* Enhanced Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 border-b border-blue-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-blue-900">
              <div className="p-2 bg-blue-500/20 rounded-lg shadow-md">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold">Total Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-900 mb-2">{formatCurrency(inventoryData.totalValue)}</div>
            <p className="text-blue-600 font-medium">Current inventory worth</p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-500 text-sm">Live tracking</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 border-b border-green-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-green-900">
              <div className="p-2 bg-green-500/20 rounded-lg shadow-md">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-bold">Turnover Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-900 mb-2">{inventoryData.stockTurnover}x</div>
            <p className="text-green-600 font-medium">Stock turnover per month</p>
            <div className="mt-4">
              <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm">
                {inventoryData.stockTurnover >= 4 ? 'Excellent' : inventoryData.stockTurnover >= 2 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-red-50/20 to-pink-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-red-100/80 to-pink-100/80 border-b border-red-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-red-900">
              <div className="p-2 bg-red-500/20 rounded-lg shadow-md">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-bold">Waste Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-900 mb-2">{inventoryData.wastePercentage}%</div>
            <p className="text-red-600 font-medium">Food waste percentage</p>
            <div className="mt-4">
              <div className="w-full bg-red-200/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(inventoryData.wastePercentage * 2, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/20 to-yellow-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
          <CardHeader className="pb-3 bg-gradient-to-r from-orange-100/80 to-yellow-100/80 border-b border-orange-200/50">
            <CardTitle className="text-lg flex items-center space-x-2 text-orange-900">
              <div className="p-2 bg-orange-500/20 rounded-lg shadow-md">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-bold">Low Stock</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-900 mb-2">{inventoryData.lowStockAlerts}</div>
            <p className="text-orange-600 font-medium">Items need reordering</p>
            <div className="mt-4">
              <Badge className={`border-0 shadow-sm font-medium ${
                inventoryData.lowStockAlerts > 10 ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800' :
                inventoryData.lowStockAlerts > 5 ? 'bg-gradient-to-r from-orange-200 to-yellow-200 text-orange-800' :
                'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800'
              }`}>
                {inventoryData.lowStockAlerts > 10 ? 'Critical' : inventoryData.lowStockAlerts > 5 ? 'Moderate' : 'Low'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Top Consuming Items */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/20 to-pink-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-100/80 via-pink-100/80 to-rose-100/80 border-b border-purple-200/50 backdrop-blur-sm">
          <CardTitle className="text-xl flex items-center space-x-3 text-purple-900">
            <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <span className="font-bold">Top Consuming Items</span>
              <div className="text-sm font-normal text-purple-700 mt-1">Items with highest consumption rates</div>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-600 font-medium">High Usage</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6">
            {inventoryData.topConsumingItems.map((item, index) => (
              <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-white to-purple-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Rank indicator */}
                <div className="absolute top-4 left-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-red-400 to-pink-400' :
                    index === 1 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                    index === 2 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    'bg-gradient-to-r from-blue-400 to-indigo-400'
                  }`}>
                    #{index + 1}
                  </div>
                </div>
                
                <div className="relative p-6 pl-20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-900 mb-2">{item.name}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                          <div className="text-lg font-bold text-blue-900">{item.consumed}</div>
                          <div className="text-blue-600 text-sm font-medium">Units Consumed</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl shadow-sm">
                          <div className="text-lg font-bold text-green-900">{formatCurrency(item.value)}</div>
                          <div className="text-green-600 text-sm font-medium">Total Value</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Badge className={`${
                        index === 0 ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800' :
                        index === 1 ? 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800' :
                        index === 2 ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800' :
                        'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800'
                      } border-0 shadow-sm font-bold`}>
                        {index === 0 ? 'HIGHEST' : index === 1 ? 'HIGH' : index === 2 ? 'MODERATE' : 'NORMAL'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Usage indicator */}
                  <div className="mt-6 pt-4 border-t border-purple-200/50">
                    <div className="flex items-center justify-between text-sm text-purple-700 mb-2">
                      <span className="font-medium">Consumption Rate</span>
                      <span>{Math.round((item.consumed / Math.max(...inventoryData.topConsumingItems.map(i => i.consumed))) * 100)}%</span>
                    </div>
                    <div className="w-full bg-purple-200/50 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                          index === 0 ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                          index === 1 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                          index === 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${(item.consumed / Math.max(...inventoryData.topConsumingItems.map(i => i.consumed))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Inventory Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 border-b border-indigo-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-indigo-900">
              <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <span className="font-bold">Stock Movement Trends</span>
                <div className="text-sm font-normal text-indigo-700 mt-1">Inventory flow analysis over time</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-2 border-dashed border-indigo-300 rounded-2xl">
              <div className="text-center">
                <div className="p-6 bg-indigo-100 rounded-full w-fit mx-auto mb-6">
                  <BarChart3 className="w-16 h-16 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-indigo-900 mb-2">Stock Movement Analytics</h3>
                <p className="text-indigo-600 mb-4">Timeline of inventory changes and trends</p>
                <div className="text-sm text-indigo-500">
                  Integration with charting library for interactive stock movement visualization
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-teal-50/20 to-cyan-50/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-100/80 via-cyan-100/80 to-blue-100/80 border-b border-teal-200/50 backdrop-blur-sm">
            <CardTitle className="text-xl flex items-center space-x-3 text-teal-900">
              <div className="p-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl shadow-lg">
                <PieChart className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <span className="font-bold">Category Distribution</span>
                <div className="text-sm font-normal text-teal-700 mt-1">Value breakdown by inventory categories</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-80 flex items-center justify-center bg-gradient-to-br from-teal-50/30 to-cyan-50/30 border-2 border-dashed border-teal-300 rounded-2xl">
              <div className="text-center">
                <div className="p-6 bg-teal-100 rounded-full w-fit mx-auto mb-6">
                  <PieChart className="w-16 h-16 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-teal-900 mb-2">Category Distribution</h3>
                <p className="text-teal-600 mb-4">Interactive breakdown of inventory value by category</p>
                <div className="text-sm text-teal-500">
                  Pie chart visualization showing proportional inventory distribution
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}