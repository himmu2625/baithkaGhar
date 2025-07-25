# Creating Coupon Codes in the Unified Promotion System

## Quick Start: Creating Simple Coupon Codes

The unified promotion system now makes it easy to create common coupon types like `WELCOME1000`, `ANURAG10`, or `SAVE500` with just a few clicks.

### Method 1: Using Quick Templates (Recommended)

1. **Go to Promotions**: Navigate to `/admin/promotions`
2. **Click "Create Promotion"**
3. **Choose a Template**: Select from the quick templates:

   - **Flat Discount Coupon**: For codes like `WELCOME1000` (₹1000 off)
   - **Percentage Coupon**: For codes like `SAVE10` (10% off)
   - **Welcome Offer**: For first-time users like `NEWUSER500`

4. **Customize**: Edit the coupon code, amount, and terms
5. **Save**: Your coupon is ready to use!

### Method 2: Manual Creation

1. **Go to Promotions**: Navigate to `/admin/promotions`
2. **Click "Create Promotion"**
3. **Configure**:

   - **Name**: "Flat Discount Coupon"
   - **Type**: Select "Coupon Code"
   - **Discount Type**: Choose "Fixed Amount" or "Percentage"
   - **Discount Value**: Enter amount (e.g., 1000 for ₹1000 off)

4. **Set Conditions**:

   - ✅ Check "Requires coupon code"
   - **Coupon Code**: Enter your code (e.g., `WELCOME1000`)
   - **Valid From/To**: Set validity period
   - **Usage Limit**: Total number of uses
   - **Per Customer Limit**: How many times one user can use it
   - **Minimum Booking Amount**: Required minimum spend

5. **Display Settings**:
   - **Title**: "Flat ₹1000 Off"
   - ✅ **Show at Checkout**: Enable this for coupon codes
   - ❌ **Show in Search/Property Pages**: Usually disabled for coupon codes

## Examples of Common Coupon Types

### Flat Discount Coupons

```
Code: WELCOME1000
Type: Fixed Amount
Value: ₹1000
Min Booking: ₹2000
Usage: 100 times total, 1 per customer
```

### Percentage Discount Coupons

```
Code: SAVE10
Type: Percentage
Value: 10%
Max Discount: ₹2000
Min Booking: ₹1000
Usage: 100 times total, 1 per customer
```

### Personal/Custom Coupons

```
Code: ANURAG500
Type: Fixed Amount
Value: ₹500
Min Booking: ₹1500
Usage: 1 time total, 1 per customer
```

### First-Time User Coupons

```
Code: NEWUSER500
Type: Fixed Amount
Value: ₹500
Min Booking: ₹1500
First-Time Customer: ✅ Yes
Usage: 1000 times total, 1 per customer
```

## Where Coupons Appear

**Checkout Page**: Users can enter coupon codes during booking completion

- Shows discount amount immediately
- Validates code and shows error if invalid
- Applies discount to final booking amount

**NOT shown on**:

- Property listing pages
- Search results
- Property detail pages

(This is different from Special Offers which are shown as banners)

## Terms and Conditions

All coupons automatically include:

- Validity period (start and end dates)
- Usage limits (total and per customer)
- Minimum booking amount requirements
- Active/inactive status
- Automatic validation at checkout

## Testing Your Coupons

1. **Create a test coupon** with a short validity period
2. **Go to a property page** and start a booking
3. **At checkout**, enter your coupon code
4. **Verify** the discount is applied correctly
5. **Check admin panel** to see usage count updated

## Migration from Old System

If you have existing coupons from the old system:

1. **Go to `/admin/migration`**
2. **Click "Migrate Coupons"**
3. **All existing coupons** will be converted to the new system
4. **Functionality preserved** - they'll work exactly the same

## Best Practices

- **Clear naming**: Use descriptive coupon codes
- **Set expiry dates**: Don't leave coupons open-ended
- **Reasonable limits**: Set appropriate usage limits
- **Minimum amounts**: Prevent abuse with minimum spend requirements
- **Test before launch**: Always test new coupons
- **Monitor usage**: Check analytics regularly

## Support

- **Migration issues**: Use `/admin/migration` page
- **Coupon not working**: Check if it's active and within validity period
- **Usage tracking**: View analytics in the promotion details
