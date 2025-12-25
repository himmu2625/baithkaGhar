import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10,
  },
  receiptNumber: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
  },
  value: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  divider: {
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 10,
  },
  paymentBreakdown: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 10,
    color: '#4B5563',
  },
  paymentAmount: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopColor: '#4F46E5',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 10,
  },
  collectedBy: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 15,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 10,
    padding: 5,
    borderRadius: 4,
    marginTop: 10,
    textAlign: 'center',
  },
});

interface PaymentReceiptProps {
  booking: any;
  property: any;
  receiptNumber: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function PaymentReceipt({ booking, property, receiptNumber }: PaymentReceiptProps) {
  const calculateNights = () => {
    const checkIn = new Date(booking.dateFrom);
    const checkOut = new Date(booking.dateTo);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PAYMENT RECEIPT</Text>
          <Text style={styles.subtitle}>{property.title}</Text>
          <Text style={styles.receiptNumber}>Receipt No: {receiptNumber}</Text>
          <Text style={styles.receiptNumber}>Date: {formatDateTime(new Date())}</Text>
        </View>

        {/* Property Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Property Name:</Text>
            <Text style={styles.value}>{property.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{property.location}</Text>
          </View>
          {property.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>
                {property.address.city}, {property.address.state}
              </Text>
            </View>
          )}
          {property.contactNo && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{property.contactNo}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Guest Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{booking.userId?.name || 'Guest'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{booking.userId?.email || 'N/A'}</Text>
          </View>
          {booking.userId?.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{booking.userId.phone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Booking ID:</Text>
            <Text style={styles.value}>{booking._id}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Check-in Date:</Text>
            <Text style={styles.value}>{formatDate(booking.dateFrom)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-out Date:</Text>
            <Text style={styles.value}>{formatDate(booking.dateTo)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Number of Nights:</Text>
            <Text style={styles.value}>{calculateNights()}</Text>
          </View>
          {booking.numberOfGuests && (
            <View style={styles.row}>
              <Text style={styles.label}>Number of Guests:</Text>
              <Text style={styles.value}>{booking.numberOfGuests}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Booking Date:</Text>
            <Text style={styles.value}>{formatDate(booking.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.paymentBreakdown}>
            {/* Online Payment */}
            {booking.onlinePaymentAmount && booking.onlinePaymentAmount > 0 && (
              <>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Online Payment (Advance)</Text>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(booking.onlinePaymentAmount)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>  Payment Method:</Text>
                  <Text style={styles.value}>{booking.paymentMethod || 'Online'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>  Payment Date:</Text>
                  <Text style={styles.value}>{formatDate(booking.createdAt)}</Text>
                </View>
              </>
            )}

            {/* Hotel Payment */}
            {booking.isPartialPayment && booking.hotelPaymentAmount > 0 && (
              <>
                <View style={{ marginTop: 10 }} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment at Property</Text>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(booking.hotelPaymentAmount)}
                  </Text>
                </View>
                {booking.hotelPaymentStatus === 'collected' && (
                  <>
                    <View style={styles.row}>
                      <Text style={styles.label}>  Payment Method:</Text>
                      <Text style={styles.value}>
                        {(booking.hotelPaymentMethod || 'Cash').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>  Payment Date:</Text>
                      <Text style={styles.value}>
                        {formatDate(booking.hotelPaymentDate || new Date())}
                      </Text>
                    </View>
                    {booking.hotelPaymentNotes && (
                      <View style={styles.row}>
                        <Text style={styles.label}>  Notes:</Text>
                        <Text style={styles.value}>{booking.hotelPaymentNotes}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(booking.totalAmount || 0)}
              </Text>
            </View>
          </View>

          {/* Payment Status */}
          {booking.hotelPaymentStatus === 'collected' && (
            <View style={styles.statusBadge}>
              <Text>✓ PAYMENT COMPLETED</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for choosing {property.title}!</Text>
          <Text style={styles.footerText}>
            This is a computer-generated receipt and does not require a signature.
          </Text>
          <Text style={styles.footerText}>
            For any queries, please contact us at {property.email || property.contactNo}
          </Text>

          {booking.hotelPaymentCollectedBy && (
            <Text style={styles.collectedBy}>
              Payment collected by: Property Staff
            </Text>
          )}

          <Text style={styles.collectedBy}>
            Generated on {formatDateTime(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
