# 🎯 Pricing Structure - Simple & Clear Design

## The Simple Logic You Want

### Level 1: BASE PRICE (Default)
**Set once per:** Room Category + Plan + Sharing Type

Example:
```
Deluxe Room + EP + Double = ₹5,000
Deluxe Room + CP + Double = ₹6,000
Deluxe Room + MAP + Double = ₹7,000
Suite Room + EP + Single = ₹8,000
```

This is the **default price** that applies to all dates unless overridden.

---

### Level 2: PLAN-BASED PRICING (Excel Import)
**Updates:** Specific date ranges with bulk pricing

Example Excel:
```
Category  | Plan | Sharing | Start Date  | End Date    | Price
----------|------|---------|-------------|-------------|-------
Deluxe    | EP   | DOUBLE  | 2025-12-20  | 2025-12-31  | 8,000
Deluxe    | CP   | DOUBLE  | 2025-12-20  | 2025-12-31  | 9,000
Suite     | EP   | SINGLE  | 2025-12-20  | 2025-12-31  | 12,000
```

This **overrides base price** for those specific date ranges.

---

### Level 3: DIRECT PRICING (Manual Override)
**Updates:** Specific dates with exact pricing

Example:
```
Date: 2025-12-31
Category: Deluxe
Plan: EP
Sharing: Double
Price: ₹15,000
```

This **overrides everything** for that specific date.

---

## Priority Order (What Gets Applied)

```
1. Direct Pricing (Highest Priority)
   ↓ If not found, check...

2. Plan-Based Pricing (Date Range)
   ↓ If not found, check...

3. Base Price (Default)
```

---

## Data Structure

### PropertyPricing Collection (Unified)

```javascript
{
  _id: ObjectId,
  propertyId: "68ded9c16e52d7dcaa2dd843",
  roomCategory: "deluxe",      // Room category
  planType: "EP",               // EP, CP, MAP, AP
  occupancyType: "DOUBLE",      // SINGLE, DOUBLE, TRIPLE, QUAD
  price: 7400,

  // Date range (for base, use far future dates)
  startDate: ISODate("2025-01-01"),
  endDate: ISODate("2026-12-31"),

  // Priority level
  pricingType: "BASE",          // BASE, PLAN_BASED, DIRECT

  // Metadata
  seasonType: "regular",
  reason: "Base pricing",
  isActive: true,
  createdAt: ISODate("2025-01-07"),
  updatedAt: ISODate("2025-01-07")
}
```

### Pricing Types:

1. **BASE** - Default pricing (broad date range like 2025-2026)
2. **PLAN_BASED** - Excel imported pricing (specific date ranges)
3. **DIRECT** - Manual overrides (specific dates)

---

## Admin Forms

### Form 1: Base Price Setup
**Purpose:** Set default prices for all combinations

**UI:**
```
Property: BAITHAKA GHAR CRESCENT RESORT

Room Categories:
┌─────────────────────────────────────────────────────────┐
│ Deluxe Room                                             │
│ ─────────────────────────────────────────────────────── │
│ Plan          | Single | Double | Triple | Quad         │
│ ─────────────────────────────────────────────────────── │
│ EP (Room Only)      5000    5000    5000    5000       │
│ CP (+ Breakfast)    6000    6000    6000    6000       │
│ MAP (+ 2 Meals)     7000    7000    7000    7000       │
│ AP (All Meals)      8000    8000    8000    8000       │
└─────────────────────────────────────────────────────────┘

[Save Base Prices]
```

**What it does:**
- Creates entries with `pricingType: "BASE"`
- Date range: 2025-01-01 to 2026-12-31 (or indefinite)
- Applies to all dates unless overridden

---

### Form 2: Plan-Based Pricing (Excel Import)
**Purpose:** Bulk update prices for date ranges

**UI:**
```
Upload Excel File:
[Choose File] [Upload]

Excel Format:
─────────────────────────────────────────────────────────
Category | Plan | Sharing | Start Date | End Date | Price
─────────────────────────────────────────────────────────
Deluxe   | EP   | DOUBLE  | 2025-12-20 | 2025-12-31 | 8000
Deluxe   | CP   | DOUBLE  | 2025-12-20 | 2025-12-31 | 9000
Suite    | EP   | SINGLE  | 2025-12-20 | 2025-12-31 | 12000
─────────────────────────────────────────────────────────

Preview:
✓ 3 entries will be updated
✓ Date range: 2025-12-20 to 2025-12-31
✓ Categories: Deluxe, Suite
✓ Plans: EP, CP

[Confirm Import]
```

**What it does:**
- Creates/updates entries with `pricingType: "PLAN_BASED"`
- Specific date ranges from Excel
- Overrides BASE prices for those dates

---

### Form 3: Direct Pricing (Manual Override)
**Purpose:** Set exact price for specific dates

**UI:**
```
Select Dates: [Calendar]
Selected: Dec 31, 2025

Room Category: [Deluxe ▼]
Plan Type:     [EP - Room Only ▼]
Occupancy:     [Double Sharing ▼]

Price: ₹ [15000]

Reason: [New Year Special Event]

[Save Direct Price]

Current Overrides:
─────────────────────────────────────────────────────────
Date       | Category | Plan | Sharing | Price  | Reason
─────────────────────────────────────────────────────────
2025-12-31 | Deluxe   | EP   | DOUBLE  | 15,000 | New Year
2025-08-15 | Suite    | CP   | SINGLE  | 12,000 | Festival
─────────────────────────────────────────────────────────
```

**What it does:**
- Creates entries with `pricingType: "DIRECT"`
- Specific date (startDate = endDate)
- Highest priority - overrides everything

---

## API Query Logic

### Pricing Query API (`/api/pricing/query`)

**Request:**
```json
{
  "propertyId": "68ded9c16e52d7dcaa2dd843",
  "roomCategory": "deluxe",
  "planType": "EP",
  "occupancyType": "DOUBLE",
  "checkInDate": "2025-12-31",
  "checkOutDate": "2026-01-02"
}
```

**Query Logic:**
```javascript
// For each date in range
for (const date of dateRange) {

  // 1. Try DIRECT pricing (exact date)
  const directPrice = await PropertyPricing.findOne({
    propertyId,
    roomCategory,
    planType,
    occupancyType,
    pricingType: "DIRECT",
    startDate: { $lte: date },
    endDate: { $gte: date },
    isActive: true
  }).sort({ updatedAt: -1 })

  if (directPrice) {
    prices.push(directPrice.price)
    continue
  }

  // 2. Try PLAN_BASED pricing (date range)
  const planPrice = await PropertyPricing.findOne({
    propertyId,
    roomCategory,
    planType,
    occupancyType,
    pricingType: "PLAN_BASED",
    startDate: { $lte: date },
    endDate: { $gte: date },
    isActive: true
  }).sort({ updatedAt: -1 })

  if (planPrice) {
    prices.push(planPrice.price)
    continue
  }

  // 3. Use BASE pricing (default)
  const basePrice = await PropertyPricing.findOne({
    propertyId,
    roomCategory,
    planType,
    occupancyType,
    pricingType: "BASE",
    isActive: true
  })

  prices.push(basePrice?.price || fallbackPrice)
}

return {
  pricePerNight: average(prices),
  totalPrice: sum(prices),
  breakdown: prices // Daily breakdown
}
```

---

## Database Schema Changes

### Add pricingType Field

```javascript
// Migration script
db.propertypricings.updateMany(
  { pricingType: { $exists: false } },
  { $set: { pricingType: "BASE" } }
)

// Add index
db.propertypricings.createIndex({
  propertyId: 1,
  roomCategory: 1,
  planType: 1,
  occupancyType: 1,
  pricingType: 1,
  startDate: 1,
  endDate: 1
})
```

---

## Implementation Steps

### Step 1: Update Database Schema
- [ ] Add `pricingType` field to PropertyPricing
- [ ] Set existing entries to "BASE"
- [ ] Add indexes for performance

### Step 2: Update Base Price Form
- [ ] Add plan and sharing selection
- [ ] Create grid UI (Plan × Sharing)
- [ ] Save as pricingType: "BASE"

### Step 3: Update Excel Import
- [ ] Update Excel template
- [ ] Add column validation
- [ ] Save as pricingType: "PLAN_BASED"

### Step 4: Update Direct Pricing
- [ ] Add category/plan/sharing selectors
- [ ] Save as pricingType: "DIRECT"
- [ ] Single date entry

### Step 5: Update API
- [ ] Implement priority-based query
- [ ] Return daily price breakdown
- [ ] Handle all three types

### Step 6: Update Frontend
- [ ] Display correct prices
- [ ] Show pricing breakdown
- [ ] Update booking flow

---

## Example Scenarios

### Scenario 1: Normal Day
```
Date: 2025-06-15
Category: Deluxe
Plan: EP
Sharing: Double

Query Order:
1. DIRECT for 2025-06-15? → Not found
2. PLAN_BASED for 2025-06-15? → Not found
3. BASE → Found: ₹5,000

Result: ₹5,000
```

### Scenario 2: Peak Season (Excel)
```
Date: 2025-12-25
Category: Deluxe
Plan: EP
Sharing: Double

Query Order:
1. DIRECT for 2025-12-25? → Not found
2. PLAN_BASED for 2025-12-25? → Found: ₹8,000
3. BASE → Not checked

Result: ₹8,000
```

### Scenario 3: Special Event (Direct)
```
Date: 2025-12-31
Category: Deluxe
Plan: EP
Sharing: Double

Query Order:
1. DIRECT for 2025-12-31? → Found: ₹15,000
2. PLAN_BASED → Not checked
3. BASE → Not checked

Result: ₹15,000
```

---

## Benefits of This Structure

✅ **Simple & Clear**: 3 levels, easy to understand
✅ **Flexible**: Can update at any level
✅ **Performant**: Single collection with indexes
✅ **Traceable**: Know which pricing type is applied
✅ **Bulk Operations**: Excel import for ranges
✅ **Manual Override**: Direct pricing for special dates
✅ **Default Fallback**: Base pricing always available

---

## Next Steps

1. Implement database migration
2. Update base price form
3. Update Excel import logic
4. Update direct pricing form
5. Rewrite pricing query API
6. Update frontend display
7. Test all scenarios

---

**Status:** 📋 Design Complete - Ready for Implementation

---
