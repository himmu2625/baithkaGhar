'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  IndianRupee, 
  ShoppingCart, 
  TrendingUp,
  Users,
  Utensils,
  Star,
  AlertCircle,
  BarChart3,
  Calendar,
  Package,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  averageOrderValue: number;
  tableOccupancy: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  kitchenQueue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    currentStock: number;
    minStock: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    table: string;
    items: number;
    total: number;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    time: string;
  }>;
}

export default function FBDashboard() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard statistics
        const response = await fetch(`/api/fb/dashboard/stats?propertyId=${propertyId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setDashboardData(data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Mock data for development
        setDashboardData({
          todayOrders: 47,
          todayRevenue: 12450,
          averageOrderValue: 264,
          tableOccupancy: 78,
          pendingOrders: 8,
          completedOrders: 39,
          cancelledOrders: 2,
          kitchenQueue: 5,
          topSellingItems: [
            { name: 'Butter Chicken', quantity: 12, revenue: 3600 },
            { name: 'Paneer Tikka', quantity: 8, revenue: 2400 },
            { name: 'Dal Makhani', quantity: 15, revenue: 2250 }
          ],
          lowStockItems: [
            { name: 'Basmati Rice', currentStock: 5, minStock: 20 },
            { name: 'Fresh Cream', currentStock: 2, minStock: 10 }
          ],
          recentOrders: [
            {
              id: '1',
              orderNumber: 'ORD-001',
              table: 'T-05',
              items: 3,
              total: 850,
              status: 'preparing',
              time: '2 mins ago'
            },
            {
              id: '2',
              orderNumber: 'ORD-002',
              table: 'T-12',
              items: 2,
              total: 620,
              status: 'ready',
              time: '5 mins ago'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchDashboardData();
    }
  }, [propertyId, session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading F&B Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
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
            onClick={() => router.push(`/os/dashboard/${propertyId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">F&B Management</h1>
            <p className="text-gray-600 mt-2">Restaurant operations dashboard</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href={`/os/fb/orders/${propertyId}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href={`/os/fb/kitchen/${propertyId}`}>
            <Button variant="outline">
              <ChefHat className="w-4 h-4 mr-2" />
              Kitchen Display
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dashboardData?.todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.tableOccupancy}%</div>
            <Progress value={dashboardData?.tableOccupancy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kitchen Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.kitchenQueue}</div>
            <p className="text-xs text-muted-foreground">
              orders in preparation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.table} • {order.items} items</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium">₹{order.total}</p>
                      <p className="text-sm text-gray-500">{order.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href={`/os/fb/orders/${propertyId}`}>
                <Button variant="outline" className="w-full">
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Stock: {item.currentStock}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Low
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href={`/os/fb/inventory/${propertyId}`}>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  Manage Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/os/fb/menu/${propertyId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Utensils className="w-4 h-4 mr-1" />
                    Menu
                  </Button>
                </Link>
                <Link href={`/os/fb/tables/${propertyId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="w-4 h-4 mr-1" />
                    Tables
                  </Button>
                </Link>
                <Link href={`/os/fb/reservations/${propertyId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="w-4 h-4 mr-1" />
                    Reservations
                  </Button>
                </Link>
                <Link href={`/os/fb/reports/${propertyId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items Today</CardTitle>
          <CardDescription>Best performing menu items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData?.topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{item.revenue}</p>
                  <p className="text-sm text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}