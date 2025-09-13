'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ShoppingCart,
  Calendar,
  Clock,
  IndianRupee,
  Users,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { InventoryList } from '@/components/os/fb/inventory/InventoryList';
import { InventoryForm } from '@/components/os/fb/inventory/InventoryForm';
import { StockMovements } from '@/components/os/fb/inventory/StockMovements';
import { LowStockAlerts } from '@/components/os/fb/inventory/LowStockAlerts';
import { InventoryAnalytics } from '@/components/os/fb/inventory/InventoryAnalytics';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice?: number;
  supplier: string;
  supplierContact?: string;
  location: string;
  expiryDate?: string;
  batchNumber?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  isPerishable: boolean;
  lastRestocked: string;
  lastUpdated: string;
  createdBy: string;
  notes?: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  cost?: number;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  topCategories: { category: string; count: number; value: number }[];
  recentMovements: number;
  wasteValue: number;
}

interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  subcategories: string[];
}

export default function InventoryManagement() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    topCategories: [],
    recentMovements: 0,
    wasteValue: 0,
  });
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        
        const [inventoryRes, movementsRes, statsRes, categoriesRes] = await Promise.all([
          fetch(`/api/fb/inventory?propertyId=${propertyId}`),
          fetch(`/api/fb/inventory/movements?propertyId=${propertyId}&limit=100`),
          fetch(`/api/fb/inventory/stats?propertyId=${propertyId}`),
          fetch(`/api/fb/inventory/categories?propertyId=${propertyId}`)
        ]);

        const [inventoryData, movementsData, statsData, categoriesData] = await Promise.all([
          inventoryRes.json(),
          movementsRes.json(),
          statsRes.json(),
          categoriesRes.json()
        ]);
        
        if (inventoryData.success && movementsData.success && statsData.success && categoriesData.success) {
          setInventory(inventoryData.inventory || []);
          setStockMovements(movementsData.movements || []);
          setInventoryStats(statsData.stats || inventoryStats);
          setCategories(categoriesData.categories || []);
        } else {
          throw new Error('Inventory API returned error responses');
        }
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inventory data');
        setInventory([]);
        setStockMovements([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchInventoryData();
    }
  }, [propertyId, session]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesLowStock = !showLowStockOnly || item.status === 'low_stock' || item.status === 'out_of_stock';
    const matchesExpiring = !showExpiringOnly || (item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLowStock && matchesExpiring;
  });

  const handleUpdateStock = async (itemId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    let newStock = item.currentStock;
    switch (type) {
      case 'in':
        newStock += quantity;
        break;
      case 'out':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'adjustment':
        newStock = quantity;
        break;
    }
    try {
      const response = await fetch(`/api/fb/inventory/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newStock, 
          reason, 
          propertyId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update inventory
        setInventory(inventory =>
          inventory.map(item => {
            if (item.id === itemId) {
              const updatedItem = { 
                ...item, 
                currentStock: newStock,
                lastUpdated: new Date().toISOString(),
                status: newStock === 0 ? 'out_of_stock' as const : 
                       newStock <= item.minimumStock ? 'low_stock' as const : 'in_stock' as const
              };
              return updatedItem;
            }
            return item;
          })
        );

        // Add stock movement
        const movement: StockMovement = {
          id: Date.now().toString(),
          itemId: itemId,
          itemName: inventory.find(i => i.id === itemId)?.name || '',
          movementType: 'adjustment',
          quantity: Math.abs(newStock - (inventory.find(i => i.id === itemId)?.currentStock || 0)),
          previousStock: inventory.find(i => i.id === itemId)?.currentStock || 0,
          newStock: newStock,
          reason: reason,
          performedBy: session?.user?.id || 'user',
          timestamp: new Date().toISOString(),
        };
        setStockMovements(movements => [movement, ...movements]);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.minimumStock) return 'low_stock';
    return 'in_stock';
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'none';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 2) return 'expires_soon';
    if (diffDays <= 7) return 'expires_week';
    return 'fresh';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
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
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Inventory Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-amber-100">Stock Tracking & Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Inventory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
              <div className="text-amber-200 text-sm">Total Items</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{inventoryStats.lowStockItems}</div>
              <div className="text-amber-200 text-sm">Low Stock</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost"
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                onClick={() => setShowItemForm(true)}
                className="bg-white text-amber-600 hover:bg-white/90 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Items</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">{inventoryStats.totalItems}</div>
            <div className="flex items-center space-x-1">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">Worth ₹{inventoryStats.totalValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">Low Stock Alerts</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-amber-900 mb-1">{inventoryStats.lowStockItems}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-600">{inventoryStats.outOfStockItems} out of stock</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-700">Expiring Soon</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-red-900 mb-1">{inventoryStats.expiringItems}</div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600">Within 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Recent Activity</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{inventoryStats.recentMovements}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">Stock movements today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-blue-800 flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <span>Top Categories by Value</span>
            </CardTitle>
            <CardDescription className="text-blue-600">Most valuable inventory categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryStats.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <div>
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm text-gray-500">{category.count} items</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{category.value.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      {Math.round((category.value / inventoryStats.totalValue) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/8 via-emerald-500/6 to-teal-500/8 opacity-70"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
          <CardHeader className="relative bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-b border-green-100/50">
            <CardTitle className="text-green-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/30 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="text-xl font-bold">Inventory Health</span>
                  <div className="text-green-600 text-sm font-medium flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Real-time monitoring</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100)}%
                </div>
                <div className="text-xs text-green-600">Overall Health</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6 p-8">
            {/* Enhanced Stock Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* In Stock */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 hover:border-green-300/70 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-green-800">In Stock</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems}
                    </div>
                  </div>
                  <div className="relative h-2 bg-green-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600 mt-2 flex items-center">
                    <span>{Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100)}% of total inventory</span>
                  </div>
                </div>
              </div>

              {/* Low Stock */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-amber-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-orange-800">Low Stock</span>
                    </div>
                    <div className="text-lg font-bold text-orange-700">
                      {inventoryStats.lowStockItems}
                    </div>
                  </div>
                  <div className="relative h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(inventoryStats.lowStockItems / inventoryStats.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-orange-600 mt-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>{Math.round((inventoryStats.lowStockItems / inventoryStats.totalItems) * 100)}% need restocking</span>
                  </div>
                </div>
              </div>

              {/* Out of Stock */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                <div className="relative bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-200/50 hover:border-red-300/70 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-red-800">Out of Stock</span>
                    </div>
                    <div className="text-lg font-bold text-red-700">
                      {inventoryStats.outOfStockItems}
                    </div>
                  </div>
                  <div className="relative h-2 bg-red-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${(inventoryStats.outOfStockItems / inventoryStats.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-red-600 mt-2 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                    <span>{Math.round((inventoryStats.outOfStockItems / inventoryStats.totalItems) * 100)}% critical shortage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Health Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-green-100/50">
              {/* Expiring Items Alert */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                <div className="relative bg-gradient-to-br from-yellow-50/80 to-orange-50/80 backdrop-blur-sm p-5 rounded-xl border border-yellow-200/50 hover:border-yellow-300/70 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-yellow-800">Expiring Soon</div>
                        <div className="text-xs text-yellow-600">Within 7 days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-700">{inventoryStats.expiringItems}</div>
                      <div className="text-xs text-yellow-600">items</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-yellow-700">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Immediate attention required</span>
                  </div>
                </div>
              </div>

              {/* Waste Management */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                <div className="relative bg-gradient-to-br from-red-50/80 to-pink-50/80 backdrop-blur-sm p-5 rounded-xl border border-red-200/50 hover:border-red-300/70 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-red-800">Monthly Waste</div>
                        <div className="text-xs text-red-600">Cost impact</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-700">₹{inventoryStats.wasteValue.toLocaleString()}</div>
                      <div className="text-xs text-red-600">this month</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-red-700">
                    <IndianRupee className="w-3 h-3" />
                    <span>Focus on waste reduction</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Score Indicator */}
            <div className="pt-6 border-t border-green-100/50">
              <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-4 rounded-xl border border-green-200/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-green-800">Inventory Health Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live tracking</span>
                  </div>
                </div>
                <div className="relative h-3 bg-green-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100)}%` }}
                  >
                    <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-green-600">
                    {Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100) >= 80 ? 'Excellent' : 
                     Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100) >= 60 ? 'Good' : 'Needs Attention'}
                  </span>
                  <span className="text-xs font-bold text-green-700">
                    {Math.round(((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-50 data-[state=active]:to-orange-100 data-[state=active]:text-amber-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-amber-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <span>Inventory</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="movements" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <span>Stock Movements</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-pink-100 data-[state=active]:text-red-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-red-100 hover:to-pink-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <span>Alerts</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <span>Analytics</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Inventory Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Filters - Modern OS Style */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/8 via-orange-500/6 to-yellow-500/8 opacity-70"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
            <CardContent className="relative pt-8 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Enhanced Search */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-600/70 w-5 h-5 z-10 group-hover:text-amber-600 transition-colors" />
                    <Input
                      placeholder="Search items, SKU, or supplier..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-3 w-80 border-0 bg-gradient-to-r from-white/90 to-amber-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-500/30 focus:bg-white relative z-20"
                    />
                  </div>

                  {/* Enhanced Dropdowns */}
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-52 h-12 border-0 bg-gradient-to-r from-white/90 to-blue-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg text-gray-900 relative z-20">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <SelectValue placeholder="All Categories" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl">
                          <SelectItem value="all" className="hover:bg-blue-50 transition-colors rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span>All Categories</span>
                            </div>
                          </SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id} className="hover:bg-blue-50 transition-colors rounded-lg">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity blur-sm"></div>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-44 h-12 border-0 bg-gradient-to-r from-white/90 to-green-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg text-gray-900 relative z-20">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-green-600" />
                            <SelectValue placeholder="All Status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl">
                          <SelectItem value="all" className="hover:bg-green-50 transition-colors rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
                              <span>All Status</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="in_stock" className="hover:bg-green-50 transition-colors rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                              <span>In Stock</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="low_stock" className="hover:bg-green-50 transition-colors rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-500"></div>
                              <span>Low Stock</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="out_of_stock" className="hover:bg-green-50 transition-colors rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-pink-500"></div>
                              <span>Out of Stock</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Stats and Toggles */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Results Counter */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-violet-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                    <div className="relative bg-gradient-to-r from-white/90 to-purple-50/70 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                          <Package className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-sm font-semibold">
                          <span className="text-purple-600 text-lg font-bold">{filteredInventory.length}</span>
                          <span className="text-gray-500 mx-1">of</span>
                          <span className="text-gray-700 font-bold">{inventory.length}</span>
                          <span className="text-gray-500 text-xs ml-1">items</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Toggle Switches */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-3 group">
                      <div className="relative">
                        <Switch 
                          id="low-stock-only"
                          checked={showLowStockOnly}
                          onCheckedChange={setShowLowStockOnly}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-amber-500"
                        />
                      </div>
                      <label 
                        htmlFor="low-stock-only" 
                        className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock Only</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 group">
                      <div className="relative">
                        <Switch 
                          id="expiring-only"
                          checked={showExpiringOnly}
                          onCheckedChange={setShowExpiringOnly}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-500 data-[state=checked]:to-pink-500"
                        />
                      </div>
                      <label 
                        htmlFor="expiring-only" 
                        className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Expiring Soon</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/30">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live inventory tracking</span>
                  <div className="w-px h-4 bg-gray-300 mx-3"></div>
                  <Clock className="w-3 h-3" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-600 transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <InventoryList
            inventory={filteredInventory}
            categories={categories}
            onItemSelect={setSelectedItem}
            onStockUpdate={handleUpdateStock}
          />
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <StockMovements
            movements={stockMovements}
            inventory={inventory}
          />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <LowStockAlerts
            inventory={inventory.filter(item => 
              item.status === 'low_stock' || 
              item.status === 'out_of_stock' ||
              getExpiryStatus(item.expiryDate) === 'expires_soon' ||
              getExpiryStatus(item.expiryDate) === 'expired'
            )}
            onStockUpdate={handleUpdateStock}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <InventoryAnalytics
            analytics={{
              totalItems: inventoryStats.totalItems,
              totalValue: inventoryStats.totalValue,
              lowStockItems: inventoryStats.lowStockItems,
              outOfStockItems: inventoryStats.outOfStockItems,
              expiringItems: inventoryStats.expiringItems,
              fastMovingItems: inventory.slice(0, 10).map((item, index) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                averageUsage: Math.round(Math.random() * 50) + 10,
                unit: item.unit,
                trend: Math.round((Math.random() - 0.5) * 50),
                stockLevel: item.currentStock
              })),
              slowMovingItems: inventory.slice(0, 10).map((item, index) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                daysSinceLastMovement: Math.round(Math.random() * 90) + 10,
                currentStock: item.currentStock,
                unit: item.unit,
                value: item.costPrice * item.currentStock
              })),
              categoryPerformance: inventoryStats.topCategories.map((cat, index) => ({
                category: cat.category,
                items: cat.count,
                totalValue: cat.value,
                turnoverRate: Math.round((Math.random() + 0.5) * 10) / 10,
                profitMargin: Math.round(Math.random() * 30) + 10,
                trend: Math.round((Math.random() - 0.5) * 20),
                color: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B'
              })),
              monthlyTrends: Array.from({ length: 6 }, (_, i) => ({
                month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                purchases: Math.round(Math.random() * 100000) + 50000,
                consumption: Math.round(Math.random() * 80000) + 40000,
                wastage: Math.round(Math.random() * 5000) + 1000,
                value: Math.round(Math.random() * 200000) + 100000
              })),
              topSuppliers: [
                {
                  id: '1',
                  name: 'Fresh Produce Co.',
                  totalOrders: 45,
                  totalValue: 125000,
                  reliability: 4.8,
                  items: ['Vegetables', 'Fruits'],
                  lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  id: '2',
                  name: 'Dairy Distributors',
                  totalOrders: 32,
                  totalValue: 89000,
                  reliability: 4.6,
                  items: ['Milk', 'Cheese', 'Butter'],
                  lastOrder: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
              ],
              stockTurnover: {
                overall: Math.round((Math.random() + 1) * 10) / 10,
                byCategory: inventoryStats.topCategories.slice(0, 5).map((cat, index) => ({
                  category: cat.category,
                  rate: Math.round((Math.random() + 0.5) * 10) / 10,
                  color: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B'
                })),
                trend: Math.round((Math.random() - 0.5) * 20)
              },
              wastageAnalysis: {
                totalWastage: Math.round(Math.random() * 1000) + 200,
                totalValue: inventoryStats.wasteValue,
                topWastedItems: [
                  { name: 'Vegetables', quantity: 15, value: 750, reason: 'Expired' },
                  { name: 'Fruits', quantity: 8, value: 400, reason: 'Damaged' },
                  { name: 'Bread', quantity: 12, value: 240, reason: 'Expired' }
                ],
                byCategory: inventoryStats.topCategories.slice(0, 4).map((cat, index) => ({
                  category: cat.category,
                  percentage: Math.round(Math.random() * 30) + 5,
                  value: Math.round(Math.random() * 2000) + 500,
                  color: index === 0 ? '#EF4444' : index === 1 ? '#F97316' : '#F59E0B'
                }))
              },
              seasonalTrends: [
                { period: 'Summer', demand: 85, trend: 'up' as const, items: ['Ice Cream', 'Cold Drinks'] },
                { period: 'Winter', demand: 72, trend: 'down' as const, items: ['Hot Beverages', 'Soups'] }
              ],
              profitabilityAnalysis: inventory.slice(0, 10).map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                costPrice: item.costPrice,
                sellPrice: item.sellingPrice || item.costPrice * 1.3,
                profitMargin: item.sellingPrice ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 : 23,
                volume: Math.round(Math.random() * 100) + 20,
                totalProfit: item.sellingPrice ? (item.sellingPrice - item.costPrice) * (Math.round(Math.random() * 100) + 20) : item.costPrice * 0.3 * (Math.round(Math.random() * 100) + 20)
              }))
            }}
            onRefresh={() => window.location.reload()}
            onExportReport={(type) => console.log('Exporting report:', type)}
          />
        </TabsContent>
      </Tabs>

      {/* Item Form Modal */}
      {showItemForm && (
        <InventoryForm
          propertyId={propertyId}
          item={selectedItem}
          categories={categories}
          onClose={() => {
            setShowItemForm(false);
            setSelectedItem(null);
          }}
          onSave={(savedItem: InventoryItem) => {
            if (selectedItem) {
              setInventory(inventory =>
                inventory.map(item =>
                  item.id === savedItem.id ? savedItem : item
                )
              );
            } else {
              setInventory(inventory => [...inventory, savedItem]);
            }
            setShowItemForm(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}