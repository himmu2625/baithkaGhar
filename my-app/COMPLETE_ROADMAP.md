# 🗺️ Complete Implementation Roadmap
## Baithaka GHAR - Plan-Based Pricing System

**Last Updated:** 2025-10-04
**Current Status:** 40% Complete (8/20 steps done)
**Server Status:** ✅ Running on http://localhost:3000

---

## 📋 PHASE 1: IMMEDIATE PRIORITIES (Week 1)
**Goal:** Ensure system is production-ready and bug-free

### ✅ Task 1.1: Complete End-to-End System Testing (Day 1-2)
**Priority:** 🔴 CRITICAL
**Estimated Time:** 8-12 hours
**Status:** ⏳ IN PROGRESS

#### Checklist:
- [ ] **Setup Test Property**
  ```bash
  cd "C:\Users\Lenovo\Desktop\Baithaka GHAR website\my-app"
  $env:MONGODB_URI="mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/"
  node scripts/setup-plan-based-test-property.cjs
  ```

- [ ] **Test 1: Property Display**
  - [ ] Navigate to property page
  - [ ] Verify pricing matrix displays all plan types (EP, CP, MAP, AP)
  - [ ] Check all occupancy types (SINGLE, DOUBLE, TRIPLE, QUAD)
  - [ ] Test on Desktop (Chrome, Firefox, Safari)
  - [ ] Test on Mobile (iOS Safari, Android Chrome)
  - [ ] Screenshot results for documentation

- [ ] **Test 2: Search & Filter**
  - [ ] Test plan type filter (EP, CP, MAP, AP)
  - [ ] Test occupancy filter (SINGLE, DOUBLE, etc.)
  - [ ] Verify results update correctly
  - [ ] Check "No results" state
  - [ ] Test filter combinations

- [ ] **Test 3: Booking Flow**
  - [ ] Select property with plan-based pricing
  - [ ] Choose plan type and occupancy
  - [ ] Add guests (verify count matches occupancy)
  - [ ] Calculate total price (verify calculation)
  - [ ] Complete payment (test mode)
  - [ ] Verify booking confirmation page
  - [ ] Check booking appears in admin panel

- [ ] **Test 4: Analytics Dashboard**
  - [ ] Navigate to `/admin/analytics/plan-based`
  - [ ] Verify revenue by plan chart renders
  - [ ] Check booking count by plan
  - [ ] Test date range filter
  - [ ] Verify data accuracy against database

- [ ] **Test 5: Invoice Generation**
  - [ ] Open booking details
  - [ ] Generate invoice
  - [ ] Verify plan details show correctly
  - [ ] Check pricing breakdown
  - [ ] Test PDF download
  - [ ] Verify GST calculation

- [ ] **Test 6: Email Notifications**
  - [ ] Verify booking confirmation email
  - [ ] Check plan details in email
  - [ ] Test invoice attachment
  - [ ] Verify email to property owner
  - [ ] Test reminder emails

#### Documentation:
```markdown
Create: TESTING_REPORT.md
- Document all test results
- Include screenshots
- Note any bugs found
- Performance metrics
```

---

### 🐛 Task 1.2: Fix All Bugs Found During Testing (Day 2-3)
**Priority:** 🔴 CRITICAL
**Estimated Time:** 8-16 hours
**Status:** ⏸️ PENDING (depends on Task 1.1)

#### Common Issues to Watch For:
1. **TypeScript Errors**
   - [ ] Run: `npx tsc --noEmit`
   - [ ] Fix all type mismatches
   - [ ] Update interfaces/types

2. **UI/UX Issues**
   - [ ] Pricing matrix overflow on mobile
   - [ ] Filter dropdown positioning
   - [ ] Button click states
   - [ ] Loading states
   - [ ] Error messages

3. **Data Issues**
   - [ ] Null/undefined price handling
   - [ ] Missing plan types
   - [ ] Incorrect calculations
   - [ ] Date range bugs

4. **Performance Issues**
   - [ ] Slow pricing queries
   - [ ] Heavy re-renders
   - [ ] Large bundle sizes
   - [ ] Image optimization

#### Bug Fix Process:
```bash
# 1. Create bug fix branch
git checkout -b fix/critical-bugs

# 2. Fix issues one by one
# 3. Test each fix

# 4. Commit fixes
git add .
git commit -m "fix: [description]"

# 5. Merge to master
git checkout master
git merge fix/critical-bugs
```

---

### 📱 Task 1.3: Mobile Responsive Testing (Day 3-4)
**Priority:** 🟠 HIGH
**Estimated Time:** 6-8 hours
**Status:** ❌ NOT STARTED

#### Test Devices:
- [ ] iPhone 12/13/14 (Safari)
- [ ] iPhone SE (small screen)
- [ ] iPad (tablet view)
- [ ] Android Phone (Chrome)
- [ ] Android Tablet

#### Areas to Test:
1. **Pricing Matrix**
   - [ ] Horizontal scroll works
   - [ ] Touch targets are 44px minimum
   - [ ] Text is readable
   - [ ] Consider collapsible view for mobile

2. **Filter Sidebar**
   - [ ] Convert to drawer on mobile
   - [ ] Smooth animations
   - [ ] Easy to close
   - [ ] Doesn't block content

3. **Booking Flow**
   - [ ] Form inputs are accessible
   - [ ] Date picker works well
   - [ ] Payment form is mobile-optimized
   - [ ] Confirmation page is readable

4. **Analytics Dashboard**
   - [ ] Charts resize properly
   - [ ] Tables are scrollable
   - [ ] Export buttons are accessible
   - [ ] Data loads efficiently

#### Implementation:
```tsx
// Example: Make pricing matrix mobile responsive
// In components/property/PlanPricingMatrix.tsx

<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  <table className="min-w-full md:min-w-0">
    {/* Pricing matrix content */}
  </table>
</div>
```

---

## 📊 PHASE 2: CORE ENHANCEMENTS (Week 2-3)
**Goal:** Add essential missing features

### 🔍 Task 2.1: Backend Search Filtering (Day 5-6)
**Priority:** 🟠 HIGH
**Estimated Time:** 4-6 hours
**Status:** ❌ NOT STARTED

#### Implementation Steps:
1. **Update API Route**
   ```typescript
   // File: app/api/properties/route.ts

   export async function GET(req: NextRequest) {
     const { searchParams } = new URL(req.url)

     const planType = searchParams.get('planType')
     const occupancyType = searchParams.get('occupancyType')
     const minPrice = searchParams.get('minPrice')
     const maxPrice = searchParams.get('maxPrice')

     const query: any = { isActive: true }

     // Filter by plan type
     if (planType && planType !== 'all') {
       query['propertyUnits.planBasedPricing.planType'] = planType
     }

     // Filter by occupancy
     if (occupancyType && occupancyType !== 'all') {
       query['propertyUnits.planBasedPricing.occupancyType'] = occupancyType
     }

     // Price range filter
     if (minPrice || maxPrice) {
       query['propertyUnits.planBasedPricing.price'] = {}
       if (minPrice) query['propertyUnits.planBasedPricing.price'].$gte = parseFloat(minPrice)
       if (maxPrice) query['propertyUnits.planBasedPricing.price'].$lte = parseFloat(maxPrice)
     }

     const properties = await Property.find(query)
       .populate('city')
       .lean()

     return NextResponse.json({ success: true, properties })
   }
   ```

2. **Add Database Indexes**
   ```javascript
   // File: scripts/add-search-indexes.cjs

   const indexes = [
     { 'propertyUnits.planBasedPricing.planType': 1 },
     { 'propertyUnits.planBasedPricing.occupancyType': 1 },
     { 'propertyUnits.planBasedPricing.price': 1 },
     {
       'propertyUnits.planBasedPricing.planType': 1,
       'propertyUnits.planBasedPricing.occupancyType': 1,
       'propertyUnits.planBasedPricing.price': 1
     }
   ]
   ```

3. **Update Frontend to Use New API**
   ```typescript
   // File: components/search/PlanFilters.tsx

   const searchProperties = async () => {
     const params = new URLSearchParams({
       planType,
       occupancyType,
       minPrice: minPrice.toString(),
       maxPrice: maxPrice.toString()
     })

     const res = await fetch(`/api/properties?${params}`)
     const data = await res.json()
     setProperties(data.properties)
   }
   ```

#### Testing:
- [ ] Test each filter individually
- [ ] Test filter combinations
- [ ] Verify database query performance
- [ ] Check edge cases (no results, all filters)

---

### 📊 Task 2.2: Add Export Functionality (Day 7-8)
**Priority:** 🟠 HIGH
**Estimated Time:** 6-8 hours
**Status:** ❌ NOT STARTED

#### File Structure:
```
lib/
  utils/
    export/
      csv-exporter.ts
      pdf-exporter.ts
      json-exporter.ts
components/
  reports/
    ExportButton.tsx
```

#### Implementation:

**1. CSV Export**
```typescript
// File: lib/utils/export/csv-exporter.ts

export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
}
```

**2. PDF Export**
```typescript
// File: lib/utils/export/pdf-exporter.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToPDF = (data: any[], title: string) => {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(title, 14, 20)

  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map(row => Object.values(row)),
    startY: 30
  })

  doc.save(`${title}.pdf`)
}
```

**3. Export Button Component**
```typescript
// File: components/reports/ExportButton.tsx

export function ExportButton({ data, filename }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportToCSV(data, filename)}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(data, filename)}>
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, filename)}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**4. Add to Reports**
```tsx
// Update: app/admin/analytics/plan-based/page.tsx

<div className="flex justify-between items-center">
  <h1>Plan-Based Revenue Report</h1>
  <ExportButton
    data={reportData}
    filename="plan-based-revenue"
  />
</div>
```

#### Testing:
- [ ] Test CSV export with various data
- [ ] Verify PDF formatting
- [ ] Test large datasets
- [ ] Check file downloads

---

### 💰 Task 2.3: Dynamic Pricing Per Plan (Day 9-11)
**Priority:** 🟡 MEDIUM
**Estimated Time:** 12-16 hours
**Status:** ❌ NOT STARTED

#### Features to Implement:
1. **Weekend Pricing Multipliers**
2. **Seasonal Pricing**
3. **Peak Period Surcharges**
4. **Last-Minute Discounts**

#### Database Schema Update:
```typescript
// File: models/Property.ts

interface DynamicPricingRule {
  name: string
  type: 'multiplier' | 'fixed_amount' | 'percentage'
  condition: {
    dayOfWeek?: number[] // 0-6 (Sun-Sat)
    dateRange?: {
      start: Date
      end: Date
    }
    daysBeforeCheckIn?: number
  }
  adjustment: {
    EP?: number
    CP?: number
    MAP?: number
    AP?: number
  }
}

const PropertySchema = new Schema({
  // ... existing fields
  dynamicPricingRules: [DynamicPricingRuleSchema]
})
```

#### Implementation:
```typescript
// File: lib/services/dynamic-pricing-calculator.ts

export async function calculateDynamicPrice(
  basePrice: number,
  planType: PlanType,
  checkInDate: Date,
  bookingDate: Date,
  rules: DynamicPricingRule[]
): Promise<number> {
  let finalPrice = basePrice

  for (const rule of rules) {
    if (isRuleApplicable(rule, checkInDate, bookingDate)) {
      const adjustment = rule.adjustment[planType] || 1

      switch (rule.type) {
        case 'multiplier':
          finalPrice *= adjustment
          break
        case 'percentage':
          finalPrice *= (1 + adjustment / 100)
          break
        case 'fixed_amount':
          finalPrice += adjustment
          break
      }
    }
  }

  return Math.round(finalPrice)
}

function isRuleApplicable(
  rule: DynamicPricingRule,
  checkInDate: Date,
  bookingDate: Date
): boolean {
  // Check day of week
  if (rule.condition.dayOfWeek) {
    const day = checkInDate.getDay()
    if (!rule.condition.dayOfWeek.includes(day)) return false
  }

  // Check date range
  if (rule.condition.dateRange) {
    const { start, end } = rule.condition.dateRange
    if (checkInDate < start || checkInDate > end) return false
  }

  // Check days before check-in
  if (rule.condition.daysBeforeCheckIn) {
    const daysUntilCheckIn = Math.floor(
      (checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilCheckIn > rule.condition.daysBeforeCheckIn) return false
  }

  return true
}
```

#### Admin UI:
```tsx
// File: app/admin/properties/[id]/dynamic-pricing/page.tsx

export default function DynamicPricingPage() {
  return (
    <div className="space-y-6">
      <h1>Dynamic Pricing Rules</h1>

      <Card>
        <CardHeader>
          <CardTitle>Weekend Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <Form>
            <FormField label="Days">
              <MultiSelect options={DAYS_OF_WEEK} />
            </FormField>
            <FormField label="EP Multiplier">
              <Input type="number" step="0.1" />
            </FormField>
            <FormField label="CP Multiplier">
              <Input type="number" step="0.1" />
            </FormField>
            {/* ... other plan types */}
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seasonal Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date range picker + pricing adjustments */}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### Testing:
- [ ] Test weekend pricing
- [ ] Verify seasonal adjustments
- [ ] Check last-minute discounts
- [ ] Test rule combinations
- [ ] Performance test with multiple rules

---

## 🚀 PHASE 3: ADVANCED FEATURES (Week 4-6)

### 📈 Task 3.1: Advanced Analytics Dashboard (Day 12-15)
**Priority:** 🟡 MEDIUM
**Estimated Time:** 16-20 hours
**Status:** ❌ NOT STARTED

#### Features:
1. **Revenue Forecasting**
2. **Trend Analysis**
3. **Competitor Benchmarking**
4. **AI-Powered Recommendations**

#### Implementation:
```typescript
// File: lib/services/analytics/forecast.ts

export async function forecastRevenue(
  propertyId: string,
  months: number = 3
): Promise<ForecastData> {
  // Get historical data
  const history = await getBookingHistory(propertyId, 12) // Last 12 months

  // Simple moving average forecast
  const avgGrowthRate = calculateGrowthRate(history)
  const lastMonthRevenue = history[history.length - 1].revenue

  const forecast = []
  for (let i = 1; i <= months; i++) {
    forecast.push({
      month: addMonths(new Date(), i),
      predictedRevenue: lastMonthRevenue * Math.pow(1 + avgGrowthRate, i),
      confidence: calculateConfidence(history, i)
    })
  }

  return { history, forecast }
}
```

#### Dashboard UI:
```tsx
// File: app/admin/analytics/advanced/page.tsx

export default function AdvancedAnalytics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast (Next 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={forecastData} />
        </CardContent>
      </Card>

      {/* Plan Popularity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Popularity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart data={trendData} />
        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Pricing Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={competitorData} />
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map(rec => (
              <li key={rec.id} className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {rec.description}
                  </p>
                  <p className="text-sm text-green-600">
                    Potential increase: {rec.potentialIncrease}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 🎁 Task 3.2: Package Deals & Promotions (Day 16-18)
**Priority:** 🟡 MEDIUM
**Estimated Time:** 12-16 hours
**Status:** ❌ NOT STARTED

#### Schema:
```typescript
// File: models/Package.ts

interface Package {
  name: string
  description: string
  propertyId: ObjectId
  roomCategory: string
  planType: PlanType
  addOns: {
    type: 'spa' | 'dining' | 'activity' | 'transport'
    name: string
    price: number
  }[]
  totalPrice: number
  discount: number
  validFrom: Date
  validTo: Date
  maxBookings?: number
  isActive: boolean
}
```

#### Implementation:
Create full CRUD for packages with booking integration.

---

### 🎯 Task 3.3: Guest Preferences & Recommendations (Day 19-21)
**Priority:** 🟡 MEDIUM
**Estimated Time:** 12-16 hours
**Status:** ❌ NOT STARTED

#### Features:
- Save favorite meal plans
- Recommend based on history
- "Users who booked MAP also booked..."

---

## 🔧 PHASE 4: TECHNICAL IMPROVEMENTS (Week 7-8)

### 📊 Task 4.1: Monitoring & Error Tracking (Day 22-24)
**Priority:** 🟠 HIGH
**Estimated Time:** 8-12 hours
**Status:** ❌ NOT STARTED

#### Services to Integrate:
1. **Sentry** - Error tracking
2. **Vercel Analytics** - Performance
3. **Google Analytics** - User behavior
4. **LogRocket** - Session replay

#### Implementation:
```typescript
// File: lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
})

// Track custom events
export function trackPlanSelection(planType: PlanType) {
  Sentry.addBreadcrumb({
    category: 'booking',
    message: `User selected plan: ${planType}`,
    level: 'info'
  })
}
```

---

### 🧪 Task 4.2: Comprehensive Test Suite (Day 25-28)
**Priority:** 🟠 HIGH
**Estimated Time:** 16-20 hours
**Status:** ❌ NOT STARTED

#### Test Coverage:
1. Unit tests for pricing calculator
2. Integration tests for APIs
3. Component tests with React Testing Library
4. E2E tests with Playwright

#### Implementation:
```typescript
// File: __tests__/pricing-calculator.test.ts
import { calculateBookingPrice } from '@/lib/services/pricing-calculator'

describe('Pricing Calculator', () => {
  it('calculates EP price correctly', async () => {
    const result = await calculateBookingPrice({
      propertyId: 'test-id',
      planType: 'EP',
      occupancyType: 'DOUBLE',
      checkInDate: new Date('2025-01-15'),
      checkOutDate: new Date('2025-01-17'),
      guests: 2
    })

    expect(result.basePrice).toBe(5000)
    expect(result.totalNights).toBe(2)
    expect(result.totalPrice).toBe(10000)
  })

  it('applies dynamic pricing rules', async () => {
    // Weekend pricing test
  })
})
```

---

### 📚 Task 4.3: Documentation & Help Center (Day 29-30)
**Priority:** 🟡 MEDIUM
**Estimated Time:** 8-12 hours
**Status:** ❌ NOT STARTED

#### Content to Create:
1. Property owner guide
2. Video tutorials
3. API documentation
4. Troubleshooting guide

---

## 🌟 PHASE 5: LONG-TERM VISION (Month 3-6)

### 🏨 Task 5.1: Multi-Property Group Management (Month 3)
**Estimated Time:** 40-60 hours
**Status:** ❌ NOT STARTED

Features:
- Pricing templates
- Bulk updates
- Group analytics

### 💼 Task 5.2: Revenue Management System (Month 4)
**Estimated Time:** 60-80 hours
**Status:** ❌ NOT STARTED

Features:
- Yield management
- Overbooking protection
- Automated repricing

### 📱 Task 5.3: Mobile Native Apps (Month 5)
**Estimated Time:** 80-120 hours
**Status:** ❌ NOT STARTED

Tech Stack:
- React Native
- Expo
- Native modules

### 🔌 Task 5.4: Public API (Month 6)
**Estimated Time:** 40-60 hours
**Status:** ❌ NOT STARTED

Features:
- REST API
- GraphQL
- Webhooks
- API documentation

---

## 📊 PROGRESS TRACKING

### Current Sprint (Week 1)
- [ ] Task 1.1: System Testing
- [ ] Task 1.2: Bug Fixes
- [ ] Task 1.3: Mobile Testing

### Blockers
None currently

### Dependencies
- Task 1.2 depends on Task 1.1
- All Phase 2+ tasks depend on Phase 1 completion

### Success Metrics
- 100% test coverage for critical paths
- Page load time < 3s
- Mobile responsiveness score > 90
- Zero critical bugs in production

---

## 📝 NOTES

### Daily Standup Format
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers?

### Git Workflow
```bash
# Feature branch
git checkout -b feature/task-name

# Regular commits
git add .
git commit -m "feat: description"

# Merge to master
git checkout master
git merge feature/task-name
git push origin master
```

### Deployment Checklist
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Performance metrics acceptable
- [ ] Security audit passed
- [ ] Documentation updated

---

**Next Action:** Start Task 1.1 - Complete End-to-End System Testing
