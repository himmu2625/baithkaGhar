'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Timer,
  Users,
  MessageSquare,
  Zap,
  Eye,
  Play,
  Pause
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifications?: string[];
  specialInstructions?: string;
  allergens?: string[];
  preparationTime: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  orderType: 'dine_in' | 'takeout' | 'delivery';
  totalItems: number;
  estimatedTime: number;
  actualTime?: number;
  startTime: Date;
  status: 'new' | 'acknowledged' | 'preparing' | 'ready' | 'served';
  assignedChef?: string;
  notes?: string[];
}

interface KitchenDisplaySystemProps {
  orders: KitchenOrder[];
  onOrderStatusUpdate: (orderId: string, status: KitchenOrder['status']) => void;
  onItemStatusUpdate: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  onOrderAcknowledge: (orderId: string, chefId: string) => void;
  currentChef: {
    id: string;
    name: string;
    station: string;
  };
}

export default function KitchenDisplaySystem({
  orders,
  onOrderStatusUpdate,
  onItemStatusUpdate,
  onOrderAcknowledge,
  currentChef
}: KitchenDisplaySystemProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | KitchenOrder['status']>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredOrders = orders
    .filter(order => filterStatus === 'all' || order.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  const getElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
    return elapsed;
  };

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'acknowledged': return 'bg-yellow-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: KitchenOrder['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getItemStatusIcon = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'preparing': return <ChefHat className="h-4 w-4 text-orange-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'served': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAcknowledgeOrder = (order: KitchenOrder) => {
    onOrderAcknowledge(order.id, currentChef.id);
    onOrderStatusUpdate(order.id, 'acknowledged');
  };

  const handleStartOrder = (orderId: string) => {
    onOrderStatusUpdate(orderId, 'preparing');
  };

  const handleCompleteOrder = (orderId: string) => {
    onOrderStatusUpdate(orderId, 'ready');
  };

  const OrderDetailDialog = ({ order }: { order: KitchenOrder | null }) => (
    <Dialog open={!!order} onOpenChange={() => setSelectedOrder(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Order #{order?.orderNumber} Details
          </DialogTitle>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Order Time: {order.startTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span>Elapsed: {getElapsedTime(order.startTime)} min</span>
                </div>
                {order.tableNumber && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Table: {order.tableNumber}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Badge className={getStatusColor(order.status)}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={getPriorityColor(order.priority)}>
                  {order.priority.toUpperCase()} PRIORITY
                </Badge>
                <Badge variant="outline">
                  {order.orderType.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Order Items:</h4>
              {order.items.map(item => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getItemStatusIcon(item.status)}
                        <span className="font-medium">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      
                      {item.modifications && item.modifications.length > 0 && (
                        <div className="text-sm text-blue-600 mb-1">
                          <strong>Modifications:</strong> {item.modifications.join(', ')}
                        </div>
                      )}
                      
                      {item.specialInstructions && (
                        <div className="text-sm text-orange-600 mb-1">
                          <strong>Special Instructions:</strong> {item.specialInstructions}
                        </div>
                      )}
                      
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="text-sm text-red-600 mb-1">
                          <strong>Allergens:</strong> {item.allergens.join(', ')}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Prep time: {item.preparationTime} min
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {item.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => onItemStatusUpdate(order.id, item.id, 'preparing')}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {item.status === 'preparing' && (
                        <Button 
                          size="sm"
                          onClick={() => onItemStatusUpdate(order.id, item.id, 'ready')}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {order.assignedChef && (
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                <span>Assigned to: {order.assignedChef}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Kitchen Display System - {currentChef.station}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              </div>
              <Badge>{currentChef.name}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({orders.length})
            </Button>
            <Button
              variant={filterStatus === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('new')}
            >
              New ({orders.filter(o => o.status === 'new').length})
            </Button>
            <Button
              variant={filterStatus === 'preparing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('preparing')}
            >
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </Button>
            <Button
              variant={filterStatus === 'ready' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ready')}
            >
              Ready ({orders.filter(o => o.status === 'ready').length})
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map(order => {
          const elapsedTime = getElapsedTime(order.startTime);
          const isOverdue = elapsedTime > order.estimatedTime;
          
          return (
            <Card 
              key={order.id} 
              className={`${
                order.status === 'new' ? 'border-blue-500 shadow-blue-100' :
                order.status === 'preparing' ? 'border-orange-500 shadow-orange-100' :
                order.status === 'ready' ? 'border-green-500 shadow-green-100' :
                'border-gray-200'
              } ${isOverdue ? 'ring-2 ring-red-300' : ''} relative`}
            >
              {/* Priority Indicator */}
              {(order.priority === 'urgent' || order.priority === 'high') && (
                <div className="absolute -top-1 -right-1">
                  <Flame className={`h-6 w-6 ${
                    order.priority === 'urgent' ? 'text-red-500' : 'text-orange-500'
                  }`} />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
                    {order.tableNumber && (
                      <p className="text-sm text-muted-foreground">
                        Table {order.tableNumber}
                      </p>
                    )}
                    {order.customerName && (
                      <p className="text-sm text-muted-foreground">
                        {order.customerName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority.toUpperCase()}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {elapsedTime} / {order.estimatedTime} min
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress 
                    value={Math.min((elapsedTime / order.estimatedTime) * 100, 100)}
                    className={`h-2 ${isOverdue ? 'bg-red-100' : ''}`}
                  />
                  {isOverdue && (
                    <div className="flex items-center gap-1 text-red-600 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue by {elapsedTime - order.estimatedTime} min
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Order Items Summary */}
                <div className="space-y-2">
                  {order.items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      {getItemStatusIcon(item.status)}
                      <span className="flex-1">
                        {item.quantity}x {item.name}
                      </span>
                      {item.modifications && item.modifications.length > 0 && (
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  ))}
                  
                  {order.items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {order.status === 'new' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAcknowledgeOrder(order)}
                      className="flex-1"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                  )}
                  
                  {order.status === 'acknowledged' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartOrder(order.id)}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleCompleteOrder(order.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Orders</h3>
            <p className="text-muted-foreground">
              {filterStatus === 'all' 
                ? 'No orders in the queue' 
                : `No ${filterStatus} orders`}
            </p>
          </CardContent>
        </Card>
      )}

      <OrderDetailDialog order={selectedOrder} />
    </div>
  );
}