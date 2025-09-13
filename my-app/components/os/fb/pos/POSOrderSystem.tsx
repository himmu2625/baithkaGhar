'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign,
  Receipt,
  User,
  ShoppingCart,
  Search,
  Filter
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number;
  image?: string;
  ingredients?: string[];
  allergens?: string[];
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  modifications?: string[];
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
    tableNumber?: string;
  };
  paymentMethod?: 'cash' | 'card' | 'digital' | 'split';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid';
  timestamp: Date;
  serverId: string;
  serverName: string;
}

interface POSOrderSystemProps {
  menuItems: MenuItem[];
  onOrderSubmit?: (order: Order) => void;
  onPaymentProcess?: (order: Order, paymentMethod: string) => void;
  serverId: string;
  serverName: string;
}

export default function POSOrderSystem({
  menuItems,
  onOrderSubmit,
  onPaymentProcess,
  serverId,
  serverName
}: POSOrderSystemProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    tableNumber: ''
  });
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital' | 'split'>('cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const orderTotal = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);
  const taxRate = 0.1; // 10% tax
  const taxAmount = orderTotal * taxRate;
  const discountAmount = 0; // Can be implemented for promotions
  const finalTotal = orderTotal + taxAmount - discountAmount;

  const addToOrder = (menuItem: MenuItem) => {
    setCurrentOrder(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * menuItem.price
              }
            : item
        );
      }
      
      return [
        ...prev,
        {
          menuItem,
          quantity: 1,
          subtotal: menuItem.price
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }

    setCurrentOrder(prev =>
      prev.map(item =>
        item.menuItem.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.menuItem.price
            }
          : item
      )
    );
  };

  const removeFromOrder = (itemId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  const clearOrder = () => {
    setCurrentOrder([]);
    setCustomerInfo({ name: '', phone: '', email: '', tableNumber: '' });
  };

  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      const change = paymentAmount - finalTotal;
      setChangeAmount(change);
      
      if (change < 0) {
        alert('Insufficient payment amount');
        return;
      }
    }

    const order: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      items: currentOrder,
      subtotal: orderTotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      customer: customerInfo.name ? customerInfo : undefined,
      paymentMethod,
      status: 'confirmed',
      timestamp: new Date(),
      serverId,
      serverName
    };

    onPaymentProcess?.(order, paymentMethod);
    onOrderSubmit?.(order);
    
    clearOrder();
    setIsPaymentDialogOpen(false);
    setPaymentAmount(0);
    setChangeAmount(0);
  };

  const PaymentDialog = () => (
    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
      <DialogContent className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center justify-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <span>Process Payment</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
            <div className="text-4xl font-bold text-green-600">
              ₹{finalTotal.toFixed(2)}
            </div>
            <p className="text-sm text-green-700 font-medium mt-2">Total Amount</p>
          </div>

          <div className="space-y-3">
            <Label className="text-blue-800 font-semibold flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Payment Method</span>
            </Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 backdrop-blur-sm py-3">
                <SelectValue className="text-blue-800 font-medium" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                <SelectItem value="cash" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Cash</span>
                  </div>
                </SelectItem>
                <SelectItem value="card" className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Credit/Debit Card</span>
                  </div>
                </SelectItem>
                <SelectItem value="digital" className="rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 p-3 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                    <span className="font-medium text-purple-800">Digital Wallet</span>
                  </div>
                </SelectItem>
                <SelectItem value="split" className="rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 p-3 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                    <span className="font-medium text-orange-800">Split Payment</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <Label htmlFor="paymentAmount" className="text-orange-800 font-semibold flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Amount Received</span>
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min={finalTotal}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder={finalTotal.toFixed(2)}
                className="border-0 bg-gradient-to-r from-orange-50 to-red-50 focus:from-orange-100 focus:to-red-100 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-bold text-orange-800 placeholder:text-orange-500 text-lg"
              />
              {paymentAmount > finalTotal && (
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-bold flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Change: ₹{(paymentAmount - finalTotal).toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-r from-slate-50 to-gray-100 p-4 rounded-xl space-y-3 text-sm border border-gray-200">
            <div className="flex justify-between font-medium text-gray-700">
              <span>Subtotal:</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700">
              <span>Tax (10%):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="bg-gray-300" />
            <div className="flex justify-between font-bold text-lg">
              <span className="text-gray-900">Total:</span>
              <span className="text-green-600 bg-white px-3 py-1 rounded-lg shadow-sm">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentDialogOpen(false)} 
              className="flex-1 bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors shadow-sm py-3 font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 py-3 font-bold"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Process Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Enhanced Menu Items Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xl font-bold">Menu Items</span>
            </CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                    <Search className="w-4 h-4 text-emerald-600" />
                  </div>
                  <Input
                    placeholder="Search delicious items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-16 pr-4 py-3 border-0 bg-gradient-to-r from-emerald-50 to-green-50 focus:from-emerald-100 focus:to-green-100 focus:ring-2 focus:ring-emerald-500/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-emerald-800 placeholder:text-emerald-500"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-52 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 group backdrop-blur-sm">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <Filter className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue className="text-blue-800 font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-blue-800">{category === 'all' ? 'All Categories' : category}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 hover:from-emerald-50 hover:to-green-100 group">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">{item.name}</h4>
                        <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-0 shadow-sm font-bold">₹{item.price.toFixed(2)}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-orange-600 font-medium">
                            {item.preparationTime}min
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addToOrder(item)}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Order Summary Section */}
      <div className="space-y-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-bold">Current Order</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Customer Info */}
            <div className="space-y-3">
              <Label htmlFor="customerName" className="text-blue-800 font-semibold flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Customer Information (Optional)</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 focus:from-blue-100 focus:to-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-blue-800 placeholder:text-blue-500"
              />
              <Input
                placeholder="Table number"
                value={customerInfo.tableNumber}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, tableNumber: e.target.value }))}
                className="border-0 bg-gradient-to-r from-purple-50 to-pink-50 focus:from-purple-100 focus:to-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-purple-800 placeholder:text-purple-500"
              />
            </div>

            <Separator />

            {/* Enhanced Order Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentOrder.map((item, index) => (
                <div key={`${item.menuItem.id}-${index}`} className="flex items-center justify-between space-x-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-100 hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-300">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-gray-900">{item.menuItem.name}</p>
                    <p className="text-xs text-gray-600">
                      ₹{item.menuItem.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 transition-colors shadow-sm w-8 h-8"
                    >
                      <Minus className="h-3 w-3 text-red-600" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-bold bg-white px-2 py-1 rounded border text-gray-900">{item.quantity}</span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="bg-white/60 hover:bg-green-50 border-green-200 hover:border-green-300 transition-colors shadow-sm w-8 h-8"
                    >
                      <Plus className="h-3 w-3 text-green-600" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromOrder(item.menuItem.id)}
                      className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors shadow-sm w-8 h-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-600">₹{item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {currentOrder.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-blue-600" />
                  </div>
                  <p className="text-blue-600 font-medium">Your order is empty</p>
                  <p className="text-blue-500 text-sm mt-1">Add some delicious items from the menu!</p>
                </div>
              )}
            </div>

            {currentOrder.length > 0 && (
              <>
                <Separator />
                
                {/* Enhanced Order Total */}
                <div className="space-y-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <div className="flex justify-between text-sm font-medium text-emerald-800">
                    <span>Subtotal:</span>
                    <span>₹{orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-emerald-800">
                    <span>Tax (10%):</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-emerald-200" />
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-emerald-900">Total:</span>
                    <span className="text-green-600 bg-white px-3 py-1 rounded-lg shadow-sm">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 py-3 font-bold"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Process Payment
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors shadow-sm py-3 font-medium"
                    onClick={clearOrder}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Order
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Server Info */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-purple-900">{serverName}</p>
                <p className="text-xs text-purple-600 bg-white/60 px-2 py-1 rounded-full font-medium">ID: {serverId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentDialog />
    </div>
  );
}