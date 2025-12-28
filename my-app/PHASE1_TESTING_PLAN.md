# Phase 1: Partial Payment System - Testing Plan

## Overview
This document outlines the comprehensive testing plan for the Partial Payment System implementation.

---

## 🎯 Testing Objectives

1. Verify partial payment calculations (40% - 100%)
2. Test online payment integration with Razorpay
3. Validate hotel payment collection workflow
4. Ensure payment history is tracked correctly
5. Test Owner System payment dashboard accuracy

---

## ✅ Pre-Testing Checklist

### Database
- [x] Booking model updated with payment history fields
- [x] Migration script executed successfully (7 bookings migrated)
- [x] Indexes created for payment queries

### Backend APIs
- [x] Booking creation API calculates partial payments
- [x] Payment collection API updated
- [x] Payment verification working

### Frontend Components
- [x] Booking form has percentage slider (40-100%)
- [x] Payment collection modal created
- [x] Owner payments page displays correctly

---

## 📋 Test Cases

### 1. Booking Flow Tests

#### Test 1.1: 40% Partial Payment Booking
**Steps:**
1. Navigate to a property page
2. Select check-in and check-out dates
3. Enable "Pay Partial Amount Now"
4. Set slider to 40%
5. Complete booking

**Expected Results:**
- Online amount = 40% of total (rounded)
- Hotel amount = 60% of total
- `isPartialPayment = true`
- `partialPaymentPercent = 40`
- Razorpay charges only 40%

**Verification:**
```javascript
// Check in database
db.bookings.findOne({ _id: ObjectId("...") })

Expected fields:
- isPartialPayment: true
- partialPaymentPercent: 40
- onlinePaymentAmount: <calculated_40%>
- hotelPaymentAmount: <calculated_60%>
- hotelPaymentStatus: "pending"
```

---

#### Test 1.2: 75% Partial Payment Booking
**Steps:**
1. Navigate to a property page
2. Select dates
3. Set slider to 75%
4. Complete booking

**Expected Results:**
- Online amount = 75% of total
- Hotel amount = 25% of total
- Payment split correctly

---

#### Test 1.3: 100% Full Payment Booking
**Steps:**
1. Navigate to a property page
2. Select dates
3. Set slider to 100%
4. Complete booking

**Expected Results:**
- Online amount = 100% of total
- Hotel amount = ₹0
- `isPartialPayment = true` (but 100%)
- No pending hotel payment

---

#### Test 1.4: Full Payment Toggle OFF
**Steps:**
1. Navigate to a property page
2. Select dates
3. Toggle "Pay Partial Amount Now" to OFF
4. Complete booking

**Expected Results:**
- `isPartialPayment = false`
- `onlinePaymentAmount = totalPrice`
- `hotelPaymentAmount = 0`
- `partialPaymentPercent = 100`

---

### 2. Payment Collection Tests

#### Test 2.1: Collect Pending Hotel Payment
**Steps:**
1. Login to Owner System (anshuuu1302@gmail.com)
2. Navigate to Payments page
3. Click "View & Collect" on a pending payment
4. Click "Collect Payment"
5. Select payment method (Cash)
6. Enter amount
7. Submit

**Expected Results:**
- Payment status changes to "collected"
- `hotelPaymentStatus = "collected"`
- `hotelPaymentCompletedAt` set to current time
- `hotelPaymentCollectedBy` set to owner ID
- Payment history entry created

**Verification:**
```javascript
// Check payment history
db.bookings.findOne(
  { _id: ObjectId("...") },
  { paymentHistory: 1 }
)

Expected:
paymentHistory: [
  {
    amount: <online_amount>,
    paymentType: "online",
    method: "razorpay",
    status: "completed",
    transactionId: "...",
    collectedAt: <timestamp>
  },
  {
    amount: <hotel_amount>,
    paymentType: "hotel",
    method: "cash",
    status: "completed",
    transactionId: "HP-...",
    collectedBy: ObjectId("owner_id"),
    collectedAt: <timestamp>
  }
]
```

---

#### Test 2.2: Payment Method Validation
**Test each payment method:**
- Cash
- Card
- UPI
- Net Banking
- Cheque

**Expected:**
- Each method is recorded correctly
- `hotelPaymentMethod` field updated

---

#### Test 2.3: Amount Mismatch Validation
**Steps:**
1. Try to collect different amount than expected
2. Submit form

**Expected:**
- API returns error
- Shows: "Amount mismatch. Expected ₹X, received ₹Y"
- Payment not collected

---

### 3. Payment History Tests

#### Test 3.1: Online Payment History Entry
**Steps:**
1. Complete a partial payment booking
2. After Razorpay payment succeeds
3. Check database

**Expected:**
```javascript
paymentHistory: [{
  amount: <online_amount>,
  paymentType: "online",
  method: "razorpay",
  status: "completed",
  transactionId: <razorpay_payment_id>,
  collectedAt: <payment_timestamp>,
  notes: "Online payment via Razorpay"
}]
```

---

#### Test 3.2: Hotel Payment History Entry
**Steps:**
1. Collect hotel payment
2. Check database

**Expected:**
```javascript
// Second entry added to paymentHistory
paymentHistory: [
  { /* online payment */ },
  {
    amount: <hotel_amount>,
    paymentType: "hotel",
    method: <selected_method>,
    status: "completed",
    transactionId: "HP-<timestamp>-<random>",
    collectedBy: ObjectId("owner_id"),
    collectedAt: <collection_timestamp>
  }
]
```

---

### 4. Owner Dashboard Tests

#### Test 4.1: Pending Payments Display
**Steps:**
1. Login to OS
2. Navigate to Payments page

**Expected:**
- Shows all bookings with `hotelPaymentStatus = "pending"`
- Displays correct amounts
- Shows days until check-in
- Stats cards accurate:
  - Total Pending
  - Due Today
  - Due This Week
  - Collected This Month

---

#### Test 4.2: Recently Collected Display
**Steps:**
1. Collect a payment
2. Check "Recently Collected" section

**Expected:**
- Payment appears immediately (after page refresh)
- Shows:
  - Guest name
  - Property title
  - Amount
  - Payment method
  - Collection timestamp
  - Collected by

---

#### Test 4.3: Payment Filtering by Property
**Steps:**
1. Create bookings for multiple properties
2. Login as owner with one property
3. Check payments page

**Expected:**
- Only shows payments for owned properties
- Filtered by `propertyId`

---

### 5. Edge Cases & Error Handling

#### Test 5.1: Duplicate Payment Collection
**Steps:**
1. Collect a payment
2. Try to collect again

**Expected:**
- API returns error
- "Payment has already been collected"
- Status 400

---

#### Test 5.2: Unauthorized Access
**Steps:**
1. Login as different owner
2. Try to access another owner's booking payment

**Expected:**
- 403 Forbidden error
- "Unauthorized - You do not have access to this booking"

---

#### Test 5.3: Cancelled Booking Payment
**Steps:**
1. Try to collect payment for cancelled booking

**Expected:**
- Error: "Cannot collect payment for booking with status: cancelled"

---

#### Test 5.4: Rounding Edge Cases
Test amounts that round differently:
- ₹1000 at 40% = ₹400 + ₹600
- ₹1500 at 75% = ₹1125 + ₹375
- ₹999 at 40% = ₹400 + ₹599

**Expected:**
- Amounts always sum to total
- No fraction loss

---

### 6. Razorpay Integration Tests

#### Test 6.1: Order Creation with Partial Amount
**Steps:**
1. Create booking with 40% partial payment
2. Check Razorpay order amount

**Expected:**
- Razorpay order amount = onlinePaymentAmount (not totalPrice)
- Metadata includes partial payment info

---

#### Test 6.2: Payment Success Webhook
**Steps:**
1. Complete Razorpay payment
2. Wait for webhook

**Expected:**
- `paymentStatus = "completed"`
- Payment ID recorded
- Payment history entry created
- Booking status updated

---

### 7. Mobile Responsiveness Tests

#### Test 7.1: Booking Form on Mobile
**Device:** iPhone/Android simulator

**Steps:**
1. Open property page on mobile
2. Use slider

**Expected:**
- Slider works smoothly
- Payment split cards readable
- Form submits correctly

---

#### Test 7.2: Payment Collection Modal on Mobile
**Steps:**
1. Open OS on mobile
2. Collect payment

**Expected:**
- Modal displays properly
- All buttons accessible
- Form inputs functional

---

## 🔍 Performance Tests

### Load Test 7.1: Multiple Simultaneous Bookings
- Create 10 bookings simultaneously
- Check all have correct payment splits
- Verify no race conditions

### Database Query Performance
```javascript
// Test payment aggregation query speed
db.bookings.aggregate([
  { $match: { hotelPaymentStatus: "collected" } },
  { $group: { _id: null, total: { $sum: "$hotelPaymentAmount" } } }
]).explain("executionStats")

// Should use index and execute in <100ms
```

---

## 📊 Validation Queries

### Check All Partial Payments
```javascript
db.bookings.find({
  isPartialPayment: true
}).forEach(booking => {
  const total = booking.onlinePaymentAmount + booking.hotelPaymentAmount;
  const expected = booking.totalPrice || booking.priceBreakdown?.total;

  if (Math.abs(total - expected) > 1) {
    print(`❌ Booking ${booking._id}: Amount mismatch`);
    print(`  Online: ${booking.onlinePaymentAmount}`);
    print(`  Hotel: ${booking.hotelPaymentAmount}`);
    print(`  Total: ${total}, Expected: ${expected}`);
  } else {
    print(`✅ Booking ${booking._id}: Amounts correct`);
  }
});
```

### Verify Payment History Integrity
```javascript
db.bookings.find({
  paymentHistory: { $exists: true, $ne: [] }
}).forEach(booking => {
  const historyTotal = booking.paymentHistory.reduce((sum, p) => {
    return sum + (p.status === 'completed' ? p.amount : 0);
  }, 0);

  const expectedTotal = booking.totalPrice || booking.priceBreakdown?.total;

  if (Math.abs(historyTotal - expectedTotal) > 1) {
    print(`❌ Booking ${booking._id}: Payment history mismatch`);
  } else {
    print(`✅ Booking ${booking._id}: Payment history valid`);
  }
});
```

---

## 🐛 Known Issues to Test

1. **Payment history duplication** - Ensure pre-save middleware doesn't create duplicates
2. **ObjectId serialization** - Verify all MongoDB IDs convert to strings for client
3. **Timezone handling** - Check payment dates display correctly in IST

---

## ✅ Sign-Off Checklist

Before marking Phase 1 as complete:

- [ ] All 21 test cases passed
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Database queries performant (<100ms)
- [ ] Mobile experience smooth
- [ ] Payment amounts always accurate
- [ ] Owner dashboard stats correct
- [ ] Payment history tracks properly
- [ ] Razorpay integration working
- [ ] Error messages user-friendly

---

## 📝 Test Results Template

```
Test Date: _______________
Tester: __________________

| Test ID | Status | Notes |
|---------|--------|-------|
| 1.1     | ⬜     |       |
| 1.2     | ⬜     |       |
| 1.3     | ⬜     |       |
| ...     | ⬜     |       |

Overall Status: PASS / FAIL
Issues Found: ___
```

---

## 🚀 Next Steps After Testing

If all tests pass:
1. Deploy to staging
2. Run user acceptance testing
3. Move to Phase 2 (Receipt Generation & PDF System)

If tests fail:
1. Document failures
2. Create bug fix tasks
3. Re-test after fixes
