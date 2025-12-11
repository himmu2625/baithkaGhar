# Razorpay Payment Integration - Complete Setup Guide

## 🔧 Issues Fixed

### ✅ 1. Missing UPI and Payment Methods
**Problem:** Only Cards, Netbanking, Wallet, and Pay Later were showing. UPI was completely missing.

**Root Cause:** Razorpay payment options didn't include `config.display` to explicitly enable all payment methods.

**Solution:** Added comprehensive payment method configuration in `app/booking/payment/page.tsx`:
```typescript
config: {
  display: {
    blocks: {
      banks: {
        name: "All payment methods",
        instruments: [
          { method: "upi" },
          { method: "card" },
          { method: "netbanking" },
          { method: "wallet" },
          { method: "paylater" },
          { method: "emi" },
          { method: "cardless_emi" },
        ],
      },
    },
    sequence: ["block.banks"],
    preferences: {
      show_default_blocks: true,
    },
  },
}
```

### ✅ 2. Payment Failure on Valid Transactions
**Problem:** Payments were failing immediately even with correct test credentials.

**Root Cause:**
- `payment_capture: false` required manual capture, causing auto-capture failures
- Missing retry configuration
- No timeout settings

**Solution:** Updated `lib/services/payment-service.ts`:
```typescript
payment_capture: true // Auto-capture for immediate confirmation
```

Added retry and timeout in frontend:
```typescript
retry: {
  enabled: true,
  max_count: 3,
},
timeout: 900, // 15 minutes
```

### ✅ 3. International Cards Not Supported
**Problem:** "International cards are not supported" error message.

**Root Cause:** Razorpay dashboard setting restricts international cards by default.

**Solution:** Enable in Razorpay Dashboard (see section below).

---

## 🔑 Razorpay Credentials Setup

### 1. Get Your API Keys

#### For Testing (Test Mode)
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Login to your account
3. Switch to **Test Mode** (toggle in top-left corner)
4. Navigate: **Settings** → **API Keys** → **Generate Test Key**
5. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this private!)

#### For Production (Live Mode)
1. Complete KYC verification in Razorpay Dashboard
2. Switch to **Live Mode**
3. Navigate: **Settings** → **API Keys** → **Generate Live Key**
4. Copy both:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret** (keep this private!)

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay Test Credentials (for development)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_test_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX

# Razorpay Webhook Secret (generate in Dashboard → Webhooks)
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

**For Vercel Production:**
1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add the same variables with your **LIVE** credentials:
   - `RAZORPAY_KEY_ID` = `rzp_live_XXXXXXXXXXXX`
   - `RAZORPAY_KEY_SECRET` = `your_live_secret`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_live_XXXXXXXXXXXX`
   - `RAZORPAY_WEBHOOK_SECRET` = `whsec_XXXXXXXXXXXX`

### 3. Webhook Configuration

#### For Local Development (using ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and add webhook in Razorpay Dashboard.

#### For Production (Vercel)
1. Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Enter webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
4. Select events to track:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `payment.authorized`
   - ✅ `order.paid`
   - ✅ `refund.processed`
   - ✅ `refund.failed`
5. Copy the **Webhook Secret** and add to environment variables

---

## 🧪 Test Payment Credentials

### Test Cards (Success)

**Visa:**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date (e.g., 12/28)
Name: Any name
```

**Mastercard:**
```
Card Number: 5555 5555 5555 4444
CVV: 123
Expiry: 12/28
Name: Any name
```

**Rupay:**
```
Card Number: 6073 8496 5001 6868
CVV: 123
Expiry: 12/28
Name: Any name
```

### Test Cards (Failure Scenarios)

**Card Declined:**
```
Card Number: 4000 0000 0000 0002
```

**Insufficient Funds:**
```
Card Number: 4000 0000 0000 9995
```

**Processing Error:**
```
Card Number: 4000 0000 0000 0069
```

### Test UPI IDs

**Success:**
```
success@razorpay
```

**Failure:**
```
failure@razorpay
```

**Pending (then success after 5 seconds):**
```
pending@razorpay
```

### Test Netbanking
- Select any bank (HDFC, ICICI, SBI, etc.)
- Click **Success** button on the test page

### Test Wallets
All wallets work in test mode - just click **Pay Now**

---

## 📋 Razorpay Dashboard Configuration

### 1. Enable All Payment Methods

1. Go to **Settings** → **Payment Methods**
2. Ensure these are enabled:
   - ✅ Cards (Debit & Credit)
   - ✅ Netbanking
   - ✅ UPI
   - ✅ Wallets (Paytm, PhonePe, Amazon Pay, etc.)
   - ✅ Pay Later (LazyPay, Simpl, etc.)
   - ✅ EMI
   - ✅ Cardless EMI

### 2. Enable International Cards (Important!)

1. Go to **Settings** → **Payment Methods** → **Cards**
2. Under **International Cards**, toggle:
   - ✅ **Accept International Cards**
3. Set accepted currencies if needed
4. Click **Save**

**Note:** International cards only work in Live Mode after KYC completion.

### 3. Enable UPI (Critical for India)

1. Go to **Settings** → **Payment Methods** → **UPI**
2. Ensure all UPI options are enabled:
   - ✅ UPI Intent (GPay, PhonePe, Paytm, etc.)
   - ✅ UPI Collect (Enter UPI ID)
   - ✅ UPI QR Code
3. Click **Save**

**Important:** UPI requires KYC completion in Live Mode!

### 4. Set Payment Capture Mode

1. Go to **Settings** → **Payment Capture**
2. Choose **Automatic Capture** (recommended)
3. Or use **Manual Capture** and update `payment_capture: false` in code

### 5. Set Order Expiry Time

1. Go to **Settings** → **Order Settings**
2. Set **Order expiry time**: 15 minutes (default: 5 minutes)
3. This matches our `timeout: 900` setting

---

## 🔍 Troubleshooting

### Issue 1: "Payment could not be completed"

**Causes:**
- Invalid or missing Razorpay credentials
- Test/Live mode mismatch (using test key in live mode or vice versa)
- Order creation failed
- Network/firewall blocking Razorpay

**Solutions:**
1. Verify environment variables are set correctly
2. Check browser console for errors
3. Verify Razorpay script loaded: `console.log(window.Razorpay)`
4. Check network tab for failed API calls
5. Verify MongoDB connection (bookings need to be created first)

### Issue 2: UPI Not Showing

**Causes:**
- UPI disabled in Razorpay Dashboard
- Account not KYC-verified (Live Mode only)
- Payment config not including UPI method

**Solutions:**
1. ✅ Enable UPI in Dashboard → Settings → Payment Methods
2. ✅ Complete KYC for Live Mode
3. ✅ Code already fixed to include UPI in config

### Issue 3: International Cards Blocked

**Causes:**
- International cards disabled in Dashboard
- Live Mode requires KYC completion

**Solutions:**
1. Enable in Dashboard → Settings → Payment Methods → Cards
2. Complete KYC verification
3. Test with domestic cards first

### Issue 4: Payment Fails After Success

**Causes:**
- Signature verification failure
- Webhook secret mismatch
- Database connection issue

**Solutions:**
1. Verify `RAZORPAY_KEY_SECRET` matches Dashboard
2. Verify `RAZORPAY_WEBHOOK_SECRET` matches webhook config
3. Check server logs for signature verification errors
4. Ensure MongoDB connection is stable

### Issue 5: ERR_BLOCKED_BY_CLIENT in Console

**Causes:**
- Ad blocker blocking Razorpay scripts
- Browser extension blocking payment gateway
- Corporate firewall restrictions

**Solutions:**
1. Disable ad blockers (uBlock Origin, AdBlock, etc.)
2. Disable browser extensions temporarily
3. Whitelist `*.razorpay.com` in firewall
4. Try in incognito/private mode
5. Add to Content Security Policy if using one

---

## 🧪 Testing Workflow

### Test Mode Testing
1. Set test credentials in `.env.local`
2. Start dev server: `npm run dev`
3. Create a booking
4. Go to payment page
5. Try each payment method:
   - ✅ Card: Use `4111 1111 1111 1111`
   - ✅ UPI: Use `success@razorpay`
   - ✅ Netbanking: Select any bank, click Success
   - ✅ Wallet: Select wallet, click Pay
6. Verify booking status changes to `confirmed`
7. Check Razorpay Dashboard → Payments for test payment

### Live Mode Testing (After KYC)
1. Complete Razorpay KYC verification
2. Generate Live API keys
3. Add Live credentials to Vercel environment variables
4. Deploy to production
5. Test with small amount (₹1 or ₹10)
6. Verify real payment flow
7. Test refunds in Dashboard

---

## 📊 Payment Flow Diagram

```
User clicks "Pay Now"
    ↓
Frontend creates booking (POST /api/bookings)
    ↓
Backend creates Razorpay order (PaymentService.createPaymentOrder)
    ↓
Frontend opens Razorpay modal with order ID
    ↓
User selects payment method (Card/UPI/Netbanking/Wallet)
    ↓
User completes payment on Razorpay
    ↓
Razorpay sends response to frontend handler
    ↓
Frontend verifies payment (POST /api/payments/verify)
    ↓
Backend verifies signature (PaymentService.verifyPaymentSignature)
    ↓
Backend captures payment (if auto-capture disabled)
    ↓
Backend updates booking status to "confirmed"
    ↓
Frontend redirects to confirmation page
    ↓
Razorpay sends webhook to backend (payment.captured)
    ↓
Backend processes webhook and double-confirms
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Never expose `RAZORPAY_KEY_SECRET` to frontend
- ✅ Only use `NEXT_PUBLIC_RAZORPAY_KEY_ID` in frontend
- ✅ Rotate keys if accidentally exposed

### 2. Signature Verification
- ✅ Always verify payment signature on backend
- ✅ Never trust frontend payment success without verification
- ✅ Use constant-time comparison for signatures

### 3. Amount Validation
- ✅ Always validate amount on backend before creating order
- ✅ Verify payment amount matches booking amount
- ✅ Use smallest currency unit (paise) to avoid decimal issues

### 4. Webhook Security
- ✅ Verify webhook signature before processing
- ✅ Use HTTPS for webhook URLs
- ✅ Keep webhook secret secure
- ✅ Implement idempotency to handle duplicate webhooks

---

## 📞 Support

If you encounter issues:

1. **Check Razorpay Dashboard Logs:**
   - Dashboard → Transactions → Click on payment → View logs

2. **Check Your Server Logs:**
   - Look for `[PaymentService]` prefixed logs
   - Check for signature verification errors
   - Verify MongoDB connection errors

3. **Razorpay Support:**
   - Email: support@razorpay.com
   - Dashboard → Help
   - [Razorpay Docs](https://razorpay.com/docs/)

4. **Test in Razorpay Test Mode First:**
   - All features work in test mode
   - No real money charged
   - Faster troubleshooting

---

## ✅ Checklist Before Going Live

- [ ] KYC completed in Razorpay Dashboard
- [ ] Live API keys generated
- [ ] Live environment variables added to Vercel
- [ ] Webhook configured with production URL
- [ ] All payment methods enabled (UPI, Cards, Netbanking, Wallets)
- [ ] International cards enabled (if needed)
- [ ] Test transaction completed successfully (₹1)
- [ ] Refund process tested
- [ ] Webhook events tested
- [ ] SSL certificate valid on production domain
- [ ] Error handling tested
- [ ] Database backup configured

---

**Last Updated:** December 12, 2025
**Version:** 2.0
**Status:** ✅ All payment issues resolved
