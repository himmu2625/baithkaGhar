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
// import { InventoryList } from '@/components/os/fb/inventory/InventoryList';
// import { InventoryForm } from '@/components/os/fb/inventory/InventoryForm';
// import { StockMovements } from '@/components/os/fb/inventory/StockMovements';
// import { LowStockAlerts } from '@/components/os/fb/inventory/LowStockAlerts';

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

  const handleUpdateStock = async (itemId: string, newStock: number, reason: string) => {
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
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track stock levels, manage suppliers and monitor inventory</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button 
            onClick={() => setShowItemForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Worth ₹{inventoryStats.totalValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryStats.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats.expiringItems}</div>
            <p className="text-xs text-muted-foreground">
              Within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.recentMovements}</div>
            <p className="text-xs text-muted-foreground">
              Stock movements today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Value</CardTitle>
            <CardDescription>Most valuable inventory categories</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
            <CardDescription>Overall inventory status overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>In Stock</span>
                <span>{inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems} items</span>
              </div>
              <Progress value={((inventoryStats.totalItems - inventoryStats.lowStockItems - inventoryStats.outOfStockItems) / inventoryStats.totalItems) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Low Stock</span>
                <span>{inventoryStats.lowStockItems} items</span>
              </div>
              <Progress value={(inventoryStats.lowStockItems / inventoryStats.totalItems) * 100} className="h-2 bg-orange-200" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Out of Stock</span>
                <span>{inventoryStats.outOfStockItems} items</span>
              </div>
              <Progress value={(inventoryStats.outOfStockItems / inventoryStats.totalItems) * 100} className="h-2 bg-red-200" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Waste This Month</span>
                <span className="text-sm text-red-600 font-medium">₹{inventoryStats.wasteValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Inventory Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search inventory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="low-stock-only"
                      checked={showLowStockOnly}
                      onCheckedChange={setShowLowStockOnly}
                    />
                    <label htmlFor="low-stock-only" className="text-sm">Low Stock Only</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="expiring-only"
                      checked={showExpiringOnly}
                      onCheckedChange={setShowExpiringOnly}
                    />
                    <label htmlFor="expiring-only" className="text-sm">Expiring Soon</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <InventoryList
            inventory={filteredInventory}
            categories={categories}
            onItemSelect={setSelectedItem}
            onStockUpdate={handleUpdateStock}
          /> */}
          <div className="p-8 text-center text-gray-500">
            InventoryList component placeholder
          </div>
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          {/* <StockMovements
            movements={stockMovements}
            inventory={inventory}
          /> */}
          <div className="p-8 text-center text-gray-500">
            StockMovements component placeholder
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* <LowStockAlerts
            inventory={inventory.filter(item => 
              item.status === 'low_stock' || 
              item.status === 'out_of_stock' ||
              getExpiryStatus(item.expiryDate) === 'expires_soon' ||
              getExpiryStatus(item.expiryDate) === 'expired'
            )}
            onStockUpdate={handleUpdateStock}
          /> */}
          <div className="p-8 text-center text-gray-500">
            LowStockAlerts component placeholder
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels Trend</CardTitle>
                <CardDescription>Historical stock levels over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Stock analytics chart would appear here</p>
                  <p className="text-sm mt-2">Integration with charting library needed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Patterns</CardTitle>
                <CardDescription>Most consumed items and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventory
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-red-500' : 
                            index === 1 ? 'bg-orange-500' : 
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{Math.round(Math.random() * 100)}%</div>
                          <div className="text-sm text-gray-500">usage</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Form Modal */}
      {showItemForm && (
        // <InventoryForm
        //   propertyId={propertyId}
        //   item={selectedItem}
        //   categories={categories}
        //   onClose={() => {
        //     setShowItemForm(false);
        //     setSelectedItem(null);
        //   }}
        //   onSave={(savedItem: InventoryItem) => {
        //     if (selectedItem) {
        //       setInventory(inventory =>
        //         inventory.map(item =>
        //           item.id === savedItem.id ? savedItem : item
        //         )
        //       );
        //     } else {
        //       setInventory(inventory => [...inventory, savedItem]);
        //     }
        //     setShowItemForm(false);
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">InventoryForm Placeholder</h2>
            <p className="text-gray-500 mb-4">InventoryForm component not implemented</p>
            <Button onClick={() => setShowItemForm(false)}>Close</Button>
          </div>
        </div>
        //     setSelectedItem(null);
        //   }}
        // />
      )}
    </div>
  );
}