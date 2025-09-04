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
  ArrowLeft
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
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">Track and manage all food & beverage orders</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh" className="text-sm">Auto Refresh</label>
          </div>
          <Button 
            onClick={() => setIsCreateMode(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
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
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-3">
                        <span>{order.orderNumber}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <div className="flex items-center text-gray-500">
                          {getOrderTypeIcon(order.orderType)}
                          <span className="ml-1 text-sm">{order.orderType.replace('_', ' ')}</span>
                        </div>
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center space-x-4">
                        <span className="font-medium">{order.customerName}</span>
                        {order.customerPhone && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.customerPhone}
                          </span>
                        )}
                        {order.tableName && <span>• {order.tableName}</span>}
                        {order.deliveryAddress && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {order.deliveryAddress}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-800">₹{order.totalAmount}</div>
                      <div className="text-sm text-gray-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
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
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <div className="text-sm font-medium text-yellow-800">Special Instructions:</div>
                        <div className="text-sm text-yellow-700">{order.specialInstructions}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateMode(true)}
                >
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