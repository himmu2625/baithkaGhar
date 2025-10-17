# Baithaka Ghar PMS Separation - Complete Documentation

## Executive Summary

This document details the complete separation of the Property Management System (PMS) from the Baithaka Ghar Hotel Booking Website. The system previously called "Baithaka Ghar OS" was incorrectly named - OS actually means "Owner System" (owner's perspective for the entire platform), whereas what has been built is a comprehensive **Property Management System (PMS)** for individual hotel operations.

## Terminology Clarification

- **PMS (Property Management System)**: The comprehensive hotel management system built for individual properties. This includes:
  - Dashboard & Analytics
  - Room & Inventory Management
  - Booking Management
  - Financial Reports & Payments
  - Guest Management
  - Staff Management
  - Food & Beverage Module
  - Events Management
  - OTA Integration
  - Housekeeping & Maintenance

- **OS (Owner System)** - Future System: A separate system focused entirely on the **owner's perspective** of the platform (not individual properties). This will manage:
  - Portfolio overview across all properties
  - Commission tracking
  - Property onboarding & verification
  - Platform-wide analytics
  - Owner payouts
  - Multi-property management

## Current System Analysis

### 1. PMS Frontend Routes (app/os/)

#### Core Management Pages
- `/os/login` - PMS Authentication
- `/os/dashboard/[id]` - Property Dashboard
- `/os/dashboard` - Dashboard selector
- `/os/properties` - Properties list
- `/os/properties/[id]` - Property details
- `/os/properties/[id]/rooms` - Room management
- `/os/properties/[id]/settings` - Property settings
- `/os/properties/[id]/room-types` - Room type configuration

#### Booking & Inventory Management
- `/os/bookings/[propertyId]` - Booking management
- `/os/inventory` - Inventory overview
- `/os/inventory/dashboard/[propertyId]` - Inventory dashboard
- `/os/inventory/rooms/[propertyId]` - Room inventory
- `/os/inventory/room-types/[propertyId]` - Room types
- `/os/inventory/rates/[propertyId]` - Rate management
- `/os/inventory/housekeeping/[propertyId]` - Housekeeping management
- `/os/inventory/facilities/[propertyId]` - Facilities management
- `/os/inventory/amenities/[propertyId]` - Amenities management
- `/os/inventory/analytics` - Inventory analytics

#### Financial & Analytics
- `/os/financial/[id]` - Financial reports
- `/os/financial/payments` - Payment management
- `/os/analytics/[id]` - Analytics dashboard

#### Guest & Staff Management
- `/os/guests/[id]` - Guest management
- `/os/staff/[id]` - Staff management
- `/os/tasks/[propertyId]` - Task management

#### Food & Beverage Module
- `/os/fb/dashboard/[propertyId]` - F&B Dashboard
- `/os/fb/menu/[propertyId]` - Menu management
- `/os/fb/orders/[propertyId]` - Order management
- `/os/fb/tables/[propertyId]` - Table management
- `/os/fb/kitchen/[propertyId]` - Kitchen display system
- `/os/fb/pos/[propertyId]` - Point of sale
- `/os/fb/inventory/[propertyId]` - F&B Inventory
- `/os/fb/reports/[propertyId]` - F&B Reports
- `/os/fb/reservations/[propertyId]` - Table reservations

#### Events Management
- `/os/events/dashboard/[propertyId]` - Events dashboard
- `/os/events/bookings/[propertyId]` - Event bookings
- `/os/events/bookings/[propertyId]/new` - New event booking
- `/os/events/venues/[propertyId]` - Venue management
- `/os/events/packages/[propertyId]` - Package management
- `/os/events/calendar/[propertyId]` - Event calendar
- `/os/events/services/[propertyId]` - Service management
- `/os/events/staff/[propertyId]` - Event staff management
- `/os/events/billing/[propertyId]` - Event billing

#### OTA & Integration
- `/os/ota-config/[id]` - OTA configuration
- `/os/settings/[id]` - Settings

#### Maintenance & Operations
- `/os/maintenance/[id]` - Maintenance management
- `/os/reports/daily` - Daily reports

#### Demo & Testing Pages
- `/os/accessibility-demo` - Accessibility testing
- `/os/theme-demo` - Theme demonstration
- `/os/debug` - Debug page

### 2. PMS API Routes (app/api/os/)

#### Authentication & Core
- `/api/os/login` - PMS login
- `/api/os/dashboard` - Dashboard data
- `/api/os/dashboard/performance` - Performance metrics
- `/api/os/properties` - Properties API

#### Booking Management
- `/api/os/bookings/[propertyId]` - Bookings CRUD
- `/api/os/bookings/bulk` - Bulk operations
- `/api/os/bookings/bulk/email` - Bulk email
- `/api/os/bookings/reminders` - Booking reminders

#### Room Management
- `/api/os/rooms/[propertyId]` - Room operations
- `/api/os/rooms/[propertyId]/availability` - Room availability

#### Guest Management
- `/api/os/guests/[id]` - Guest operations
- `/api/os/guests/[id]/communication` - Guest communication
- `/api/os/guests/[id]/communications` - Communication history

#### Staff Management
- `/api/os/staff/[id]` - Staff operations
- `/api/os/staff/[id]/[staffId]` - Individual staff
- `/api/os/staff/[id]/management` - Staff management
- `/api/os/staff/tasks` - Staff tasks
- `/api/os/staff/workload` - Workload management
- `/api/os/staff/analytics` - Staff analytics

#### Financial Operations
- `/api/os/financial/[id]` - Financial data
- `/api/os/payments/create-order` - Create payment order
- `/api/os/payments/verify` - Verify payment
- `/api/os/payments/refund` - Process refund

#### Analytics & Reports
- `/api/os/analytics` - Analytics API
- `/api/os/analytics/[id]` - Property analytics
- `/api/os/analytics/[id]/dashboard` - Analytics dashboard
- `/api/os/analytics/[id]/export` - Export analytics
- `/api/os/reports/daily` - Daily reports
- `/api/os/reports/list` - Reports list
- `/api/os/reports/revenue` - Revenue reports
- `/api/os/reports/occupancy` - Occupancy reports
- `/api/os/reports/patterns` - Pattern analysis
- `/api/os/reports/demographics` - Demographics
- `/api/os/reports/forecast` - Forecasting

#### Housekeeping Operations
- `/api/os/housekeeping` - Housekeeping operations
- `/api/os/housekeeping/[taskId]` - Task operations
- `/api/os/housekeeping/tasks` - Task management
- `/api/os/housekeeping/schedule` - Scheduling
- `/api/os/housekeeping/analytics` - Analytics

#### Maintenance Operations
- `/api/os/maintenance/[id]` - Maintenance operations
- `/api/os/maintenance/tasks` - Task management
- `/api/os/maintenance/schedule` - Scheduling
- `/api/os/maintenance/analytics` - Analytics

#### OTA Management
- `/api/os/ota-config/[id]` - OTA configuration
- `/api/os/ota/test-connection` - Test OTA connection
- `/api/os/ota/sync-inventory` - Sync inventory
- `/api/os/ota/channels` - Channel management
- `/api/os/ota/channels/[id]` - Individual channel
- `/api/os/ota/sync-logs/[id]` - Sync logs
- `/api/os/ota-management` - OTA management
- `/api/os/ota-core/sync` - Core sync
- `/api/os/channels/booking-com` - Booking.com integration
- `/api/os/channels/expedia` - Expedia integration
- `/api/os/channels/agoda` - Agoda integration
- `/api/os/channels/sync` - Channel sync
- `/api/os/connectors/pms` - PMS connector
- `/api/os/connectors/channel-manager` - Channel manager

#### Service Management
- `/api/os/services/requests` - Service requests
- `/api/os/services/categories` - Service categories
- `/api/os/services/feedback` - Service feedback

#### Feedback & Loyalty
- `/api/os/feedback` - Feedback management
- `/api/os/feedback/request` - Request feedback
- `/api/os/feedback/submit` - Submit feedback
- `/api/os/feedback/analytics` - Feedback analytics
- `/api/os/loyalty/members` - Loyalty members
- `/api/os/loyalty/rewards` - Rewards management
- `/api/os/loyalty/analytics` - Loyalty analytics
- `/api/os/loyalty/booking` - Loyalty booking integration

#### Front Desk Operations
- `/api/os/front-desk/dashboard` - Front desk dashboard
- `/api/os/front-desk/handover` - Shift handover

#### Communication
- `/api/os/communications/email` - Email communication

#### Tasks & Integration
- `/api/os/tasks/pending` - Pending tasks
- `/api/os/integrations/connect` - Integration connections

### 3. PMS Components (components/os/)

#### Theme & UI Components
- `/components/os/theme/` - Theme provider, icons, buttons, animations
- `/components/os/ui/` - Data tables, forms, modals, loading states, toasts, search filters, command palette, glass card effects
- `/components/os/common-ui/` - Responsive components, data tables, forms
- `/components/os/common/` - Error boundary, loading states, notifications, spinners

#### Layout Components
- `/components/os/layout/` - Sidebar, header, breadcrumb
- `/components/os/navigation/` - Mobile navigation, enhanced breadcrumb

#### Authentication & Security
- `/components/os/auth/` - Two-factor auth, session timeout, password reset, RBAC protected routes

#### Accessibility
- `/components/os/accessibility/` - Keyboard navigation, screen reader support, focus indicators, user onboarding, help documentation

#### Dashboard Components
- `/components/os/dashboard/` - Arrivals/departures, property-specific widgets, OTA status, analytics dashboard, enhanced analytics

#### Guest Management
- `/components/os/guests/` - Guest journey tracker

#### Inventory Management
- `/components/os/inventory/` - Advanced room manager

#### Maintenance
- `/components/os/maintenance/` - Maintenance manager, workflow manager

#### Food & Beverage Components
- `/components/os/fb/shared/` - Status badges, priority indicators, currency display, rating stars, progress bars, date/time display, loading spinners, metric cards, search filters, empty states
- `/components/os/fb/menu/` - Menu display board, category manager, pricing
- `/components/os/fb/tables/` - Table layout, waitlist manager
- `/components/os/fb/pos/` - POS order system, payment gateway, receipt generator, sales reporting
- `/components/os/fb/kitchen/` - Kitchen display system, order queue, ingredient availability, recipe management
- `/components/os/fb/inventory/` - Inventory tracker, list, stock movements, analytics, low stock alerts
- `/components/os/fb/orders/` - Order dashboard, tracking
- `/components/os/fb/reports/` - Sales reports, menu performance, inventory reports, customer analytics
- `/components/os/fb/reservations/` - Reservation calendar

#### Events Management Components
- `/components/os/events/` - Event booking form, venue availability, package selector, service customizer, event calendar, timeline, staff scheduler, equipment manager, quotation, contract generator, payment tracking, invoice generator, lead management, check-in manager, feedback manager, analytics dashboard, automation manager

### 4. PMS-Specific Models

#### Core PMS Models
- `PropertyManagement.ts` - Property management data
- `PropertyLogin.ts` - PMS authentication
- `PropertyPermission.ts` - Role-based permissions
- `Room.ts` - Room data
- `RoomType.ts` - Room type definitions
- `EnhancedRoom.ts` - Extended room properties
- `RoomAvailability.ts` - Room availability tracking
- `RoomMaintenance.ts` - Maintenance records
- `RoomAsset.ts` - Asset management
- `RoomInventoryItem.ts` - Inventory items

#### Booking & Guest Models
- `EnhancedBooking.ts` - Enhanced booking data
- `BookingRoom.ts` - Booking room assignments
- `BookingStatus.ts` - Status tracking
- `Guest.ts` - Guest profiles
- `GuestMessage.ts` - Guest communications

#### Staff Management Models
- `Staff.ts` - Staff records
- `StaffMember.ts` - Staff member details
- `StaffAttendance.ts` - Attendance tracking
- `StaffRole.ts` - Role definitions
- `Department.ts` - Department structure
- `Task.ts` - Task management

#### Food & Beverage Models
- `FBOrder.ts` - F&B orders
- `FBOrderItem.ts` - Order items
- `FBInventory.ts` - F&B inventory
- `Kitchen.ts` - Kitchen operations
- `MenuItem.ts` - Menu items
- `MenuCategory.ts` - Menu categories
- `MenuModifier.ts` - Item modifiers
- `Order.ts` - Order processing
- `Recipe.ts` - Recipe management
- `Reservation.ts` - Table reservations
- `Table.ts` - Table management

#### Events Management Models
- `EventBooking.ts` - Event bookings
- `EventVenue.ts` - Venue management
- `EventPackage.ts` - Event packages
- `EventMenu.ts` - Event menus
- `EventService.ts` - Service offerings
- `EventEquipment.ts` - Equipment tracking
- `EventStaff.ts` - Staff assignments
- `EventType.ts` - Event categories
- `EventInvoice.ts` - Invoicing
- `EventQuote.ts` - Quotations
- `EventContract.ts` - Contracts
- `EventLead.ts` - Lead management
- `EventAutomation.ts` - Automation rules
- `EventTimeline.ts` - Event timelines
- `EventCheckin.ts` - Check-in management
- `EventFeedback.ts` - Feedback collection

#### Operational Models
- `HousekeepingTask.ts` - Housekeeping tasks
- `MaintenanceRequest.ts` - Maintenance requests
- `Commission.ts` - Commission tracking
- `GeneratedReport.ts` - Report generation
- `ReportTemplate.ts` - Report templates
- `ReportSchedule.ts` - Scheduled reports

#### OTA & Integration Models
- `OTAChannelConfig.ts` - OTA channel configuration
- `OTAPropertyConfig.ts` - Property OTA settings

#### Financial Models
- `EnhancedPayment.ts` - Payment processing
- `Refund.ts` - Refund management

#### Security & Access Models
- `UserRole.ts` - User roles
- `UserSession.ts` - Session management
- `UserPermission.ts` - Permission system
- `Session.ts` - Session tracking
- `SecurityEvent.ts` - Security logging
- `LoginAttempt.ts` - Login tracking
- `AccessLog.ts` - Access logging
- `TwoFactorAuth.ts` - 2FA management

### 5. PMS-Specific Hooks

- `/hooks/use-os-dashboard.ts` - Dashboard state management
- `/hooks/use-os-auth.ts` - PMS authentication
- `/hooks/use-auth-rbac.ts` - Role-based access control
- `/hooks/useMobileCheckIn.ts` - Mobile check-in functionality
- `/hooks/useAccessibility.ts` - Accessibility features
- `/hooks/use-websocket.ts` - Real-time WebSocket connections
- `/hooks/use-optimized-fetch.ts` - Optimized data fetching
- `/hooks/use-network-status.ts` - Network status monitoring

### 6. PMS-Specific Utilities & Libraries

#### Lib Files
- Any utility functions specifically used by PMS features

#### Providers
- `/provider/OSProperty-provider.tsx` - PMS property context provider

### 7. Shared Resources Used by Both Systems

#### Models Used by Both
- `Property.ts` - Property base model (shared)
- `Booking.ts` - Booking base model (shared)
- `User.ts` - User authentication (shared)
- `Payment.ts` - Payment processing (shared)
- `Review.ts` - Reviews (shared)
- `PropertyPricing.ts` - Pricing data (shared)
- `DynamicPricingRule.ts` - Pricing rules (shared)
- `PlanType.ts` - Plan types (shared)
- `PropertyAmenity.ts` - Amenities (shared)
- `PropertyImage.ts` - Images (shared)

#### Shared UI Components
- All components in `/components/ui/` (shadcn/ui components)
- All components in `/components/common/` not in os subfolder
- All components in `/components/layout/` (main site layout)

#### Shared Hooks
- `/hooks/use-toast.ts`
- `/hooks/use-mobile.tsx`
- `/hooks/useLoader.ts`
- `/hooks/useDynamicPricing.ts`
- `/hooks/use-report.tsx`

#### Shared Libraries
- `/lib/analytics.ts`
- `/lib/maps.ts`
- `/lib/search.ts`
- `/lib/performance.ts`
- `/lib/utils.ts` (assumed standard utility file)

### 8. Database Collections

#### PMS-Specific Collections (Will move to PMS Database)
- `propertyLogins` - PMS user authentication
- `propertyPermissions` - Role permissions
- `rooms` - Room inventory
- `roomTypes` - Room type definitions
- `roomAvailability` - Availability tracking
- `roomMaintenance` - Maintenance records
- `roomAssets` - Asset tracking
- `roomInventoryItems` - Room inventory
- `fbOrders` - F&B orders
- `fbOrderItems` - Order line items
- `fbInventory` - F&B inventory
- `kitchens` - Kitchen management
- `menuItems` - Menu items
- `menuCategories` - Menu categories
- `menuModifiers` - Item modifiers
- `recipes` - Recipe management
- `tableReservations` - Table reservations
- `tables` - Table management
- `eventBookings` - Event bookings
- `eventVenues` - Venues
- `eventPackages` - Event packages
- `eventMenus` - Event menus
- `eventServices` - Services
- `eventEquipment` - Equipment
- `eventStaff` - Event staff
- `eventTypes` - Event types
- `eventInvoices` - Invoices
- `eventQuotes` - Quotations
- `eventContracts` - Contracts
- `eventLeads` - Leads
- `eventAutomations` - Automation rules
- `eventTimelines` - Timelines
- `eventCheckins` - Check-ins
- `eventFeedback` - Event feedback
- `housekeepingTasks` - Housekeeping
- `maintenanceRequests` - Maintenance
- `staffMembers` - Staff
- `staffAttendance` - Attendance
- `staffRoles` - Staff roles
- `departments` - Departments
- `tasks` - Task management
- `guestMessages` - Guest communications
- `otaChannelConfigs` - OTA channels
- `otaPropertyConfigs` - OTA property settings
- `generatedReports` - Reports
- `reportTemplates` - Templates
- `reportSchedules` - Schedules
- `userRoles` - PMS roles
- `userSessions` - PMS sessions
- `userPermissions` - Permissions
- `securityEvents` - Security logs
- `loginAttempts` - Login tracking
- `accessLogs` - Access logs
- `twoFactorAuth` - 2FA data

#### Shared Collections (Referenced by both systems)
- `properties` - Property master data
- `bookings` - Booking records
- `users` - User accounts
- `payments` - Payment records
- `reviews` - Reviews
- `propertyPricing` - Pricing data
- `dynamicPricingRules` - Pricing rules
- `planTypes` - Plan types
- `propertyAmenities` - Amenities
- `propertyImages` - Images
- `guests` - Guest profiles
- `commissions` - Commission tracking

**Important Note:** The PMS will need to reference some shared collections (like `properties`, `bookings`) but will maintain its own separate database. Cross-database references will be handled via property IDs and proper API integrations.

### 9. Environment Variables

#### PMS-Specific Environment Variables (to be moved)
```env
# These are PMS-specific
OTA_ENCRYPTION_KEY=BaithakGharOTAChannelManager2024!!

# These will need separate PMS instances
RAZORPAY_KEY_ID=<separate_pms_key>
RAZORPAY_KEY_SECRET=<separate_pms_secret>
```

#### Shared Environment Variables (both systems need)
```env
MONGODB_URI=mongodb+srv://...
GOOGLE_MAPS_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 10. Authentication Flow Separation

#### Current State (Mixed)
- Main website uses NextAuth with `/api/auth/*` routes
- PMS uses custom login via `/api/os/login` route
- PMS has its own `PropertyLogin` model separate from `User` model
- PMS stores auth state in `use-os-auth.ts` hook

#### Target State (Separated)
- **Main Website**:
  - Keeps NextAuth
  - Uses `User` model
  - Guests, hosts, admins authenticate here

- **PMS (New Project)**:
  - Standalone authentication system
  - Uses `PropertyLogin` model
  - Property staff, managers authenticate here
  - Completely separate session management
  - No dependency on main website auth

#### Future OS (Owner System)
- Will have its own authentication
- Property owners authenticate here
- Manages multi-property portfolio
- Separate from both website and PMS

### 11. Middleware Configuration

Current middleware (`middleware.ts`) needs cleanup:
- Remove PMS-specific route protection (anything starting with `/os/`)
- PMS will have its own middleware in the new project
- Main website middleware should only handle:
  - Main website authentication
  - Admin routes
  - Host/Guest routes
  - Public routes

### 12. Package Dependencies Analysis

#### PMS-Specific Dependencies
These are primarily or exclusively used by PMS:
- `@tanstack/react-table` - Data tables (PMS heavy usage)
- `recharts` - Charts and analytics
- `react-chartjs-2` & `chart.js` - Alternative charting
- `html2canvas` - Report generation
- `jspdf` & `jspdf-autotable` - PDF generation
- `xlsx` - Excel exports
- `socket.io` & `socket.io-client` - Real-time updates (PMS features)
- `web-push` - Push notifications (PMS notifications)
- `cmdk` - Command palette (PMS UI)

#### Shared Dependencies
These are used by both systems and should remain:
- `next`, `react`, `react-dom` - Core framework
- `mongodb` - Database
- `next-auth` - Main website auth
- `bcryptjs` - Password hashing
- `jsonwebtoken` & `jose` - JWT handling
- `axios` - HTTP client
- `cloudinary` - Image management
- `razorpay` - Payments
- `nodemailer` - Email
- `twilio` - SMS
- `@radix-ui/*` - UI primitives
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `zod` - Validation
- `date-fns` - Date utilities

## Migration Strategy

### Phase 1: Pre-Migration Setup
1. Create new Next.js project: "Baithaka Ghar PMS" on desktop
2. Set up clean project structure
3. Initialize Git repository
4. Configure TypeScript and ESLint
5. Set up Tailwind CSS
6. Create separate MongoDB database/connection for PMS

### Phase 2: Database & Models Migration
1. Copy all PMS-specific models to new project
2. Create database connection utility
3. Test database connections
4. Set up indexes for performance
5. Create database migration scripts if needed

### Phase 3: Authentication System Migration
1. Set up standalone auth system for PMS
2. Migrate `PropertyLogin` model and related logic
3. Create authentication middleware
4. Implement session management
5. Set up RBAC (Role-Based Access Control)
6. Migrate 2FA functionality

### Phase 4: Backend API Migration
1. Create folder structure: `app/api/`
2. Migrate all `/api/os/*` routes to root API routes
3. Update all internal API references
4. Test each API endpoint individually
5. Implement error handling and logging
6. Set up API rate limiting and security

### Phase 5: Frontend Components Migration
1. Create components directory structure
2. Migrate all PMS-specific components
3. Copy shared UI components needed
4. Update all import paths
5. Test component rendering
6. Fix any styling issues

### Phase 6: Pages & Routes Migration
1. Migrate all `/os/*` routes to root level
2. Update route structure (remove `/os` prefix)
3. Migrate layouts and nested routes
4. Update navigation logic
5. Test all page routes

### Phase 7: Hooks & Utilities Migration
1. Migrate PMS-specific hooks
2. Copy necessary shared utilities
3. Update import paths
4. Test custom hooks functionality

### Phase 8: Configuration & Environment
1. Set up environment variables
2. Configure deployment settings
3. Set up logging and monitoring
4. Configure error tracking
5. Set up CI/CD pipeline

### Phase 9: Testing & Validation
1. Test all PMS features end-to-end
2. Verify data integrity
3. Test authentication flows
4. Verify API integrations (OTA, payment gateways)
5. Performance testing
6. Security audit

### Phase 10: Main Website Cleanup
1. Remove all `/os/*` routes and pages
2. Remove PMS components
3. Remove PMS API routes
4. Clean up models (keep only shared ones)
5. Update middleware configuration
6. Remove PMS-specific dependencies
7. Update TypeScript types
8. Clean up environment variables
9. Test main website thoroughly
10. Verify build process

### Phase 11: Documentation & Handover
1. Document PMS architecture
2. Create deployment guide
3. Document API endpoints
4. Create user manual
5. Document future OS integration points

## Future Owner System (OS) Considerations

### OS Purpose
The Owner System will be a separate application focused on:
- Property owners managing their portfolio
- Commission tracking across properties
- Property performance comparison
- Multi-property analytics
- Owner payouts and financial management
- Property onboarding and verification

### Integration Points

#### Between Main Website and PMS
- Property data synchronization
- Booking data flow (website creates bookings → PMS manages them)
- Payment reconciliation
- Review and rating sync

#### Between Main Website and Future OS
- Property listing approval flow
- Owner registration and verification
- Commission calculation
- Payout management

#### Between PMS and Future OS
- Property performance data
- Financial summary reports
- Operational metrics
- Compliance and audit data

### Data Flow Architecture
```
Main Website (Customer-facing)
  ↓ (creates booking)
  → Property.bookings
  ↓ (sends to)
PMS (Property Operations)
  ↓ (reports to)
Future OS (Owner Management)
```

### API Integration Strategy
- All three systems will be separate Next.js applications
- Communication via REST APIs
- Shared database for core entities (properties, bookings, users)
- Each system maintains its own operational database
- Event-driven architecture for real-time updates
- Webhooks for critical state changes

## File Relocation Plan

### Files to Move to New PMS Project

#### 1. Frontend Pages (app/os/*)
- All 60+ page files under `/app/os/`
- Total: ~60 files

#### 2. API Routes (app/api/os/*)
- All 80+ API route files under `/app/api/os/`
- Total: ~80 files

#### 3. Components (components/os/*)
- All 90+ component files under `/components/os/`
- Total: ~90 files

#### 4. Models
Move these specific models:
- PropertyLogin.ts
- PropertyPermission.ts
- PropertyManagement.ts
- EnhancedRoom.ts
- RoomMaintenance.ts
- RoomAsset.ts
- RoomInventoryItem.ts
- EnhancedBooking.ts (if truly PMS-specific extensions)
- BookingRoom.ts
- BookingStatus.ts
- GuestMessage.ts
- Staff.ts
- StaffMember.ts
- StaffAttendance.ts
- StaffRole.ts
- Department.ts
- Task.ts
- FBOrder.ts
- FBOrderItem.ts
- FBInventory.ts
- Kitchen.ts
- MenuItem.ts
- MenuCategory.ts
- MenuModifier.ts
- Order.ts
- Recipe.ts
- Reservation.ts
- Table.ts
- EventBooking.ts
- EventVenue.ts
- EventPackage.ts
- EventMenu.ts
- EventService.ts
- EventEquipment.ts
- EventStaff.ts
- EventType.ts
- EventInvoice.ts
- EventQuote.ts
- EventContract.ts
- EventLead.ts
- EventAutomation.ts
- EventTimeline.ts
- EventCheckin.ts
- EventFeedback.ts
- HousekeepingTask.ts
- MaintenanceRequest.ts
- OTAChannelConfig.ts
- OTAPropertyConfig.ts
- GeneratedReport.ts
- ReportTemplate.ts
- ReportSchedule.ts
- UserRole.ts (PMS-specific)
- UserSession.ts (PMS-specific)
- UserPermission.ts
- SecurityEvent.ts
- LoginAttempt.ts
- AccessLog.ts
- TwoFactorAuth.ts (if PMS-specific)
- Total: ~50 model files

#### 5. Hooks
- use-os-dashboard.ts
- use-os-auth.ts
- use-auth-rbac.ts
- useMobileCheckIn.ts
- useAccessibility.ts
- use-websocket.ts
- use-optimized-fetch.ts
- use-network-status.ts
- Total: 8 hook files

#### 6. Providers
- OSProperty-provider.tsx

#### 7. Scripts
- Any PMS-specific setup or seed scripts

### Files to Keep in Main Website

#### Models (Shared)
- Property.ts
- Booking.ts
- User.ts
- Payment.ts
- Review.ts
- PropertyPricing.ts
- DynamicPricingRule.ts
- PlanType.ts
- PropertyAmenity.ts
- PropertyImage.ts
- Guest.ts (if used by main site)
- Room.ts (basic room definition)
- RoomType.ts (basic room types)
- RoomAvailability.ts (for website booking)
- Commission.ts
- Refund.ts
- All other website-specific models

#### Components
- All `/components/ui/` (shadcn/ui)
- All `/components/layout/` (except OS layout)
- All `/components/common/` (except OS subfolder)
- All property listing components
- All booking components
- All user-facing components

#### Pages
- All main website pages
- Property listing pages
- Booking pages
- User dashboard
- Admin pages
- All other non-PMS pages

## Estimated File Counts

- **Total files to move**: ~290+ files
- **Total files to keep**: Majority of current project
- **New files to create in PMS**: ~50+ (configuration, setup, etc.)

## Risk Mitigation

### Risks
1. Data inconsistency between systems
2. Broken API integrations
3. Lost functionality during migration
4. Authentication issues
5. Performance degradation

### Mitigation Strategies
1. Comprehensive testing at each phase
2. Maintain detailed documentation
3. Create rollback plans
4. Set up staging environments
5. Gradual migration with parallel running
6. Data validation scripts
7. API versioning
8. Comprehensive logging

## Success Criteria

### PMS Project
- ✅ All PMS features working independently
- ✅ Authentication system fully functional
- ✅ All API endpoints tested and working
- ✅ Database properly configured and optimized
- ✅ UI/UX matches or exceeds current system
- ✅ Performance metrics acceptable
- ✅ Security audit passed
- ✅ Documentation complete

### Main Website
- ✅ No PMS code remaining
- ✅ All website features working
- ✅ Build process clean (no errors)
- ✅ Performance not degraded
- ✅ All tests passing
- ✅ Dependencies optimized
- ✅ Code quality improved

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Setup & Database)
- **Phase 3**: 2 days (Authentication)
- **Phase 4**: 3-4 days (API Migration)
- **Phase 5**: 3-4 days (Components)
- **Phase 6**: 2-3 days (Pages & Routes)
- **Phase 7**: 1 day (Hooks & Utilities)
- **Phase 8**: 1-2 days (Configuration)
- **Phase 9**: 3-4 days (Testing)
- **Phase 10**: 2-3 days (Cleanup)
- **Phase 11**: 1-2 days (Documentation)

**Total Estimated Time**: 20-30 days

## Next Steps

1. Review and approve this documentation
2. Create new PMS project repository
3. Begin Phase 1: Pre-Migration Setup
4. Set up project tracking and milestones
5. Start systematic migration following the phases

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Author**: Claude AI Assistant
**Status**: Draft - Awaiting Approval
