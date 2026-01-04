/**
 * Invoice Service
 * Handles invoice generation and download
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { api } from './api';
import type { Booking } from '@/types';

class InvoiceService {
  /**
   * Generate and download invoice for a booking
   */
  async downloadInvoice(booking: Booking): Promise<void> {
    try {
      // Generate HTML invoice content
      const htmlContent = this.generateInvoiceHTML(booking);

      // Create file path
      const fileName = `invoice_${booking.bookingReference}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write HTML to file
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Download Invoice',
        });
      } else {
        Alert.alert('Success', 'Invoice saved to device storage');
      }
    } catch (error: any) {
      console.error('Download invoice error:', error);
      throw new Error(error.message || 'Failed to download invoice');
    }
  }

  /**
   * Generate invoice PDF from backend
   */
  async generatePDFInvoice(bookingId: string): Promise<string> {
    try {
      const response = await api.get<{ data: { pdfUrl: string } }>(
        `/api/bookings/${bookingId}/invoice`
      );

      return response.data.pdfUrl;
    } catch (error: any) {
      console.error('Generate PDF error:', error);
      throw new Error(error.message || 'Failed to generate PDF invoice');
    }
  }

  /**
   * Generate HTML invoice content
   */
  private generateInvoiceHTML(booking: Booking): string {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const invoiceDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${booking.bookingReference}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px 20px;
            background: #f5f5f5;
        }
        .invoice {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .invoice-title {
            font-size: 24px;
            color: #666;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .info-block {
            flex: 1;
        }
        .info-label {
            font-weight: 600;
            color: #666;
            margin-bottom: 10px;
        }
        .info-value {
            color: #1a1a1a;
            line-height: 1.6;
        }
        .booking-ref {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .booking-ref-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .booking-ref-value {
            font-size: 20px;
            font-weight: bold;
            color: #1a1a1a;
            letter-spacing: 2px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .details-table th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
        }
        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .total-row {
            font-weight: bold;
            font-size: 18px;
            background: #f5f5f5;
        }
        .payment-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-paid {
            background: #4CAF50;
            color: white;
        }
        .status-pending {
            background: #FFC107;
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="logo">Baithaka Ghar</div>
            <div class="invoice-title">BOOKING INVOICE</div>
        </div>

        <div class="booking-ref">
            <div class="booking-ref-label">Booking Reference</div>
            <div class="booking-ref-value">${booking.bookingReference}</div>
        </div>

        <div class="info-section">
            <div class="info-block">
                <div class="info-label">Bill To:</div>
                <div class="info-value">
                    ${booking.guestDetails.name}<br>
                    ${booking.guestDetails.email}<br>
                    ${booking.guestDetails.phone}
                </div>
            </div>
            <div class="info-block" style="text-align: right;">
                <div class="info-label">Invoice Details:</div>
                <div class="info-value">
                    Invoice Date: ${invoiceDate}<br>
                    Status: <span class="payment-status status-${booking.paymentStatus}">
                        ${booking.paymentStatus.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>

        <table class="details-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Details</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Property Booking</td>
                    <td>
                        Check-in: ${checkInDate}<br>
                        Check-out: ${checkOutDate}<br>
                        Guests: ${booking.guests} | Rooms: ${booking.rooms}
                    </td>
                    <td style="text-align: right;">₹${booking.totalPrice.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="2">TOTAL AMOUNT</td>
                    <td style="text-align: right;">₹${booking.totalPrice.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        ${booking.paymentDetails ? `
        <div class="info-section">
            <div class="info-block">
                <div class="info-label">Payment Details:</div>
                <div class="info-value">
                    Method: ${booking.paymentDetails.method || 'Razorpay'}<br>
                    Transaction ID: ${booking.paymentDetails.transactionId || 'N/A'}<br>
                    Payment Date: ${booking.paymentDetails.paidAt ? new Date(booking.paymentDetails.paidAt).toLocaleDateString('en-IN') : 'N/A'}
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for choosing Baithaka Ghar!</p>
            <p>For support, contact us at support@baithakaghar.com</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const invoiceService = new InvoiceService();
