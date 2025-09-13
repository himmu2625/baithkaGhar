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
  ArrowLeft,
  Receipt,
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Activity,
  Timer,
  CheckCircle2,
  RefreshCw,
  Bell,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
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
    <div className="space-y-8">
      {/* Enhanced Header - Matching OS Dashboard Style */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Utensils className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">F&B Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <ChefHat className="h-4 w-4" />
                    <span className="text-orange-100">Restaurant Operations</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Link href={`/os/fb/orders/${propertyId}`}>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Orders
              </Button>
            </Link>
            <Link href={`/os/fb/kitchen/${propertyId}`}>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold">
                <ChefHat className="w-4 h-4 mr-2" />
                Kitchen Display
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - Matching OS Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Today's Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              ₹{dashboardData?.todayRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600">+12%</span>
              <span className="text-xs text-emerald-600">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Orders Today</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {dashboardData?.todayOrders}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600">{dashboardData?.pendingOrders} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Table Occupancy</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {dashboardData?.tableOccupancy}%
            </div>
            <div className="space-y-2">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${dashboardData?.tableOccupancy}%` }}
                ></div>
              </div>
              <span className="text-xs text-purple-600">Active tables</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">Kitchen Queue</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <ChefHat className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">
              {dashboardData?.kitchenQueue}
            </div>
            <div className="flex items-center space-x-1">
              <Timer className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">orders in preparation</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content with Accordions - OS Style */}
      <Accordion
        type="multiple"
        defaultValue={["overview", "orders", "menu", "inventory", "reports", "reservations"]}
        className="w-full"
      >
        {/* Restaurant Overview Section - Clean Modern Style */}
        <AccordionItem
          value="overview"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 mr-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <span>Restaurant Overview</span>
              <div className="flex items-center space-x-2 ml-auto mr-4">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {dashboardData?.todayOrders} Orders Today
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  <ChefHat className="w-3 h-3 mr-1" />
                  {dashboardData?.kitchenQueue} In Kitchen
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Card */}
              <Card className="lg:col-span-2 border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Live order tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Receipt className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.table} • {order.items} items</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(order.status)} font-medium`}>
                          {order.status}
                        </Badge>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{order.total}</p>
                          <p className="text-xs text-gray-500">{order.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <Link href={`/os/fb/orders/${propertyId}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Eye className="w-4 h-4 mr-2" />
                        View All Orders
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Top Selling Items Card */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Star className="h-5 w-5 text-amber-600 mr-2" />
                    Top Sellers
                  </CardTitle>
                  <CardDescription>Today's favorites</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.topSellingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.revenue}</p>
                        <div className="flex items-center justify-end space-x-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Hot</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Performance Summary */}
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-800">Performance</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-amber-900">Trending Up</div>
                        <div className="text-xs text-amber-700">Strong sales today</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Orders Management */}
        <AccordionItem
          value="orders"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-emerald-100 mr-3">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              <span>Order Management</span>
              <Badge
                variant="outline"
                className="ml-auto mr-4 bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                Active Operations
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    Order Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-800">Completed</span>
                      </div>
                      <span className="font-bold text-green-800">{dashboardData?.completedOrders}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-yellow-800">Pending</span>
                      </div>
                      <span className="font-bold text-yellow-800">{dashboardData?.pendingOrders}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium text-red-800">Cancelled</span>
                      </div>
                      <span className="font-bold text-red-800">{dashboardData?.cancelledOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <ChefHat className="h-5 w-5 text-blue-600 mr-2" />
                    Kitchen Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-blue-100">
                    <div className="text-3xl font-bold text-blue-900 mb-1">
                      {dashboardData?.kitchenQueue}
                    </div>
                    <div className="text-sm text-blue-700">Orders in Queue</div>
                  </div>
                  <Link href={`/os/fb/kitchen/${propertyId}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <ChefHat className="w-4 h-4 mr-2" />
                      View Kitchen Display
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Bell className="h-5 w-5 text-purple-600 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/os/fb/orders/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">All Orders</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/pos/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">New Order (POS)</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/tables/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-green-100 hover:bg-green-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Table Management</span>
                      </div>
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Menu Management */}
        <AccordionItem
          value="menu"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-indigo-100 mr-3">
                <Utensils className="h-5 w-5 text-indigo-600" />
              </div>
              <span>Menu & Pricing</span>
              <Badge className="ml-auto mr-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-0 shadow-sm font-semibold px-3 py-1">
                <Utensils className="w-3 h-3 mr-1" />
                Management
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Utensils className="h-5 w-5 text-indigo-600 mr-2" />
                    Menu Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-indigo-100">
                    <div className="text-2xl font-bold text-indigo-900 mb-1">Menu</div>
                    <div className="text-sm text-indigo-700">Food & Beverages</div>
                  </div>
                  <Link href={`/os/fb/menu/${propertyId}`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View Menu
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 text-green-600 mr-2" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-green-100">
                    <div className="text-2xl font-bold text-green-900 mb-1">Organize</div>
                    <div className="text-sm text-green-700">Menu Categories</div>
                  </div>
                  <Link href={`/os/fb/menu/${propertyId}?tab=categories`}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Manage Categories
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
                    Pricing & Offers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-orange-100">
                    <div className="text-2xl font-bold text-orange-900 mb-1">₹{dashboardData?.averageOrderValue || 0}</div>
                    <div className="text-sm text-orange-700">Avg Order Value</div>
                  </div>
                  <Link href={`/os/fb/menu/${params.propertyId}?tab=pricing`}>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <IndianRupee className="w-4 h-4 mr-2" />
                      Update Pricing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Inventory Management */}
        <AccordionItem
          value="inventory"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-amber-100 mr-3">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <span>Inventory & Stock</span>
              <div className="flex items-center space-x-2 ml-auto mr-4">
                <Badge
                  variant="destructive"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  {dashboardData?.lowStockItems?.length || 0} Low Stock
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    Stock Alerts
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData?.lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
                      <div>
                        <p className="font-semibold text-red-900">{item.name}</p>
                        <p className="text-sm text-red-700">Current: {item.currentStock} | Min: {item.minStock}</p>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))}
                  <Link href={`/os/fb/inventory/${propertyId}`}>
                    <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
                      <Package className="w-4 h-4 mr-2" />
                      Manage Inventory
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="h-5 w-5 text-blue-600 mr-2" />
                    Quick Inventory Actions
                  </CardTitle>
                  <CardDescription>Streamline your inventory workflow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/os/fb/inventory/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Add New Item</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/inventory/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-green-100 hover:bg-green-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Update Stock Levels</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/reports/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Stock Reports</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/inventory/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-800">Inventory Settings</span>
                      </div>
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Reports & Analytics */}
        <AccordionItem
          value="reports"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-violet-100 mr-3">
                <BarChart3 className="h-5 w-5 text-violet-600" />
              </div>
              <span>Reports & Analytics</span>
              <Badge variant="secondary" className="ml-auto mr-4 bg-violet-50 text-violet-700">
                Business Intelligence
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <IndianRupee className="h-5 w-5 text-violet-600 mr-2" />
                    Sales Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-violet-100">
                    <div className="text-2xl font-bold text-violet-900 mb-1">₹{dashboardData?.todayRevenue.toLocaleString()}</div>
                    <div className="text-sm text-violet-700">Today's Revenue</div>
                  </div>
                  <Link href={`/os/fb/reports/${propertyId}`}>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Sales Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 text-purple-600 mr-2" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-purple-100">
                    <div className="text-2xl font-bold text-purple-900 mb-1">{dashboardData?.todayOrders}</div>
                    <div className="text-sm text-purple-700">Orders Today</div>
                  </div>
                  <Link href={`/os/fb/reports/${propertyId}?tab=menu`}>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Menu Performance
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    Customer Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-blue-100">
                    <div className="text-2xl font-bold text-blue-900 mb-1">₹{dashboardData?.averageOrderValue}</div>
                    <div className="text-sm text-blue-700">Avg Order Value</div>
                  </div>
                  <Link href={`/os/fb/reports/${propertyId}?tab=customers`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Users className="w-4 h-4 mr-2" />
                      Customer Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Reservations Management */}
        <AccordionItem
          value="reservations"
          className="border rounded-xl shadow-sm bg-white"
        >
          <AccordionTrigger className="text-lg font-semibold px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-rose-100 mr-3">
                <Calendar className="h-5 w-5 text-rose-600" />
              </div>
              <span>Table Reservations</span>
              <Badge variant="secondary" className="ml-auto mr-4 bg-rose-50 text-rose-700">
                Booking System
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md bg-gradient-to-br from-rose-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 text-rose-600 mr-2" />
                    Today's Reservations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-rose-100">
                    <div className="text-2xl font-bold text-rose-900 mb-1">12</div>
                    <div className="text-sm text-rose-700">Bookings Today</div>
                  </div>
                  <Link href={`/os/fb/reservations/${propertyId}`}>
                    <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Reservations
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 text-pink-600 mr-2" />
                    Reservation Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-xl bg-pink-100">
                    <div className="text-2xl font-bold text-pink-900 mb-1">8</div>
                    <div className="text-sm text-pink-700">Available Slots</div>
                  </div>
                  <Link href={`/os/fb/reservations/${propertyId}?tab=calendar`}>
                    <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendar View
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <PlusCircle className="h-5 w-5 text-amber-600 mr-2" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/os/fb/reservations/${propertyId}`}>
                    <button className="w-full p-3 text-left rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">New Reservation</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/reservations/${propertyId}?tab=list`}>
                    <button className="w-full p-3 text-left rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Manage Bookings</span>
                      </div>
                    </button>
                  </Link>
                  <Link href={`/os/fb/reservations/${propertyId}?tab=timeline`}>
                    <button className="w-full p-3 text-left rounded-lg bg-red-100 hover:bg-red-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">Timeline View</span>
                      </div>
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}