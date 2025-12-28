"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CreditCard, Banknote, Smartphone, Building2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    _id: string;
    guestName: string;
    propertyTitle: string;
    checkInDate: string;
    amountDue: number;
    totalAmount: number;
  };
}

export default function PaymentCollectionModal({
  open,
  onOpenChange,
  booking
}: PaymentCollectionModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'net_banking' | 'cheque'>('cash');
  const [amount, setAmount] = useState(booking.amountDue);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/os/bookings/${booking._id}/collect-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to collect payment');
      }

      setStatus('success');

      // Close modal and refresh after 1.5 seconds
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 1500);

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred while collecting payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'net_banking', label: 'Net Banking', icon: Building2 },
    { value: 'cheque', label: 'Cheque', icon: Building2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Record payment collection for this booking
          </DialogDescription>
        </DialogHeader>

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Payment Collected Successfully!</p>
              <p className="text-sm text-green-700">Redirecting...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Payment Collection Failed</p>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Guest:</span>
              <span className="font-medium">{booking.guestName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Property:</span>
              <span className="font-medium">{booking.propertyTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">
                {new Date(booking.checkInDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-600">Total Booking:</span>
              <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Amount Due:</span>
              <span className="font-bold text-orange-600 text-lg">
                {formatCurrency(booking.amountDue)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Collect</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              max={booking.amountDue}
              required
              disabled={isSubmitting || status === 'success'}
            />
            <p className="text-xs text-muted-foreground">
              Expected: {formatCurrency(booking.amountDue)}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: any) => setPaymentMethod(value)}
              disabled={isSubmitting || status === 'success'}
            >
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div key={method.value}>
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={method.value}
                        className="flex items-center gap-2 rounded-lg border-2 border-gray-200 p-3 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50"
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              disabled={isSubmitting || status === 'success'}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || status === 'success'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || status === 'success' || amount <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Collecting...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Collected
                </>
              ) : (
                <>Collect {formatCurrency(amount)}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
