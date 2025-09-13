'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  Timer,
  Utensils,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { KitchenDisplay } from '@/components/os/fb/kitchen/KitchenDisplay';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: string[];
  preparationTime: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  items: OrderItem[];
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  estimatedCompletionTime: string;
  actualCompletionTime?: string;
  assignedChef?: string;
  notes?: string;
}

interface KitchenStats {
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  averagePreparationTime: number;
  totalOrdersToday: number;
  completedOrdersToday: number;
}

export default function KitchenPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [stats, setStats] = useState<KitchenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const kitchenStations = [
    { value: 'all', label: 'All Stations' },
    { value: 'hot_kitchen', label: 'Hot Kitchen' },
    { value: 'cold_kitchen', label: 'Cold Kitchen' },
    { value: 'grill', label: 'Grill Station' },
    { value: 'fryer', label: 'Fryer Station' },
    { value: 'beverage_station', label: 'Beverage Station' },
    { value: 'dessert_station', label: 'Dessert Station' },
  ];

  const fetchKitchenData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/fb/orders/kitchen/display?propertyId=${propertyId}`),
        fetch(`/api/fb/kitchen/stats?propertyId=${propertyId}`)
      ]);

      const [ordersData, statsData] = await Promise.all([
        ordersRes.json(),
        statsRes.json()
      ]);

      if (ordersData.success && statsData.success) {
        setOrders(ordersData.orders || []);
        setStats(statsData.stats || null);
      } else {
        throw new Error('Kitchen API returned error responses');
      }
    } catch (error) {
      console.error('Error fetching kitchen data:', error);
      setOrders([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId && session) {
      fetchKitchenData();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchKitchenData, 30000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [propertyId, session]);

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders =>
          orders.map(order =>
            order.id === orderId 
              ? { ...order, status: newStatus as any, actualCompletionTime: newStatus === 'ready' ? new Date().toISOString() : order.actualCompletionTime }
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleItemStatusUpdate = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/orders/${orderId}/items/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(orders =>
          orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map(item =>
                    item.id === itemId ? { ...item, status: newStatus as any } : item
                  )
                }
              : order
          )
        );
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getOrderPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const getEstimatedTime = (estimatedTime: string) => {
    const estimated = new Date(estimatedTime);
    const now = new Date();
    const diffMinutes = Math.floor((estimated.getTime() - now.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-2xl p-8 text-white shadow-2xl">
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
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Kitchen Display System</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Timer className="h-4 w-4" />
                    <span className="text-red-100">Real-time Order Management</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Kitchen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
              <div className="text-red-200 text-sm">Pending</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.preparingOrders || 0}</div>
              <div className="text-red-200 text-sm">Preparing</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger className="w-64 border-0 bg-white/20 hover:bg-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-white backdrop-blur-sm group">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                      <ChefHat className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue placeholder="Select station" className="text-white font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                  {kitchenStations.map((station) => (
                    <SelectItem key={station.value} value={station.value} className="rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-200 p-3 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100">
                          <ChefHat className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium text-red-800">{station.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={fetchKitchenData} 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Kitchen Stats - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-amber-100 hover:from-yellow-100 hover:to-amber-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-700">Pending Orders</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-yellow-900 mb-1">{stats?.pendingOrders || 0}</div>
            <div className="text-xs text-yellow-600">Waiting to start</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">In Preparation</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <ChefHat className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{stats?.preparingOrders || 0}</div>
            <div className="text-xs text-blue-600">Being cooked</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">Ready to Serve</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-900 mb-1">{stats?.readyOrders || 0}</div>
            <div className="text-xs text-green-600">Ready for pickup</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Avg. Prep Time</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Timer className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">{stats?.averagePreparationTime || 0}m</div>
            <div className="text-xs text-purple-600">Average time</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Display */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-orange-100 data-[state=active]:text-red-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-red-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <Utensils className="h-4 w-4 text-red-600" />
              </div>
              <span>Active Orders</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-50 data-[state=active]:to-amber-100 data-[state=active]:text-yellow-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-yellow-100 hover:to-amber-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <span>Pending ({stats?.pendingOrders || 0})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="preparing" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <ChefHat className="h-4 w-4 text-blue-600" />
              </div>
              <span>Preparing ({stats?.preparingOrders || 0})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="ready" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Bell className="h-4 w-4 text-green-600" />
              </div>
              <span>Ready ({stats?.readyOrders || 0})</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(order => order.status !== 'served').map((order) => (
              <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)} shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <CardDescription>
                        {order.tableNumber} • {order.orderType.replace('_', ' ')}
                        {order.customerName && ` • ${order.customerName}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {getTimeElapsed(order.createdAt)}m ago
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Time Information */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-gray-500" />
                        <span>ETA: {getEstimatedTime(order.estimatedCompletionTime)}m</span>
                      </div>
                      {order.assignedChef && (
                        <div className="flex items-center space-x-1">
                          <ChefHat className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.assignedChef}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-100">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.quantity}x {item.name}</span>
                              <Badge variant="outline" className={`${getStatusColor(item.status)} border-0 shadow-sm`}>
                                {item.status}
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <div className="bg-red-50 border border-red-200 p-2 rounded-md mt-2">
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Note:</span> {item.specialInstructions}
                                </p>
                              </div>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.modifiers.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusUpdate(order.id, item.id, 'preparing')}
                                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-shadow"
                              >
                                Start
                              </Button>
                            )}
                            {item.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusUpdate(order.id, item.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-shadow"
                              >
                                Ready
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Actions */}
                    <div className="flex justify-end space-x-2 pt-2">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                          className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                        >
                          Start Order
                        </Button>
                      )}
                      {order.status === 'preparing' && order.items.every(item => item.status === 'ready') && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                          className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Order
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'served')}
                          variant="outline"
                          className="bg-gray-600 text-white hover:bg-gray-700 border-gray-500 shadow-md hover:shadow-lg transition-all"
                        >
                          Mark Served
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.filter(order => order.status !== 'served').length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
              <CardContent className="text-center py-12">
                <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">No active orders</h3>
                <p className="text-red-600">Kitchen is all caught up! 🎉</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(order => order.status === 'pending').map((order) => (
              <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)} shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50`}>
                <CardHeader className="pb-4 bg-gradient-to-r from-yellow-100/50 to-amber-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-yellow-900">{order.orderNumber}</CardTitle>
                      <CardDescription className="text-yellow-700">
                        {order.tableNumber} • {order.orderType.replace('_', ' ')}
                        {order.customerName && ` • ${order.customerName}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                      <p className="text-sm text-yellow-600 mt-1 font-medium">
                        {getTimeElapsed(order.createdAt)}m ago
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Priority Alert */}
                    {order.priority === 'high' && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-semibold">High Priority Order</span>
                      </div>
                    )}

                    {/* Time Information */}
                    <div className="flex items-center justify-between text-sm bg-yellow-100/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">ETA: {getEstimatedTime(order.estimatedCompletionTime)}m</span>
                      </div>
                      {order.assignedChef && (
                        <div className="flex items-center space-x-1">
                          <ChefHat className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-800 font-medium">{order.assignedChef}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-900 flex items-center space-x-2">
                        <Utensils className="w-4 h-4" />
                        <span>Items ({order.items.length})</span>
                      </h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-gray-900 text-lg">{item.quantity}x</span>
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                {item.preparationTime}m prep
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <div className="bg-red-50 border border-red-200 p-3 rounded-md mt-2">
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-red-800 mb-1">Special Instructions:</p>
                                    <p className="text-sm text-red-700">{item.specialInstructions}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Modifications:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.modifiers.map((modifier, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      {modifier}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-yellow-200">
                      <div className="text-sm text-yellow-700">
                        <span className="font-medium">Waiting since:</span> {getTimeElapsed(order.createdAt)} minutes
                      </div>
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6"
                      >
                        <ChefHat className="w-4 h-4 mr-2" />
                        Start Cooking
                      </Button>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Kitchen Notes:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {orders.filter(order => order.status === 'pending').length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardContent className="text-center py-16">
                <div className="p-6 bg-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-yellow-900 mb-3">No Pending Orders</h3>
                <p className="text-yellow-700 text-lg">All orders have been started! 🎯</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preparing Orders Tab */}
        <TabsContent value="preparing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(order => order.status === 'preparing').map((order) => (
              <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)} shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50`}>
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-100/50 to-indigo-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-blue-900">{order.orderNumber}</CardTitle>
                      <CardDescription className="text-blue-700">
                        {order.tableNumber} • {order.orderType.replace('_', ' ')}
                        {order.customerName && ` • ${order.customerName}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-200 text-blue-800 border-blue-300">
                        <ChefHat className="w-3 h-3 mr-1" />
                        Preparing
                      </Badge>
                      <p className="text-sm text-blue-600 mt-1 font-medium">
                        {getTimeElapsed(order.createdAt)}m cooking
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Cooking Progress */}
                    <div className="bg-blue-100/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-900">Cooking Progress</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-blue-700 text-sm font-medium">Active</span>
                        </div>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (getTimeElapsed(order.createdAt) / 30) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="flex items-center justify-between text-sm bg-blue-100/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">ETA: {getEstimatedTime(order.estimatedCompletionTime)}m</span>
                      </div>
                      {order.assignedChef && (
                        <div className="flex items-center space-x-1 bg-white/50 px-2 py-1 rounded">
                          <ChefHat className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-800 font-medium">{order.assignedChef}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Items with Individual Status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-900 flex items-center space-x-2">
                        <Utensils className="w-4 h-4" />
                        <span>Items Status</span>
                      </h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-gray-900 text-lg">{item.quantity}x</span>
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <Badge className={`${getStatusColor(item.status)} border-0 font-medium`}>
                                {item.status === 'preparing' ? (
                                  <>
                                    <ChefHat className="w-3 h-3 mr-1" />
                                    Cooking
                                  </>
                                ) : item.status === 'ready' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Done
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Waiting
                                  </>
                                )}
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <div className="bg-red-50 border border-red-200 p-2 rounded-md mt-2">
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5" />
                                  <p className="text-xs text-red-700">{item.specialInstructions}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusUpdate(order.id, item.id, 'preparing')}
                                className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                              >
                                Start Item
                              </Button>
                            )}
                            {item.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusUpdate(order.id, item.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-blue-200">
                      <div className="text-sm text-blue-700">
                        <span className="font-medium">Cooking for:</span> {getTimeElapsed(order.createdAt)} minutes
                      </div>
                      {order.items.every(item => item.status === 'ready') && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.filter(order => order.status === 'preparing').length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="text-center py-16">
                <div className="p-6 bg-blue-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">No Orders Being Prepared</h3>
                <p className="text-blue-700 text-lg">Ready to start cooking! 👨‍🍳</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ready Orders Tab */}
        <TabsContent value="ready" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(order => order.status === 'ready').map((order) => (
              <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)} shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden`}>
                {/* Ready Indicator */}
                <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-500 text-white px-3 py-1 rounded-bl-lg">
                  <Bell className="w-4 h-4 animate-pulse" />
                </div>
                
                <CardHeader className="pb-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-green-900 flex items-center space-x-2">
                        <span>{order.orderNumber}</span>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        {order.tableNumber} • {order.orderType.replace('_', ' ')}
                        {order.customerName && ` • ${order.customerName}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-200 text-green-800 border-green-300 shadow-sm">
                        <Bell className="w-3 h-3 mr-1 animate-pulse" />
                        Ready
                      </Badge>
                      <p className="text-sm text-green-600 mt-1 font-medium">
                        Ready {order.actualCompletionTime ? 
                          `${Math.floor((new Date().getTime() - new Date(order.actualCompletionTime).getTime()) / (1000 * 60))}m ago` :
                          'now'
                        }
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Ready Alert */}
                    <div className="bg-green-100 border border-green-300 rounded-lg p-4 flex items-center space-x-3">
                      <div className="p-2 bg-green-200 rounded-full">
                        <Bell className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Order Complete!</h4>
                        <p className="text-green-700 text-sm">Ready for pickup and serving</p>
                      </div>
                    </div>

                    {/* Completion Time */}
                    <div className="bg-green-100/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Completed in: {getTimeElapsed(order.createdAt)} minutes</span>
                        </div>
                        {order.assignedChef && (
                          <div className="flex items-center space-x-1 bg-white/50 px-2 py-1 rounded">
                            <ChefHat className="w-4 h-4 text-green-600" />
                            <span className="text-green-800 font-medium">{order.assignedChef}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items - All Ready */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-900 flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed Items</span>
                      </h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-900 text-lg">{item.quantity}x</span>
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <Badge className="bg-green-200 text-green-800 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ready
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <div className="bg-green-50 border border-green-200 p-2 rounded-md mt-2">
                                <p className="text-xs text-green-700">
                                  <span className="font-medium">Note followed:</span> {item.specialInstructions}
                                </p>
                              </div>
                            )}
                          </div>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      ))}
                    </div>

                    {/* Pickup Instructions */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-900 mb-1">Pickup Instructions</h4>
                          <p className="text-amber-800 text-sm">
                            Order ready for {order.tableNumber}. 
                            {order.orderType === 'takeaway' && ' Customer pickup required.'}
                            {order.orderType === 'delivery' && ' Ready for delivery dispatch.'}
                            {order.orderType === 'dine_in' && ' Ready to serve to table.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-green-200">
                      <div className="text-sm text-green-700">
                        <span className="font-medium">Total time:</span> {getTimeElapsed(order.createdAt)} minutes
                      </div>
                      <Button
                        onClick={() => handleOrderStatusUpdate(order.id, 'served')}
                        className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Mark as Served
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.filter(order => order.status === 'ready').length === 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="text-center py-16">
                <div className="p-6 bg-green-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Bell className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">No Orders Ready</h3>
                <p className="text-green-700 text-lg">All orders have been served! 🎉</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}