'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText, 
  Download, 
  Send, 
  DollarSign, 
  Calendar, 
  User,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

interface Invoice {
  id: string;
  eventTitle: string;
  clientName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  createdDate: Date;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export default function EventBillingPage({ params }: { params: { propertyId: string } }) {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      eventTitle: 'Wedding Reception',
      clientName: 'John & Jane Doe',
      amount: 5000,
      status: 'sent',
      dueDate: new Date(2024, 3, 15),
      createdDate: new Date(2024, 2, 1),
      items: [
        { description: 'Venue Rental', quantity: 1, rate: 2000, amount: 2000 },
        { description: 'Catering Package', quantity: 100, rate: 25, amount: 2500 },
        { description: 'Photography', quantity: 1, rate: 500, amount: 500 }
      ]
    },
    {
      id: '2',
      eventTitle: 'Corporate Meeting',
      clientName: 'TechCorp Inc.',
      amount: 1200,
      status: 'paid',
      dueDate: new Date(2024, 2, 20),
      createdDate: new Date(2024, 2, 5),
      items: [
        { description: 'Conference Room', quantity: 8, rate: 100, amount: 800 },
        { description: 'AV Equipment', quantity: 1, rate: 400, amount: 400 }
      ]
    }
  ]);

  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      invoiceId: '2',
      amount: 1200,
      method: 'Credit Card',
      date: new Date(2024, 2, 18),
      status: 'completed'
    }
  ]);

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const InvoiceDialog = () => (
    <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input id="eventTitle" required />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Invoice Items</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-sm font-medium">
                <span>Description</span>
                <span>Quantity</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Item description" />
                <Input type="number" placeholder="1" />
                <Input type="number" placeholder="0.00" step="0.01" />
                <Input placeholder="0.00" disabled />
              </div>
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const InvoiceDetailDialog = ({ invoice }: { invoice: Invoice | null }) => (
    <Dialog open={!!invoice} onOpenChange={() => setSelectedInvoice(null)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Invoice Details - {invoice?.eventTitle}</DialogTitle>
        </DialogHeader>
        {invoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Bill To:</h4>
                <p>{invoice.clientName}</p>
              </div>
              <div className="text-right">
                <h4 className="font-medium mb-2">Invoice #{invoice.id}</h4>
                <p>Date: {invoice.createdDate.toLocaleDateString()}</p>
                <p>Due: {invoice.dueDate.toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Items:</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.rate.toFixed(2)}</td>
                        <td className="text-right p-3">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-medium">
                    <tr>
                      <td colSpan={3} className="text-right p-3">Total:</td>
                      <td className="text-right p-3">${invoice.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Billing</h1>
          <p className="text-muted-foreground">Manage invoices and payments</p>
        </div>
        <InvoiceDialog />
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid gap-4">
            {invoices.map(invoice => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{invoice.eventTitle}</h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {invoice.clientName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Due: {invoice.dueDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-lg text-foreground">
                            ${invoice.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4">
            {payments.map(payment => {
              const invoice = invoices.find(inv => inv.id === payment.invoiceId);
              return (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">
                            Payment #{payment.id}
                          </h3>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Invoice: {invoice?.eventTitle}</div>
                          <div>Client: {invoice?.clientName}</div>
                          <div>Method: {payment.method}</div>
                          <div>Date: {payment.date.toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${payment.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$6,200</div>
                <p className="text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$5,000</div>
                <p className="text-muted-foreground">Pending payment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoices Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <InvoiceDetailDialog invoice={selectedInvoice} />
    </div>
  );
}