'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from 'react-beautiful-dnd';
import { 
  Clock, 
  ChefHat, 
  ArrowUp,
  ArrowDown,
  Flame,
  Timer,
  Users,
  Settings,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter
} from 'lucide-react';

interface QueueOrder {
  id: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    preparationTime: number;
    complexity: 'simple' | 'medium' | 'complex';
  }>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime: number;
  actualTime?: number;
  orderTime: Date;
  customerInfo: {
    name?: string;
    tableNumber?: string;
    orderType: 'dine_in' | 'takeout' | 'delivery';
  };
  status: 'queued' | 'preparing' | 'ready' | 'delayed';
  assignedStation?: string;
  delayReason?: string;
}

interface Station {
  id: string;
  name: string;
  type: 'hot' | 'cold' | 'grill' | 'fry' | 'dessert' | 'beverage';
  capacity: number;
  currentLoad: number;
  averageTime: number;
  efficiency: number;
}

interface OrderQueueManagementProps {
  orders: QueueOrder[];
  stations: Station[];
  onOrderReorder: (orders: QueueOrder[]) => void;
  onPriorityChange: (orderId: string, priority: QueueOrder['priority']) => void;
  onStationAssign: (orderId: string, stationId: string) => void;
  onDelayReport: (orderId: string, reason: string, estimatedDelay: number) => void;
}

export default function OrderQueueManagement({
  orders,
  stations,
  onOrderReorder,
  onPriorityChange,
  onStationAssign,
  onDelayReport
}: OrderQueueManagementProps) {
  const [localOrders, setLocalOrders] = useState(orders);
  const [selectedOrder, setSelectedOrder] = useState<QueueOrder | null>(null);
  const [filterStation, setFilterStation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'complexity'>('time');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [estimatedDelay, setEstimatedDelay] = useState(0);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedOrders = Array.from(localOrders);
    const [removed] = reorderedOrders.splice(result.source.index, 1);
    reorderedOrders.splice(result.destination.index, 0, removed);

    setLocalOrders(reorderedOrders);
    onOrderReorder(reorderedOrders);
  };

  const getPriorityColor = (priority: QueueOrder['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'complex': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'simple': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getElapsedTime = (orderTime: Date) => {
    return Math.floor((new Date().getTime() - orderTime.getTime()) / 1000 / 60);
  };

  const calculateQueueStatistics = () => {
    const totalOrders = localOrders.length;
    const averageWaitTime = localOrders.reduce((acc, order) => 
      acc + getElapsedTime(order.orderTime), 0) / totalOrders;
    const delayedOrders = localOrders.filter(order => 
      getElapsedTime(order.orderTime) > order.estimatedTime).length;
    const urgentOrders = localOrders.filter(order => order.priority === 'urgent').length;

    return {
      totalOrders,
      averageWaitTime: Math.round(averageWaitTime),
      delayedOrders,
      urgentOrders,
      onTimePercentage: Math.round(((totalOrders - delayedOrders) / totalOrders) * 100)
    };
  };

  const filteredOrders = localOrders
    .filter(order => filterStation === 'all' || order.assignedStation === filterStation)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'complexity':
          const complexityOrder = { complex: 3, medium: 2, simple: 1 };
          const aComplexity = Math.max(...a.items.map(item => complexityOrder[item.complexity]));
          const bComplexity = Math.max(...b.items.map(item => complexityOrder[item.complexity]));
          return bComplexity - aComplexity;
        default:
          return a.orderTime.getTime() - b.orderTime.getTime();
      }
    });

  const stats = calculateQueueStatistics();

  const DelayReportDialog = () => (
    <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Delay - Order #{selectedOrder?.orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="delayReason">Delay Reason</Label>
            <Select value={delayReason} onValueChange={setDelayReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingredient_shortage">Ingredient Shortage</SelectItem>
                <SelectItem value="equipment_issue">Equipment Issue</SelectItem>
                <SelectItem value="staff_shortage">Staff Shortage</SelectItem>
                <SelectItem value="complex_order">Complex Order</SelectItem>
                <SelectItem value="supplier_delay">Supplier Delay</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="estimatedDelay">Additional Time Needed (minutes)</Label>
            <Input
              id="estimatedDelay"
              type="number"
              min="1"
              value={estimatedDelay || ''}
              onChange={(e) => setEstimatedDelay(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setDelayDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrder && delayReason && estimatedDelay > 0) {
                  onDelayReport(selectedOrder.id, delayReason, estimatedDelay);
                  setDelayDialogOpen(false);
                  setDelayReason('');
                  setEstimatedDelay(0);
                }
              }}
              className="flex-1"
            >
              Report Delay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-2xl font-bold">{stats.averageWaitTime}m</p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delayed Orders</p>
                <p className="text-2xl font-bold text-red-600">{stats.delayedOrders}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.urgentOrders}</p>
              </div>
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Time %</p>
                <p className="text-2xl font-bold text-green-600">{stats.onTimePercentage}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Order Queue Management
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label>Station:</Label>
              <Select value={filterStation} onValueChange={setFilterStation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  {stations.map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Sort by:</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Order Time</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="complexity">Complexity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Station Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stations.map(station => {
          const loadPercentage = (station.currentLoad / station.capacity) * 100;
          return (
            <Card key={station.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{station.name}</h4>
                    <Badge variant={loadPercentage > 80 ? 'destructive' : 'default'} className="text-xs">
                      {station.currentLoad}/{station.capacity}
                    </Badge>
                  </div>
                  <Progress value={loadPercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Avg: {station.averageTime}min • {station.efficiency}% efficiency
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Draggable Order Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Order Queue (Drag to reorder)</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="order-queue">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {filteredOrders.map((order, index) => {
                    const elapsedTime = getElapsedTime(order.orderTime);
                    const isDelayed = elapsedTime > order.estimatedTime;
                    const maxComplexity = Math.max(...order.items.map(item => 
                      item.complexity === 'complex' ? 3 : item.complexity === 'medium' ? 2 : 1
                    ));
                    
                    return (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              p-4 border rounded-lg bg-background transition-shadow
                              ${snapshot.isDragging ? 'shadow-lg' : ''}
                              ${isDelayed ? 'border-red-300 bg-red-50' : ''}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold">#{order.orderNumber}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {order.customerInfo.orderType.replace('_', ' ')}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getPriorityColor(order.priority)}>
                                      {order.priority}
                                    </Badge>
                                    {order.customerInfo.tableNumber && (
                                      <Badge variant="outline">
                                        Table {order.customerInfo.tableNumber}
                                      </Badge>
                                    )}
                                    {order.assignedStation && (
                                      <Badge variant="secondary">
                                        {stations.find(s => s.id === order.assignedStation)?.name}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="text-sm">
                                    {order.items.slice(0, 2).map((item, i) => (
                                      <span key={i} className={getComplexityColor(item.complexity)}>
                                        {item.quantity}x {item.name}
                                        {i < Math.min(order.items.length - 1, 1) && ', '}
                                      </span>
                                    ))}
                                    {order.items.length > 2 && (
                                      <span className="text-muted-foreground">
                                        {' '}+{order.items.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${isDelayed ? 'text-red-600' : ''}`}>
                                    {elapsedTime}m
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    / {order.estimatedTime}m
                                  </div>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newPriority = order.priority === 'urgent' ? 'high' : 
                                                         order.priority === 'high' ? 'normal' : 'high';
                                      onPriorityChange(order.id, newPriority);
                                    }}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setDelayDialogOpen(true);
                                    }}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                  </Button>
                                  
                                  <Select 
                                    value={order.assignedStation || ''} 
                                    onValueChange={(stationId) => onStationAssign(order.id, stationId)}
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Station" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stations.map(station => (
                                        <SelectItem key={station.id} value={station.id}>
                                          {station.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            
                            {isDelayed && (
                              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Delayed by {elapsedTime - order.estimatedTime} minutes
                                {order.delayReason && ` - ${order.delayReason}`}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <DelayReportDialog />
    </div>
  );
}