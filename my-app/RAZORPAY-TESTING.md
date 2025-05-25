# Razorpay Payment Integration Testing Guide

## Overview

This guide helps you test the Razorpay payment integration in the Baithaka Ghar booking system.

## Configuration Status ✅

- **Razorpay Keys**: Configured in `.env.local`
- **Key ID**: `rzp_test_7RBjbBxdd3N4RO` (Test Mode)
- **Integration**: Complete with booking flow

## Testing the Payment Flow

### 1. Complete Booking Flow

1. **Navigate to Homepage**: `http://localhost:3000`
2. **Search for Properties**: Use the search functionality
3. **Select a Property**: Click on any property card
4. **Enter Booking Details**:
   - Select check-in/check-out dates
   - Choose number of guests
   - Click "Book Now"
5. **Fill Guest Information**:
   - Enter required details (name, email, phone)
   - Add any special requests (optional)
6. **Click "Proceed to Payment"**: This should redirect to `/checkout`

### 2. Payment Processing

1. **Checkout Page**: Should display booking summary and property details
2. **Click "Pay Now"**: This opens the Razorpay payment window
3. **Razorpay Test Payment**:
   - **Test Card Number**: `4111 1111 1111 1111`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: Any 3 digits (e.g., `123`)
   - **Name**: Any name

### 3. Test Payment Scenarios

#### Successful Payment:

- Use card: `4111 1111 1111 1111`
- Should redirect to booking confirmation page

#### Failed Payment:

- Use card: `4000 0000 0000 0002`
- Should show error message and allow retry

#### UPI Testing:

- Use UPI ID: `success@razorpay`
- Should simulate successful UPI payment

### 4. Verification Steps

After successful payment, verify:

- [ ] Booking status updated to "confirmed"
- [ ] Payment record created in database
- [ ] Confirmation email sent (if configured)
- [ ] Booking details displayed correctly

## Common Issues & Solutions

### 1. Razorpay Window Not Opening

**Possible Causes:**

- Browser blocking popups
- JavaScript errors
- Network connectivity

**Solutions:**

- Allow popups for localhost
- Check browser console for errors
- Verify Razorpay script is loading

### 2. Payment Fails with "Order Creation Failed"

**Possible Causes:**

- Invalid Razorpay credentials
- Database connection issues
- Booking not found

**Solutions:**

- Verify `.env.local` has correct Razorpay keys
- Check MongoDB connection
- Ensure booking exists in database

### 3. Redirect Issues After Payment

**Possible Causes:**

- Incorrect return URL configuration
- Session/authentication issues

**Solutions:**

- Check `returnUrl` parameter in payment call
- Verify user session is maintained

## Environment Variables Required

```env
RAZORPAY_KEY_ID=rzp_test_7RBjbBxdd3N4RO
RAZORPAY_KEY_SECRET=your_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_7RBjbBxdd3N4RO
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Testing Checklist

- [ ] Booking form submission works
- [ ] Redirects to checkout page correctly
- [ ] Razorpay payment window opens
- [ ] Test payment processes successfully
- [ ] Confirmation page displays
- [ ] Database records are created
- [ ] Error handling works for failed payments

## Support

For issues with Razorpay integration:

1. Check browser console for JavaScript errors
2. Verify environment variables are correct
3. Test with different browsers
4. Check network tab for API call failures

## Notes

- This is using Razorpay Test Mode
- Test payments won't charge real money
- Use provided test card numbers for reliable testing
