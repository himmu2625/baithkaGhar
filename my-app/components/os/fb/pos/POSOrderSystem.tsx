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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${finalTotal.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="digital">Digital Wallet</SelectItem>
                <SelectItem value="split">Split Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <Label htmlFor="paymentAmount">Amount Received</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min={finalTotal}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder={finalTotal.toFixed(2)}
              />
              {paymentAmount > finalTotal && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ${(paymentAmount - finalTotal).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePayment} className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Menu Items
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <Badge variant="outline">${item.price.toFixed(2)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {item.preparationTime}min
                        </span>
                        <Button size="sm" onClick={() => addToOrder(item)}>
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

      {/* Order Summary Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Current Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Customer name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Table number"
                value={customerInfo.tableNumber}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, tableNumber: e.target.value }))}
              />
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentOrder.map((item, index) => (
                <div key={`${item.menuItem.id}-${index}`} className="flex items-center justify-between space-x-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${item.menuItem.price.toFixed(2)} each
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromOrder(item.menuItem.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-sm">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {currentOrder.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No items in order</p>
                </div>
              )}
            </div>

            {currentOrder.length > 0 && (
              <>
                <Separator />
                
                {/* Order Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearOrder}
                  >
                    Clear Order
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Server Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">{serverName}</p>
                <p className="text-xs text-muted-foreground">Server ID: {serverId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentDialog />
    </div>
  );
}