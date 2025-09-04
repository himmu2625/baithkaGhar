'use client';

import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Receipt, 
  Printer, 
  Download, 
  Mail,
  Building2,
  Calendar,
  Clock,
  User,
  CreditCard,
  Hash
} from 'lucide-react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  modifications?: string[];
}

interface ReceiptData {
  receiptNumber: string;
  orderNumber: string;
  timestamp: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
    cashReceived?: number;
    change?: number;
  };
  customer?: {
    name?: string;
    tableNumber?: string;
    phone?: string;
    email?: string;
  };
  server: {
    name: string;
    id: string;
  };
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
    website?: string;
  };
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onPrint?: () => void;
  onEmail?: (email: string) => void;
  onDownload?: () => void;
}

const ReceiptPreview = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => (
    <div ref={ref} className="max-w-sm mx-auto bg-white text-black font-mono text-xs p-4">
      {/* Business Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="h-5 w-5" />
          <h1 className="font-bold text-lg">{data.businessInfo.name}</h1>
        </div>
        <div className="text-center text-xs space-y-1">
          <p>{data.businessInfo.address}</p>
          <p>Phone: {data.businessInfo.phone}</p>
          <p>Email: {data.businessInfo.email}</p>
          {data.businessInfo.website && <p>Web: {data.businessInfo.website}</p>}
          {data.businessInfo.taxId && <p>Tax ID: {data.businessInfo.taxId}</p>}
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3"></div>

      {/* Receipt Info */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="font-bold">{data.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Order #:</span>
          <span>{data.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{data.timestamp.toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{data.timestamp.toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Server:</span>
          <span>{data.server.name} ({data.server.id})</span>
        </div>
        {data.customer?.name && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{data.customer.name}</span>
          </div>
        )}
        {data.customer?.tableNumber && (
          <div className="flex justify-between">
            <span>Table:</span>
            <span>#{data.customer.tableNumber}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-3"></div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        {data.items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between">
              <span className="flex-1">
                {item.quantity}x {item.name}
              </span>
              <span>${item.total.toFixed(2)}</span>
            </div>
            <div className="text-right text-gray-600">
              @${item.price.toFixed(2)} each
            </div>
            {item.modifications && item.modifications.length > 0 && (
              <div className="ml-4 text-gray-600">
                {item.modifications.map((mod, i) => (
                  <div key={i}>• {mod}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-3"></div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${data.subtotal.toFixed(2)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-${data.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${data.tax.toFixed(2)}</span>
        </div>
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span>
          <span>${data.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3"></div>

      {/* Payment Info */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="capitalize">{data.paymentMethod}</span>
        </div>
        
        {data.paymentDetails?.cardLast4 && (
          <div className="flex justify-between">
            <span>Card:</span>
            <span>
              {data.paymentDetails.cardBrand?.toUpperCase()} ****{data.paymentDetails.cardLast4}
            </span>
          </div>
        )}
        
        {data.paymentDetails?.transactionId && (
          <div className="flex justify-between">
            <span>Transaction ID:</span>
            <span>{data.paymentDetails.transactionId}</span>
          </div>
        )}
        
        {data.paymentDetails?.cashReceived && (
          <>
            <div className="flex justify-between">
              <span>Cash Received:</span>
              <span>${data.paymentDetails.cashReceived.toFixed(2)}</span>
            </div>
            {data.paymentDetails.change && data.paymentDetails.change > 0 && (
              <div className="flex justify-between">
                <span>Change Given:</span>
                <span>${data.paymentDetails.change.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-3"></div>

      {/* Footer */}
      <div className="text-center space-y-2">
        <p className="font-bold">Thank you for dining with us!</p>
        <p>Please come again soon</p>
        
        {data.customer?.email && (
          <p className="text-xs">Receipt sent to: {data.customer.email}</p>
        )}
        
        <div className="mt-4 text-xs text-gray-600">
          <p>For any queries, please contact us</p>
          <p>or visit our website</p>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="text-center mt-4">
        <div className="w-16 h-16 mx-auto bg-gray-200 flex items-center justify-center">
          <Hash className="h-8 w-8 text-gray-500" />
        </div>
        <p className="text-xs mt-1">Scan for feedback</p>
      </div>
    </div>
  )
);

ReceiptPreview.displayName = 'ReceiptPreview';

export default function ReceiptGenerator({ 
  receiptData, 
  onPrint, 
  onEmail, 
  onDownload 
}: ReceiptGeneratorProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt ${receiptData.receiptNumber}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px;
                }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
    onPrint?.();
  };

  const handleDownload = () => {
    // In a real implementation, you would generate a PDF here
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${receiptData.receiptNumber}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    onDownload?.();
  };

  const handleEmail = () => {
    if (receiptData.customer?.email) {
      onEmail?.(receiptData.customer.email);
    } else {
      const email = prompt('Enter customer email address:');
      if (email) {
        onEmail?.(email);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Receipt className="h-4 w-4 mr-2" />
          View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt #{receiptData.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <Card>
            <CardContent className="p-0">
              <div id="receipt-content">
                <ReceiptPreview data={receiptData} />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Printer className="h-4 w-4" />
              <span className="text-xs">Print</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEmail}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Mail className="h-4 w-4" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          {/* Receipt Summary */}
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>{receiptData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-bold">${receiptData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="capitalize">{receiptData.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <Badge className="bg-green-500">Paid</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}