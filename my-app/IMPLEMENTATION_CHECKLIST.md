# 🎯 Plan-Based Pricing System - Implementation Checklist

## ✅ COMPLETED (Already Done)

### Backend Changes
- [x] **Updated PropertyPricing Model** (`models/PropertyPricing.ts`)
  - Added `pricingType` field (DIRECT | PLAN_BASED | BASE)
  - Added `reason` field for notes
  - Updated indexes for optimal queries

- [x] **Enhanced Pricing Query API** (`app/api/pricing/query/route.ts`)
  - Daily price calculation with breakdown
  - 4-tier pricing priority: DIRECT → PLAN_BASED → BASE → FALLBACK
  - Removed authentication requirement for public access
  - Returns detailed pricing breakdown per day

- [x] **Created Plan Pricing API** (`app/api/admin/properties/[id]/plan-pricing/route.ts`)
  - GET: Fetch plan-based pricing entries
  - POST: Create single pricing entry
  - PUT: Bulk update pricing entries
  - DELETE: Remove pricing entries

- [x] **Created Direct Pricing API** (`app/api/admin/properties/[id]/direct-pricing/route.ts`)
  - GET: Fetch direct pricing overrides
  - POST: Create date-specific pricing
  - PUT: Update existing override
  - DELETE: Remove override

- [x] **Updated Excel Import** (`app/api/pricing/import/route.ts`)
  - Support for `pricingType` field
  - Support for `reason` field
  - Updated template with new structure

### Frontend Components
- [x] **PlanOccupancyGrid Component** (`components/ui/plan-occupancy-grid.tsx`)
  - Grid interface for managing pricing across plans and occupancy types
  - Bulk save functionality
  - "Apply to All" feature per plan type

- [x] **DirectPricingForm Component** (`components/ui/direct-pricing-form.tsx`)
  - CRUD operations for date-specific pricing
  - Room category, plan, and occupancy selectors
  - Date range picker with reason field

- [x] **Updated PricingSection** (`components/property/PricingSection.tsx`)
  - Uses new API response structure
  - Handles `averagePrice`, `totalPrice`, `nights` fields

### Database Scripts (Created for reference)
- [x] Setup scripts for creating plan-based pricing
- [x] Migration scripts for adding `pricingType` field
- [x] Test scripts for validating pricing queries

---

## 📋 TODO: Integration & Testing

### 1. **Integrate Components into Admin Pricing Page** 🔴 HIGH PRIORITY

**File:** `app/admin/properties/[id]/pricing/page.tsx`

**Tasks:**
- [ ] Import `PlanOccupancyGrid` component
- [ ] Import `DirectPricingForm` component
- [ ] Add a new tab for "Base Pricing (Plan/Occupancy Grid)"
- [ ] Add a new tab for "Direct Pricing Overrides"
- [ ] Replace or enhance existing pricing forms with new components
- [ ] Ensure room categories are passed to both components
- [ ] Test save/update/delete operations

**Example Integration:**
```tsx
import PlanOccupancyGrid from "@/components/ui/plan-occupancy-grid"
import DirectPricingForm from "@/components/ui/direct-pricing-form"

// Inside the component:
<Tabs>
  <TabsList>
    <TabsTrigger value="base-pricing">Base Pricing</TabsTrigger>
    <TabsTrigger value="plan-pricing">Plan Grid</TabsTrigger>
    <TabsTrigger value="direct-pricing">Direct Overrides</TabsTrigger>
  </TabsList>

  <TabsContent value="plan-pricing">
    <PlanOccupancyGrid
      propertyId={propertyId}
      roomCategories={roomCategories}
      onSave={handleRefresh}
    />
  </TabsContent>

  <TabsContent value="direct-pricing">
    <DirectPricingForm
      propertyId={propertyId}
      roomCategories={roomCategories}
    />
  </TabsContent>
</Tabs>
```

---

### 2. **Migrate Existing Pricing Data** 🔴 HIGH PRIORITY

**Tasks:**
- [ ] Run migration script to add `pricingType` field to existing data
- [ ] Set default `pricingType = 'PLAN_BASED'` for all existing entries
- [ ] Verify no data loss after migration

**Script to run:**
```bash
MONGODB_URI="mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/" node scripts/migrate-pricing-add-type.cjs
```

**Verification:**
```javascript
// Check all entries have pricingType
db.propertypricings.count({ pricingType: { $exists: false } })
// Should return 0
```

---

### 3. **Test Admin UI End-to-End** 🟡 MEDIUM PRIORITY

**Base Pricing Grid Tests:**
- [ ] Navigate to property pricing page
- [ ] Switch to "Plan Grid" tab
- [ ] Select a room category
- [ ] Enter prices for different plan/occupancy combinations
- [ ] Click "Apply to All" for one plan type
- [ ] Save all changes
- [ ] Refresh and verify data persists
- [ ] Check MongoDB that entries were created with `pricingType: 'PLAN_BASED'`

**Direct Pricing Tests:**
- [ ] Switch to "Direct Overrides" tab
- [ ] Click "Add Entry"
- [ ] Select room category, plan, occupancy
- [ ] Set date range (e.g., holiday period)
- [ ] Enter custom price
- [ ] Add reason (e.g., "Christmas Special")
- [ ] Save entry
- [ ] Verify entry appears in list
- [ ] Check MongoDB that entry was created with `pricingType: 'DIRECT'`
- [ ] Edit an entry and verify update works
- [ ] Delete an entry and verify soft delete (isActive: false)

**Excel Import Tests:**
- [ ] Download new template from import dialog
- [ ] Fill in sample data with different `pricingType` values
- [ ] Import file
- [ ] Verify success message with summary
- [ ] Check entries were created correctly in database

---

### 4. **Test Frontend Property Display** 🟡 MEDIUM PRIORITY

**Tasks:**
- [ ] Navigate to a property page (not logged in)
- [ ] Select check-in and check-out dates
- [ ] Change plan type (EP, CP, MAP, AP)
- [ ] Change occupancy (Single, Double, Triple, Quad)
- [ ] Verify price updates correctly
- [ ] Check browser DevTools → Network tab
- [ ] Verify `/api/pricing/query` returns correct data
- [ ] Check response includes `averagePrice`, `totalPrice`, `nights`
- [ ] Verify pricing breakdown shows correct pricingType per day

**Properties to Test:**
- BAITHAKA GHAR CRESCENT RESORT (ID: 68ded9c16e52d7dcaa2dd843)
- Hotel Rosetum (ID: 68543c425b2163fa898ab394)
- White Pearl Suite (ID: 68543254321ae4322b9b5b31)

---

### 5. **Create Sample Pricing Data** 🟢 LOW PRIORITY

**For Testing Purposes:**
- [ ] Create plan-based pricing for 2-3 test properties
- [ ] Add direct pricing overrides for upcoming dates
- [ ] Test with different date ranges
- [ ] Test with overlapping date ranges (should use DIRECT over PLAN_BASED)

**Sample Data Script:**
```javascript
// Create plan-based pricing for all combinations
const roomCategories = ['deluxe', 'suite', 'standard']
const plans = ['EP', 'CP', 'MAP', 'AP']
const occupancies = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD']

for (const room of roomCategories) {
  for (const plan of plans) {
    for (const occupancy of occupancies) {
      await PropertyPricing.create({
        propertyId: 'YOUR_PROPERTY_ID',
        roomCategory: room,
        planType: plan,
        occupancyType: occupancy,
        pricingType: 'PLAN_BASED',
        price: calculatePrice(room, plan, occupancy),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        isActive: true
      })
    }
  }
}
```

---

### 6. **Update Documentation** 🟢 LOW PRIORITY

**Tasks:**
- [ ] Create user guide for admin pricing management
- [ ] Document pricing priority system for team
- [ ] Add comments to complex pricing logic
- [ ] Update API documentation with new endpoints

---

### 7. **Performance Optimization (Optional)** 🔵 OPTIONAL

**Tasks:**
- [ ] Add caching for frequently accessed pricing data
- [ ] Optimize database queries (already have indexes)
- [ ] Consider Redis cache for hot pricing data
- [ ] Add pagination for large pricing datasets

---

## 🧪 TESTING CHECKLIST

### Unit Tests Needed:
- [ ] Pricing query API with different pricingType values
- [ ] Priority system (DIRECT overrides PLAN_BASED)
- [ ] Date range overlaps
- [ ] Fallback pricing when no data exists

### Integration Tests Needed:
- [ ] Admin UI → API → Database flow
- [ ] Excel import with mixed pricingType values
- [ ] Frontend property page → Pricing API
- [ ] Booking flow with plan-based pricing

### Manual Tests:
- [ ] Create pricing via admin UI
- [ ] View pricing on property page
- [ ] Book a room with specific plan/occupancy
- [ ] Verify booking includes correct plan data
- [ ] Test with different date ranges (regular vs. direct pricing)

---

## 🚨 CRITICAL ISSUES TO CHECK

### Before Going Live:
1. [ ] **Authentication**: Verify admin endpoints require auth
2. [ ] **Data Validation**: All price inputs validated (no negative numbers)
3. [ ] **Date Validation**: End date must be after start date
4. [ ] **Conflict Detection**: Overlapping date ranges handled correctly
5. [ ] **Soft Delete**: Deleted entries marked as `isActive: false`
6. [ ] **Migration**: All existing data has `pricingType` field

---

## 📊 SUCCESS CRITERIA

### The system is ready when:
✅ Admin can manage pricing in grid format (plan × occupancy)
✅ Admin can set date-specific overrides
✅ Public users see correct prices without login
✅ Price changes when selecting different plans/occupancy
✅ Direct pricing overrides plan-based pricing
✅ All existing pricing data migrated successfully
✅ No TypeScript errors
✅ No runtime errors in browser console
✅ Excel import works with new structure
✅ Booking flow includes plan/occupancy data

---

## 📁 FILES CREATED/MODIFIED (Reference)

### New API Endpoints:
- `app/api/admin/properties/[id]/plan-pricing/route.ts`
- `app/api/admin/properties/[id]/direct-pricing/route.ts`

### New Components:
- `components/ui/plan-occupancy-grid.tsx`
- `components/ui/direct-pricing-form.tsx`

### Modified Files:
- `models/PropertyPricing.ts` (added pricingType, reason)
- `app/api/pricing/query/route.ts` (daily pricing, priority system)
- `app/api/pricing/import/route.ts` (support pricingType)
- `components/property/PricingSection.tsx` (new API structure)

### Documentation:
- `PRICING_FIXES_COMPLETED.md`
- `QUICK_VERIFICATION_CHECKLIST.md`

### Scripts:
- `scripts/migrate-pricing-add-type.cjs`
- `scripts/setup-all-properties-pricing.cjs`
- `scripts/test-pricing-query.cjs`

---

## 🎯 NEXT IMMEDIATE STEPS

1. **Integrate components into admin pricing page** (30 mins)
2. **Run data migration script** (5 mins)
3. **Test admin UI creation flow** (15 mins)
4. **Test frontend property page** (15 mins)
5. **Fix any bugs found** (variable)

**Estimated Total Time:** 1-2 hours

---

## 💡 TIPS

- Start dev server: `npm run dev`
- Check MongoDB data: Use MongoDB Compass or scripts
- Clear browser cache: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Check API responses: Browser DevTools → Network tab
- Test different scenarios: Regular dates vs. special dates with overrides

---

**Status:** 🟢 Backend Complete | 🟡 Integration Pending | 🔴 Testing Needed

**Last Updated:** January 2025
