'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  FileText, 
  Download, 
  Send, 
  Edit, 
  Trash2,
  Eye,
  Calculator,
  Building2
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  eventTitle: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  companyName: string;
  companyAddress: string;
  companyTax: string;
  eventDate: Date;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  discountAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  paymentTerms: string;
}

interface InvoiceGeneratorProps {
  eventData?: Partial<Invoice>;
  onSave?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
}

export default function InvoiceGenerator({ 
  eventData, 
  onSave, 
  onSend 
}: InvoiceGeneratorProps) {
  const [invoice, setInvoice] = useState<Partial<Invoice>>(eventData || {
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    eventTitle: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    companyName: 'Baithaka GHAR Events',
    companyAddress: '123 Event Street\nEvent City, EC 12345\nPhone: (555) 123-4567',
    companyTax: 'TAX ID: 123456789',
    eventDate: new Date(),
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    discount: 0,
    discountAmount: 0,
    total: 0,
    status: 'draft',
    paymentTerms: 'Payment due within 30 days of invoice date. Late payments may incur additional fees.'
  });

  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: 1,
    rate: 0
  });

  const calculateTotals = (items: InvoiceItem[], discount: number = 0, taxRate: number = 10) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  const addOrUpdateItem = () => {
    const amount = itemForm.quantity * itemForm.rate;
    const newItem: InvoiceItem = {
      id: editingItem?.id || Date.now().toString(),
      description: itemForm.description,
      quantity: itemForm.quantity,
      rate: itemForm.rate,
      amount
    };

    const updatedItems = editingItem 
      ? invoice.items?.map(item => item.id === editingItem.id ? newItem : item) || []
      : [...(invoice.items || []), newItem];

    const totals = calculateTotals(updatedItems, invoice.discount, invoice.taxRate);

    setInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));

    setItemForm({ description: '', quantity: 1, rate: 0 });
    setEditingItem(null);
    setIsAddItemDialogOpen(false);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = invoice.items?.filter(item => item.id !== itemId) || [];
    const totals = calculateTotals(updatedItems, invoice.discount, invoice.taxRate);

    setInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const updateDiscount = (discount: number) => {
    const totals = calculateTotals(invoice.items || [], discount, invoice.taxRate);
    setInvoice(prev => ({ ...prev, discount, ...totals }));
  };

  const updateTaxRate = (taxRate: number) => {
    const totals = calculateTotals(invoice.items || [], invoice.discount, taxRate);
    setInvoice(prev => ({ ...prev, taxRate, ...totals }));
  };

  const handleSave = () => {
    if (invoice.eventTitle && invoice.clientName) {
      onSave?.(invoice as Invoice);
    }
  };

  const handleSend = () => {
    if (invoice.eventTitle && invoice.clientName && invoice.clientEmail) {
      const updatedInvoice = { ...invoice, status: 'sent' as const };
      setInvoice(updatedInvoice);
      onSend?.(updatedInvoice as Invoice);
    }
  };

  const ItemDialog = () => (
    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setEditingItem(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Line Item' : 'Add New Line Item'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={itemForm.description}
              onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the service or product"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.rate}
                onChange={(e) => setItemForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                value={(itemForm.quantity * itemForm.rate).toFixed(2)}
                disabled
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addOrUpdateItem}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const InvoicePreview = () => (
    <div className="space-y-6 p-8 bg-white text-black font-sans max-w-4xl mx-auto">
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8" />
            <h1 className="text-2xl font-bold">INVOICE</h1>
          </div>
          <div className="text-sm">
            <div className="font-bold text-lg mb-2">{invoice.companyName}</div>
            <div className="whitespace-pre-line text-gray-600">{invoice.companyAddress}</div>
            <div className="text-gray-600 mt-1">{invoice.companyTax}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">#{invoice.invoiceNumber}</div>
          <div className="text-sm mt-4 space-y-1">
            <div>Issue Date: {invoice.issueDate?.toLocaleDateString()}</div>
            <div>Due Date: {invoice.dueDate?.toLocaleDateString()}</div>
            <div>
              <Badge className={
                invoice.status === 'paid' ? 'bg-green-500' :
                invoice.status === 'overdue' ? 'bg-red-500' :
                invoice.status === 'sent' ? 'bg-blue-500' : 'bg-gray-500'
              }>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-3 text-gray-700">BILL TO:</h3>
          <div className="text-sm">
            <div className="font-bold text-lg">{invoice.clientName}</div>
            <div className="whitespace-pre-line text-gray-600 mt-1">{invoice.clientAddress}</div>
            <div className="text-gray-600 mt-1">{invoice.clientEmail}</div>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-gray-700">EVENT DETAILS:</h3>
          <div className="text-sm space-y-1">
            <div><strong>Event:</strong> {invoice.eventTitle}</div>
            <div><strong>Date:</strong> {invoice.eventDate?.toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Description</th>
              <th className="border p-3 text-right">Qty</th>
              <th className="border p-3 text-right">Rate</th>
              <th className="border p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map(item => (
              <tr key={item.id}>
                <td className="border p-3">{item.description}</td>
                <td className="border p-3 text-right">{item.quantity}</td>
                <td className="border p-3 text-right">${item.rate.toFixed(2)}</td>
                <td className="border p-3 text-right">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-80">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${invoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {invoice.discount && invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({invoice.discount}%):</span>
                <span>-${invoice.discountAmount?.toFixed(2) || '0.00'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({invoice.taxRate}%):</span>
              <span>${invoice.taxAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span className="text-green-600">${invoice.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <h3 className="font-bold mb-2">Notes:</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="font-bold mb-2">Payment Terms:</h3>
        <p className="text-sm text-gray-600">{invoice.paymentTerms}</p>
      </div>

      <div className="text-center text-xs text-gray-500 pt-4">
        Thank you for your business!
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Invoice Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Edit Invoice
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <InvoicePreview />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Generator
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoice.invoiceNumber || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={invoice.status || 'draft'} 
                  onValueChange={(value) => setInvoice(prev => ({ ...prev, status: value as Invoice['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={invoice.issueDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, issueDate: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoice.dueDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  value={invoice.eventTitle || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, eventTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={invoice.eventDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setInvoice(prev => ({ ...prev, eventDate: new Date(e.target.value) }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={invoice.clientName || ''}
                onChange={(e) => setInvoice(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={invoice.clientEmail || ''}
                onChange={(e) => setInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea
                id="clientAddress"
                placeholder="Client's billing address"
                value={invoice.clientAddress || ''}
                onChange={(e) => setInvoice(prev => ({ ...prev, clientAddress: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Line Items
            </CardTitle>
            <ItemDialog />
          </div>
        </CardHeader>
        <CardContent>
          {invoice.items && invoice.items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.rate.toFixed(2)}</td>
                        <td className="text-right p-3">${item.amount.toFixed(2)}</td>
                        <td className="text-right p-3">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  description: item.description,
                                  quantity: item.quantity,
                                  rate: item.rate
                                });
                                setIsAddItemDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Discount (%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={invoice.discount || 0}
                        onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Tax (%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={invoice.taxRate || 0}
                        onChange={(e) => updateTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax Amount:</span>
                    <span>${invoice.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>

                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ${invoice.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Items Added</h3>
              <p className="text-muted-foreground mb-4">
                Add line items to your invoice
              </p>
              <ItemDialog />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the client..."
              value={invoice.notes || ''}
              onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Textarea
              id="paymentTerms"
              placeholder="Payment terms and conditions..."
              value={invoice.paymentTerms || ''}
              onChange={(e) => setInvoice(prev => ({ ...prev, paymentTerms: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}