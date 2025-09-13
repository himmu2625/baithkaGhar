'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  IndianRupee,
  Users,
  ChefHat,
  Utensils,
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OrderDashboard } from '@/components/os/fb/orders/OrderDashboard';
import { OrderCreation } from '@/components/os/fb/orders/OrderCreation';
import { OrderTracking } from '@/components/os/fb/orders/OrderTracking';

interface FBOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableId?: string;
  tableName?: string;
  deliveryAddress?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: FBOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  specialInstructions?: string;
  estimatedTime?: number;
  actualTime?: number;
  createdAt: string;
  updatedAt: string;
  servedAt?: string;
  kitchenNotes?: string;
}

interface FBOrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifications?: string[];
  specialRequests?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  preparationTime: number;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
}

export default function OrderManagement() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [orders, setOrders] = useState<FBOrder[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    averagePreparationTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<FBOrder | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        
        const [ordersRes, statsRes] = await Promise.all([
          fetch(`/api/fb/orders?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/orders/stats?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (!ordersRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch order data');
        }

        const [ordersData, statsData] = await Promise.all([
          ordersRes.json(),
          statsRes.json()
        ]);
        
        if (ordersData.success && statsData.success) {
          setOrders(ordersData.orders || []);
          setOrderStats(statsData.stats || orderStats);
        } else {
          throw new Error('Orders API returned error responses');
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order data');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchOrderData();
    }
  }, [propertyId, session]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && !loading) {
      interval = setInterval(() => {
        const fetchLatestOrders = async () => {
          try {
            const response = await fetch(`/api/fb/orders?propertyId=${propertyId}`, {
              headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setOrders(data.orders || []);
            }
          } catch (err) {
            console.error('Error refreshing orders:', err);
          }
        };
        
        fetchLatestOrders();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, loading, propertyId, session]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesOrderType = selectedOrderType === 'all' || order.orderType === selectedOrderType;
    
    return matchesSearch && matchesStatus && matchesOrderType;
  });

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders =>
          orders.map(order =>
            order.id === orderId ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() } : order
          )
        );
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'preparing': return <ChefHat className="w-4 h-4 text-orange-500" />;
      case 'ready': return <Utensils className="w-4 h-4 text-green-500" />;
      case 'served': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-700" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return <Utensils className="w-4 h-4" />;
      case 'takeaway': return <Users className="w-4 h-4" />;
      case 'delivery': return <MapPin className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
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
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Order Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <ChefHat className="h-4 w-4" />
                    <span className="text-blue-100">Track & Manage Orders</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
              <div className="text-blue-200 text-sm">Total Orders</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.pendingOrders}</div>
              <div className="text-blue-200 text-sm">Active</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-white/30"
                />
                <label htmlFor="auto-refresh" className="text-sm text-white/80">Auto Refresh</label>
              </div>
              <Button 
                onClick={() => setIsCreateMode(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">Total Orders</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-900 mb-1">
              {orderStats.totalOrders}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">Pending Orders</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {orderStats.pendingOrders}
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">In Kitchen</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <ChefHat className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {orderStats.preparingOrders}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">Being prepared</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Revenue Today</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹{orderStats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <div className="text-xs text-purple-600">Avg: ₹{orderStats.averageOrderValue}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <span>Dashboard</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
              <span>All Orders</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="tracking" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-50 data-[state=active]:to-red-100 data-[state=active]:text-orange-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-orange-100 hover:to-red-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
              </div>
              <span>Live Tracking</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <OrderDashboard 
            propertyId={propertyId}
            stats={orderStats}
            recentOrders={orders.slice(0, 5)}
            onOrderStatusUpdate={handleUpdateOrderStatus}
          />
        </TabsContent>

        {/* All Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Enhanced Filters - OS Style */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            <CardContent className="relative pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <Input
                        placeholder="Search orders, customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-16 pr-4 py-3 w-80 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 focus:from-blue-100 focus:to-indigo-100 focus:ring-2 focus:ring-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-blue-800 placeholder:text-blue-500"
                      />
                    </div>
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-52 border-0 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-100 hover:to-emerald-100 group backdrop-blur-sm">
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                          <Filter className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <SelectValue placeholder="Status" className="text-green-800 font-medium" />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                      <SelectItem value="all" className="rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-slate-100">
                            <ShoppingCart className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-800">All Status</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending" className="rounded-lg hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100">
                            <Clock className="w-4 h-4 text-yellow-600" />
                          </div>
                          <span className="font-medium text-yellow-800">Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="confirmed" className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-blue-800">Confirmed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="preparing" className="rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100">
                            <ChefHat className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium text-orange-800">Preparing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ready" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                            <Utensils className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-green-800">Ready</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="served" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-green-800">Served</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-green-800">Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled" className="rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-red-100 to-pink-100">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="font-medium text-red-800">Cancelled</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                    <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-pink-100 group backdrop-blur-sm">
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                          <Utensils className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <SelectValue placeholder="Order Type" className="text-purple-800 font-medium" />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                      <SelectItem value="all" className="rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-slate-100">
                            <Utensils className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-800">All Types</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dine_in" className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                            <Utensils className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-blue-800">Dine In</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="takeaway" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-green-800">Takeaway</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="delivery" className="rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100">
                            <MapPin className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium text-orange-800">Delivery</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-700 font-medium bg-white/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-blue-600 font-bold">{filteredOrders.length}</span> of <span className="font-semibold">{orders.length}</span> orders
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Orders List - OS Style */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-3 flex-wrap">
                        <span className="font-bold text-gray-900">{order.orderNumber}</span>
                        <Badge className={`${getStatusColor(order.status)} border-0 shadow-sm`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 font-medium">{order.status.toUpperCase()}</span>
                        </Badge>
                        <Badge className={`${getPriorityColor(order.priority)} border-0 shadow-sm`}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {order.priority.toUpperCase()}
                        </Badge>
                        <div className="flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          {getOrderTypeIcon(order.orderType)}
                          <span className="ml-1 text-xs font-medium">{order.orderType.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center space-x-4 text-gray-700">
                        <span className="font-semibold text-gray-900">{order.customerName}</span>
                        {order.customerPhone && (
                          <span className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                            <Phone className="w-3 h-3 mr-1 text-blue-600" />
                            <span className="text-blue-800 text-sm">{order.customerPhone}</span>
                          </span>
                        )}
                        {order.tableName && (
                          <span className="bg-purple-50 text-purple-800 px-2 py-1 rounded-md text-sm font-medium">
                            {order.tableName}
                          </span>
                        )}
                        {order.deliveryAddress && (
                          <span className="flex items-center bg-green-50 px-2 py-1 rounded-md max-w-48 truncate">
                            <MapPin className="w-3 h-3 mr-1 text-green-600 flex-shrink-0" />
                            <span className="text-green-800 text-sm">{order.deliveryAddress}</span>
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-gray-900 mb-1">₹{order.totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </div>
                      <div className="mt-2">
                        <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'} className="text-xs">
                          {order.paymentStatus.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                            <span className="text-gray-500 text-sm ml-2">({item.categoryName})</span>
                            {item.modifications && item.modifications.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Modifications: {item.modifications.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{item.totalPrice}</div>
                            <Badge className={getStatusColor(item.status)} variant="outline">
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium">
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Est. Time:</span>
                        <div className="font-medium flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {order.estimatedTime} mins
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Payment:</span>
                        <div className="font-medium">
                          <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <div className="text-sm font-semibold text-yellow-800">Special Instructions:</div>
                        </div>
                        <div className="text-sm text-yellow-700 bg-white/50 p-2 rounded-lg">{order.specialInstructions}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="text-center py-12">
                <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">No orders found</h3>
                <p className="text-blue-600 mb-6">Start by creating your first order</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  onClick={() => setIsCreateMode(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Order
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking">
          <OrderTracking 
            propertyId={propertyId}
            orders={orders.filter(order => ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status))}
            onOrderStatusUpdate={handleUpdateOrderStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Order Creation Modal */}
      {isCreateMode && (
        <OrderCreation
          propertyId={propertyId}
          onClose={() => setIsCreateMode(false)}
          onSave={(newOrder) => {
            setOrders(orders => [newOrder, ...orders]);
            setIsCreateMode(false);
          }}
        />
      )}
    </div>
  );
}