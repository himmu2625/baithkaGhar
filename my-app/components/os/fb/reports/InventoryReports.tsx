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
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryData.totalValue)}</div>
            <p className="text-sm text-gray-600">Current inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-green-600" />
              Turnover Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryData.stockTurnover}x</div>
            <p className="text-sm text-gray-600">Stock turnover per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Waste Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryData.wastePercentage}%</div>
            <p className="text-sm text-gray-600">Food waste percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryData.lowStockAlerts}</div>
            <p className="text-sm text-gray-600">Items need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Consuming Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Consuming Items</CardTitle>
          <CardDescription>Items with highest consumption rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryData.topConsumingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-red-100 text-red-800' :
                    index === 1 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{item.consumed} units</div>
                  <div className="text-sm text-gray-600">{formatCurrency(item.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement Trends</CardTitle>
            <CardDescription>Inventory in/out over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Stock Movement Chart</p>
                <p className="text-sm text-gray-400">Timeline of inventory changes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Inventory value by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Category Distribution</p>
                <p className="text-sm text-gray-400">Value breakdown by category</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}