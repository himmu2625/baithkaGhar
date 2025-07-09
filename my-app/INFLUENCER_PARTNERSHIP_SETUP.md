# Influencer Partnership System - Setup & Usage Guide

## 🎯 Overview

This influencer partnership system enables your hotel booking platform to work with influencers through referral tracking, commission management, and automated payouts. Everything is controlled via the admin panel - no influencer login required.

## 🔧 Installation & Setup

### 1. Database Migration

Run the following to ensure your database has the necessary indexes:

```javascript
// MongoDB Shell Commands
use your_database_name;

// Create indexes for optimal performance
db.influencers.createIndex({ "referralCode": 1 }, { unique: true });
db.influencers.createIndex({ "status": 1, "createdAt": -1 });
db.influencers.createIndex({ "email": 1 }, { unique: true });

db.referralclicks.createIndex({ "influencerId": 1, "clickedAt": -1 });
db.referralclicks.createIndex({ "sessionId": 1 });
db.referralclicks.createIndex({ "conversionStatus": 1, "influencerId": 1 });

db.payouts.createIndex({ "influencerId": 1, "status": 1 });
db.payouts.createIndex({ "status": 1, "requestedAt": -1 });

db.bookings.createIndex({ "influencerId": 1, "createdAt": -1 });
db.bookings.createIndex({ "commissionPaid": 1, "influencerId": 1 });
```

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Influencer System Configuration
ENABLE_INFLUENCER_SYSTEM=true
CRON_SECRET=your-super-secure-cron-secret-key
INFLUENCER_MIN_PAYOUT=100
INFLUENCER_TDS_RATE=0.10

# Email notifications (optional)
INFLUENCER_EMAIL_NOTIFICATIONS=true
ADMIN_EMAIL=admin@yourhotel.com
```

### 3. Update Booking Integration

Modify your booking creation API to integrate with influencer tracking:

```typescript
// In your booking creation API (e.g., /api/bookings/create)
import { InfluencerService } from "@/lib/services/influencer-service";

export async function POST(request: NextRequest) {
  // ... existing booking logic ...

  // After successful booking creation
  if (newBooking) {
    // Check for active referral session
    const referralData = await InfluencerService.checkReferralSession(
      request.cookies
    );

    if (referralData) {
      // Apply commission to booking
      await InfluencerService.applyCommissionToBooking(
        newBooking._id,
        newBooking.totalPrice,
        referralData,
        request.cookies.get("referral_session_id")?.value
      );

      console.log(
        `Applied influencer commission for booking ${newBooking._id}`
      );
    }
  }

  // ... rest of the logic ...
}
```

### 4. Frontend Integration

Add referral tracking to your main layout component:

```typescript
// components/ReferralTracker.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");

    if (refCode) {
      // Track the referral click
      fetch("/api/referrals/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: refCode,
          landingPage: window.location.href,
          sourcePage: document.referrer || undefined,
          utmParams: {
            source: searchParams.get("utm_source") || undefined,
            medium: searchParams.get("utm_medium") || undefined,
            campaign: searchParams.get("utm_campaign") || undefined,
          },
        }),
      }).catch(console.error);
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}

// Add to your app/layout.tsx
import ReferralTracker from "@/components/ReferralTracker";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReferralTracker />
        {children}
      </body>
    </html>
  );
}
```

## 🚀 Usage Guide

### Admin Panel Access

Navigate to `/admin/influencers` and `/admin/payouts` to manage the system.

### Creating Influencers

1. Go to **Admin Panel > Influencers**
2. Click **"Add Influencer"**
3. Fill in details:
   - Name, Email, Platform (YouTube, Instagram, etc.)
   - Handle/Username
   - Commission Type: Percentage or Fixed Amount
   - Commission Rate
   - Referral Code (auto-generated or custom)

### Commission Types

- **Percentage**: 1-50% of booking amount
- **Fixed**: Fixed amount per booking (₹100, ₹500, etc.)

### Referral Link Format

Influencers share links like:

- `https://yoursite.com?ref=TRAVEL2024`
- `https://yoursite.com/cities/goa?ref=INFLUENCER123`

### Payout Management

1. **Automatic Monthly**: Cron job creates payouts on 1st of each month
2. **Manual Creation**:
   - Go to **Payouts > Create Payout**
   - Choose "Generate for All" or specific influencer
   - Select date range
3. **Processing Payments**:
   - View pending payouts
   - Mark as paid with transaction ID
   - System updates influencer wallet balance

### Analytics & Reporting

Each influencer profile shows:

- Total clicks and bookings
- Conversion rate
- Revenue generated
- Commission earned
- Recent activity

## 🔄 Automation Setup

### Vercel Cron (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-payouts",
      "schedule": "0 9 1 * *"
    }
  ]
}
```

### GitHub Actions Alternative

Create `.github/workflows/monthly-payouts.yml`:

```yaml
name: Monthly Payout Processing
on:
  schedule:
    - cron: "0 9 1 * *" # 1st day of month at 9 AM UTC

jobs:
  process-payouts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Payout Processing
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/process-payouts \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               -H "Content-Type: application/json"
```

### External Cron Services

Services like cron-job.org or EasyCron can hit your endpoint:

- URL: `https://yoursite.com/api/cron/process-payouts`
- Method: POST
- Header: `Authorization: Bearer your-cron-secret`
- Schedule: Monthly (1st day)

## 🔐 Security Considerations

1. **Admin-Only Access**: All influencer APIs require admin authentication
2. **Referral Validation**: Codes are validated and expired after 30 days
3. **Commission Limits**: Max 50% commission rate enforced
4. **Payout Verification**: Manual approval required before payments
5. **Audit Trail**: All activities logged with timestamps

## 📊 Key Metrics

Monitor these metrics in your admin dashboard:

- **Active Influencers**: Currently active partnerships
- **Conversion Rates**: Clicks to booking ratios
- **Average Order Value**: Revenue per booking
- **Top Performers**: Best converting influencers
- **Monthly Payouts**: Commission amounts processed

## 🛠️ Troubleshooting

### Common Issues

1. **Referral Not Tracking**

   - Check if referral code exists and is active
   - Verify cookies are enabled
   - Ensure middleware is running

2. **Commission Not Applied**

   - Check booking integration code
   - Verify influencer status is 'active'
   - Look for console logs during booking

3. **Payouts Not Creating**
   - Ensure bookings have `commissionPaid: false`
   - Check minimum payout threshold (₹100)
   - Verify cron job authorization

### Debug Endpoints

- `GET /api/cron/process-payouts` - Check cron health
- `GET /api/referrals/track?code=TESTCODE` - Validate referral code

## 📈 Performance Optimization

1. **Database Indexes**: Ensure all recommended indexes are created
2. **Caching**: Redis cache for frequently accessed influencer data
3. **Batch Processing**: Process payouts in batches for large influencer counts
4. **Image Optimization**: Optimize influencer profile images

## 🔄 Future Enhancements

Planned features:

- Influencer dashboard (optional portal)
- Advanced analytics with charts
- Automated email notifications
- Integration with payment gateways
- Multi-tier commission structures
- Seasonal campaign management

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review server logs for errors
3. Test with debug endpoints
4. Verify environment configuration

---

**Note**: This system is designed for admin-only control. Influencers don't need accounts - they simply share referral links and receive payments through your existing process.
