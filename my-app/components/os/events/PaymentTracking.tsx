'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Receipt,
  TrendingUp,
  Download
} from 'lucide-react';

interface Payment {
  id: string;
  eventId: string;
  eventTitle: string;
  clientName: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer' | 'check' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'deposit' | 'partial' | 'final' | 'additional';
  date: Date;
  dueDate: Date;
  notes?: string;
  transactionId?: string;
  processingFee?: number;
}

interface PaymentPlan {
  eventId: string;
  eventTitle: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: Payment[];
  nextPaymentDue?: Date;
}

interface PaymentTrackingProps {
  eventId: string;
  eventTitle: string;
  clientName: string;
  totalAmount: number;
  paymentPlan?: PaymentPlan;
  onRecordPayment?: (payment: Omit<Payment, 'id'>) => void;
  onUpdatePayment?: (paymentId: string, updates: Partial<Payment>) => void;
}

export default function PaymentTracking({
  eventId,
  eventTitle,
  clientName,
  totalAmount,
  paymentPlan,
  onRecordPayment,
  onUpdatePayment
}: PaymentTrackingProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'card' as Payment['method'],
    type: 'partial' as Payment['type'],
    date: new Date().toISOString().split('T')[0],
    notes: '',
    transactionId: ''
  });

  const payments = paymentPlan?.payments || [];
  const paidAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'refunded': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: Payment['method']) => {
    const labels = {
      'cash': 'Cash',
      'card': 'Credit/Debit Card',
      'bank-transfer': 'Bank Transfer',
      'check': 'Check',
      'online': 'Online Payment'
    };
    return labels[method];
  };

  const getTypeLabel = (type: Payment['type']) => {
    const labels = {
      'deposit': 'Deposit',
      'partial': 'Partial Payment',
      'final': 'Final Payment',
      'additional': 'Additional Charges'
    };
    return labels[type];
  };

  const handleRecordPayment = () => {
    if (paymentForm.amount <= 0) return;

    const payment: Omit<Payment, 'id'> = {
      eventId,
      eventTitle,
      clientName,
      amount: paymentForm.amount,
      method: paymentForm.method,
      status: paymentForm.method === 'cash' ? 'completed' : 'pending',
      type: paymentForm.type,
      date: new Date(paymentForm.date),
      dueDate: new Date(paymentForm.date),
      notes: paymentForm.notes,
      transactionId: paymentForm.transactionId
    };

    onRecordPayment?.(payment);
    setPaymentForm({
      amount: 0,
      method: 'card',
      type: 'partial',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      transactionId: ''
    });
    setIsPaymentDialogOpen(false);
  };

  const PaymentDialog = () => (
    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={remainingAmount}
                value={paymentForm.amount || ''}
                onChange={(e) => setPaymentForm(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max: ${remainingAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Method</Label>
              <Select 
                value={paymentForm.method} 
                onValueChange={(value) => setPaymentForm(prev => ({ 
                  ...prev, 
                  method: value as Payment['method'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select 
                value={paymentForm.type} 
                onValueChange={(value) => setPaymentForm(prev => ({ 
                  ...prev, 
                  type: value as Payment['type'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="final">Final Payment</SelectItem>
                  <SelectItem value="additional">Additional Charges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              placeholder="Reference number or transaction ID"
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this payment..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
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
              <DollarSign className="h-5 w-5" />
              Payment Tracking - {eventTitle}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <PaymentDialog />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${paidAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${remainingAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentProgress.toFixed(0)}%</div>
            <Progress value={paymentProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map(payment => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">${payment.amount.toFixed(2)}</span>
                        <Badge variant="outline">
                          {getTypeLabel(payment.type)}
                        </Badge>
                        <Badge className={getStatusColor(payment.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {payment.date.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {getMethodLabel(payment.method)}
                        </div>
                        {payment.transactionId && (
                          <div>ID: {payment.transactionId}</div>
                        )}
                        {payment.notes && (
                          <div className="text-xs bg-muted p-2 rounded mt-2">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {payment.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdatePayment?.(payment.id, { status: 'completed' })}
                        >
                          Confirm
                        </Button>
                      )}
                      {payment.status === 'failed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onUpdatePayment?.(payment.id, { status: 'pending' })}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Payments Recorded</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking payments for this event
                  </p>
                  <PaymentDialog />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payment Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-2xl">
                    {payments.filter(p => p.status === 'completed').length}
                  </div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-2xl">
                    {payments.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Payment Methods</h4>
                {Object.entries(
                  payments.reduce((acc, payment) => {
                    acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([method, amount]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span>{getMethodLabel(method as Payment['method'])}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {remainingAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Outstanding Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-red-600">
                    ${remainingAmount.toFixed(2)}
                  </div>
                  <p className="text-muted-foreground">
                    {paymentProgress < 50 ? 'Deposit required' : 'Final payment due'}
                  </p>
                  <PaymentDialog />
                </div>
              </CardContent>
            </Card>
          )}

          {remainingAmount === 0 && paidAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Payment Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold text-green-600">
                    Fully Paid
                  </div>
                  <p className="text-muted-foreground">
                    All payments have been received for this event
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}