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
            <h1 className="text-3xl font-bold text-gray-900">Kitchen Display System</h1>
            <p className="text-gray-600 mt-2">Real-time order management for kitchen operations</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              {kitchenStations.map((station) => (
                <SelectItem key={station.value} value={station.value}>
                  {station.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchKitchenData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Kitchen Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Preparation</CardTitle>
            <ChefHat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.preparingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Serve</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.readyOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Prep Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averagePreparationTime || 0}m</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Display */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats?.pendingOrders || 0})</TabsTrigger>
          <TabsTrigger value="preparing">Preparing ({stats?.preparingOrders || 0})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({stats?.readyOrders || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(order => order.status !== 'served').map((order) => (
              <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)}`}>
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
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.quantity}x {item.name}</span>
                              <Badge variant="outline" className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>
                            {item.specialInstructions && (
                              <p className="text-sm text-red-600 mt-1">
                                Note: {item.specialInstructions}
                              </p>
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
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Start
                              </Button>
                            )}
                            {item.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusUpdate(order.id, item.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700"
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
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Order
                        </Button>
                      )}
                      {order.status === 'preparing' && order.items.every(item => item.status === 'ready') && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Order
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => handleOrderStatusUpdate(order.id, 'served')}
                          variant="outline"
                          className="bg-gray-600 text-white hover:bg-gray-700"
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
            <Card>
              <CardContent className="text-center py-8">
                <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Individual status tabs */}
        {['pending', 'preparing', 'ready'].map(status => (
          <TabsContent key={status} value={status} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.filter(order => order.status === status).map((order) => (
                <Card key={order.id} className={`border-l-4 ${getOrderPriorityColor(order.priority)}`}>
                  {/* Same card content as above - could be extracted to component */}
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
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}