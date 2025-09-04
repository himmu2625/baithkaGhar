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
  Plus, 
  FileText, 
  Download, 
  Send, 
  Edit, 
  Trash2,
  Calculator,
  DollarSign
} from 'lucide-react';

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'venue' | 'catering' | 'equipment' | 'service' | 'other';
}

interface Quotation {
  id: string;
  eventTitle: string;
  clientName: string;
  clientEmail: string;
  eventDate: Date;
  venue: string;
  guests: number;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdAt: Date;
}

interface EventQuotationProps {
  eventId?: string;
  existingQuotation?: Quotation;
  onSave?: (quotation: Quotation) => void;
  onSend?: (quotation: Quotation) => void;
}

export default function EventQuotation({ 
  eventId, 
  existingQuotation, 
  onSave, 
  onSend 
}: EventQuotationProps) {
  const [quotation, setQuotation] = useState<Partial<Quotation>>(existingQuotation || {
    eventTitle: '',
    clientName: '',
    clientEmail: '',
    eventDate: new Date(),
    venue: '',
    guests: 50,
    items: [],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    discount: 0,
    total: 0,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'draft',
    notes: '',
    createdAt: new Date()
  });

  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
    category: 'venue' as QuotationItem['category']
  });

  const categories = {
    venue: 'Venue & Space',
    catering: 'Catering & F&B',
    equipment: 'Equipment & AV',
    service: 'Additional Services',
    other: 'Other Items'
  };

  const calculateTotals = (items: QuotationItem[], discount: number = 0, taxRate: number = 10) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
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
    const total = itemForm.quantity * itemForm.unitPrice;
    const newItem: QuotationItem = {
      id: editingItem?.id || Date.now().toString(),
      description: itemForm.description,
      quantity: itemForm.quantity,
      unitPrice: itemForm.unitPrice,
      total,
      category: itemForm.category
    };

    const updatedItems = editingItem 
      ? quotation.items?.map(item => item.id === editingItem.id ? newItem : item) || []
      : [...(quotation.items || []), newItem];

    const totals = calculateTotals(updatedItems, quotation.discount, quotation.taxRate);

    setQuotation(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));

    setItemForm({ description: '', quantity: 1, unitPrice: 0, category: 'venue' });
    setEditingItem(null);
    setIsAddItemDialogOpen(false);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = quotation.items?.filter(item => item.id !== itemId) || [];
    const totals = calculateTotals(updatedItems, quotation.discount, quotation.taxRate);

    setQuotation(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const updateDiscount = (discount: number) => {
    const totals = calculateTotals(quotation.items || [], discount, quotation.taxRate);
    setQuotation(prev => ({ ...prev, discount, ...totals }));
  };

  const updateTaxRate = (taxRate: number) => {
    const totals = calculateTotals(quotation.items || [], quotation.discount, taxRate);
    setQuotation(prev => ({ ...prev, taxRate, ...totals }));
  };

  const handleSave = () => {
    if (quotation.eventTitle && quotation.clientName) {
      onSave?.(quotation as Quotation);
    }
  };

  const handleSend = () => {
    if (quotation.eventTitle && quotation.clientName && quotation.clientEmail) {
      const updatedQuotation = { ...quotation, status: 'sent' as const };
      setQuotation(updatedQuotation);
      onSend?.(updatedQuotation as Quotation);
    }
  };

  const ItemDialog = () => (
    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setEditingItem(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={itemForm.description}
              onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Item description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Total</Label>
              <Input
                value={(itemForm.quantity * itemForm.unitPrice).toFixed(2)}
                disabled
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={itemForm.category}
              onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value as QuotationItem['category'] }))}
            >
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Event Quotation
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                Save Draft
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  value={quotation.eventTitle || ''}
                  onChange={(e) => setQuotation(prev => ({ ...prev, eventTitle: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={quotation.venue || ''}
                  onChange={(e) => setQuotation(prev => ({ ...prev, venue: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={quotation.eventDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setQuotation(prev => ({ ...prev, eventDate: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={quotation.guests || ''}
                  onChange={(e) => setQuotation(prev => ({ ...prev, guests: parseInt(e.target.value) || 0 }))}
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
                value={quotation.clientName || ''}
                onChange={(e) => setQuotation(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={quotation.clientEmail || ''}
                onChange={(e) => setQuotation(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Quote Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={quotation.validUntil?.toISOString().split('T')[0] || ''}
                onChange={(e) => setQuotation(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
              />
            </div>

            {quotation.status && (
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge>{quotation.status}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quotation Items
            </CardTitle>
            <ItemDialog />
          </div>
        </CardHeader>
        <CardContent>
          {quotation.items && quotation.items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Total</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {categories[item.category]}
                          </Badge>
                        </td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.unitPrice.toFixed(2)}</td>
                        <td className="text-right p-3">${item.total.toFixed(2)}</td>
                        <td className="text-right p-3">
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  description: item.description,
                                  quantity: item.quantity,
                                  unitPrice: item.unitPrice,
                                  category: item.category
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
                    <span>${quotation.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Discount (%):</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={quotation.discount || 0}
                        onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right"
                      />
                      <span>%</span>
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
                        value={quotation.taxRate || 0}
                        onChange={(e) => updateTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-20 text-right"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax Amount:</span>
                    <span>${quotation.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>

                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ${quotation.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Items Added</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding items to your quotation
              </p>
              <ItemDialog />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes or terms for this quotation..."
            value={quotation.notes || ''}
            onChange={(e) => setQuotation(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}