# 🔄 EMERGENCY ROLLBACK PROCEDURES

**Document Purpose:** Step-by-step guide to rollback the Owner System implementation in case of critical failures.

**Last Updated:** December 16, 2025

---

## 🚨 WHEN TO TRIGGER ROLLBACK

Initiate immediate rollback if:

1. **Critical data loss** detected
2. **Payment processing failures** affecting customer transactions
3. **Security breach** or unauthorized access detected
4. **Database corruption** that cannot be recovered
5. **Widespread application crashes** (>10% of requests failing)
6. **Owner system preventing** normal bookings from completing

**Do NOT rollback for:**
- Minor UI bugs
- Single user issues
- Non-critical feature issues
- Performance degradation <20%

---

## ⚡ QUICK ROLLBACK (5 MINUTES)

### Emergency Fast Rollback

**Use this when:** Application is completely broken

```bash
# 1. IMMEDIATELY stop the application
pm2 stop all  # or your process manager

# 2. Switch to previous Git version
git checkout v1.0.0-pre-owner-system

# 3. Rebuild application
npm run build

# 4. Start application
pm2 start all

# 5. Verify application is running
curl https://baithakaghar.com/api/health

# Time: ~3-5 minutes
```

**This rollback:**
- ✅ Restores code to previous working version
- ✅ Quick to execute
- ❌ Does NOT restore database changes
- ❌ Bookings created during new version may have issues

---

## 🗄️ FULL ROLLBACK (30 MINUTES)

### Complete System Rollback

**Use this when:** Database changes are causing issues

### Step 1: Stop Application (1 minute)

```bash
# SSH into server
ssh user@your-server.com

# Stop all Node processes
pm2 stop all

# Verify nothing is running
pm2 list
```

### Step 2: Backup Current State (5 minutes)

**CRITICAL:** Always backup current state before rollback!

```bash
# Create emergency backup of current database
node scripts/backup/backup-database.js

# Verify backup was created
ls -lh backups/ | tail -1

# Expected output: baithaka-backup-2025-12-16
```

### Step 3: Restore Database (15 minutes)

```bash
# List available backups
node scripts/backup/restore-database.js

# Choose backup from BEFORE owner system deployment
# Example: baithaka-backup-2025-12-15

# Restore database
node scripts/backup/restore-database.js baithaka-backup-2025-12-15

# Confirm when prompted: yes
```

### Step 4: Restore Code (3 minutes)

```bash
# Switch to pre-owner-system Git tag
git fetch --all --tags
git checkout v1.0.0-pre-owner-system

# Restore dependencies
npm ci

# Rebuild application
npm run build
```

### Step 5: Restore Environment Variables (2 minutes)

```bash
# Restore previous .env.production
# (Should be backed up separately)

cp .env.production.backup .env.production

# Or manually remove new environment variables:
# - Remove ENABLE_OWNER_SYSTEM
# - Remove ENABLE_PARTIAL_PAYMENTS
# - etc.
```

### Step 6: Start Application (2 minutes)

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Wait 30 seconds for startup
sleep 30

# Verify application is running
pm2 status

# Check logs for errors
pm2 logs --lines 50
```

### Step 7: Verification (5 minutes)

```bash
# Test critical flows
curl https://baithakaghar.com/
curl https://baithakaghar.com/api/properties
curl https://baithakaghar.com/api/bookings

# Test user login
# Test property search
# Test booking creation
# Verify payments work
```

### Step 8: Notify Stakeholders (2 minutes)

```bash
# Send notification email template:

Subject: [URGENT] Baithaka Ghar - System Rollback Executed

Team,

A rollback has been performed on the production system.

Reason: [Describe issue]
Time: [Current time]
Affected Period: [Time range when new system was live]
Current Status: Restored to version v1.0.0-pre-owner-system

Action Items:
1. [List immediate actions needed]
2. [Any data recovery needed]
3. [Investigation tasks]

Next Steps:
- Root cause analysis
- Fix identified issues in staging
- Re-deployment plan

Contact: [Your contact info]
```

---

## 🔍 POST-ROLLBACK VERIFICATION

After rollback, verify these critical functions:

### Database Integrity
```bash
# Connect to MongoDB
mongosh "YOUR_MONGODB_URI"

# Check collection counts
use baithaka
db.users.countDocuments()
db.properties.countDocuments()
db.bookings.countDocuments()

# Verify recent bookings exist
db.bookings.find().sort({createdAt: -1}).limit(5)

# Check for orphaned records
# (Bookings created during owner system that may have new fields)
db.bookings.find({ paymentType: { $exists: true } }).count()
```

### Application Functionality
- [ ] Homepage loads correctly
- [ ] User can log in
- [ ] Property search works
- [ ] Property details page loads
- [ ] Booking creation works
- [ ] Payment processing works (TEST MODE)
- [ ] Confirmation email sends
- [ ] Admin panel accessible

### Payment System
- [ ] Razorpay integration functional
- [ ] Test booking with ₹1 completes
- [ ] Payment callback works
- [ ] Booking status updates correctly
- [ ] Confirmation email received

---

## 🧹 CLEANUP AFTER ROLLBACK

### Database Cleanup

If owner system was live and bookings were created:

```javascript
// scripts/cleanup/remove-owner-system-fields.js

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Property = require('../models/Property');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('Removing Owner System fields...');

  // Remove partial payment fields from bookings
  await Booking.updateMany(
    {},
    {
      $unset: {
        paymentType: '',
        partialPaymentAmount: '',
        partialPaymentPercentage: '',
        remainingAmount: '',
        paidAmount: '',
        hotelPaymentAmount: '',
        hotelPaymentMethod: '',
        hotelPaymentDate: '',
        hotelPaymentReceivedBy: '',
        paymentHistory: ''
      }
    }
  );

  console.log('✓ Booking fields cleaned');

  // Remove property owner role from users
  await User.updateMany(
    { role: 'property_owner' },
    { $set: { role: 'user' } }
  );

  await User.updateMany(
    {},
    {
      $unset: {
        ownedProperties: '',
        ownerProfile: '',
        ownerAccountStatus: '',
        ownerAccountCreatedBy: ''
      }
    }
  );

  console.log('✓ User fields cleaned');

  // Remove payment settings from properties
  await Property.updateMany(
    {},
    {
      $unset: {
        paymentSettings: ''
      }
    }
  );

  console.log('✓ Property fields cleaned');

  console.log('\n✅ Cleanup complete!');
  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
```

Run cleanup:
```bash
node scripts/cleanup/remove-owner-system-fields.js
```

### Handle Partial Payment Bookings

If customers made partial payments during rollback period:

```javascript
// scripts/cleanup/fix-partial-payment-bookings.js

const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function fixPartialBookings() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Find all bookings with partial payments
  const partialBookings = await Booking.find({
    paymentType: 'partial',
    paymentStatus: 'partial_paid'
  });

  console.log(`Found ${partialBookings.length} partial payment bookings`);

  for (const booking of partialBookings) {
    console.log(`\nBooking ${booking._id}:`);
    console.log(`  Total: ₹${booking.totalPrice}`);
    console.log(`  Paid: ₹${booking.paidAmount}`);
    console.log(`  Remaining: ₹${booking.remainingAmount}`);

    // Options:
    // 1. Mark as completed (if they paid at hotel)
    // 2. Refund partial payment
    // 3. Contact customer

    // For now, just log - manual decision needed
    console.log(`  ACTION NEEDED: Manual review required`);
  }

  process.exit(0);
}

fixPartialBookings();
```

### Export Affected Bookings

```bash
# Export list of bookings created during owner system period
mongoexport \
  --uri="YOUR_MONGODB_URI" \
  --collection=bookings \
  --query='{"createdAt": {"$gte": {"$date": "2025-12-16T00:00:00.000Z"}}}' \
  --out=affected-bookings.json
```

---

## 📋 ROLLBACK CHECKLIST

Print this and follow step-by-step:

```
ROLLBACK EXECUTION CHECKLIST
Date: __________  Time Started: __________  Executed By: __________

PRE-ROLLBACK
□ Backup current database state
□ Notify team of rollback
□ Document reason for rollback
□ Estimate downtime

ROLLBACK EXECUTION
□ Stop application
□ Restore database from backup
□ Verify backup restoration
□ Switch to previous Git version
□ Restore environment variables
□ Rebuild application
□ Start application

POST-ROLLBACK VERIFICATION
□ Application starts without errors
□ Homepage loads
□ User login works
□ Property search works
□ Booking creation works
□ Payment processing works
□ Admin panel accessible
□ No error spikes in logs

CLEANUP
□ Remove owner system database fields
□ Handle partial payment bookings
□ Export affected bookings for review
□ Update documentation

COMMUNICATION
□ Notify team rollback complete
□ Email affected customers (if any)
□ Post-mortem scheduled

Time Completed: __________  Total Duration: __________

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🔬 POST-MORTEM TEMPLATE

After every rollback, conduct a post-mortem:

```markdown
# Rollback Post-Mortem: [Date]

## Incident Summary
- **Date:**
- **Duration:**
- **Affected Users:**
- **Root Cause:**

## Timeline
- [Time] - Issue first detected
- [Time] - Decision to rollback
- [Time] - Rollback initiated
- [Time] - Rollback completed
- [Time] - System verified operational

## What Went Wrong
1.
2.
3.

## What Went Right
1.
2.
3.

## Root Cause Analysis
### Why did this happen?
-

### Why wasn't it caught in testing?
-

### Why didn't monitoring alert earlier?
-

## Action Items
- [ ] [Action 1 - Owner - Deadline]
- [ ] [Action 2 - Owner - Deadline]
- [ ] [Action 3 - Owner - Deadline]

## Prevention Measures
-
-
-

## Lessons Learned
-
-
-
```

---

## 📞 EMERGENCY CONTACTS

### Technical Team
- **Lead Developer:** [Name] - [Phone] - [Email]
- **Database Admin:** [Name] - [Phone] - [Email]
- **DevOps:** [Name] - [Phone] - [Email]

### Business Team
- **Product Owner:** Anurag Singh - +91 9356547176 - anuragsingh@baithakaghar.com
- **Support Lead:** [Name] - [Phone] - [Email]

### Service Providers
- **MongoDB Atlas Support:** support@mongodb.com
- **Razorpay Support:** +91-80-46669999
- **Vercel Support:** support@vercel.com

---

## 🛡️ PREVENTION BEST PRACTICES

To minimize need for rollbacks:

1. **Always test in staging first**
   - Minimum 3 days of staging testing
   - Test all critical user flows
   - Load testing with realistic data

2. **Gradual rollout**
   - Deploy to 10% of users first
   - Monitor for 24 hours
   - Gradually increase to 100%

3. **Feature flags**
   - Use feature flags for new features
   - Can disable instantly if issues found
   - No code deployment needed

4. **Monitoring alerts**
   - Set up alerts for error spikes
   - Monitor payment success rates
   - Track booking completion rates

5. **Database migrations**
   - Always backwards compatible
   - Use migration scripts, not manual changes
   - Test migration on staging first

---

## 📝 ROLLBACK LOG

Maintain a log of all rollbacks:

| Date | Reason | Duration | Affected Users | Success |
|------|--------|----------|----------------|---------|
| 2025-12-16 | [Example] Payment failures | 45 min | 50 users | Yes |
|  |  |  |  |  |

---

**Remember:** A rollback is not a failure - it's a safety mechanism. The goal is always user satisfaction and data integrity.

---

**Last Updated:** December 16, 2025
**Version:** 1.0
**Document Owner:** Development Team
