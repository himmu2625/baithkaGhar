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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/os/fb/dashboard/${params.propertyId}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Point of Sale</h1>
              <p className="text-muted-foreground">Process orders and payments</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {serverInfo.name}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{completedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  ${completedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  ${completedOrders.length > 0 
                    ? (completedOrders.reduce((sum, order) => sum + order.total, 0) / completedOrders.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-orange-500 rounded-full" />
              <div>
                <p className="text-sm text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold">
                  ${(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.03).toFixed(2)}
                </p>
              </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Order Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">Order #{currentOrder.orderNumber}</p>
                  <p className="text-muted-foreground">Payment successful</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedOrders.slice(-5).reverse().map(order => (
                  <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className="text-muted-foreground ml-2">
                        {order.customer?.name || 'Walk-in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        order.status === 'paid' ? 'bg-green-500' : 
                        order.status === 'confirmed' ? 'bg-blue-500' : 'bg-gray-500'
                      }>
                        {order.status}
                      </Badge>
                      <span className="font-bold">${order.total.toFixed(2)}</span>
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