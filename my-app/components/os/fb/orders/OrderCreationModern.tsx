'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  ShoppingCart,
  ChefHat,
  Star,
  Zap,
  CheckCircle,
  Info,
  Filter,
  ArrowRight,
  ArrowLeft,
  Eye,
  Sparkles,
  Calculator,
  CreditCard,
  Wallet,
  Smartphone,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

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
  rating?: number;
  isPopular?: boolean;
  isNew?: boolean;
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
  section?: string;
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

const SPICY_LEVELS = {
  none: { icon: '🟢', label: 'No Spice' },
  mild: { icon: '🟡', label: 'Mild' },
  medium: { icon: '🟠', label: 'Medium' },
  hot: { icon: '🔴', label: 'Hot' },
  extra_hot: { icon: '🌶️', label: 'Extra Hot' }
};

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: <Wallet className="w-4 h-4" /> },
  { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'upi', label: 'UPI', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'pending', label: 'Pay Later', icon: <Receipt className="w-4 h-4" /> }
];

export function OrderCreationModern({ propertyId, onClose, onSave }: OrderCreationProps) {
  const { data: session } = useSession();
  const [currentTab, setCurrentTab] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [completionProgress, setCompletionProgress] = useState(0);
  
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
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  const [showOnlyVegetarian, setShowOnlyVegetarian] = useState(false);

  // Calculate completion progress
  useEffect(() => {
    const totalSteps = 8;
    const completedSteps = [
      orderData.customerName,
      orderData.orderType,
      orderData.orderType === 'dine_in' ? orderData.tableId : true,
      orderData.orderType === 'delivery' ? orderData.deliveryAddress : true,
      orderItems.length > 0,
      orderData.paymentMethod,
      true, // Always count review step as available
      true  // Always count final step as available
    ].filter(Boolean).length;
    
    setCompletionProgress(Math.round((completedSteps / totalSteps) * 100));
  }, [orderData, orderItems]);

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
        // Enhanced mock data
        setMenuItems([
          {
            id: '1',
            name: 'Butter Chicken',
            description: 'Rich and creamy tomato-based chicken curry with aromatic spices',
            categoryId: '2',
            categoryName: 'Main Course',
            basePrice: 350,
            itemType: 'food',
            isActive: true,
            isAvailable: true,
            preparationTime: 25,
            spicyLevel: 'medium',
            dietary: { vegetarian: false, vegan: false, glutenFree: false },
            rating: 4.5,
            isPopular: true,
            isNew: false
          },
          {
            id: '2',
            name: 'Paneer Tikka',
            description: 'Grilled cottage cheese marinated in yogurt and spices',
            categoryId: '1',
            categoryName: 'Appetizers',
            basePrice: 280,
            itemType: 'food',
            isActive: true,
            isAvailable: true,
            preparationTime: 20,
            spicyLevel: 'mild',
            dietary: { vegetarian: true, vegan: false, glutenFree: true },
            rating: 4.3,
            isPopular: true,
            isNew: false
          },
          {
            id: '3',
            name: 'Masala Chai',
            description: 'Traditional Indian spiced tea with aromatic herbs',
            categoryId: '3',
            categoryName: 'Beverages',
            basePrice: 60,
            itemType: 'beverage',
            isActive: true,
            isAvailable: true,
            preparationTime: 5,
            spicyLevel: 'none',
            dietary: { vegetarian: true, vegan: false, glutenFree: true },
            rating: 4.2,
            isPopular: false,
            isNew: true
          }
        ]);

        setTables([
          { id: 'T01', name: 'Table 1', capacity: 4, isAvailable: true, section: 'Main Hall' },
          { id: 'T02', name: 'Table 2', capacity: 6, isAvailable: false, section: 'Main Hall' },
          { id: 'T03', name: 'Table 3', capacity: 2, isAvailable: true, section: 'Terrace' },
          { id: 'T04', name: 'VIP Table', capacity: 8, isAvailable: true, section: 'Private' },
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
    const matchesPopular = !showOnlyPopular || item.isPopular;
    const matchesVegetarian = !showOnlyVegetarian || item.dietary.vegetarian;
    
    return matchesSearch && matchesCategory && matchesPopular && matchesVegetarian && item.isActive && item.isAvailable;
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
        onSave(newOrder);
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
      case 'dine_in': return <Utensils className="w-5 h-5" />;
      case 'takeaway': return <Users className="w-5 h-5" />;
      case 'delivery': return <Truck className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'from-gray-400 to-gray-500';
      case 'normal': return 'from-blue-400 to-blue-500';
      case 'high': return 'from-orange-400 to-orange-500';
      case 'urgent': return 'from-red-400 to-red-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => ({ id: item.categoryId, name: item.categoryName }))
    .map(cat => JSON.stringify(cat))))
    .map(str => JSON.parse(str));

  const canProceedToNextTab = () => {
    switch (currentTab) {
      case 'customer':
        return orderData.customerName && 
               (orderData.orderType !== 'dine_in' || orderData.tableId) &&
               (orderData.orderType !== 'delivery' || orderData.deliveryAddress);
      case 'menu':
        return orderItems.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl">
                <ShoppingCart className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
                <p className="text-blue-100 mt-2 text-lg">Design the perfect dining experience</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Progress Indicator */}
              <div className="hidden md:block text-center">
                <div className="text-sm text-blue-100 mb-2">Progress</div>
                <div className="flex items-center space-x-3">
                  <Progress 
                    value={completionProgress} 
                    className="w-32 h-3 bg-white/20"
                  />
                  <span className="text-lg font-bold text-white min-w-[3rem]">{completionProgress}%</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-2xl p-3"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-b-2 bg-gradient-to-r from-gray-50 to-white">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 p-2 gap-2">
              <TabsTrigger 
                value="customer" 
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-xl py-6 font-semibold text-lg relative group overflow-hidden rounded-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Customer Details</span>
                  {orderData.customerName && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="menu" 
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-xl py-6 font-semibold text-lg relative group overflow-hidden rounded-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                    <ChefHat className="h-6 w-6 text-green-600" />
                  </div>
                  <span>Menu Selection</span>
                  {orderItems.length > 0 && (
                    <Badge className="bg-green-500 text-white font-bold">{orderItems.length}</Badge>
                  )}
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="review" 
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-violet-100 data-[state=active]:text-purple-700 data-[state=active]:shadow-xl py-6 font-semibold text-lg relative group overflow-hidden rounded-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>Review & Confirm</span>
                  {totalAmount > 0 && (
                    <Badge className="bg-purple-500 text-white font-bold">₹{totalAmount}</Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[calc(95vh-280px)] overflow-y-auto">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            {/* Customer Information Tab */}
            <TabsContent value="customer" className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Details */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                  <CardHeader className="relative bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-b border-blue-100/50">
                    <CardTitle className="text-blue-800 flex items-center space-x-3 text-xl">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <span>Customer Information</span>
                    </CardTitle>
                    <CardDescription className="text-blue-600 ml-12">Who's placing this order?</CardDescription>
                  </CardHeader>
                  <CardContent className="relative p-8 space-y-6">
                    <div>
                      <Label htmlFor="customerName" className="text-sm font-semibold text-gray-700 mb-3 block">
                        Customer Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5 z-10" />
                        <Input
                          id="customerName"
                          placeholder="Enter customer name"
                          value={orderData.customerName}
                          onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                          className="relative z-20 pl-12 h-14 text-lg border-0 bg-gradient-to-r from-white/90 to-blue-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700 mb-3 block">
                          Phone Number
                        </Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5 z-10" />
                          <Input
                            id="customerPhone"
                            placeholder="Phone number"
                            value={orderData.customerPhone}
                            onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                            className="pl-12 h-14 border-0 bg-gradient-to-r from-white/90 to-green-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="customerEmail" className="text-sm font-semibold text-gray-700 mb-3 block">
                          Email Address
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-600 w-5 h-5 z-10" />
                          <Input
                            id="customerEmail"
                            placeholder="Email address"
                            value={orderData.customerEmail}
                            onChange={(e) => setOrderData({ ...orderData, customerEmail: e.target.value })}
                            className="pl-12 h-14 border-0 bg-gradient-to-r from-white/90 to-purple-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Configuration */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                  <CardHeader className="relative bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-b border-green-100/50">
                    <CardTitle className="text-green-800 flex items-center space-x-3 text-xl">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <Utensils className="h-6 w-6 text-green-600" />
                      </div>
                      <span>Order Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-green-600 ml-12">How will this order be served?</CardDescription>
                  </CardHeader>
                  <CardContent className="relative p-8 space-y-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                        Order Type <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'dine_in', label: 'Dine In', icon: Utensils, color: 'blue' },
                          { id: 'takeaway', label: 'Takeaway', icon: Users, color: 'green' },
                          { id: 'delivery', label: 'Delivery', icon: Truck, color: 'orange' }
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            className={`relative group p-6 border-2 rounded-2xl flex flex-col items-center space-y-3 hover:scale-105 transition-all duration-300 ${
                              orderData.orderType === type.id 
                                ? `border-${type.color}-500 bg-gradient-to-br from-${type.color}-50 to-${type.color}-100 shadow-xl` 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                            }`}
                            onClick={() => setOrderData({ ...orderData, orderType: type.id as any })}
                          >
                            <div className={`p-4 rounded-2xl transition-all duration-300 ${
                              orderData.orderType === type.id 
                                ? `bg-${type.color}-500/20` 
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <type.icon className={`h-8 w-8 ${
                                orderData.orderType === type.id ? `text-${type.color}-600` : 'text-gray-600'
                              }`} />
                            </div>
                            <span className={`text-lg font-semibold ${
                              orderData.orderType === type.id ? `text-${type.color}-700` : 'text-gray-700'
                            }`}>
                              {type.label}
                            </span>
                            {orderData.orderType === type.id && (
                              <CheckCircle className={`h-6 w-6 text-${type.color}-600 absolute -top-2 -right-2 bg-white rounded-full`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {orderData.orderType === 'dine_in' && (
                      <div>
                        <Label htmlFor="tableId" className="text-sm font-semibold text-gray-700 mb-3 block">
                          Select Table <span className="text-red-500">*</span>
                        </Label>
                        <Select value={orderData.tableId} onValueChange={(value) => setOrderData({ ...orderData, tableId: value })}>
                          <SelectTrigger className="h-14 border-0 bg-gradient-to-r from-white/90 to-blue-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                            <SelectValue placeholder="Choose an available table" />
                          </SelectTrigger>
                          <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl">
                            {tables.filter(table => table.isAvailable).map((table) => (
                              <SelectItem key={table.id} value={table.id} className="hover:bg-blue-50 transition-colors rounded-lg p-3">
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <span className="font-medium">{table.name}</span>
                                    <span className="text-gray-500 ml-2">• Capacity: {table.capacity}</span>
                                  </div>
                                  {table.section && (
                                    <Badge variant="outline" className="ml-2">{table.section}</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {orderData.orderType === 'delivery' && (
                      <div>
                        <Label htmlFor="deliveryAddress" className="text-sm font-semibold text-gray-700 mb-3 block">
                          Delivery Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-4 text-orange-600 w-5 h-5 z-10" />
                          <Textarea
                            id="deliveryAddress"
                            placeholder="Enter complete delivery address with landmarks"
                            value={orderData.deliveryAddress}
                            onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                            className="pl-12 min-h-[120px] border-0 bg-gradient-to-r from-white/90 to-orange-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="priority" className="text-sm font-semibold text-gray-700 mb-3 block">
                        Order Priority
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'low', label: 'Low', color: 'gray' },
                          { id: 'normal', label: 'Normal', color: 'blue' },
                          { id: 'high', label: 'High', color: 'orange' },
                          { id: 'urgent', label: 'Urgent', color: 'red' }
                        ].map((priority) => (
                          <button
                            key={priority.id}
                            type="button"
                            className={`p-4 border-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                              orderData.priority === priority.id
                                ? `border-${priority.color}-500 bg-gradient-to-r from-${priority.color}-400 to-${priority.color}-500 text-white shadow-lg`
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setOrderData({ ...orderData, priority: priority.id as any })}
                          >
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Special Instructions */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/50 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5"></div>
                <CardHeader className="relative bg-gradient-to-r from-yellow-50/80 to-amber-50/80 backdrop-blur-sm border-b border-yellow-100/50">
                  <CardTitle className="text-yellow-800 flex items-center space-x-3 text-xl">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <Sparkles className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span>Special Instructions</span>
                  </CardTitle>
                  <CardDescription className="text-yellow-600 ml-12">Any special requests or dietary requirements?</CardDescription>
                </CardHeader>
                <CardContent className="relative p-8">
                  <Textarea
                    placeholder="Share any special dietary requirements, allergies, cooking preferences, or additional requests..."
                    value={orderData.specialInstructions}
                    onChange={(e) => setOrderData({ ...orderData, specialInstructions: e.target.value })}
                    className="min-h-[120px] border-0 bg-gradient-to-r from-white/90 to-yellow-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 rounded-xl text-lg"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Selection Tab */}
            <TabsContent value="menu" className="p-8 space-y-8">
              {/* Enhanced Filters */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                <CardContent className="relative p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-sm"></div>
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5 z-10" />
                        <Input
                          placeholder="Search delicious items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="relative z-20 pl-12 h-12 w-80 border-0 bg-gradient-to-r from-white/90 to-green-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        />
                      </div>
                      
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-12 w-52 border-0 bg-gradient-to-r from-white/90 to-blue-50/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <SelectValue placeholder="All Categories" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-xl">
                          <SelectItem value="all" className="hover:bg-blue-50 transition-colors rounded-lg">
                            All Categories
                          </SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id} className="hover:bg-blue-50 transition-colors rounded-lg">
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Toggle Filters */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-3">
                        <Switch 
                          id="popular-only"
                          checked={showOnlyPopular}
                          onCheckedChange={setShowOnlyPopular}
                          className="data-[state=checked]:bg-orange-500"
                        />
                        <Label htmlFor="popular-only" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                          <Star className="w-4 h-4 text-orange-500" />
                          <span>Popular Only</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Switch 
                          id="vegetarian-only"
                          checked={showOnlyVegetarian}
                          onCheckedChange={setShowOnlyVegetarian}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Label htmlFor="vegetarian-only" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                          <span className="text-green-600">🥬</span>
                          <span>Vegetarian</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id} className="relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50 group overflow-hidden hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Item Badges */}
                    <div className="absolute top-3 left-3 z-10 flex space-x-2">
                      {item.isNew && (
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold shadow-lg">
                          <Zap className="w-3 h-3 mr-1" />
                          NEW
                        </Badge>
                      )}
                      {item.isPopular && (
                        <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          POPULAR
                        </Badge>
                      )}
                    </div>

                    {/* Dietary Indicators */}
                    <div className="absolute top-3 right-3 z-10 flex space-x-1">
                      {item.dietary.vegetarian && <span className="text-lg">🥬</span>}
                      {item.dietary.vegan && <span className="text-lg">🌱</span>}
                      {item.dietary.glutenFree && <span className="text-lg">🚫🌾</span>}
                    </div>

                    <CardContent className="relative p-6 space-y-4">
                      {/* Item Info */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-bold text-gray-900">₹{item.basePrice}</span>
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                              {item.categoryName}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{item.preparationTime}m</span>
                            </div>
                            
                            {item.rating && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{item.rating}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1 text-sm">
                              <span>{SPICY_LEVELS[item.spicyLevel].icon}</span>
                              <span className="text-gray-500">{SPICY_LEVELS[item.spicyLevel].label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Add to Order Button */}
                      <Button 
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        onClick={() => addItemToOrder(item)}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add to Order
                      </Button>
                      
                      {/* Quantity Indicator */}
                      {orderItems.find(orderItem => orderItem.menuItemId === item.id) && (
                        <div className="absolute top-3 right-14 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                          {orderItems.find(orderItem => orderItem.menuItemId === item.id)?.quantity}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredMenuItems.length === 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100">
                  <CardContent className="text-center py-16">
                    <div className="p-6 bg-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Search className="w-12 h-12 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                  </CardContent>
                </Card>
              )}

              {/* Order Summary Sidebar */}
              {orderItems.length > 0 && (
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-violet-50/50 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5"></div>
                  <CardHeader className="relative bg-gradient-to-r from-purple-50/80 to-violet-50/80 backdrop-blur-sm border-b border-purple-100/50">
                    <CardTitle className="text-purple-800 flex items-center space-x-3 text-xl">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <ShoppingCart className="h-6 w-6 text-purple-600" />
                      </div>
                      <span>Order Summary ({orderItems.length} items)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-6 space-y-4 max-h-96 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100/50 group hover:shadow-lg transition-all duration-300">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.menuItemName}</h4>
                          <p className="text-sm text-gray-500">{item.categoryName}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                            className="rounded-full w-8 h-8 p-0 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-lg min-w-[2rem] text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                            className="rounded-full w-8 h-8 p-0 border-green-300 text-green-600 hover:bg-green-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <div className="text-right min-w-[5rem]">
                            <div className="font-bold text-lg">₹{item.totalPrice}</div>
                            <div className="text-xs text-gray-500">₹{item.unitPrice} each</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Review & Confirm Tab */}
            <TabsContent value="review" className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Summary */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                  <CardHeader className="relative bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-b border-blue-100/50">
                    <CardTitle className="text-blue-800 flex items-center space-x-3 text-xl">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>
                      <span>Order Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-8 space-y-6">
                    {/* Customer Details */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">Customer Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{orderData.customerName}</span>
                        </div>
                        {orderData.customerPhone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-green-600" />
                            <span>{orderData.customerPhone}</span>
                          </div>
                        )}
                        {orderData.customerEmail && (
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-purple-600" />
                            <span>{orderData.customerEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          {getOrderTypeIcon(orderData.orderType)}
                          <span className="capitalize font-medium">{orderData.orderType.replace('_', ' ')}</span>
                        </div>
                        {orderData.tableId && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <span>{tables.find(t => t.id === orderData.tableId)?.name}</span>
                          </div>
                        )}
                        {orderData.deliveryAddress && (
                          <div className="flex items-start space-x-3">
                            <MapPin className="w-5 h-5 text-orange-600 mt-0.5" />
                            <span>{orderData.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">Order Items</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {orderItems.map((item) => (
                          <div key={item.menuItemId} className="flex justify-between items-center p-3 bg-white/80 rounded-lg">
                            <div>
                              <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                              <div className="text-sm text-gray-500">{item.categoryName}</div>
                            </div>
                            <span className="font-bold">₹{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {orderData.specialInstructions && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Special Instructions</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800">{orderData.specialInstructions}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                  <CardHeader className="relative bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-b border-green-100/50">
                    <CardTitle className="text-green-800 flex items-center space-x-3 text-xl">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <Calculator className="h-6 w-6 text-green-600" />
                      </div>
                      <span>Payment Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative p-8 space-y-6">
                    {/* Bill Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-lg">
                        <span>Subtotal:</span>
                        <span className="font-bold">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span>Tax (18%):</span>
                        <span className="font-bold">₹{tax}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-lg text-green-600">
                          <span>Discount:</span>
                          <span className="font-bold">-₹{discount}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
                          <span>Total Amount:</span>
                          <span>₹{totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className="text-lg">Estimated Time: <strong>{estimatedTime} minutes</strong></span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${getPriorityColor(orderData.priority)}`}></div>
                        <span className="text-lg">Priority: <strong className="capitalize">{orderData.priority}</strong></span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <Label htmlFor="paymentMethod" className="text-lg font-semibold text-gray-700 mb-4 block">
                        Payment Method
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            className={`p-4 border-2 rounded-xl flex items-center space-x-3 font-medium transition-all duration-300 hover:scale-105 ${
                              orderData.paymentMethod === method.id
                                ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-lg'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => setOrderData({ ...orderData, paymentMethod: method.id })}
                          >
                            {method.icon}
                            <span>{method.label}</span>
                            {orderData.paymentMethod === method.id && (
                              <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Footer */}
        <div className="border-t-2 bg-gradient-to-r from-gray-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className={`text-lg px-4 py-2 ${
                completionProgress >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {completionProgress >= 80 ? '✓ Ready to Create' : `${completionProgress}% Complete`}
              </Badge>
              
              {orderItems.length > 0 && (
                <div className="text-lg text-gray-700">
                  <span className="font-bold">{orderItems.length}</span> items • 
                  <span className="font-bold text-green-600 ml-1">₹{totalAmount}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="h-12 px-6 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              
              <div className="flex space-x-3">
                {currentTab !== 'customer' && (
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const tabs = ['customer', 'menu', 'review'];
                      const currentIndex = tabs.indexOf(currentTab);
                      if (currentIndex > 0) {
                        setCurrentTab(tabs[currentIndex - 1]);
                      }
                    }}
                    className="h-12 px-6 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Previous
                  </Button>
                )}
                
                {currentTab !== 'review' ? (
                  <Button 
                    size="lg"
                    onClick={() => {
                      const tabs = ['customer', 'menu', 'review'];
                      const currentIndex = tabs.indexOf(currentTab);
                      if (currentIndex < tabs.length - 1) {
                        setCurrentTab(tabs[currentIndex + 1]);
                      }
                    }}
                    disabled={!canProceedToNextTab()}
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    size="lg"
                    onClick={handleSaveOrder}
                    disabled={loading || !orderData.customerName || orderItems.length === 0}
                    className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Create Order
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}