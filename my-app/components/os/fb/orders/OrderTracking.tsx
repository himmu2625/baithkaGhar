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
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Order Tracking</h2>
          <p className="text-gray-600">Real-time monitoring of active orders</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dine_in">Dine In</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredOrders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredOrders.filter(o => o.status === 'preparing').length}
              </div>
              <div className="text-sm text-gray-500">Preparing</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredOrders.filter(o => o.status === 'ready').length}
              </div>
              <div className="text-sm text-gray-500">Ready</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredOrders.filter(o => isOverdue(o)).length}
              </div>
              <div className="text-sm text-gray-500">Overdue</div>
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
                className={`relative ${isOrderOverdue ? 'border-red-300 bg-red-50' : ''} ${
                  order.priority === 'urgent' ? 'ring-2 ring-red-200' : ''
                }`}
              >
                {order.priority === 'urgent' && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-red-500 text-white">
                      <Bell className="w-3 h-3 mr-1" />
                      URGENT
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{order.orderNumber}</span>
                        <div className="flex items-center text-gray-500">
                          {getOrderTypeIcon(order.orderType)}
                        </div>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{order.customerName}</span>
                        {order.customerPhone && (
                          <>
                            <Phone className="w-3 h-3" />
                            <span className="text-xs">{order.customerPhone}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status and Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium capitalize">{order.status}</span>
                      </div>
                      <span className="text-sm text-gray-500">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Timer */}
                  <div className={`p-3 rounded-lg ${isOrderOverdue ? 'bg-red-100 border border-red-200' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className={`w-4 h-4 ${isOrderOverdue ? 'text-red-600' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">
                          {elapsedTime}m elapsed
                          {order.estimatedTime && ` / ${order.estimatedTime}m est.`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTimer(order.id)}
                        >
                          {pausedTimers[order.id] ? 
                            <Play className="w-3 h-3" /> : 
                            <Pause className="w-3 h-3" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetTimer(order.id)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {isOrderOverdue && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Flag className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-red-600 font-medium">
                          OVERDUE by {elapsedTime - (order.estimatedTime || 0)}m
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

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.status !== 'ready' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onOrderStatusUpdate(order.id, getNextStatus(order.status))}
                      >
                        {getStatusButtonText(order.status)}
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => onOrderStatusUpdate(order.id, 'served')}
                        >
                          Mark Served
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Trigger notification or alert
                            if (order.customerPhone) {
                              // In a real app, this would send SMS/call
                              alert(`Calling ${order.customerName} at ${order.customerPhone}`);
                            }
                          }}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Order Created Time */}
                  <div className="text-xs text-gray-500 text-center">
                    Created: {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active orders to track</p>
            <p className="text-sm text-gray-400 mt-2">All orders are completed or no orders match the current filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}