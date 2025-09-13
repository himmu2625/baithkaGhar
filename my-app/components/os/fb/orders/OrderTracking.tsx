'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChefHat,
  Utensils,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Users,
  MapPin,
  Phone,
  Bell,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FBOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  totalAmount: number;
  createdAt: string;
  estimatedTime?: number;
  tableName?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  items: Array<{
    id: string;
    menuItemName: string;
    quantity: number;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    preparationTime: number;
  }>;
}

interface OrderTrackingProps {
  propertyId: string;
  orders: FBOrder[];
  onOrderStatusUpdate: (orderId: string, newStatus: string) => void;
}

export function OrderTracking({ propertyId, orders, onOrderStatusUpdate }: OrderTrackingProps) {
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [pausedTimers, setPausedTimers] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers = { ...prevTimers };
        
        orders.forEach(order => {
          if (!pausedTimers[order.id] && ['confirmed', 'preparing'].includes(order.status)) {
            const orderTime = new Date(order.createdAt).getTime();
            const currentTime = new Date().getTime();
            const elapsedMinutes = Math.floor((currentTime - orderTime) / 60000);
            newTimers[order.id] = elapsedMinutes;
          }
        });
        
        return newTimers;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [orders, pausedTimers]);

  const filteredOrders = orders.filter(order => {
    const matchesType = selectedOrderType === 'all' || order.orderType === selectedOrderType;
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    return matchesType && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'preparing': return <ChefHat className="w-5 h-5 text-orange-500" />;
      case 'ready': return <Utensils className="w-5 h-5 text-green-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800 animate-pulse';
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

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'preparing': return 70;
      case 'ready': return 100;
      default: return 0;
    }
  };

  const isOverdue = (order: FBOrder) => {
    if (!order.estimatedTime) return false;
    const elapsedTime = timers[order.id] || 0;
    return elapsedTime > order.estimatedTime;
  };

  const toggleTimer = (orderId: string) => {
    setPausedTimers(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const resetTimer = (orderId: string) => {
    setTimers(prev => ({
      ...prev,
      [orderId]: 0
    }));
    setPausedTimers(prev => ({
      ...prev,
      [orderId]: false
    }));
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return currentStatus;
    }
  };

  const getStatusButtonText = (status: string) => {
    switch (status) {
      case 'pending': return 'Confirm Order';
      case 'confirmed': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Mark Served';
      default: return 'Update Status';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header with Filters - Modern OS Style */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-orange-50/20 to-red-50/30 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/8 via-red-500/6 to-pink-500/8 opacity-70"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
        
        <CardContent className="relative pt-8 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl shadow-lg">
                  <Timer className="h-8 w-8 text-orange-600 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-orange-900">Live Order Tracking</h2>
                  <div className="flex items-center space-x-3 text-orange-700 mt-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Real-time monitoring of active orders</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Enhanced Filter Dropdowns */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                  <SelectTrigger className="relative w-48 h-12 border-0 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Utensils className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <SelectValue placeholder="Order Type" className="text-blue-800 font-medium" />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl p-2">
                    <SelectItem value="all" className="rounded-lg hover:bg-blue-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Utensils className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">All Types</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dine_in" className="rounded-lg hover:bg-blue-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Utensils className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">Dine In</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="takeaway" className="rounded-lg hover:bg-blue-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium">Takeaway</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery" className="rounded-lg hover:bg-blue-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-orange-100">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium">Delivery</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="relative w-48 h-12 border-0 bg-gradient-to-r from-purple-50/90 to-pink-50/90 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Flag className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <SelectValue placeholder="Priority" className="text-purple-800 font-medium" />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl p-2">
                    <SelectItem value="all" className="rounded-lg hover:bg-purple-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Flag className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">All Priorities</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent" className="rounded-lg hover:bg-purple-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <Bell className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium text-red-800">Urgent</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high" className="rounded-lg hover:bg-purple-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-orange-100">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium text-orange-800">High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="normal" className="rounded-lg hover:bg-purple-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-blue-800">Normal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="low" className="rounded-lg hover:bg-purple-50 transition-colors p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Clock className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-800">Low</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Stats - Modern OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardContent className="relative pt-8 pb-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-orange-600 group-hover:animate-pulse" />
              </div>
              <div className="text-4xl font-bold text-orange-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                {filteredOrders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-base font-semibold text-orange-700 mb-1">Pending Orders</div>
              <div className="text-xs text-orange-600 font-medium">Awaiting confirmation</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-red-100 hover:from-orange-100 hover:to-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardContent className="relative pt-8 pb-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <ChefHat className="w-8 h-8 text-red-600 group-hover:animate-bounce" />
              </div>
              <div className="text-4xl font-bold text-red-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                {filteredOrders.filter(o => o.status === 'preparing').length}
              </div>
              <div className="text-base font-semibold text-red-700 mb-1">In Kitchen</div>
              <div className="text-xs text-red-600 font-medium flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Being prepared</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="relative pt-8 pb-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-8 h-8 text-emerald-600 group-hover:animate-pulse" />
              </div>
              <div className="text-4xl font-bold text-emerald-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                {filteredOrders.filter(o => o.status === 'ready').length}
              </div>
              <div className="text-base font-semibold text-emerald-700 mb-1">Ready to Serve</div>
              <div className="text-xs text-emerald-600 font-medium">Pick up / deliver</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardContent className="relative pt-8 pb-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bell className={`w-8 h-8 text-pink-600 ${filteredOrders.filter(o => isOverdue(o)).length > 0 ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-4xl font-bold text-pink-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                {filteredOrders.filter(o => isOverdue(o)).length}
              </div>
              <div className="text-base font-semibold text-pink-700 mb-1">Overdue Orders</div>
              <div className="text-xs text-pink-600 font-medium">Need immediate attention</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders
          .sort((a, b) => {
            // Sort by priority first, then by creation time
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          })
          .map((order) => {
            const elapsedTime = timers[order.id] || 0;
            const isOrderOverdue = isOverdue(order);
            const progress = getStatusProgress(order.status);

            return (
              <Card 
                key={order.id} 
                className={`relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group ${
                  isOrderOverdue ? 'bg-gradient-to-br from-red-50 to-pink-100' : 
                  order.priority === 'urgent' ? 'bg-gradient-to-br from-red-50/80 to-orange-100/80' :
                  order.status === 'preparing' ? 'bg-gradient-to-br from-orange-50/80 to-yellow-100/80' :
                  order.status === 'ready' ? 'bg-gradient-to-br from-green-50/80 to-emerald-100/80' :
                  'bg-gradient-to-br from-white to-blue-50/50'
                } ${order.priority === 'urgent' ? 'ring-2 ring-red-300 ring-opacity-50' : ''}`}
              >
                {/* Enhanced background effects */}
                <div className={`absolute inset-0 ${
                  isOrderOverdue ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10' :
                  order.priority === 'urgent' ? 'bg-gradient-to-r from-red-500/8 to-orange-500/8' :
                  order.status === 'preparing' ? 'bg-gradient-to-r from-orange-500/8 to-yellow-500/8' :
                  order.status === 'ready' ? 'bg-gradient-to-r from-green-500/8 to-emerald-500/8' :
                  'bg-gradient-to-r from-blue-500/5 to-indigo-500/5'
                } opacity-70`}></div>
                
                {order.priority === 'urgent' && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      <Badge className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse">
                        <Bell className="w-3 h-3 mr-1" />
                        <span className="font-bold">URGENT</span>
                      </Badge>
                    </div>
                  </div>
                )}
                
                <CardHeader className="relative pb-4 border-b border-white/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl flex items-center space-x-3 font-bold">
                        <span className="text-gray-900">{order.orderNumber}</span>
                        <div className={`p-2 rounded-lg shadow-sm ${
                          order.orderType === 'dine_in' ? 'bg-blue-100 text-blue-600' :
                          order.orderType === 'takeaway' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {getOrderTypeIcon(order.orderType)}
                        </div>
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-gray-100 rounded">
                            <Users className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{order.customerName}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-blue-100 rounded">
                              <Phone className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-sm text-blue-700 font-medium">{order.customerPhone}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={`${getPriorityColor(order.priority).replace('bg-', 'bg-gradient-to-r from-').replace('-100', '-100 to-').replace(' text-', '-200 text-')} border-0 shadow-lg font-semibold px-3 py-1`}>
                        {order.priority.toUpperCase()}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-6 pt-4">
                  {/* Enhanced Status and Progress */}
                  <div className={`p-4 rounded-xl ${
                    order.status === 'preparing' ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' :
                    order.status === 'ready' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' :
                    order.status === 'pending' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                    'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg shadow-sm ${
                          order.status === 'preparing' ? 'bg-orange-100' :
                          order.status === 'ready' ? 'bg-green-100' :
                          order.status === 'pending' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 capitalize text-lg">{order.status.replace('_', ' ')}</span>
                          <div className="text-xs text-gray-600 font-medium">
                            {order.status === 'preparing' ? 'Kitchen is working on it' :
                             order.status === 'ready' ? 'Ready for pickup/delivery' :
                             order.status === 'pending' ? 'Awaiting confirmation' :
                             'Order confirmed'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{progress}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-3 ${
                        order.status === 'preparing' ? 'bg-orange-200' :
                        order.status === 'ready' ? 'bg-green-200' :
                        order.status === 'pending' ? 'bg-yellow-200' :
                        'bg-blue-200'
                      }`}
                    />
                  </div>

                  {/* Enhanced Timer Section */}
                  <div className={`p-4 rounded-xl shadow-sm ${
                    isOrderOverdue ? 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-300' : 
                    'bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isOrderOverdue ? 'bg-red-200 animate-pulse' : 'bg-gray-200'
                        }`}>
                          <Timer className={`w-5 h-5 ${
                            isOrderOverdue ? 'text-red-700' : 'text-gray-700'
                          }`} />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {elapsedTime}m elapsed
                          </div>
                          {order.estimatedTime && (
                            <div className="text-sm text-gray-600">
                              Est. {order.estimatedTime}m total
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTimer(order.id)}
                          className="bg-white/60 hover:bg-blue-50 border-blue-200 transition-colors"
                        >
                          {pausedTimers[order.id] ? 
                            <Play className="w-4 h-4 text-green-600" /> : 
                            <Pause className="w-4 h-4 text-orange-600" />
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetTimer(order.id)}
                          className="bg-white/60 hover:bg-gray-50 border-gray-200 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                    {isOrderOverdue && (
                      <div className="flex items-center space-x-2 p-2 bg-red-200/50 rounded-lg">
                        <Flag className="w-4 h-4 text-red-700" />
                        <span className="text-sm text-red-800 font-bold">
                          OVERDUE by {elapsedTime - (order.estimatedTime || 0)} minutes
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Items:</span> {order.items.length}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Total:</span> ₹{order.totalAmount}
                    </div>
                    {order.tableName && (
                      <div className="text-sm">
                        <span className="font-medium">Table:</span> {order.tableName}
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div className="text-sm">
                        <span className="font-medium">Address:</span> {order.deliveryAddress.substring(0, 50)}...
                      </div>
                    )}
                  </div>

                  {/* Order Items Status */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Item Status:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                          <span>{item.quantity}x {item.menuItemName}</span>
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-xs font-medium text-yellow-800">Special Instructions:</div>
                      <div className="text-xs text-yellow-700">{order.specialInstructions}</div>
                    </div>
                  )}

                  {/* Enhanced Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-white/50">
                    {order.status !== 'ready' && (
                      <Button
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
                        onClick={() => onOrderStatusUpdate(order.id, getNextStatus(order.status))}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {getStatusButtonText(order.status)}
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <>
                        <Button
                          size="lg"
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
                          onClick={() => onOrderStatusUpdate(order.id, 'served')}
                        >
                          <Utensils className="w-4 h-4 mr-2" />
                          Mark Served
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => {
                            // Trigger notification or alert
                            if (order.customerPhone) {
                              // In a real app, this would send SMS/call
                              alert(`Calling ${order.customerName} at ${order.customerPhone}`);
                            }
                          }}
                          className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <Phone className="w-4 h-4 text-blue-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
          <CardContent className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-4">No Active Orders</h3>
            <p className="text-blue-600 text-lg font-medium mb-2">All caught up! 🎉</p>
            <p className="text-blue-500 max-w-md mx-auto">
              All orders are completed or no orders match the current filters. 
              Great job keeping up with the orders!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}