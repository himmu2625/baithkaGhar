# Razorpay Payment Integration - Quick Reference Guide

## Overview
This guide explains how to use and test the Razorpay payment integration in the Baithaka Ghar mobile app.

---

## Configuration

### Mobile App Configuration
File: `baithaka-ghar-mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_7RBjbBxdd3N4RO
```

### Backend Configuration
File: `my-app/.env.local`

```env
RAZORPAY_KEY_ID=rzp_test_7RBjbBxdd3N4RO
RAZORPAY_KEY_SECRET=xQnPLGRh5mUZ2i2dxcmY58ql
```

**🔒 Security Note:** The secret key is NEVER exposed to the mobile app. It's only used on the backend for order creation and signature verification.

---

## Payment Flow Diagram

```
User
  ↓
[Select Property] → [Fill Booking Details] → [Click "Confirm & Pay"]
  ↓
Mobile App
  ↓
1. Create Booking (status: pending)
  ↓
2. Create Razorpay Order (Backend API)
  ↓
3. Open Razorpay Checkout (Native SDK)
  ↓
User Completes Payment
  ↓
4. Receive Payment Response
  ↓
5. Verify Payment Signature (Backend API)
  ↓
6. Update Booking (status: confirmed, paymentStatus: paid)
  ↓
7. Show Success Screen
  ↓
8. User Views Booking
```

---

## Testing Payment Integration

### Test Cards (Always Successful)
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25 (any future date)
Name: Any name
```

### Test Cards (Always Fails)
```
Card Number: 4000 0000 0000 0002
CVV: 123
Expiry: 12/25
```

### Test UPI IDs
```
Success: success@razorpay
Failure: failure@razorpay
```

### Test Net Banking
- Select any bank
- All test transactions will succeed in test mode

---

## Step-by-Step Testing

### 1. Start the Backend Server
```bash
cd my-app
npm run dev
```
Backend runs on http://localhost:3000

### 2. Start the Mobile App
```bash
cd baithaka-ghar-mobile
npm start
```

### 3. Open App on Device/Emulator
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

### 4. Create a Test Booking
1. Login/Register in the app
2. Browse properties on home screen
3. Tap on any property
4. Tap "Book Now" button
5. Select check-in and check-out dates
6. Select number of guests and rooms
7. Fill in guest details:
   - Full Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
8. Review price breakdown
9. Tap "Confirm & Pay ₹X,XXX.XX"

### 5. Complete Payment
**Razorpay checkout will open:**

**Option A - Card Payment:**
1. Select "Card" payment method
2. Enter test card: 4111 1111 1111 1111
3. CVV: 123
4. Expiry: Any future date
5. Tap "Pay"

**Option B - UPI Payment:**
1. Select "UPI" payment method
2. Enter: success@razorpay
3. Tap "Pay"

**Option C - Net Banking:**
1. Select "Net Banking"
2. Choose any bank
3. Complete test payment

### 6. Verify Success
After successful payment:
- ✅ Success screen should appear
- ✅ Booking reference number displayed
- ✅ Payment ID shown
- ✅ Amount and status confirmed

### 7. Check Booking Status
1. Tap "Go to My Bookings"
2. Verify booking appears with:
   - Status: Confirmed (green)
   - Payment Status: Paid
   - All details correct

---

## Common Scenarios

### Scenario 1: Successful Payment
```
User completes payment successfully
→ Booking status changes to "confirmed"
→ Payment status changes to "paid"
→ Success screen shows
→ Confirmation email sent (if configured)
→ Booking appears in "My Bookings" tab
```

### Scenario 2: Payment Cancelled by User
```
User closes Razorpay checkout
→ Alert shows: "Payment cancelled by user"
→ Booking remains with status "pending"
→ User can retry payment later
→ Booking accessible in "My Bookings"
```

### Scenario 3: Payment Failed
```
Payment fails (network/card issue)
→ Alert shows: "Payment failed. Booking saved but not confirmed"
→ Booking remains with status "pending"
→ User can view booking details
→ Option to retry payment (future feature)
```

### Scenario 4: Verification Failed
```
Payment succeeds but verification fails (rare)
→ Alert shows: "Payment verification failed. Contact support"
→ Admin can manually verify and confirm
→ Booking ID and payment ID logged for reference
```

---

## API Endpoints Reference

### 1. Create Razorpay Order
**POST** `/api/payments/razorpay/create-order`

Request:
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "booking_123",
  "notes": {
    "bookingId": "booking_123"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "orderId": "order_MnKLkjhgFDSA",
    "amount": 50000,
    "currency": "INR",
    "receipt": "booking_123"
  }
}
```

### 2. Verify Payment
**POST** `/api/payments/razorpay/verify`

Request:
```json
{
  "paymentId": "pay_MnKLmnOPqrST",
  "orderId": "order_MnKLkjhgFDSA",
  "signature": "9d3a8e8c...",
  "bookingId": "booking_123"
}
```

Response:
```json
{
  "success": true,
  "verified": true,
  "booking": {
    "_id": "booking_123",
    "status": "confirmed",
    "paymentStatus": "paid"
  }
}
```

### 3. Get Payment Details
**GET** `/api/payments/razorpay/details/[paymentId]`

Response:
```json
{
  "success": true,
  "data": {
    "id": "pay_MnKLmnOPqrST",
    "amount": 50000,
    "currency": "INR",
    "status": "captured",
    "method": "card",
    "email": "user@example.com",
    "contact": "9876543210",
    "createdAt": 1640000000
  }
}
```

### 4. Initiate Refund
**POST** `/api/payments/razorpay/refund`

Request:
```json
{
  "paymentId": "pay_MnKLmnOPqrST",
  "amount": 50000,
  "reason": "Booking cancelled by user"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "refundId": "rfnd_AbCdEfGhIjKl",
    "paymentId": "pay_MnKLmnOPqrST",
    "amount": 50000,
    "status": "processed",
    "createdAt": 1640000100
  }
}
```

---

## Troubleshooting

### Issue: Razorpay checkout not opening
**Cause:** Missing or invalid Razorpay key ID
**Solution:**
1. Check `.env` file has correct key: `EXPO_PUBLIC_RAZORPAY_KEY_ID`
2. Restart app after changing `.env`
3. Verify key is correct in Razorpay dashboard

### Issue: Payment succeeds but verification fails
**Cause:** Incorrect signature or secret key mismatch
**Solution:**
1. Verify backend `.env.local` has correct `RAZORPAY_KEY_SECRET`
2. Check backend logs for signature mismatch
3. Ensure order ID and payment ID match

### Issue: "Order not found" error
**Cause:** Backend API not creating order
**Solution:**
1. Check backend server is running
2. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in backend
3. Check backend console for errors
4. Ensure Razorpay package is installed: `npm list razorpay`

### Issue: App crashes on payment
**Cause:** Missing react-native-razorpay package
**Solution:**
```bash
cd baithaka-ghar-mobile
npm install react-native-razorpay --legacy-peer-deps
npx expo prebuild
npm start
```

---

## Going Live (Production Checklist)

### 1. Get Live Razorpay Keys
- Login to https://dashboard.razorpay.com
- Complete KYC verification
- Navigate to Settings → API Keys
- Generate live keys (starts with `rzp_live_`)

### 2. Update Environment Variables

**Mobile App:**
```env
EXPO_PUBLIC_API_URL=https://your-production-domain.com
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXX
```

**Backend:**
```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Configure Webhooks
1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/razorpay/webhook`
3. Select events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - refund.created
4. Copy webhook secret to `.env`

### 4. Test Live Payments
- Start with small test amounts (₹1)
- Verify webhook notifications
- Test refunds
- Check settlement to bank account

### 5. Enable Payment Methods
In Razorpay Dashboard:
- Enable UPI
- Enable Cards (Visa, MasterCard, RuPay)
- Enable Net Banking
- Enable Wallets
- Configure EMI if needed

---

## Security Best Practices

✅ **DO:**
- Keep secret key on backend only
- Verify all payments on backend
- Use HTTPS in production
- Validate payment amounts on backend
- Log all payment transactions
- Handle failed payments gracefully

❌ **DON'T:**
- Expose secret key to mobile app
- Trust payment amounts from client
- Skip signature verification
- Store card details
- Process payments without TLS/SSL

---

## Support & Resources

### Razorpay Resources
- Documentation: https://razorpay.com/docs/
- API Reference: https://razorpay.com/docs/api/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-details/
- Support: https://razorpay.com/support/

### React Native Razorpay
- GitHub: https://github.com/razorpay/react-native-razorpay
- NPM: https://www.npmjs.com/package/react-native-razorpay

### Contact
For issues with this implementation, contact your development team or refer to PHASE5_SUMMARY.md

---

**Last Updated:** December 28, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
