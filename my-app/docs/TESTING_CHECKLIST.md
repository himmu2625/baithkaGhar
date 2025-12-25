# ✅ COMPREHENSIVE TESTING CHECKLIST

**Purpose:** Complete testing guide for Owner System & Partial Payment implementation

**Testing Phases:**
1. Unit Testing
2. Integration Testing
3. End-to-End Testing
4. Security Testing
5. Performance Testing
6. User Acceptance Testing (UAT)

---

## 📋 PRE-DEPLOYMENT TESTING

### Phase 1: Unit Tests

Test individual functions and components in isolation.

#### Database Models
```javascript
// Test: Booking Model - Partial Payment
□ Create booking with paymentType='partial'
□ Validate partialPaymentPercentage (40-100)
□ Calculate remainingAmount correctly
□ paidAmount updates correctly
□ paymentHistory array works

// Test: User Model - Property Owner
□ Create user with role='property_owner'
□ Validate ownerProfile fields
□ Test ownerAccountStatus enum
□ Test ownedProperties array

// Test: Property Model - Payment Settings
□ Add paymentSettings to property
□ Validate minimumPartialPercentage
□ Test payment method flags
```

#### API Endpoints
```javascript
// Test: POST /api/bookings
□ Create full payment booking (100%)
□ Create partial payment booking (40%)
□ Create partial payment booking (60%)
□ Create partial payment booking (100% via partial)
□ Reject booking with <40% payment
□ Reject booking with >100% payment

// Test: POST /api/os/payments/collect
□ Collect payment with valid data
□ Reject if amount mismatch
□ Reject if already collected
□ Reject if unauthorized user
□ Update booking status correctly
□ Generate payment receipt
```

---

### Phase 2: Integration Tests

Test interactions between multiple components.

#### Booking Flow - Full Payment
```
User Story: Customer books property with 100% payment

□ Step 1: Select property
  - Property data loads correctly
  - Pricing displays accurately

□ Step 2: Enter booking details
  - Date validation works
  - Guest count validation works
  - Total price calculates correctly

□ Step 3: Select "Full Payment"
  - Payment option shows ₹10,000 (100%)
  - "Pay at Hotel" shows ₹0

□ Step 4: Complete Razorpay payment
  - Razorpay modal opens
  - Payment succeeds
  - Signature verification passes

□ Step 5: Booking confirmation
  - Booking status: 'confirmed'
  - paymentStatus: 'completed'
  - paidAmount: 10000
  - remainingAmount: 0
  - Confirmation email sent
  - SMS notification sent

Expected Result: ✅ Booking fully paid, no balance due
```

#### Booking Flow - Partial Payment (60%)
```
User Story: Customer books property with 60% payment now, 40% at hotel

□ Step 1: Select property
  - Property shows "Partial Payment Available"
  - Minimum 40% displayed

□ Step 2: Enter booking details
  - Total: ₹10,000 calculated

□ Step 3: Select "Partial Payment"
  - Slider appears (40-100%)
  - Customer moves slider to 60%
  - Display shows:
    • Pay Now: ₹6,000 (60%)
    • Pay at Hotel: ₹4,000 (40%)

□ Step 4: Complete Razorpay payment
  - Razorpay charges ₹6,000 (not ₹10,000)
  - Payment succeeds

□ Step 5: Booking confirmation
  - Booking status: 'confirmed'
  - paymentStatus: 'partial_paid'
  - paymentType: 'partial'
  - paidAmount: 6000
  - remainingAmount: 4000
  - partialPaymentPercentage: 60
  - Confirmation email shows balance due
  - SMS reminder scheduled

□ Step 6: Owner sees pending payment
  - OS dashboard shows ₹4,000 pending
  - Booking appears in "Pending Payments" tab
  - Details show: "₹6,000 paid / ₹10,000 total"

Expected Result: ✅ Partial payment recorded, owner alerted
```

#### Payment Collection at Hotel
```
User Story: Owner collects ₹4,000 balance at hotel check-in

□ Step 1: Owner logs into OS
  - Owner sees dashboard
  - "Pending Payments" alert shows 1 booking
  - Total pending: ₹4,000

□ Step 2: View pending payment
  - Click "Pending Payments"
  - Booking BK-A1B2C3 listed
  - Shows: John Doe, Check-in Today, ₹4,000 due

□ Step 3: Collect payment
  - Click [Collect Payment]
  - Modal opens
  - Shows: ₹4,000 due
  - Select payment method: Cash
  - Enter transaction ID (optional)
  - Add notes: "Collected at check-in"

□ Step 4: Confirm collection
  - Click [Confirm Payment Received]
  - Booking updates:
    • paymentStatus: 'completed'
    • paidAmount: 10000
    • remainingAmount: 0
    • hotelPaymentAmount: 4000
    • hotelPaymentMethod: 'cash'
    • hotelPaymentDate: [now]
  - Guest receives email receipt
  - Guest receives SMS confirmation

□ Step 5: Verify update
  - Booking removed from "Pending Payments"
  - Dashboard pending count decrements
  - Payment history shows 2 entries:
    1. Online: ₹6,000 (Razorpay)
    2. Hotel: ₹4,000 (Cash)

Expected Result: ✅ Payment marked complete, guest notified
```

---

### Phase 3: End-to-End Tests

Complete user journeys from start to finish.

#### E2E Test 1: Guest Books with Partial Payment
```bash
# Using Playwright/Cypress

test('Guest can book with 50% partial payment', async () => {
  // 1. Browse property
  await page.goto('/property/123')
  await expect(page.locator('h1')).toContainText('Property Name')

  // 2. Click "Book Now"
  await page.click('button:has-text("Book Now")')

  // 3. Fill booking form
  await page.fill('input[name="checkIn"]', '2025-12-20')
  await page.fill('input[name="checkOut"]', '2025-12-22')
  await page.fill('input[name="guests"]', '2')

  // 4. Select partial payment
  await page.click('text=Partial Payment')
  await page.locator('input[type="range"]').fill('50')

  // 5. Verify amounts
  await expect(page.locator('.pay-now')).toContainText('₹5,000')
  await expect(page.locator('.pay-hotel')).toContainText('₹5,000')

  // 6. Proceed to payment
  await page.click('button:has-text("Proceed to Payment")')

  // 7. Complete Razorpay payment (mock)
  await completeRazorpayPayment({ amount: 5000 })

  // 8. Verify confirmation
  await expect(page).toHaveURL(/\/booking\/confirmation/)
  await expect(page.locator('.booking-status')).toContainText('Confirmed')
  await expect(page.locator('.balance-due')).toContainText('₹5,000')
})

□ Test passes in staging environment
□ Test passes in production environment
```

#### E2E Test 2: Owner Collects Payment
```bash
test('Owner can collect pending payment', async () => {
  // 1. Owner login
  await page.goto('/os/login')
  await page.fill('input[name="email"]', 'owner@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button:has-text("Sign In")')

  // 2. Navigate to pending payments
  await expect(page).toHaveURL('/os/dashboard')
  await page.click('text=Pending Payments')

  // 3. Find booking
  await expect(page.locator('.booking-row')).toContainText('BK-A1B2C3')

  // 4. Click collect payment
  await page.click('button:has-text("Collect Payment")')

  // 5. Fill payment details
  await page.click('text=Cash')
  await page.fill('input[name="notes"]', 'Collected at check-in')
  await page.click('button:has-text("Confirm Payment Received")')

  // 6. Verify success
  await expect(page.locator('.toast')).toContainText('Payment recorded')
  await expect(page.locator('.pending-count')).toContainText('0')
})

□ Test passes in staging environment
□ Test passes in production environment
```

---

### Phase 4: Security Testing

Validate security measures and access controls.

#### Authentication Tests
```
□ Unauthorized user cannot access /os/*
□ Regular user cannot access /os/*
□ Property owner can only see their property's data
□ Property owner cannot access other properties
□ Admin can access all data
□ Suspended owner cannot log in
□ Session expires after 30 days
□ CSRF protection enabled
```

#### Authorization Tests
```
□ Owner A cannot view Owner B's bookings
□ Owner cannot modify other owner's data
□ Owner cannot delete bookings
□ Owner cannot refund payments
□ Admin can perform all actions
□ API validates JWT tokens
□ API rejects expired tokens
```

#### Payment Security
```
□ Payment amounts validated server-side
□ Cannot collect payment twice (idempotency)
□ Razorpay signature verified
□ Payment history immutable
□ Sensitive data encrypted in database
□ PCI compliance maintained
```

#### SQL Injection / NoSQL Injection
```
□ Test with malicious input in booking form
□ Test with malicious input in search
□ Test with malicious input in payment collection
□ All inputs sanitized
□ Mongoose schema validation works
```

---

### Phase 5: Performance Testing

Ensure system handles load efficiently.

#### Load Testing
```bash
# Using Apache Bench or Artillery

# Test 1: Concurrent bookings
ab -n 1000 -c 50 -p booking.json -T 'application/json' \
   https://staging.baithakaghar.com/api/bookings

Expected:
□ 95% of requests complete < 2 seconds
□ 0% error rate
□ Database connections managed properly
□ No memory leaks

# Test 2: Payment collection endpoint
ab -n 500 -c 25 -p payment.json -T 'application/json' \
   https://staging.baithakaghar.com/api/os/payments/collect

Expected:
□ 95% of requests complete < 1 second
□ 0% error rate
□ No duplicate payment collections
```

#### Database Performance
```javascript
// Test: Query performance

□ Pending payments query < 100ms
  db.bookings.find({ paymentStatus: 'partial_paid' })

□ Owner bookings query < 200ms
  db.bookings.find({ 'propertyId': ObjectId('...') })

□ All indexes created correctly:
  - bookings: { paymentType: 1, paymentStatus: 1 }
  - bookings: { propertyId: 1, dateFrom: 1 }
  - users: { role: 1, ownerAccountStatus: 1 }
  - properties: { ownerId: 1 }
```

#### Frontend Performance
```
□ Homepage loads < 2 seconds
□ OS dashboard loads < 3 seconds
□ Payment modal opens < 500ms
□ Time to Interactive < 3.5 seconds
□ Lighthouse score > 80
```

---

### Phase 6: User Acceptance Testing (UAT)

Real users test the system.

#### UAT Session 1: Guest Booking Flow
```
Participants: 3-5 test users (not developers)

Scenario 1: Book with 40% payment
□ User can find property
□ User understands partial payment option
□ User successfully completes 40% payment
□ User receives clear confirmation
□ User knows ₹X is due at hotel

Scenario 2: Book with 100% payment
□ User can choose full payment
□ User successfully completes payment
□ User understands no balance due

Feedback Questions:
1. Was the partial payment option clear?
2. Did you understand how much to pay at hotel?
3. Were you worried about paying the rest at hotel?
4. What would make you trust this more?
```

#### UAT Session 2: Owner Payment Collection
```
Participants: 2-3 property owners

Scenario: Collect ₹4,000 from guest
□ Owner can log into OS
□ Owner easily finds pending payments
□ Owner understands what's owed
□ Owner successfully marks payment collected
□ Process takes < 2 minutes

Feedback Questions:
1. Was the process intuitive?
2. What confused you (if anything)?
3. What would you change?
4. Do you feel confident using this?
```

---

## 🚀 PRE-PRODUCTION CHECKLIST

Before deploying to production:

### Code Quality
```
□ All unit tests pass (100% critical paths)
□ All integration tests pass
□ Code review completed by 2+ developers
□ No console.log statements in production code
□ Error handling comprehensive
□ Loading states implemented
□ Edge cases handled
```

### Database
```
□ Migration script tested in staging
□ Indexes created
□ Backup taken before migration
□ Rollback script ready
□ Data validation rules in place
```

### Security
```
□ Environment variables secured
□ API keys rotated
□ HTTPS enforced
□ Rate limiting enabled
□ CORS configured correctly
□ Helmet.js security headers
```

### Monitoring
```
□ Sentry error tracking active
□ Payment success rate monitoring
□ Booking completion rate monitoring
□ Database performance monitoring
□ Uptime monitoring configured
□ Alert thresholds set
```

### Documentation
```
□ API documentation updated
□ User guides written
□ Admin guides written
□ Troubleshooting guide ready
□ Rollback procedures documented
```

---

## 📊 ACCEPTANCE CRITERIA

System is ready for production when:

### Functional Requirements
- ✅ Guest can pay 40-100% upfront
- ✅ Guest receives confirmation with balance due
- ✅ Owner sees pending payments in dashboard
- ✅ Owner can mark payments collected
- ✅ Guest receives receipt after collection
- ✅ Admin can view all transactions

### Performance Requirements
- ✅ Page load time < 3 seconds
- ✅ API response time < 1 second
- ✅ Payment processing < 5 seconds
- ✅ 99.9% uptime

### Security Requirements
- ✅ All data encrypted in transit (HTTPS)
- ✅ Sensitive data encrypted at rest
- ✅ Role-based access control
- ✅ Audit logs for payment actions
- ✅ PCI DSS compliance

### Quality Requirements
- ✅ 0 critical bugs
- ✅ < 5 minor bugs
- ✅ User satisfaction > 80%
- ✅ Error rate < 0.1%

---

## 🐛 BUG SEVERITY LEVELS

### Critical (P0) - Fix Immediately
- Payment processing fails
- Data loss occurs
- Security breach
- Complete system crash

### High (P1) - Fix within 24 hours
- Major feature broken
- Affects >50% of users
- Workaround available but difficult

### Medium (P2) - Fix within 1 week
- Minor feature broken
- Affects <50% of users
- Easy workaround available

### Low (P3) - Fix in next release
- UI glitch
- Non-critical feature
- Affects <10% of users

---

## 📝 TEST RESULTS LOG

| Test Suite | Date | Pass Rate | Bugs Found | Status |
|------------|------|-----------|------------|--------|
| Unit Tests | | % | | |
| Integration Tests | | % | | |
| E2E Tests | | % | | |
| Security Tests | | % | | |
| Performance Tests | | % | | |
| UAT | | % | | |

---

**Remember:** Testing is not a phase, it's a continuous process. Test early, test often, test thoroughly.

---

**Last Updated:** December 16, 2025
**Version:** 1.0
**Document Owner:** QA Team
