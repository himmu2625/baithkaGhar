'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import POSOrderSystem from '@/components/os/fb/pos/POSOrderSystem';
import PaymentGateway from '@/components/os/fb/pos/PaymentGateway';
import ReceiptGenerator from '@/components/os/fb/pos/ReceiptGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ShoppingCart, User, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  preparationTime: number;
}

interface Order {
  id: string;
  orderNumber: string;
  items: any[];
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

interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: 'card' | 'cash' | 'digital' | 'split';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  timestamp: Date;
}

export default function POSPage({ params }: { params: { propertyId: string } }) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<PaymentTransaction | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon grilled to perfection',
      price: 28.99,
      category: 'Main Course',
      available: true,
      preparationTime: 20
    },
    {
      id: '2',
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan and croutons',
      price: 14.99,
      category: 'Appetizer',
      available: true,
      preparationTime: 10
    },
    {
      id: '3',
      name: 'Ribeye Steak',
      description: '12oz premium ribeye steak cooked to your liking',
      price: 42.99,
      category: 'Main Course',
      available: true,
      preparationTime: 25
    },
    {
      id: '4',
      name: 'Pasta Carbonara',
      description: 'Traditional Italian pasta with pancetta and egg',
      price: 18.99,
      category: 'Main Course',
      available: true,
      preparationTime: 15
    },
    {
      id: '5',
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      price: 9.99,
      category: 'Dessert',
      available: true,
      preparationTime: 12
    }
  ];

  const serverInfo = {
    id: 'SRV001',
    name: 'John Smith'
  };

  const handleOrderSubmit = (order: Order) => {
    setCurrentOrder(order);
    setCompletedOrders(prev => [...prev, order]);
  };

  const handlePaymentProcess = (order: Order, paymentMethod: string) => {
    setPaymentGatewayOpen(true);
  };

  const handlePaymentComplete = (transaction: PaymentTransaction) => {
    setLastTransaction(transaction);
    setPaymentGatewayOpen(false);
    
    if (currentOrder) {
      const updatedOrder = { ...currentOrder, status: 'paid' as const };
      setCompletedOrders(prev => 
        prev.map(order => order.id === currentOrder.id ? updatedOrder : order)
      );
    }
  };

  const handlePaymentFailed = (error: string) => {
    console.error('Payment failed:', error);
    setPaymentGatewayOpen(false);
  };

  const generateReceiptData = (order: Order, transaction?: PaymentTransaction) => {
    return {
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      orderNumber: order.orderNumber,
      timestamp: new Date(),
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        total: item.subtotal
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod || 'cash',
      paymentDetails: transaction ? {
        cardLast4: transaction.transactionId?.slice(-4),
        cardBrand: 'VISA',
        transactionId: transaction.transactionId
      } : undefined,
      customer: order.customer,
      server: {
        name: order.serverName,
        id: order.serverId
      },
      businessInfo: {
        name: 'Baithaka GHAR Restaurant',
        address: '123 Restaurant Street\nCity, State 12345',
        phone: '(555) 123-4567',
        email: 'info@baithaka-ghar.com',
        taxId: 'TAX-123456789',
        website: 'www.baithaka-ghar.com'
      }
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/fb/dashboard/${params.propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to F&B Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Point of Sale</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-emerald-100">Order Processing & Payments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-200 font-medium">Live POS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{completedOrders.length}</div>
              <div className="text-emerald-200 text-sm">Today's Orders</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ₹{completedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </div>
              <div className="text-emerald-200 text-sm">Revenue</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-white/20 text-white border-white/30 flex items-center gap-2 backdrop-blur-sm">
                <User className="h-4 w-4" />
                {serverInfo.name}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Today's Orders</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {completedOrders.length}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">Orders processed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Sales</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              ₹{completedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-600">Revenue today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Avg Order Value</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <User className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹{completedOrders.length > 0 
                ? (completedOrders.reduce((sum, order) => sum + order.total, 0) / completedOrders.length).toFixed(2)
                : '0.00'
              }
            </div>
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">Per customer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">Commission</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <div className="h-5 w-5 bg-amber-600 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-amber-900 mb-1">
              ₹{(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.03).toFixed(2)}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-amber-600">3% platform fee</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <POSOrderSystem
        menuItems={menuItems}
        onOrderSubmit={handleOrderSubmit}
        onPaymentProcess={handlePaymentProcess}
        serverId={serverInfo.id}
        serverName={serverInfo.name}
      />

      {currentOrder && (
        <PaymentGateway
          orderId={currentOrder.id}
          amount={currentOrder.total}
          isOpen={paymentGatewayOpen}
          onClose={() => setPaymentGatewayOpen(false)}
          onPaymentComplete={handlePaymentComplete}
          onPaymentFailed={handlePaymentFailed}
        />
      )}

      {lastTransaction && currentOrder && (
        <div className="mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <span>Order Complete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-green-800">Order #{currentOrder.orderNumber}</p>
                  <p className="text-green-600">Payment successful</p>
                </div>
                <ReceiptGenerator
                  receiptData={generateReceiptData(currentOrder, lastTransaction)}
                  onPrint={() => console.log('Receipt printed')}
                  onEmail={(email) => console.log('Receipt emailed to:', email)}
                  onDownload={() => console.log('Receipt downloaded')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div className="mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-t-lg">
              <CardTitle className="text-slate-800 flex items-center space-x-2">
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-slate-600" />
                </div>
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {completedOrders.slice(-5).reverse().map(order => (
                  <div key={order.id} className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                      <span className="text-gray-600 ml-2">
                        {order.customer?.name || 'Walk-in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        order.status === 'paid' ? 'bg-green-500 hover:bg-green-600' : 
                        order.status === 'confirmed' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                      }>
                        {order.status}
                      </Badge>
                      <span className="font-bold text-lg text-gray-900">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}