# Phase 4: Payment Collection Features

**Status**: 🔄 IN PROGRESS
**Started**: December 17, 2025

## Overview

Phase 4 focuses on implementing payment collection features for the Owner Portal. Property owners need to collect remaining payments from guests who made partial payments online (40-100% upfront) and collect the balance at the property.

## Goals

1. **Payment Collection Interface**: Allow owners to mark partial payments as collected
2. **Booking Detail Pages**: Complete booking information with payment actions
3. **Payment Tracking**: Record collection details (date, method, amount, notes)
4. **Payment History**: Timeline of all payment activities
5. **Receipt Generation**: Generate payment receipts for guests
6. **Dashboard Updates**: Update pending payments in real-time

## Architecture

### Database Schema (Already in Place from Phase 1)

The Booking model already supports partial payments:

```typescript
{
  // Payment fields
  isPartialPayment: Boolean,
  onlinePaymentAmount: Number,     // Amount paid online
  hotelPaymentAmount: Number,      // Amount to be collected at hotel
  hotelPaymentStatus: 'pending' | 'collected' | 'waived',
  hotelPaymentDate: Date,          // When payment was collected
  hotelPaymentMethod: String,      // 'cash' | 'card' | 'upi' | 'other'
  hotelPaymentNotes: String,       // Additional notes
  hotelPaymentCollectedBy: ObjectId // User who collected the payment
}
```

### API Endpoints

#### 1. Get Booking Detail
**Endpoint**: `GET /api/os/bookings/[id]/route.ts`

Purpose: Fetch complete booking details including payment information

Response:
```typescript
{
  booking: {
    ...bookingDetails,
    userId: { name, email, phone },
    propertyId: { title, location, address },
    paymentHistory: [
      {
        type: 'online' | 'hotel',
        amount: number,
        status: string,
        date: Date,
        method: string,
        collectedBy: string
      }
    ]
  }
}
```

#### 2. Collect Hotel Payment
**Endpoint**: `POST /api/os/bookings/[id]/collect-payment/route.ts`

Purpose: Mark hotel payment as collected and record details

Request Body:
```typescript
{
  amount: number,           // Amount collected (should match hotelPaymentAmount)
  method: 'cash' | 'card' | 'upi' | 'other',
  date: Date,              // Collection date (defaults to now)
  notes?: string           // Optional notes
}
```

Response:
```typescript
{
  success: boolean,
  booking: UpdatedBooking,
  message: string
}
```

Validations:
- Booking must exist and belong to owner's property
- Booking must have isPartialPayment = true
- hotelPaymentStatus must be 'pending'
- Amount must match hotelPaymentAmount (or allow partial collection)
- Payment method is required

#### 3. Get Pending Payments
**Endpoint**: `GET /api/os/payments/pending/route.ts`

Purpose: Get all bookings with pending hotel payments

Query Parameters:
- `propertyId` (optional): Filter by specific property
- `dateFrom` (optional): Filter by check-in date range
- `dateTo` (optional): Filter by check-in date range

Response:
```typescript
{
  pendingPayments: [
    {
      bookingId: string,
      guestName: string,
      propertyTitle: string,
      checkInDate: Date,
      checkOutDate: Date,
      amountPending: number,
      daysUntilCheckIn: number
    }
  ],
  totalPending: number,
  count: number
}
```

#### 4. Generate Payment Receipt
**Endpoint**: `GET /api/os/bookings/[id]/receipt/route.ts`

Purpose: Generate PDF receipt for collected payment

Response: PDF file download

## UI Components

### 1. Booking Detail Page
**Path**: `/os/bookings/[id]/page.tsx`

Sections:
- **Guest Information**: Name, email, phone, special requests
- **Property Information**: Title, location, room details
- **Booking Dates**: Check-in, check-out, number of nights
- **Payment Summary**:
  - Total amount
  - Online payment (with status)
  - Hotel payment (with status)
  - Payment breakdown chart
- **Payment Actions**:
  - "Collect Payment" button (if pending)
  - "View Receipt" button (if collected)
  - "Send Receipt" button (email to guest)
- **Payment History Timeline**: All payment activities
- **Booking Status**: Current status with actions (confirm, cancel, etc.)

### 2. Collect Payment Modal
**Component**: `components/os/CollectPaymentModal.tsx`

Features:
- Amount input (pre-filled, read-only)
- Payment method selector (cash, card, UPI, other)
- Collection date picker (defaults to today)
- Notes textarea
- Confirm/Cancel buttons
- Validation and error handling

### 3. Payment Timeline
**Component**: `components/os/PaymentTimeline.tsx`

Features:
- Chronological list of payment events
- Visual timeline with icons
- Different colors for online vs hotel payments
- Shows date, amount, method, collected by

### 4. Payments Dashboard
**Path**: `/os/payments/page.tsx`

Sections:
- **Summary Cards**:
  - Total Pending (amount)
  - Due Today (bookings checking in today)
  - Due This Week
  - Total Collected This Month
- **Pending Payments Table**:
  - Guest name
  - Property
  - Check-in date
  - Amount pending
  - Days until check-in
  - "Collect" button
- **Recently Collected**:
  - Last 10 collected payments
  - Date, guest, amount, method
- **Filters**:
  - By property
  - By date range
  - By amount range

### 5. Payment Receipt
**Component**: `components/os/PaymentReceipt.tsx`

Features:
- Professional receipt design
- Property branding (logo, name, address)
- Receipt number (unique)
- Date and time
- Guest information
- Booking details
- Payment breakdown
- Collected by information
- Digital signature/stamp
- Print-friendly design

## Implementation Steps

### Step 1: Booking Detail Page ✅ (Next)
1. Create booking detail route: `/os/bookings/[id]/page.tsx`
2. Create API endpoint: `/api/os/bookings/[id]/route.ts`
3. Create BookingDetailCard component
4. Create PaymentSummaryCard component
5. Add "Collect Payment" button (conditional)

### Step 2: Payment Collection API ✅
1. Create API endpoint: `/api/os/bookings/[id]/collect-payment/route.ts`
2. Implement validation logic
3. Update booking document
4. Return updated booking data

### Step 3: Payment Collection Modal ✅
1. Create CollectPaymentModal component
2. Add form with amount, method, date, notes
3. Implement form validation
4. Connect to API endpoint
5. Show success/error messages
6. Refresh booking data after collection

### Step 4: Payment Timeline ✅
1. Create PaymentTimeline component
2. Parse payment history from booking
3. Display chronologically with icons
4. Style with colors for different payment types

### Step 5: Payments Dashboard ✅
1. Update `/os/payments/page.tsx`
2. Create API endpoint: `/api/os/payments/pending/route.ts`
3. Create PendingPaymentsTable component
4. Add summary cards
5. Add filters and search

### Step 6: Payment Receipt ✅
1. Create PaymentReceipt component
2. Create API endpoint: `/api/os/bookings/[id]/receipt/route.ts`
3. Implement PDF generation (using jsPDF or react-pdf)
4. Add "Download Receipt" and "Email Receipt" actions

## Database Updates

No schema changes required! All fields already exist from Phase 1.

## Security Considerations

1. **Authorization**:
   - Verify owner has access to the property
   - Check booking belongs to owner's property
   - Only allow collection for pending payments

2. **Validation**:
   - Verify amount matches expected amount
   - Ensure payment hasn't already been collected
   - Validate payment method
   - Check booking is in valid status (confirmed or completed)

3. **Audit Trail**:
   - Record who collected the payment (user ID)
   - Record when payment was collected
   - Store payment method and notes
   - Maintain immutable payment history

4. **Error Handling**:
   - Handle race conditions (two users collecting same payment)
   - Validate database state before updates
   - Return clear error messages
   - Log all payment activities

## Testing Checklist

### Manual Testing
- [ ] View booking detail page
- [ ] Verify payment summary is accurate
- [ ] Click "Collect Payment" button
- [ ] Fill out payment collection form
- [ ] Submit payment collection
- [ ] Verify booking status updates
- [ ] Check payment appears in timeline
- [ ] Verify "Collect Payment" button disappears
- [ ] Generate payment receipt
- [ ] Download receipt PDF
- [ ] Verify receipt contains correct information
- [ ] Check payments dashboard shows correct data
- [ ] Verify pending payments decrease after collection
- [ ] Test authorization (try accessing other owner's bookings)

### Edge Cases
- [ ] Try collecting already-collected payment (should fail)
- [ ] Try collecting with invalid amount (should fail)
- [ ] Try accessing booking from different owner (should fail)
- [ ] Try collecting for booking in cancelled status
- [ ] Test with booking that has no partial payment

## Success Metrics

Phase 4 will be considered complete when:

1. ✅ Owners can view complete booking details
2. ✅ Owners can collect hotel payments and record details
3. ✅ Payment history is displayed in timeline format
4. ✅ Payments dashboard shows pending and collected payments
5. ✅ Payment receipts can be generated and downloaded
6. ✅ All payment actions are properly authorized
7. ✅ Real-time updates reflect in dashboard statistics

## Future Enhancements (Phase 5+)

1. **Email Integration**: Auto-send receipts to guests
2. **SMS Notifications**: Notify guests when payment is collected
3. **Partial Collection**: Allow collecting less than full amount
4. **Payment Reminders**: Auto-remind guests before check-in
5. **Refund Management**: Handle cancellations and refunds
6. **Analytics**: Payment collection rate, average days to collect
7. **Export**: Export payment reports to Excel/CSV
8. **Multi-currency**: Support for multiple currencies

## Technical Notes

### Payment Collection Flow

```
1. Owner views booking detail page
   ↓
2. Sees "Collect Payment" button (if payment pending)
   ↓
3. Clicks button → Modal opens
   ↓
4. Fills payment details (method, date, notes)
   ↓
5. Submits form → API call
   ↓
6. API validates and updates booking
   ↓
7. Success message + booking refresh
   ↓
8. Button changes to "View Receipt"
   ↓
9. Dashboard statistics update
```

### State Management

For this phase, we'll use:
- **Server Components**: For data fetching (booking details, payment lists)
- **Client Components**: For forms, modals, interactive elements
- **React State**: For modal open/close, form values
- **Optimistic Updates**: Update UI immediately, revalidate in background

### API Response Format

All payment-related APIs will follow this format:
```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

## Dependencies

No new dependencies required. We'll use existing:
- Next.js 15 (App Router)
- React
- MongoDB/Mongoose
- Tailwind CSS
- Lucide React icons
- date-fns (for date formatting)

For PDF generation (Step 6), we may add:
- `jspdf` or `react-pdf` (TBD based on requirements)

---

**Let's start with Step 1: Booking Detail Page!** 🚀
