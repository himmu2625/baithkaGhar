# Phase 3: Owner Dashboard UI & Data Integration

**Phase:** 3 of 8
**Duration:** 1 week (December 17-24, 2025)
**Status:** 🟢 In Progress
**Focus:** Real data integration and dashboard functionality

---

## 📋 Overview

Phase 3 brings the owner portal to life by integrating real data from the database. We'll replace placeholder pages with fully functional property management, booking tracking, and analytics.

### Goals

1. **Real Data Integration** - Fetch and display actual data
2. **Property Management** - View and manage properties
3. **Booking Tracking** - Monitor reservations and check-ins
4. **Dashboard Analytics** - Statistics, charts, and insights
5. **Payment Overview** - Track pending and completed payments

---

## 🎯 Objectives

### Primary Goals

- ✅ Create API endpoints for owner data
- ✅ Update dashboard with real statistics
- ✅ Build properties list with actual data
- ✅ Build bookings list with real reservations
- ✅ Add charts and visualizations
- ✅ Create property detail pages
- ✅ Add filtering and search capabilities

### Success Criteria

- Dashboard shows accurate statistics from database
- Properties list displays owner's actual properties
- Bookings list shows real reservations
- Charts visualize trends and performance
- All data updates in real-time
- Mobile responsive design maintained
- Fast page load times (< 2 seconds)

---

## 🏗️ Architecture

### API Endpoints

```
GET /api/os/dashboard/stats        - Dashboard statistics
GET /api/os/properties              - Owner's properties list
GET /api/os/properties/[id]         - Single property details
GET /api/os/bookings                - Owner's bookings list
GET /api/os/bookings/[id]           - Single booking details
GET /api/os/payments/pending        - Pending hotel payments
GET /api/os/analytics/revenue       - Revenue analytics
GET /api/os/analytics/occupancy     - Occupancy rates
```

### Data Flow

```
1. User opens dashboard
2. Server-side fetch with requireOwnerAuth()
3. Get user's property IDs from ownerProfile
4. Query database for properties/bookings
5. Calculate statistics
6. Render page with real data
7. Client-side updates for interactivity
```

---

## 📊 Dashboard Statistics

### Metrics to Display

1. **Total Properties** - Count of owner's properties
2. **Active Bookings** - Current and upcoming reservations
3. **Pending Payments** - Amount to be collected at hotel
4. **Monthly Revenue** - This month's earnings
5. **Occupancy Rate** - % of rooms booked
6. **Average Rating** - Property ratings
7. **Total Reviews** - Review count
8. **Upcoming Check-ins** - Next 7 days

### Charts

- Revenue trend (last 6 months)
- Booking distribution (by property)
- Occupancy rate over time
- Payment status breakdown

---

## 🔧 Implementation Plan

### Week 3 Tasks

#### Day 1-2: API Endpoints
- [ ] Create `/api/os/dashboard/stats` endpoint
- [ ] Create `/api/os/properties` endpoint
- [ ] Create `/api/os/bookings` endpoint
- [ ] Test API responses with real data

#### Day 3-4: Dashboard UI
- [ ] Update dashboard with real statistics
- [ ] Add revenue chart
- [ ] Add booking chart
- [ ] Add recent activity feed

#### Day 5-6: Properties & Bookings
- [ ] Build properties list page
- [ ] Build bookings list page
- [ ] Add filtering and search
- [ ] Create property detail page

#### Day 7: Polish & Testing
- [ ] Add loading states
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

## 📝 Detailed Tasks

### Task 1: Dashboard Statistics API

Create `app/api/os/dashboard/stats/route.ts`:

```typescript
import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

export async function GET() {
  const session = await requireOwnerAuth();

  await dbConnect();

  const propertyIds = await getOwnerPropertyIds(session.user.id);

  // Calculate statistics
  const stats = {
    totalProperties: await Property.countDocuments({
      _id: { $in: propertyIds }
    }),
    activeBookings: await Booking.countDocuments({
      propertyId: { $in: propertyIds },
      status: { $in: ['confirmed', 'pending'] },
      dateTo: { $gte: new Date() }
    }),
    // ... more stats
  };

  return Response.json(stats);
}
```

### Task 2: Properties List Page

Update `app/os/properties/page.tsx`:

```typescript
import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import PropertyCard from '@/components/os/PropertyCard';

export default async function PropertiesPage() {
  const session = await requireOwnerAuth();
  await dbConnect();

  const propertyIds = await getOwnerPropertyIds(session.user.id);

  const properties = await Property.find({
    _id: { $in: propertyIds }
  }).lean();

  return (
    <div>
      <h1>My Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
}
```

### Task 3: Bookings List Page

Update `app/os/bookings/page.tsx`:

```typescript
import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';
import BookingTable from '@/components/os/BookingTable';

export default async function BookingsPage() {
  const session = await requireOwnerAuth();
  await dbConnect();

  const propertyIds = await getOwnerPropertyIds(session.user.id);

  const bookings = await Booking.find({
    propertyId: { $in: propertyIds }
  })
  .populate('userId', 'name email')
  .populate('propertyId', 'title')
  .sort({ createdAt: -1 })
  .limit(100)
  .lean();

  return (
    <div>
      <h1>Bookings</h1>
      <BookingTable bookings={bookings} />
    </div>
  );
}
```

---

## 🎨 UI Components to Create

### PropertyCard Component

```typescript
// components/os/PropertyCard.tsx
- Property image
- Property name
- Location
- Status (active/inactive)
- Quick stats (bookings, revenue)
- View details button
```

### BookingTable Component

```typescript
// components/os/BookingTable.tsx
- Table with columns: Booking ID, Guest, Property, Dates, Status, Amount
- Sortable columns
- Filter by status
- Pagination
- Action buttons (view, manage)
```

### StatsCard Component

```typescript
// components/os/StatsCard.tsx
- Icon
- Title
- Value (number/currency)
- Change indicator (+/- from last period)
- Color coding
```

### RevenueChart Component

```typescript
// components/os/RevenueChart.tsx
- Line chart showing revenue over time
- Monthly breakdown
- Comparison with previous period
- Interactive tooltips
```

---

## 📦 Required Packages

```bash
# For charts and visualizations
npm install recharts

# Already installed:
# - lucide-react (icons)
# - date-fns (date formatting)
```

---

## 🧪 Testing Plan

### Unit Tests

```typescript
describe('Owner Dashboard API', () => {
  test('returns correct statistics for property owner');
  test('returns only owner\'s properties');
  test('calculates revenue correctly');
  test('filters bookings by property ownership');
});
```

### Integration Tests

```typescript
describe('Owner Dashboard Page', () => {
  test('displays real property count');
  test('shows accurate booking statistics');
  test('renders charts with data');
  test('handles empty state gracefully');
});
```

### Manual Testing

- [ ] Login as property owner
- [ ] Verify statistics are accurate
- [ ] Check all properties are listed
- [ ] Verify bookings belong to owner's properties
- [ ] Test charts display correctly
- [ ] Check mobile responsiveness
- [ ] Verify performance (page load < 2s)

---

## 📊 Success Metrics

- ✅ Dashboard loads in < 2 seconds
- ✅ All statistics accurate (match database)
- ✅ Charts render correctly
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Proper error handling
- ✅ Loading states implemented

---

## 🔄 Next Phase Preview

### Phase 4: Payment Collection (Week 4)

- Mark hotel payments as collected
- Payment collection form
- Receipt generation
- Payment history
- Payout tracking

---

**Phase 3 Status:** 🟢 In Progress
**Last Updated:** December 17, 2025
**Target Completion:** December 24, 2025
