'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Wifi,
  WifiOff
} from 'lucide-react';

interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: 'card' | 'cash' | 'digital' | 'split';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  timestamp: Date;
  cardDetails?: {
    last4: string;
    brand: string;
    type: 'debit' | 'credit';
  };
  digitalWallet?: {
    type: 'apple_pay' | 'google_pay' | 'samsung_pay' | 'paypal';
    email?: string;
  };
  cashDetails?: {
    received: number;
    change: number;
  };
  processingFee?: number;
  receiptNumber?: string;
}

interface PaymentGatewayProps {
  orderId: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (transaction: PaymentTransaction) => void;
  onPaymentFailed: (error: string) => void;
}

export default function PaymentGateway({
  orderId,
  amount,
  isOpen,
  onClose,
  onPaymentComplete,
  onPaymentFailed
}: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'digital' | 'split'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'weak'>('connected');
  
  // Card Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  // Cash Payment States
  const [cashReceived, setCashReceived] = useState(0);
  const [cashChange, setCashChange] = useState(0);
  
  // Digital Wallet States
  const [selectedWallet, setSelectedWallet] = useState<'apple_pay' | 'google_pay' | 'samsung_pay' | 'paypal'>('apple_pay');
  
  // Split Payment States
  const [splitAmounts, setSplitAmounts] = useState({
    card: 0,
    cash: 0,
    digital: 0
  });

  const processingFee = paymentMethod === 'card' ? amount * 0.025 : 0; // 2.5% card processing fee
  const totalWithFee = amount + processingFee;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardBrand = (number: string) => {
    const num = number.replace(/\D/g, '');
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6/.test(num)) return 'discover';
    return 'unknown';
  };

  const simulatePaymentProcess = async (method: string): Promise<PaymentTransaction> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Payment processing failed. Please try again.');
    }

    const transaction: PaymentTransaction = {
      id: Date.now().toString(),
      orderId,
      amount: totalWithFee,
      method: paymentMethod,
      status: 'completed',
      transactionId: `TXN-${Date.now().toString().slice(-8)}`,
      timestamp: new Date(),
      processingFee: processingFee > 0 ? processingFee : undefined,
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`
    };

    switch (method) {
      case 'card':
        transaction.cardDetails = {
          last4: cardNumber.slice(-4),
          brand: getCardBrand(cardNumber),
          type: Math.random() > 0.5 ? 'credit' : 'debit'
        };
        break;
        
      case 'cash':
        transaction.cashDetails = {
          received: cashReceived,
          change: cashChange
        };
        break;
        
      case 'digital':
        transaction.digitalWallet = {
          type: selectedWallet,
          email: 'customer@example.com'
        };
        break;
    }

    return transaction;
  };

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && cashReceived < amount) {
      onPaymentFailed('Insufficient cash amount');
      return;
    }

    setIsProcessing(true);
    
    try {
      const transaction = await simulatePaymentProcess(paymentMethod);
      onPaymentComplete(transaction);
      onClose();
      
      // Reset form
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setCashReceived(0);
      setCashChange(0);
      
    } catch (error) {
      onPaymentFailed(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCashChange = (received: number) => {
    setCashReceived(received);
    setCashChange(Math.max(0, received - amount));
  };

  const ConnectionIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
      {connectionStatus === 'connected' && (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Connected</span>
        </>
      )}
      {connectionStatus === 'weak' && (
        <>
          <Wifi className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-600">Weak Signal</span>
        </>
      )}
      {connectionStatus === 'disconnected' && (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Disconnected</span>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Gateway
            </DialogTitle>
            <ConnectionIndicator />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  ${amount.toFixed(2)}
                </div>
                {processingFee > 0 && (
                  <div className="text-sm text-muted-foreground">
                    + ${processingFee.toFixed(2)} processing fee = ${totalWithFee.toFixed(2)}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Order #{orderId.slice(-6)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="digital">Digital Wallet</SelectItem>
                <SelectItem value="split">Split Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>
              </div>
              
              {cardNumber && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getCardBrand(cardNumber).toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    **** **** **** {cardNumber.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cash Payment Form */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cashReceived">Amount Received</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  step="0.01"
                  min={amount}
                  value={cashReceived || ''}
                  onChange={(e) => updateCashChange(parseFloat(e.target.value) || 0)}
                  placeholder={amount.toFixed(2)}
                />
              </div>
              
              {cashReceived > amount && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Change Due: ${cashChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {cashReceived > 0 && cashReceived < amount && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">
                      Insufficient Amount: ${(amount - cashReceived).toFixed(2)} more needed
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Digital Wallet Selection */}
          {paymentMethod === 'digital' && (
            <div className="space-y-4">
              <div>
                <Label>Select Digital Wallet</Label>
                <Select value={selectedWallet} onValueChange={(value: any) => setSelectedWallet(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="samsung_pay">Samsung Pay</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Customer will complete payment on their device
                </p>
              </div>
            </div>
          )}

          {/* Split Payment */}
          {paymentMethod === 'split' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cardAmount">Card Amount</Label>
                  <Input
                    id="cardAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitAmounts.card || ''}
                    onChange={(e) => setSplitAmounts(prev => ({
                      ...prev,
                      card: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cashAmount">Cash Amount</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitAmounts.cash || ''}
                    onChange={(e) => setSplitAmounts(prev => ({
                      ...prev,
                      cash: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="digitalAmount">Digital Amount</Label>
                  <Input
                    id="digitalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitAmounts.digital || ''}
                    onChange={(e) => setSplitAmounts(prev => ({
                      ...prev,
                      digital: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Total Split: ${Object.values(splitAmounts).reduce((a, b) => a + b, 0).toFixed(2)} / ${amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handlePayment}
              disabled={isProcessing || connectionStatus === 'disconnected'}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>

          {connectionStatus === 'disconnected' && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 text-sm">
                  No internet connection. Card payments unavailable.
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}