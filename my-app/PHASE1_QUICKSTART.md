# Phase 1 - Quick Start Guide

## 🚀 How to Test the Partial Payment System

### Step 1: Start the Development Server

```bash
cd "C:\Users\Lenovo\Desktop\Baithaka GHAR website\my-app"
npm run dev
```

Wait for: `✓ Ready in Xms`

---

### Step 2: Test Guest Booking with Partial Payment

#### A. Navigate to a Property
1. Open browser: `http://localhost:3000`
2. Click on any property card
3. Or directly visit a property page

#### B. Use the Booking Form
1. Select check-in and check-out dates
2. Choose number of guests
3. Look for the **blue box** with "Pay Partial Amount Now"

#### C. Adjust Payment Percentage
```
┌─────────────────────────────────────┐
│ ⚡ Pay Partial Amount Now    [ON]  │ ← Toggle this
├─────────────────────────────────────┤
│ Payment now: 40%        ₹4,000      │
│ ────●────────────────────────       │ ← Drag slider
│ Min: 40%              Max: 100%     │
└─────────────────────────────────────┘
```

**Try these percentages:**
- 40% (minimum)
- 75% (mid-range)
- 100% (full payment via slider)

#### D. Complete Booking
1. Check "I agree to terms and conditions"
2. Click "Reserve"
3. Complete Razorpay payment (use test card)

**Razorpay Test Card:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: 123
```

#### E. Verify in Database
```javascript
// Open MongoDB or use your DB client
db.bookings.findOne(
  { _id: ObjectId("your_booking_id") },
  {
    isPartialPayment: 1,
    partialPaymentPercent: 1,
    onlinePaymentAmount: 1,
    hotelPaymentAmount: 1,
    hotelPaymentStatus: 1,
    paymentHistory: 1
  }
)
```

**Expected Output:**
```javascript
{
  _id: ObjectId("..."),
  isPartialPayment: true,
  partialPaymentPercent: 40,  // or your selected %
  onlinePaymentAmount: 4000,  // 40% of total
  hotelPaymentAmount: 6000,   // 60% of total
  hotelPaymentStatus: "pending",
  paymentHistory: [
    {
      amount: 4000,
      paymentType: "online",
      method: "razorpay",
      status: "completed",
      transactionId: "pay_...",
      collectedAt: ISODate("...")
    }
  ]
}
```

---

### Step 3: Test Owner Payment Collection

#### A. Login to Owner System
1. Navigate to: `http://localhost:3000/os/login`
2. Email: `anshuuu1302@gmail.com`
3. Password: `Himmu123@`

#### B. Navigate to Payments
1. Click "Payments" in sidebar
2. You'll see the dashboard with stats:
   - Total Pending
   - Due Today
   - Due This Week
   - Collected This Month

#### C. Collect a Payment
1. Find a pending payment in the table
2. Click "View & Collect"
3. This opens the booking detail page
4. Click "Collect Payment" button
5. Payment collection modal appears

#### D. Fill the Modal
```
┌─────────────────────────────────────┐
│ Collect Payment              [X]    │
├─────────────────────────────────────┤
│ Guest: John Doe                     │
│ Property: Sea View Villa            │
│ Check-in: 28 Dec 2025              │
│ Amount Due: ₹6,000                  │
├─────────────────────────────────────┤
│ Amount to Collect: ₹6000            │
│                                     │
│ Payment Method:                     │
│ [Cash] [Card] [UPI] [Net Banking]   │
│                                     │
│ Notes (Optional):                   │
│ [                                 ] │
│                                     │
│ [Cancel]  [Collect ₹6,000]         │
└─────────────────────────────────────┘
```

1. Select payment method (e.g., Cash)
2. Add notes (optional): "Collected at check-in"
3. Click "Collect ₹6,000"

#### E. Verify Success
- ✅ Green success message appears
- ✅ Modal auto-closes after 1.5s
- ✅ Page refreshes
- ✅ Payment moves to "Recently Collected"

#### F. Check Database
```javascript
db.bookings.findOne(
  { _id: ObjectId("your_booking_id") },
  {
    hotelPaymentStatus: 1,
    hotelPaymentCompletedAt: 1,
    hotelPaymentMethod: 1,
    hotelPaymentCollectedBy: 1,
    paymentHistory: 1
  }
)
```

**Expected Output:**
```javascript
{
  hotelPaymentStatus: "collected",
  hotelPaymentCompletedAt: ISODate("2025-12-27T..."),
  hotelPaymentMethod: "cash",
  hotelPaymentCollectedBy: ObjectId("owner_id"),
  paymentHistory: [
    {
      amount: 4000,
      paymentType: "online",
      method: "razorpay",
      status: "completed",
      transactionId: "pay_...",
      collectedAt: ISODate("...")
    },
    {
      amount: 6000,
      paymentType: "hotel",
      method: "cash",
      status: "completed",
      transactionId: "HP-...",
      collectedBy: ObjectId("owner_id"),
      collectedAt: ISODate("..."),
      notes: "Payment collected at property"
    }
  ]
}
```

---

### Step 4: Quick Validation Checks

#### Check 1: Amount Math
```javascript
// Run this in MongoDB shell
db.bookings.find({
  isPartialPayment: true
}).forEach(b => {
  const total = b.onlinePaymentAmount + b.hotelPaymentAmount;
  const expected = b.totalPrice || b.priceBreakdown?.total || 0;
  const diff = Math.abs(total - expected);

  if (diff > 1) {
    print(`❌ FAIL: Booking ${b._id}`);
    print(`   Online: ${b.onlinePaymentAmount}`);
    print(`   Hotel: ${b.hotelPaymentAmount}`);
    print(`   Sum: ${total}, Expected: ${expected}`);
  } else {
    print(`✅ PASS: Booking ${b._id} - Amounts correct`);
  }
});
```

#### Check 2: Payment History Completeness
```javascript
db.bookings.find({
  hotelPaymentStatus: "collected"
}).forEach(b => {
  const hasOnline = b.paymentHistory.some(p => p.paymentType === 'online');
  const hasHotel = b.paymentHistory.some(p => p.paymentType === 'hotel');

  if (hasOnline && hasHotel) {
    print(`✅ PASS: Booking ${b._id} - Full history`);
  } else {
    print(`❌ FAIL: Booking ${b._id} - Missing payment history`);
    print(`   Has online: ${hasOnline}, Has hotel: ${hasHotel}`);
  }
});
```

#### Check 3: Dashboard Stats Accuracy
```javascript
// Get all pending payments
const pending = db.bookings.aggregate([
  {
    $match: {
      isPartialPayment: true,
      hotelPaymentStatus: "pending"
    }
  },
  {
    $group: {
      _id: null,
      count: { $sum: 1 },
      totalAmount: { $sum: "$hotelPaymentAmount" }
    }
  }
]).toArray();

print("Pending Payments:");
print(`  Count: ${pending[0]?.count || 0}`);
print(`  Total: ₹${pending[0]?.totalAmount || 0}`);

// Get this month's collected
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const collected = db.bookings.aggregate([
  {
    $match: {
      isPartialPayment: true,
      hotelPaymentStatus: "collected",
      hotelPaymentCompletedAt: { $gte: startOfMonth }
    }
  },
  {
    $group: {
      _id: null,
      total: { $sum: "$hotelPaymentAmount" }
    }
  }
]).toArray();

print("Collected This Month:");
print(`  Total: ₹${collected[0]?.total || 0}`);
```

Compare these numbers with the OS dashboard stats.

---

## 🐛 Common Issues & Solutions

### Issue 1: Slider Not Working
**Symptom:** Can't drag the slider
**Solution:**
- Check browser console for errors
- Verify `components/ui/slider.tsx` exists
- Clear browser cache and reload

### Issue 2: Payment Collection Fails
**Symptom:** "Unauthorized" error
**Solution:**
- Verify you're logged in to OS
- Check that owner owns the property
- Run: `db.users.findOne({ email: "anshuuu1302@gmail.com" })`
- Verify `ownerProfile.propertyIds` contains the property

### Issue 3: Amount Mismatch Error
**Symptom:** "Amount mismatch. Expected ₹X, received ₹Y"
**Solution:**
- This is intentional validation
- Amount must exactly match `hotelPaymentAmount`
- Check booking in database for correct amount

### Issue 4: Payment History Missing
**Symptom:** `paymentHistory` is empty
**Solution:**
- Check if pre-save middleware is running
- Look for console errors in server logs
- Manually trigger save: `booking.save()`

---

## 📱 Mobile Testing

### Test on Real Device
1. Get your local IP:
   ```bash
   ipconfig  # Windows
   # Look for IPv4 Address
   ```

2. Access on mobile:
   ```
   http://192.168.x.x:3000
   ```

3. Test slider with touch
4. Test modal on small screen
5. Verify all buttons are clickable

### Test Responsive Design
1. Open DevTools (F12)
2. Click responsive design mode
3. Test these viewports:
   - iPhone 12 (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

---

## ✅ Quick Test Checklist

Use this for rapid testing:

```
□ Booking with 40% partial payment
□ Booking with 75% partial payment
□ Booking with 100% via slider
□ Booking with toggle OFF (full payment)
□ Payment collection via modal
□ Payment shows in "Recently Collected"
□ Dashboard stats update correctly
□ Payment history has 2 entries
□ Amount calculations are exact
□ Mobile slider works smoothly
```

---

## 🎯 Success Criteria

Phase 1 is working correctly if:

✅ **Guest Experience:**
- Slider adjusts from 40-100%
- Payment split displays in real-time
- Can toggle full payment on/off
- Razorpay charges correct amount

✅ **Owner Experience:**
- Can see all pending payments
- Can collect payments via modal
- Stats update immediately
- Recently collected shows details

✅ **Data Integrity:**
- Online + Hotel = Total (±₹1)
- Payment history has all transactions
- Status changes tracked correctly
- No duplicate history entries

---

## 🔧 Debugging Commands

### Check Recent Bookings
```javascript
db.bookings.find({
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ createdAt: -1 }).limit(5).pretty()
```

### Find Bookings with Payment Issues
```javascript
db.bookings.find({
  $or: [
    { isPartialPayment: true, hotelPaymentAmount: 0 },
    { isPartialPayment: false, hotelPaymentAmount: { $gt: 0 } },
    { paymentHistory: { $exists: false } },
    { paymentHistory: { $size: 0 } }
  ]
}).pretty()
```

### Check Owner Access
```javascript
db.users.findOne(
  { email: "anshuuu1302@gmail.com" },
  { "ownerProfile.propertyIds": 1, role: 1 }
)
```

---

## 📞 Need Help?

1. **Check the test plan:** `PHASE1_TESTING_PLAN.md`
2. **Review completion summary:** `PHASE1_COMPLETION_SUMMARY.md`
3. **Check browser console** for frontend errors
4. **Check server logs** for backend errors
5. **Verify database** with validation queries above

---

**Happy Testing! 🎉**

*Remember: The goal is to ensure guests can pay flexibly and owners can collect efficiently.*
