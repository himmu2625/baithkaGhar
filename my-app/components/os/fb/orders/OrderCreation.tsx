'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Minus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Utensils, 
  Users, 
  Truck, 
  Clock, 
  DollarSign,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  itemType: 'food' | 'beverage' | 'combo';
  isActive: boolean;
  isAvailable: boolean;
  preparationTime: number;
  image?: string;
  spicyLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
  };
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

interface Table {
  id: string;
  name: string;
  capacity: number;
  isAvailable: boolean;
}

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
  createdAt: string;
  updatedAt: string;
}

interface OrderCreationProps {
  propertyId: string;
  onClose: () => void;
  onSave: (order: FBOrder) => void;
}

export function OrderCreation({ propertyId, onClose, onSave }: OrderCreationProps) {
  const { data: session } = useSession();
  const [currentTab, setCurrentTab] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    orderType: 'dine_in' as 'dine_in' | 'takeaway' | 'delivery',
    tableId: '',
    deliveryAddress: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    notes: '',
    specialInstructions: '',
    paymentMethod: '',
  });

  const [orderItems, setOrderItems] = useState<FBOrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [menuRes, tablesRes] = await Promise.all([
          fetch(`/api/fb/menu/items?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/tables?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData.items || []);
        }

        if (tablesRes.ok) {
          const tablesData = await tablesRes.json();
          setTables(tablesData.tables || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Mock data for development
        setMenuItems([
          {
            id: '1',
            name: 'Butter Chicken',
            description: 'Creamy tomato-based chicken curry',
            categoryId: '2',
            categoryName: 'Main Course',
            basePrice: 350,
            itemType: 'food',
            isActive: true,
            isAvailable: true,
            preparationTime: 25,
            spicyLevel: 'medium',
            dietary: { vegetarian: false, vegan: false, glutenFree: false }
          },
          {
            id: '2',
            name: 'Paneer Tikka',
            description: 'Grilled cottage cheese with spices',
            categoryId: '1',
            categoryName: 'Appetizers',
            basePrice: 280,
            itemType: 'food',
            isActive: true,
            isAvailable: true,
            preparationTime: 20,
            spicyLevel: 'mild',
            dietary: { vegetarian: true, vegan: false, glutenFree: true }
          }
        ]);

        setTables([
          { id: 'T01', name: 'Table 1', capacity: 4, isAvailable: true },
          { id: 'T02', name: 'Table 2', capacity: 6, isAvailable: false },
          { id: 'T03', name: 'Table 3', capacity: 2, isAvailable: true },
        ]);
      }
    };

    if (propertyId && session) {
      fetchMenuData();
    }
  }, [propertyId, session]);

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && item.isActive && item.isAvailable;
  });

  const addItemToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setOrderItems(items =>
        items.map(item =>
          item.menuItemId === menuItem.id
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice
              }
            : item
        )
      );
    } else {
      const newItem: FBOrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        categoryName: menuItem.categoryName,
        quantity: 1,
        unitPrice: menuItem.basePrice,
        totalPrice: menuItem.basePrice,
        status: 'pending',
        preparationTime: menuItem.preparationTime,
      };
      setOrderItems(items => [...items, newItem]);
    }
  };

  const updateItemQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(items => items.filter(item => item.menuItemId !== menuItemId));
    } else {
      setOrderItems(items =>
        items.map(item =>
          item.menuItemId === menuItemId
            ? { 
                ...item, 
                quantity: newQuantity,
                totalPrice: newQuantity * item.unitPrice
              }
            : item
        )
      );
    }
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = Math.round(subtotal * 0.18); // 18% tax
  const discount = 0;
  const totalAmount = subtotal + tax - discount;
  const estimatedTime = Math.max(...orderItems.map(item => item.preparationTime), 0);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `ORD-${timestamp}`;
  };

  const handleSaveOrder = async () => {
    if (!orderData.customerName || orderItems.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      const newOrder: FBOrder = {
        id: Date.now().toString(), // Temporary ID
        orderNumber: generateOrderNumber(),
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || undefined,
        customerEmail: orderData.customerEmail || undefined,
        orderType: orderData.orderType,
        tableId: orderData.tableId || undefined,
        tableName: orderData.tableId ? tables.find(t => t.id === orderData.tableId)?.name : undefined,
        deliveryAddress: orderData.deliveryAddress || undefined,
        status: 'pending',
        priority: orderData.priority,
        items: orderItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod || undefined,
        notes: orderData.notes || undefined,
        specialInstructions: orderData.specialInstructions || undefined,
        estimatedTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/fb/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...newOrder,
          propertyId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.order || newOrder);
      } else {
        // For development, still call onSave with mock data
        onSave(newOrder);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      // For development, still call onSave with mock data
      const newOrder: FBOrder = {
        id: Date.now().toString(),
        orderNumber: generateOrderNumber(),
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone || undefined,
        customerEmail: orderData.customerEmail || undefined,
        orderType: orderData.orderType,
        tableId: orderData.tableId || undefined,
        tableName: orderData.tableId ? tables.find(t => t.id === orderData.tableId)?.name : undefined,
        deliveryAddress: orderData.deliveryAddress || undefined,
        status: 'pending',
        priority: orderData.priority,
        items: orderItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        paymentStatus: 'pending',
        paymentMethod: orderData.paymentMethod || undefined,
        notes: orderData.notes || undefined,
        specialInstructions: orderData.specialInstructions || undefined,
        estimatedTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(newOrder);
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return <Utensils className="w-4 h-4" />;
      case 'takeaway': return <Users className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => ({ id: item.categoryId, name: item.categoryName }))
    .map(cat => JSON.stringify(cat))))
    .map(str => JSON.parse(str));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Take a new order for dine-in, takeaway, or delivery
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Customer Info</TabsTrigger>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="review">Review & Confirm</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Enter customer details and order preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={orderData.customerName}
                        onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerPhone"
                        placeholder="Enter phone number"
                        value={orderData.customerPhone}
                        onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerEmail"
                        placeholder="Enter email address"
                        value={orderData.customerEmail}
                        onChange={(e) => setOrderData({ ...orderData, customerEmail: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="priority">Order Priority</Label>
                    <Select value={orderData.priority} onValueChange={(value) => setOrderData({ ...orderData, priority: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {['dine_in', 'takeaway', 'delivery'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`p-4 border rounded-lg flex flex-col items-center space-y-2 hover:bg-gray-50 ${
                          orderData.orderType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setOrderData({ ...orderData, orderType: type as any })}
                      >
                        {getOrderTypeIcon(type)}
                        <span className="text-sm font-medium">
                          {type === 'dine_in' ? 'Dine In' : type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {orderData.orderType === 'dine_in' && (
                  <div>
                    <Label htmlFor="tableId">Select Table</Label>
                    <Select value={orderData.tableId} onValueChange={(value) => setOrderData({ ...orderData, tableId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.filter(table => table.isAvailable).map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.name} (Capacity: {table.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {orderData.orderType === 'delivery' && (
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <Textarea
                        id="deliveryAddress"
                        placeholder="Enter complete delivery address"
                        value={orderData.deliveryAddress}
                        onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any special requests or dietary requirements"
                    value={orderData.specialInstructions}
                    onChange={(e) => setOrderData({ ...orderData, specialInstructions: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Menu Items</CardTitle>
                <CardDescription>Browse and add items to the order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold">₹{item.basePrice}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {item.categoryName}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{item.preparationTime}m</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => addItemToOrder(item)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Items Summary */}
            {orderItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Items ({orderItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{item.menuItemName}</span>
                          <div className="text-sm text-gray-500">{item.categoryName}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-20 text-right">₹{item.totalPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Customer Details</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {orderData.customerName}</div>
                      {orderData.customerPhone && <div><strong>Phone:</strong> {orderData.customerPhone}</div>}
                      {orderData.customerEmail && <div><strong>Email:</strong> {orderData.customerEmail}</div>}
                      <div><strong>Type:</strong> {orderData.orderType.replace('_', ' ')}</div>
                      {orderData.tableId && (
                        <div><strong>Table:</strong> {tables.find(t => t.id === orderData.tableId)?.name}</div>
                      )}
                      {orderData.deliveryAddress && (
                        <div><strong>Address:</strong> {orderData.deliveryAddress}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Order Items</h3>
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.menuItemId} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItemName}</span>
                          <span>₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orderData.specialInstructions && (
                    <div>
                      <h3 className="font-medium mb-2">Special Instructions</h3>
                      <p className="text-sm text-gray-600">{orderData.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>₹{tax}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>₹{totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Estimated Time: {estimatedTime} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Priority: {orderData.priority}</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={orderData.paymentMethod} onValueChange={(value) => setOrderData({ ...orderData, paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="pending">Pay Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <div className="flex space-x-2">
            {currentTab !== 'customer' && (
              <Button 
                variant="outline"
                onClick={() => {
                  const tabs = ['customer', 'menu', 'review'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
            {currentTab !== 'review' ? (
              <Button 
                onClick={() => {
                  const tabs = ['customer', 'menu', 'review'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={currentTab === 'customer' && !orderData.customerName}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSaveOrder}
                disabled={loading || !orderData.customerName || orderItems.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Order'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}