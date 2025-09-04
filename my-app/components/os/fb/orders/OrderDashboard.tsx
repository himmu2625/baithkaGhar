'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Users, 
  ChefHat,
  Utensils,
  Timer,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

interface FBOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  totalAmount: number;
  createdAt: string;
  estimatedTime?: number;
  tableName?: string;
}

interface OrderDashboardProps {
  propertyId: string;
  stats: OrderStats;
  recentOrders: FBOrder[];
  onOrderStatusUpdate: (orderId: string, newStatus: string) => void;
}

export function OrderDashboard({ propertyId, stats, recentOrders, onOrderStatusUpdate }: OrderDashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  
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
      case 'delivery': return <ChefHat className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const completionRate = stats.totalOrders > 0 
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders + stats.preparingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending, {stats.preparingOrders} preparing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8% from last week
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.averageOrderValue}</div>
            <p className="text-xs text-muted-foreground">
              Avg prep: {stats.averagePreparationTime} mins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Overview</CardTitle>
            <CardDescription>Current status distribution of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.pendingOrders}</span>
                  <Progress value={(stats.pendingOrders / stats.totalOrders) * 100} className="w-20" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Preparing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.preparingOrders}</span>
                  <Progress value={(stats.preparingOrders / stats.totalOrders) * 100} className="w-20" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.completedOrders}</span>
                  <Progress value={(stats.completedOrders / stats.totalOrders) * 100} className="w-20" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{stats.cancelledOrders}</span>
                  <Progress value={(stats.cancelledOrders / stats.totalOrders) * 100} className="w-20" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Timer className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{stats.averagePreparationTime}</div>
                  <div className="text-xs text-blue-600">Avg Prep Time (mins)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">4.8</div>
                  <div className="text-xs text-green-600">Customer Rating</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Peak Hour Efficiency</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Order Accuracy</span>
                    <span>96%</span>
                  </div>
                  <Progress value={96} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>On-time Delivery</span>
                    <span>88%</span>
                  </div>
                  <Progress value={88} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders requiring attention</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getOrderTypeIcon(order.orderType)}
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-gray-500">
                      {order.tableName || order.orderType.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">₹{order.totalAmount}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                    
                    {order.priority !== 'normal' && (
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOrderStatusUpdate(order.id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOrderStatusUpdate(order.id, 'preparing')}
                      >
                        Start Prep
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOrderStatusUpdate(order.id, 'ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOrderStatusUpdate(order.id, 'served')}
                      >
                        Served
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Urgent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-red-600">
                {recentOrders.filter(o => o.priority === 'urgent').length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Orders need immediate attention</div>
              <Button variant="outline" size="sm" className="mt-3">
                View Urgent
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ready to Serve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600">
                {recentOrders.filter(o => o.status === 'ready').length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Orders ready for pickup/delivery</div>
              <Button variant="outline" size="sm" className="mt-3">
                View Ready
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-orange-600">3</div>
              <div className="text-sm text-gray-500 mt-1">Orders awaiting payment</div>
              <Button variant="outline" size="sm" className="mt-3">
                Process Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}