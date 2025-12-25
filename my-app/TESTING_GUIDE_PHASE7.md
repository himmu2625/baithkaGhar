# Phase 7 Complete Testing Guide

**Version:** 1.0
**Date:** December 19, 2025
**Status:** Ready for Testing

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Module 1: PDF Receipt Generation](#module-1-pdf-receipt-generation)
3. [Module 2: Room Management System](#module-2-room-management-system)
4. [Module 3: Interactive Charts](#module-3-interactive-charts)
5. [Module 4: Enhanced UX](#module-4-enhanced-ux)
6. [Module 5: Notification System](#module-5-notification-system)
7. [Integration Testing](#integration-testing)
8. [Performance Testing](#performance-testing)
9. [Bug Reporting Template](#bug-reporting-template)

---

## Pre-Testing Setup

### Step 1: Start the Development Server

```bash
cd "C:\Users\Lenovo\Desktop\Baithaka GHAR website\my-app"
npm run dev
```

**Expected Result:** Server starts on `http://localhost:3000`

**Verification Checklist:**
- [ ] No build errors in console
- [ ] Server running message displayed
- [ ] Port 3000 is accessible

### Step 2: Verify Database Connection

1. Check MongoDB connection string in `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://admin:1bfWvYGmDMSiPUPf@cluster0.jxpwth5.mongodb.net/
   ```

2. Open browser DevTools (F12) → Console

3. Navigate to `http://localhost:3000`

**Expected Result:** No database connection errors

**Verification Checklist:**
- [ ] No "Failed to connect to database" errors
- [ ] No "MongoServerError" in console

### Step 3: Login as Property Owner

1. Navigate to: `http://localhost:3000/os/login`

2. Use existing owner credentials or create new account

3. Verify successful login and redirect to dashboard

**Expected Result:** Logged in and on `/os/dashboard`

**Verification Checklist:**
- [ ] Successfully logged in
- [ ] Redirected to owner dashboard
- [ ] Sidebar visible with navigation menu
- [ ] Header shows user avatar
- [ ] No authentication errors

### Step 4: Verify Test Data Exists

**Check for Required Data:**

1. **Properties:**
   - Navigate to: `/os/properties`
   - Verify at least 1 property exists
   - Note the property ID from URL when clicking on a property

2. **Bookings:**
   - Navigate to: `/os/bookings`
   - Verify at least 5-10 bookings exist
   - Note various booking statuses (confirmed, pending, completed)

3. **Room Types:**
   - Properties should have room types defined
   - Check in property details

**If Test Data Missing:**
Run the mock setup script:
```bash
npm run setup:mock-property
```

---

## Module 1: PDF Receipt Generation

### Test 1.1: Generate PDF Receipt for Completed Payment

**Prerequisites:**
- Must have a booking with `hotelPaymentStatus = 'collected'`

**Steps:**

1. Navigate to: `/os/bookings`

2. Find a booking with status "Confirmed" and green payment indicators

3. Click "View Details" on that booking

4. Scroll down to the "Payment Collection" section

5. Verify the "Download Receipt" button is visible
   - Should be a green button with Banknote icon
   - Button text: "Download Receipt"

6. Click the "Download Receipt" button

**Expected Results:**
- [ ] Button is visible and enabled
- [ ] Clicking button triggers PDF download
- [ ] PDF filename: `receipt-{bookingId}.pdf`
- [ ] PDF opens successfully in browser/PDF viewer

**PDF Content Verification:**

Open the downloaded PDF and verify:

1. **Header Section:**
   - [ ] Title: "PAYMENT RECEIPT" in large purple text
   - [ ] Property name displayed
   - [ ] Receipt number format: `REC-YYYYMMDD-XXXXXXXX`
   - [ ] Current date visible

2. **Property Details Section:**
   - [ ] Property title
   - [ ] Property location
   - [ ] Property address
   - [ ] Property email
   - [ ] Property contact number

3. **Guest Information Section:**
   - [ ] Guest name
   - [ ] Guest email
   - [ ] Guest phone number

4. **Booking Details Section:**
   - [ ] Booking ID (last 8 characters)
   - [ ] Check-in date (DD/MM/YYYY format)
   - [ ] Check-out date (DD/MM/YYYY format)
   - [ ] Number of nights calculated correctly
   - [ ] Number of guests

5. **Payment Breakdown Section:**
   - [ ] Online payment amount in ₹
   - [ ] Hotel payment amount in ₹
   - [ ] Total amount matches sum
   - [ ] All amounts formatted correctly (Indian format)

6. **Payment Status:**
   - [ ] Status badge displayed (green for "Paid & Collected")

7. **Footer:**
   - [ ] Thank you message
   - [ ] Professional footer text

**Test Cases:**

| Test Case | Expected Result | Status |
|-----------|----------------|---------|
| TC1.1.1: Generate receipt for booking with full payment | PDF generated successfully | ☐ Pass ☐ Fail |
| TC1.1.2: Verify receipt number uniqueness | Each receipt has unique number | ☐ Pass ☐ Fail |
| TC1.1.3: Verify currency formatting | All amounts in Indian Rupee format | ☐ Pass ☐ Fail |
| TC1.1.4: Verify date formatting | Dates in DD/MM/YYYY format | ☐ Pass ☐ Fail |
| TC1.1.5: Verify calculations | Nights calculated correctly | ☐ Pass ☐ Fail |

### Test 1.2: Receipt Button Visibility Based on Payment Status

**Steps:**

1. Navigate to: `/os/bookings`

2. Find bookings with different payment statuses:
   - Booking A: `hotelPaymentStatus = 'collected'`
   - Booking B: `hotelPaymentStatus = 'pending'`
   - Booking C: `onlinePaymentStatus = 'pending'`

3. For each booking, click "View Details"

4. Scroll to Payment Collection section

**Expected Results:**

| Booking | Hotel Payment Status | Button Visible? |
|---------|---------------------|-----------------|
| Booking A | collected | ✅ YES |
| Booking B | pending | ❌ NO |
| Booking C | pending | ❌ NO |

**Verification Checklist:**
- [ ] Button ONLY visible when `hotelPaymentStatus === 'collected'`
- [ ] Button hidden for pending payments
- [ ] Button hidden for failed payments
- [ ] No errors in console when button is hidden

### Test 1.3: API Endpoint Testing

**Test API Directly:**

1. Get a booking ID with collected payment

2. Open new browser tab

3. Navigate to: `http://localhost:3000/api/os/bookings/{bookingId}/receipt`

**Expected Results:**
- [ ] PDF downloads automatically
- [ ] Response has correct content-type: `application/pdf`
- [ ] Response has content-disposition header with filename
- [ ] No 401 Unauthorized errors
- [ ] No 404 Not Found errors
- [ ] No 500 Server errors

### Test 1.4: Error Handling

**Test Scenario 1: Invalid Booking ID**

1. Navigate to: `http://localhost:3000/api/os/bookings/invalid-id-123/receipt`

**Expected Result:**
- [ ] Returns 404 or 400 error
- [ ] Error message displayed
- [ ] No server crash

**Test Scenario 2: Unauthorized Access**

1. Logout from owner account

2. Try to access receipt URL directly

**Expected Result:**
- [ ] Returns 401 Unauthorized
- [ ] Redirected to login page
- [ ] No receipt generated

---

## Module 2: Room Management System

### Test 2.1: View Room Management Page

**Steps:**

1. Navigate to: `/os/properties`

2. Click on any property card

3. Look for "Rooms" or room management section

4. If not directly visible, manually navigate to: `/os/properties/{propertyId}/rooms`

**Expected Results:**
- [ ] Room management page loads successfully
- [ ] Page title: "Room Management"
- [ ] Property name displayed
- [ ] "Back to Property" link visible
- [ ] "Add Room" button visible in top right
- [ ] Stats cards displayed showing room counts by status

**Stats Cards Verification:**
- [ ] Total Rooms count
- [ ] Available rooms (green)
- [ ] Occupied rooms (blue)
- [ ] Maintenance rooms (orange)
- [ ] Cleaning rooms (purple)
- [ ] Reserved rooms (yellow)

### Test 2.2: View Room Cards

**Steps:**

1. On room management page, scroll down to rooms grid

2. Observe room cards (if rooms exist)

**If Rooms Exist - Verify Each Card Shows:**
- [ ] Room number (e.g., "Room 101")
- [ ] Room type (e.g., "Deluxe Suite")
- [ ] Floor, wing, block information
- [ ] Room image (from room type)
- [ ] Status badge with correct color
- [ ] Bed count and icon
- [ ] Guest capacity
- [ ] Room size in sqft/sqm
- [ ] Amenity icons (AC, TV, Kitchen, Minibar)
- [ ] Base rate in ₹
- [ ] "Edit" button (gray)
- [ ] "Delete" button (red)

**If No Rooms - Verify Empty State:**
- [ ] Empty state icon displayed
- [ ] "No Rooms Yet" heading
- [ ] Helpful message
- [ ] "Add First Room" button

### Test 2.3: Create New Room

**Steps:**

1. Click "Add Room" button (top right or in empty state)

2. Should navigate to: `/os/properties/{propertyId}/rooms/new`

3. Wait for room types to load

4. Room modal/form should appear

**Fill in Room Details:**

**Basic Information Section:**
- **Room Type:** Select "Deluxe Room" (or any available type)
- **Room Number:** Enter "301"
- **Floor:** Enter "3"
- **Wing:** Enter "East Wing"
- **Block:** Enter "Block A"
- **Status:** Select "Available"
- **Condition:** Select "Good"
- **Orientation:** Select "North"
- **Is Bookable:** Check the checkbox

**Size & Beds Section:**
- **Room Size:** Enter "400" and select "sqft"
- **King Beds:** Enter "1"
- **Queen Beds:** Enter "0"
- **Double Beds:** Enter "0"
- **Single Beds:** Enter "0"
- **Sofa Beds:** Enter "1"
- **Bunk Beds:** Enter "0"

**Amenities Section (Check the following):**
- [x] Air Conditioning
- [x] Smart TV
- [x] Balcony
- [ ] Terrace
- [ ] Kitchen
- [x] Work Desk
- [ ] Minibar
- [x] Safe
- [ ] Jacuzzi
- [ ] Garden Access
- [ ] Wheelchair Accessible

**Pricing Section:**
- **Base Rate:** Enter "5000"
- **Seasonal Multiplier:** Enter "1.2"

**Notes:**
- Enter: "Corner room with excellent view"

5. Click "Create Room" button

**Expected Results:**
- [ ] Form validates all required fields
- [ ] Loading state shows "Saving..." with spinner
- [ ] Success: Page redirects to room list
- [ ] New room appears in the grid
- [ ] Room card shows all entered details correctly
- [ ] No errors in console

**Verification Checklist:**
- [ ] Room number "301" is visible
- [ ] Status badge shows "Available" (green)
- [ ] Base rate shows "₹5,000/night"
- [ ] Amenity icons are correct
- [ ] "1 King Bed + 1 Sofa Bed" displayed correctly

### Test 2.4: Edit Existing Room

**Steps:**

1. On room management page, find the room you just created (Room 301)

2. Click the "Edit" button on the room card

3. Room modal should open with pre-filled data

**Verify Pre-filled Data:**
- [ ] All fields contain previous values
- [ ] Room number shows "301"
- [ ] Checkboxes reflect previous selections
- [ ] Amenities are checked correctly

**Make Changes:**
- Change **Room Number** to "302"
- Change **Base Rate** to "5500"
- Check **Minibar** amenity
- Change **Notes** to "Corner room with excellent view and minibar"

4. Click "Update Room" button

**Expected Results:**
- [ ] Loading state shows "Saving..."
- [ ] Modal closes automatically
- [ ] Page refreshes
- [ ] Room card now shows "Room 302"
- [ ] Base rate shows "₹5,500/night"
- [ ] Minibar icon appears
- [ ] Notes are updated (view in edit again to verify)
- [ ] No errors in console

### Test 2.5: Delete Room

**Steps:**

1. On room management page, find a room to delete (preferably the one you created)

2. Click the "Delete" button on room card

3. Delete confirmation modal should appear

**Verify Modal Contents:**
- [ ] Modal title: "Delete Room"
- [ ] Warning icon (red alert triangle)
- [ ] Confirmation message
- [ ] Room details displayed (number, type, floor, wing)
- [ ] Yellow warning box about active bookings
- [ ] "Cancel" button (gray)
- [ ] "Delete Room" button (red with alert icon)

4. Click "Cancel" button first

**Expected Result:**
- [ ] Modal closes
- [ ] Room still exists in list
- [ ] No deletion occurred

5. Click "Delete" button again

6. This time click "Delete Room" button

**Expected Results:**
- [ ] Loading state shows "Deleting..." with spinner
- [ ] Modal closes
- [ ] Page refreshes
- [ ] Room disappears from list
- [ ] Stats cards update (Total Rooms count decreases)
- [ ] No errors in console

**If Room Has Active Bookings:**
- [ ] Error message displayed
- [ ] Modal stays open
- [ ] Error text explains reason
- [ ] Room is NOT deleted

### Test 2.6: Room Status Badge Colors

**Steps:**

1. Create or edit rooms with different statuses

2. Verify badge colors:

| Status | Color | Border Color |
|--------|-------|--------------|
| Available | Green text | Green border |
| Occupied | Blue text | Blue border |
| Maintenance | Orange text | Orange border |
| Cleaning | Purple text | Purple border |
| Out of Order | Red text | Red border |
| Reserved | Yellow text | Yellow border |

**Verification Checklist:**
- [ ] Each status has distinct color
- [ ] Colors match the design system
- [ ] Status text is readable
- [ ] Badge is positioned correctly (top right of image)

### Test 2.7: Room Type Fetching

**Steps:**

1. Click "Add Room" button

2. Observe the "Room Type" dropdown

**Expected Results:**
- [ ] Dropdown initially shows "Select Room Type"
- [ ] After loading, dropdown contains room types for this property
- [ ] Room type names are displayed correctly
- [ ] Selecting a room type works

**If No Room Types:**
- [ ] Dropdown shows "Select Room Type"
- [ ] Can still proceed (system should handle this)

### Test 2.8: Form Validation

**Test Required Fields:**

1. Click "Add Room"

2. Try to submit form without filling any fields

3. Click "Create Room"

**Expected Results:**
- [ ] Form does not submit
- [ ] Required field validation messages appear
- [ ] Room Type field shows error
- [ ] Room Number field shows error
- [ ] Floor field shows error
- [ ] Base Rate field shows error

**Test Invalid Data:**

1. Fill form with invalid data:
   - Room Number: (leave empty)
   - Floor: Enter "-5"
   - Base Rate: Enter "0"

2. Try to submit

**Expected Results:**
- [ ] Validation prevents submission
- [ ] Floor cannot be negative
- [ ] Base rate must be greater than 0
- [ ] Helpful error messages shown

### Test 2.9: Room Number Uniqueness

**Steps:**

1. Create a room with number "401"

2. Try to create another room with same number "401"

3. Click "Create Room"

**Expected Results:**
- [ ] API returns error
- [ ] Error message: "Room number already exists for this property"
- [ ] Form stays open
- [ ] User can correct the room number
- [ ] No duplicate room created

### Test 2.10: Stats Accuracy

**Steps:**

1. Note current stats (Total, Available, etc.)

2. Create a new room with status "Available"

3. Refresh page

**Expected Results:**
- [ ] Total Rooms increased by 1
- [ ] Available rooms increased by 1
- [ ] Other counts unchanged

4. Edit a room and change status from "Available" to "Maintenance"

5. Refresh page

**Expected Results:**
- [ ] Available rooms decreased by 1
- [ ] Maintenance rooms increased by 1
- [ ] Total remains same

---

## Module 3: Interactive Charts

### Test 3.1: Access Analytics Page

**Steps:**

1. Navigate to: `/os/reports`

2. Look for "Interactive Analytics" button in header

3. Click the button

**Expected Results:**
- [ ] Navigates to: `/os/reports/analytics`
- [ ] Page loads successfully
- [ ] Page title: "Interactive Analytics"
- [ ] Date range displayed in subtitle
- [ ] "Change Date Range" button visible
- [ ] "Export" button visible

### Test 3.2: Date Range Picker

**Steps:**

1. On analytics page, click "Change Date Range" button

**Expected Results:**
- [ ] Date range picker panel appears below
- [ ] Shows two date inputs (Start Date and End Date)
- [ ] Both inputs have calendar icons
- [ ] Default dates are pre-filled (last 30 days)

**Test Date Inputs:**

1. Click on "Start Date" field

2. Browser date picker should open

3. Select a date (e.g., 30 days ago)

4. Click on "End Date" field

5. Select today's date

6. Click "Apply" button

**Expected Results:**
- [ ] Date inputs accept date selection
- [ ] Apply button is enabled
- [ ] Clicking Apply triggers data fetch
- [ ] Loading states appear on all charts
- [ ] Charts refresh with new data
- [ ] Date range picker closes automatically

### Test 3.3: Date Range Presets

**Steps:**

1. Click "Change Date Range" button

2. Observe preset buttons

**Verify All Presets Present:**
- [ ] Today
- [ ] Yesterday
- [ ] Last 7 Days
- [ ] Last 30 Days
- [ ] This Month
- [ ] Last Month
- [ ] This Year
- [ ] Last Year

**Test Each Preset:**

1. Click "Today" button

**Expected Results:**
- [ ] Start and End dates set to today
- [ ] Charts update immediately
- [ ] Date range picker closes
- [ ] Subtitle shows today's date range

2. Click "Last 7 Days" button

**Expected Results:**
- [ ] Start date = 7 days ago
- [ ] End date = today
- [ ] Charts show 7 days of data
- [ ] X-axis shows 7 data points

3. Click "This Month" button

**Expected Results:**
- [ ] Start date = 1st of current month
- [ ] End date = last day of current month
- [ ] Charts show current month data

4. Test remaining presets similarly

**Verification Checklist:**
- [ ] All preset buttons work
- [ ] Dates are calculated correctly
- [ ] Charts update for each preset
- [ ] No errors in console

### Test 3.4: Revenue Line Chart

**Steps:**

1. Set date range to "Last 30 Days"

2. Locate "Revenue Over Time" chart (top section, full width)

**Verify Chart Elements:**

**Header:**
- [ ] Title: "Revenue Over Time" with Rupee icon
- [ ] Trend indicator (up/down arrow with percentage)
- [ ] Total Revenue amount displayed
- [ ] Daily Average amount displayed

**Chart:**
- [ ] X-axis shows dates (formatted as "Dec 19")
- [ ] Y-axis shows amounts (formatted as "₹50k")
- [ ] Three lines visible:
  - Green line: "Online Payment"
  - Amber/Orange line: "Hotel Payment"
  - Blue/Indigo line: "Total Revenue"
- [ ] Legend at bottom shows all three lines
- [ ] Grid lines visible (light gray)

**Interactivity:**
- [ ] Hover over any data point
- [ ] Tooltip appears showing:
  - Date
  - Online Payment amount
  - Hotel Payment amount
  - Total Revenue amount
- [ ] All amounts formatted as Indian Rupees
- [ ] Tooltip follows cursor
- [ ] Active dot highlights on hover

**Test Cases:**

| Test | Action | Expected Result | Status |
|------|--------|----------------|---------|
| TC3.4.1 | Hover on data point | Tooltip shows all three values | ☐ Pass ☐ Fail |
| TC3.4.2 | Check line colors | Green, Amber, Indigo as specified | ☐ Pass ☐ Fail |
| TC3.4.3 | Verify amounts | Matches payment data in bookings | ☐ Pass ☐ Fail |
| TC3.4.4 | Check trend | Shows positive or negative trend | ☐ Pass ☐ Fail |

### Test 3.5: Bookings Bar Chart

**Steps:**

1. Locate "Bookings by Status" chart (left column, below revenue)

**Verify Chart Elements:**

**Header:**
- [ ] Title: "Bookings by Status" with Calendar icon
- [ ] Four summary stat cards:
  - Confirmed (green background)
  - Pending (yellow background)
  - Completed (blue background)
  - Cancelled (red background)
- [ ] Total bookings count displayed

**Chart:**
- [ ] X-axis shows dates
- [ ] Y-axis shows count (whole numbers only)
- [ ] Four colored bars for each date:
  - Green: Confirmed
  - Yellow: Pending
  - Blue: Completed
  - Red: Cancelled
- [ ] Bars are stacked or grouped
- [ ] Legend shows all four statuses

**Interactivity:**
- [ ] Hover over bars
- [ ] Tooltip shows date and count for that status
- [ ] Bar highlights on hover
- [ ] All statuses readable in tooltip

**Verify Accuracy:**
1. Note chart data (e.g., "10 Confirmed on Dec 15")
2. Navigate to `/os/bookings`
3. Filter by date and status
4. Count matches chart

### Test 3.6: Payment Pie Chart

**Steps:**

1. Locate "Payment Distribution" chart (right column, same row as bookings)

**Verify Chart Elements:**

**Header:**
- [ ] Title: "Payment Distribution" with Wallet icon
- [ ] Total Amount displayed in large text

**Pie Chart:**
- [ ] Three segments visible:
  - Green: Online Payment
  - Amber: Hotel Payment
  - Red: Pending Payment
- [ ] Percentage labels on each segment
- [ ] Segments sized correctly (larger amount = larger segment)

**Legend Cards (below chart):**
- [ ] Three detailed cards:

  **Card 1 - Online Payment:**
  - [ ] Green background
  - [ ] Credit card icon
  - [ ] Label: "Online Payment"
  - [ ] Amount in ₹
  - [ ] Percentage of total

  **Card 2 - Hotel Payment:**
  - [ ] Amber background
  - [ ] Banknote icon
  - [ ] Label: "Hotel Payment"
  - [ ] Amount in ₹
  - [ ] Percentage of total

  **Card 3 - Pending Payment (if > 0):**
  - [ ] Red background
  - [ ] Wallet icon
  - [ ] Label: "Pending Payment"
  - [ ] Amount in ₹
  - [ ] Percentage of total

**Interactivity:**
- [ ] Hover over pie segments
- [ ] Tooltip shows label and formatted amount
- [ ] Segment highlights on hover

**Verify Calculations:**
- [ ] Sum of all three amounts = Total Amount
- [ ] Percentages add up to 100%
- [ ] If no pending payment, only 2 segments shown

### Test 3.7: Occupancy Area Chart

**Steps:**

1. Locate "Occupancy Rate Over Time" chart (bottom, full width)

**Verify Chart Elements:**

**Header:**
- [ ] Title: "Occupancy Rate Over Time" with Building icon
- [ ] Trend indicator (up/down arrow)
- [ ] Three statistics:
  - Average occupancy (%)
  - Peak occupancy (green)
  - Lowest occupancy (orange)
- [ ] Status badge (Excellent/Good/Moderate/Low)

**Chart:**
- [ ] X-axis shows dates
- [ ] Y-axis shows percentages (0% to 100%)
- [ ] Area chart with gradient fill (blue/indigo)
- [ ] Line on top of filled area
- [ ] Smooth curves

**Status Indicator:**
- [ ] If avg ≥ 80%: Shows "Excellent" (green badge)
- [ ] If avg 60-79%: Shows "Good" (blue badge)
- [ ] If avg 40-59%: Shows "Moderate" (yellow badge)
- [ ] If avg < 40%: Shows "Low" (red badge)

**Interactivity:**
- [ ] Hover over area
- [ ] Tooltip shows:
  - Date
  - Occupancy rate (%)
  - Occupied rooms / Total rooms
- [ ] Tooltip formatted nicely

**Footer Legend:**
- [ ] Color-coded guide showing:
  - Green: 80-100%
  - Blue: 60-79%
  - Yellow: 40-59%
  - Red: 0-39%

### Test 3.8: Loading States

**Steps:**

1. Click "Change Date Range"

2. Select new dates

3. Click "Apply"

4. Observe charts immediately

**Expected Results:**
- [ ] All charts show skeleton loading animation
- [ ] Gray pulsing rectangles in place of charts
- [ ] Loading state for ~1-2 seconds
- [ ] Charts smoothly transition from loading to data
- [ ] No flash of empty content

### Test 3.9: Empty States

**Test Scenario: No Data for Selected Range**

1. Set date range to far future (e.g., next year)

2. Click "Apply"

**Expected Results:**
- [ ] Charts show empty state messages:
  - Revenue: "No revenue data available for the selected period"
  - Bookings: "No booking data available for the selected period"
  - Payment: "No payment data available for the selected period"
  - Occupancy: "No occupancy data available for the selected period"
- [ ] Empty state icons displayed
- [ ] No errors or crashes
- [ ] Can still change date range

### Test 3.10: Export Functionality

**Steps:**

1. On analytics page with charts loaded

2. Click "Export" button (top right)

**Expected Results:**
- [ ] Browser print dialog opens
- [ ] Page is formatted for printing
- [ ] Charts are visible in print preview
- [ ] Date range and summary shown
- [ ] Can print to PDF
- [ ] Can print to printer
- [ ] Printed version looks professional

### Test 3.11: Summary Footer

**Steps:**

1. Scroll to bottom of analytics page

2. Locate gradient summary box

**Verify Summary Shows:**
- [ ] Total Revenue (sum of online + hotel payment)
- [ ] Total Bookings (sum of all statuses)
- [ ] Average Occupancy (% calculated from all days)
- [ ] Pending Collection (pending payment amount)
- [ ] All amounts formatted correctly
- [ ] Proper labels and descriptions

### Test 3.12: Responsive Design

**Steps:**

1. Open browser DevTools (F12)

2. Toggle device toolbar (Ctrl+Shift+M)

3. Test different screen sizes:

**Desktop (1920x1080):**
- [ ] Charts in 2-column grid
- [ ] Revenue chart full width
- [ ] Bookings and Payment side-by-side
- [ ] Occupancy full width

**Tablet (768x1024):**
- [ ] Charts stack vertically
- [ ] All charts full width
- [ ] Date picker responsive
- [ ] Tooltips still work

**Mobile (375x667):**
- [ ] Charts stack vertically
- [ ] Date picker stacks inputs
- [ ] Summary cards stack
- [ ] Export button might be smaller
- [ ] Charts still interactive

---

## Module 4: Enhanced UX

### Test 4.1: Search Functionality

**Steps:**

1. Navigate to: `/os/bookings`

2. Locate search bar at top

**Verify Search Bar:**
- [ ] Search icon visible on left
- [ ] Placeholder text: "Search by guest name, email, property, or booking ID..."
- [ ] Input is full width
- [ ] Typing is responsive

**Test Search by Guest Name:**

1. Type a guest name (e.g., "John")

2. Observe results update in real-time

**Expected Results:**
- [ ] Results filter instantly (no page reload)
- [ ] Only bookings with matching guest name shown
- [ ] Results count updates: "Showing X of Y bookings"
- [ ] If no matches: "No bookings found matching your criteria"

**Test Search by Email:**

1. Clear search (delete all text)

2. Type an email (e.g., "john@")

**Expected Results:**
- [ ] Results filter to matching emails
- [ ] Instant filtering
- [ ] Count updates

**Test Search by Property:**

1. Type property name

**Expected Results:**
- [ ] Bookings for that property shown
- [ ] Other properties hidden

**Test Search by Booking ID:**

1. Copy a booking ID from table

2. Paste into search box

**Expected Results:**
- [ ] Only that specific booking shown
- [ ] Shows "Showing 1 of X bookings"

**Test Partial Matches:**

1. Type partial text (e.g., "joh" for "John")

**Expected Results:**
- [ ] Partial matches work
- [ ] Case-insensitive search
- [ ] Results update as you type

**Test Clear Search:**

1. Clear search box (delete all text)

**Expected Results:**
- [ ] All bookings shown again
- [ ] Count returns to total
- [ ] Table refreshes

**Test Cases:**

| Test | Search Query | Expected Result | Status |
|------|--------------|----------------|---------|
| TC4.1.1 | "John" | Shows bookings with guest name John | ☐ Pass ☐ Fail |
| TC4.1.2 | "john@example.com" | Shows booking with that email | ☐ Pass ☐ Fail |
| TC4.1.3 | "Deluxe" | Shows bookings for properties with Deluxe | ☐ Pass ☐ Fail |
| TC4.1.4 | Booking ID | Shows only that booking | ☐ Pass ☐ Fail |
| TC4.1.5 | "xyz123random" | Shows "No bookings found" message | ☐ Pass ☐ Fail |

### Test 4.2: Advanced Filters

**Steps:**

1. On bookings page, click "Show Filters" button

**Expected Results:**
- [ ] Filter panel expands below search bar
- [ ] Panel has white background and border
- [ ] Shows "Filters" heading
- [ ] Two filter sections visible

**Booking Status Filter:**

**Verify Filter Buttons:**
- [ ] All (default selected - indigo background)
- [ ] Confirmed (green when selected)
- [ ] Pending (yellow when selected)
- [ ] Completed (blue when selected)
- [ ] Cancelled (red when selected)

**Test Status Filtering:**

1. Click "Confirmed" button

**Expected Results:**
- [ ] Button highlights (green background)
- [ ] Table shows only confirmed bookings
- [ ] Count updates
- [ ] Pagination resets to page 1

2. Click "All" button

**Expected Results:**
- [ ] All bookings shown again
- [ ] "All" button highlighted

**Payment Status Filter:**

**Verify Filter Buttons:**
- [ ] All (default)
- [ ] Fully Paid (green when selected)
- [ ] Partial Payment (orange when selected)
- [ ] Payment Pending (red when selected)

**Test Payment Filtering:**

1. Click "Fully Paid" button

**Expected Results:**
- [ ] Shows only bookings where both online and hotel payments are completed
- [ ] Table filters accordingly
- [ ] Count updates

2. Click "Partial Payment" button

**Expected Results:**
- [ ] Shows bookings with online paid but hotel pending
- [ ] Correct bookings displayed

**Test Combined Filters:**

1. Select Status = "Confirmed"

2. Select Payment = "Partial Payment"

**Expected Results:**
- [ ] Shows bookings that are BOTH confirmed AND partial payment
- [ ] Filters work together (AND logic)
- [ ] Count shows filtered result

**Clear All Filters:**

1. After setting some filters, look for "Clear all filters" link

2. Click the link

**Expected Results:**
- [ ] All filters reset to "All"
- [ ] Search box clears
- [ ] All bookings shown
- [ ] Pagination resets

### Test 4.3: Bulk Selection

**Steps:**

1. On bookings page, look at the table

2. First column should have checkboxes

**Test Select Individual Booking:**

1. Click checkbox on first booking row

**Expected Results:**
- [ ] Checkbox shows as checked (checkmark)
- [ ] Blue action bar appears at top
- [ ] Shows "1 booking selected"
- [ ] "Bulk Actions" button visible
- [ ] "Clear Selection" button visible

2. Click checkbox on second booking

**Expected Results:**
- [ ] Both checkboxes checked
- [ ] Shows "2 bookings selected"
- [ ] Action bar remains visible

**Test Select All:**

1. Click checkbox in table header (first column)

**Expected Results:**
- [ ] All visible bookings on current page selected
- [ ] All checkboxes checked
- [ ] Shows "10 bookings selected" (or however many on page)
- [ ] Header checkbox shows as checked

2. Click header checkbox again

**Expected Results:**
- [ ] All bookings deselected
- [ ] All checkboxes unchecked
- [ ] Action bar disappears

**Test Clear Selection Button:**

1. Select a few bookings

2. Click "Clear Selection" button in action bar

**Expected Results:**
- [ ] All selections cleared
- [ ] Action bar disappears
- [ ] Checkboxes unchecked

### Test 4.4: Bulk Actions

**Steps:**

1. Select 2-3 bookings using checkboxes

2. Click "Bulk Actions" button

**Expected Results:**
- [ ] Bulk actions menu appears below button
- [ ] Four action buttons visible:
  - "Mark as Confirmed"
  - "Mark as Completed"
  - "Cancel Selected"
  - "Export Selected"

**Note:** Bulk actions may not be fully implemented (backend logic needed)

**Verify UI Only:**
- [ ] Buttons are visible
- [ ] Buttons are clickable
- [ ] Buttons have appropriate styling
- [ ] Cancel button is red
- [ ] Export has download icon

### Test 4.5: Pagination

**Prerequisites:**
- Need more than 10 bookings to see pagination

**Steps:**

1. On bookings page, scroll to bottom

2. Look for pagination controls

**Verify Pagination Elements:**
- [ ] Shows "Showing X to Y of Z bookings"
- [ ] "Previous" button visible
- [ ] Page number buttons visible (1, 2, 3, 4, 5)
- [ ] "Next" button visible

**Test Initial State:**
- [ ] Currently on page 1
- [ ] Page 1 button highlighted (indigo background)
- [ ] "Previous" button is disabled/grayed out
- [ ] "Next" button is enabled

**Test Next Page:**

1. Click "Next" button

**Expected Results:**
- [ ] Navigates to page 2
- [ ] Table shows items 11-20
- [ ] Page 2 button highlighted
- [ ] "Previous" button now enabled
- [ ] Count updates: "Showing 11 to 20 of X"
- [ ] Table scrolls to top automatically

**Test Previous Page:**

1. Click "Previous" button

**Expected Results:**
- [ ] Returns to page 1
- [ ] Shows items 1-10
- [ ] Page 1 highlighted
- [ ] "Previous" disabled again

**Test Direct Page Navigation:**

1. Click page number button (e.g., "3")

**Expected Results:**
- [ ] Jumps to page 3
- [ ] Shows items 21-30
- [ ] Page 3 highlighted
- [ ] Count updates

**Test Last Page:**

1. Click "Next" repeatedly until last page

**Expected Results:**
- [ ] Reaches last page
- [ ] "Next" button disabled
- [ ] Shows remaining items (may be less than 10)
- [ ] Count accurate

**Test Page Numbers Display:**

When on page 1-3:
- [ ] Shows pages: 1, 2, 3, 4, 5

When on page 10:
- [ ] Shows pages centered around 10 (e.g., 8, 9, 10, 11, 12)

**Test Pagination with Filters:**

1. Apply a filter that reduces results

2. Observe pagination

**Expected Results:**
- [ ] Pagination updates based on filtered count
- [ ] If filtered results < 10, no pagination shown
- [ ] Current page resets to 1

### Test 4.6: Enhanced Table Display

**Steps:**

1. On bookings page, examine the table

**Verify Table Columns:**
- [ ] Checkbox column
- [ ] Guest (name + email)
- [ ] Property
- [ ] Dates (check-in and check-out)
- [ ] Amount (total in ₹)
- [ ] Status (with color badge)
- [ ] Payment (online + hotel status)
- [ ] Actions ("View Details" link)

**Verify Status Badges:**
- [ ] Confirmed: Green background
- [ ] Pending: Yellow background
- [ ] Completed: Blue background
- [ ] Cancelled: Red background
- [ ] Badge has border and rounded corners

**Verify Payment Status:**
- [ ] Two lines:
  - "Online: paid/pending"
  - "Hotel: collected/pending"
- [ ] Green text for paid/collected
- [ ] Red/orange text for pending

**Test Row Hover:**
- [ ] Hovering on row changes background (light gray)
- [ ] Row highlights smoothly

**Test View Details Link:**
- [ ] Click "View Details" link
- [ ] Navigates to booking detail page
- [ ] URL: `/os/bookings/{bookingId}`

### Test 4.7: Results Count

**Steps:**

1. On bookings page with no filters

2. Observe text: "Showing X of Y bookings"

**Expected Results:**
- [ ] X = total number of bookings
- [ ] Y = total number of bookings
- [ ] Example: "Showing 45 of 45 bookings"

**With Search/Filters:**

1. Type search query or apply filter

**Expected Results:**
- [ ] X updates to filtered count
- [ ] Y remains total count
- [ ] Example: "Showing 12 of 45 bookings"

**With Pagination:**

1. Go to page 2

**Expected Results:**
- [ ] Shows "Showing 11 to 20 of 45 bookings"
- [ ] Accurately reflects current page items

### Test 4.8: Performance

**Test with Large Dataset:**

1. Search/filter with many results (50+ bookings)

**Expected Results:**
- [ ] Filtering is instant (no lag)
- [ ] Typing in search is smooth
- [ ] No freezing or stuttering
- [ ] Console shows no performance warnings

**Test Rapid Filtering:**

1. Quickly change filters multiple times

**Expected Results:**
- [ ] Each filter change processes correctly
- [ ] No race conditions
- [ ] Final result matches last filter
- [ ] No errors in console

---

## Module 5: Notification System

### Test 5.1: Notification Bell Icon

**Steps:**

1. Login to owner dashboard

2. Look at top right header area

**Verify Bell Icon:**
- [ ] Bell icon visible next to user avatar
- [ ] Bell is clickable
- [ ] Icon is properly styled (gray, hover effect)

**Check Unread Badge:**

If notifications exist:
- [ ] Red badge on top-right of bell
- [ ] Badge shows unread count
- [ ] If count > 9, shows "9+"
- [ ] Badge is clearly visible

If no notifications:
- [ ] No badge shown
- [ ] Bell icon still visible

### Test 5.2: Open Notification Panel

**Steps:**

1. Click bell icon

**Expected Results:**
- [ ] Dropdown panel appears
- [ ] Panel width: ~400px
- [ ] Panel positioned below and right-aligned to bell
- [ ] Panel has white background with shadow
- [ ] Panel appears smoothly (no flashing)

**Verify Panel Header:**
- [ ] Title: "Notifications"
- [ ] If unread > 0: Shows "X unread" below title
- [ ] "Mark all read" button visible (if unread > 0)
- [ ] Close button (X) in top right

### Test 5.3: View Notifications

**Prerequisites:**
- Need to create test notifications first

**Create Test Notifications:**

1. Open new browser tab

2. Navigate to: `http://localhost:3000/api/os/notifications`

3. Or use this curl command (replace USER_ID):
```bash
curl -X POST http://localhost:3000/api/os/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking",
    "title": "New Booking Received",
    "message": "John Doe has made a new booking at your property",
    "priority": "high"
  }'
```

**Alternative: Create via Browser Console**

On any OS page, open console and run:
```javascript
fetch('/api/os/notifications', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    type: 'booking',
    title: 'New Booking Received',
    message: 'John Doe has made a new booking',
    priority: 'high'
  })
}).then(r => r.json()).then(console.log);
```

**Create Multiple Test Notifications:**

Run above code multiple times with different data:

```javascript
// Payment notification
{type: 'payment', title: 'Payment Received', message: 'Received ₹5,000 from Jane Smith', priority: 'medium'}

// Room notification
{type: 'room', title: 'Room Maintenance Required', message: 'Room 301: AC not working', priority: 'high'}

// Alert notification
{type: 'alert', title: 'Low Occupancy Alert', message: 'Property has only 30% occupancy', priority: 'urgent'}

// System notification
{type: 'system', title: 'System Update', message: 'New features added to dashboard', priority: 'low'}
```

**Now Test Viewing:**

1. Click bell icon

2. Panel should show notifications

**Verify Notification Items:**

For each notification, check:
- [ ] Icon circle with appropriate icon:
  - Booking: Calendar icon, blue background
  - Payment: Credit card icon, green background
  - Room: Door icon, purple background
  - Alert: Alert triangle icon, red background
  - System: Info icon, gray background
- [ ] Title text is bold
- [ ] Message text is visible (gray)
- [ ] Relative timestamp (e.g., "5m ago", "2h ago")
- [ ] If unread: Light blue background + blue dot on right
- [ ] If read: White background, no dot

**Verify Priority Indicators:**
- [ ] Urgent: Red left border (4px)
- [ ] High: Orange left border
- [ ] Medium: Blue left border
- [ ] Low: Gray left border

### Test 5.4: Mark Notification as Read

**Steps:**

1. Find an unread notification (has blue dot and light blue background)

2. Click anywhere on the notification item

**Expected Results:**
- [ ] Blue dot disappears
- [ ] Background changes from light blue to white
- [ ] Notification stays in list
- [ ] Unread count decreases by 1
- [ ] Badge on bell updates

**If Notification Has Link:**
- [ ] Clicking navigates to link URL
- [ ] Panel closes automatically
- [ ] Page navigates correctly

### Test 5.5: Mark All as Read

**Steps:**

1. Create/have multiple unread notifications

2. Click bell to open panel

3. Click "Mark all read" button (top right of panel header)

**Expected Results:**
- [ ] All notifications instantly marked as read
- [ ] All blue dots disappear
- [ ] All backgrounds change to white
- [ ] Unread count in header shows "0 unread" (text may disappear)
- [ ] Badge on bell disappears
- [ ] Panel stays open

### Test 5.6: Delete Notification

**Steps:**

1. Open notification panel

2. Find any notification

3. Look for trash icon on the right side

4. Hover over trash icon

**Expected Results:**
- [ ] Trash icon visible
- [ ] Icon color changes on hover (gray → red)

5. Click trash icon

**Expected Results:**
- [ ] Notification immediately removed from list
- [ ] Panel re-renders without that notification
- [ ] If was unread, unread count decreases
- [ ] No errors in console
- [ ] Other notifications remain

### Test 5.7: Action Buttons

**Create Notification with Action:**

```javascript
fetch('/api/os/notifications', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    type: 'booking',
    title: 'Payment Collection Pending',
    message: 'Collect ₹3,000 from guest',
    priority: 'high',
    actionLabel: 'Collect Payment',
    actionUrl: '/os/bookings/123'
  })
}).then(r => r.json()).then(console.log);
```

**Test Action Button:**

1. Find notification with action button

**Verify Button:**
- [ ] Button text matches actionLabel
- [ ] Button is blue/indigo color
- [ ] Button has external link icon
- [ ] Button is positioned below message

2. Click action button

**Expected Results:**
- [ ] Navigates to actionUrl
- [ ] Panel closes
- [ ] Page loads correctly

### Test 5.8: Notification Types

**Create One of Each Type:**

Use the console/API to create:
1. Booking notification
2. Payment notification
3. Room notification
4. Review notification
5. System notification
6. Alert notification

**Verify Each Type:**

| Type | Icon | Background Color | Correct? |
|------|------|-----------------|----------|
| booking | Calendar | Blue | ☐ |
| payment | Credit Card | Green | ☐ |
| room | Door | Purple | ☐ |
| review | Star | Yellow | ☐ |
| system | Info | Gray | ☐ |
| alert | Alert Triangle | Red | ☐ |

### Test 5.9: Auto-Refresh

**Steps:**

1. Open notification panel

2. Keep panel open

3. In another browser tab/window (logged in as same user):
   - Create a new notification via API

4. Wait 30 seconds (auto-refresh interval)

5. Check first tab's notification panel

**Expected Results:**
- [ ] New notification appears automatically
- [ ] Unread count updates
- [ ] Badge updates
- [ ] No page reload needed

**Note:** This tests polling mechanism (every 30 seconds)

### Test 5.10: Close Panel

**Test Click Outside:**

1. Open notification panel

2. Click anywhere outside the panel (on page body)

**Expected Results:**
- [ ] Panel closes immediately
- [ ] Bell icon remains visible
- [ ] Badge remains if unread notifications exist

**Test Close Button:**

1. Open panel

2. Click X button in top right

**Expected Results:**
- [ ] Panel closes
- [ ] Same as clicking outside

### Test 5.11: Empty State

**Steps:**

1. Delete all notifications

2. Click bell icon

**Expected Results:**
- [ ] Panel opens
- [ ] Shows empty state:
  - Bell icon (large, gray)
  - Text: "No notifications yet"
- [ ] No errors
- [ ] Panel still functional

### Test 5.12: Loading State

**Steps:**

1. Clear browser cache

2. Reload page

3. Quickly click bell icon (before notifications load)

**Expected Results:**
- [ ] Shows loading spinner
- [ ] Text: "Loading..."
- [ ] After 1-2 seconds, notifications appear
- [ ] Smooth transition from loading to content

### Test 5.13: Notification Templates (Developer Testing)

**Test in Browser Console:**

```javascript
// Import function (if accessible)
// Or call API with template data

// Test new booking template
fetch('/api/os/notifications', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    type: 'booking',
    title: 'New Booking Received',
    message: 'John Smith has made a new booking at Taj Palace',
    priority: 'high',
    link: '/os/bookings/123',
    actionLabel: 'View Booking',
    actionUrl: '/os/bookings/123'
  })
});

// Test payment received
fetch('/api/os/notifications', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    type: 'payment',
    title: 'Payment Received',
    message: 'Received ₹8,500 from Sarah Johnson',
    priority: 'medium'
  })
});
```

**Verify:**
- [ ] Each template creates correct notification
- [ ] All fields populated correctly
- [ ] Priority, type, icons correct

### Test 5.14: Notification Limits

**Test Panel Scroll:**

1. Create 15+ notifications

2. Open notification panel

**Expected Results:**
- [ ] Panel height limited (600px max)
- [ ] Scrollbar appears
- [ ] Can scroll through all notifications
- [ ] Header stays fixed at top
- [ ] Footer stays fixed at bottom

**Test "View all notifications":**

1. At bottom of panel, look for link

2. Click "View all notifications"

**Expected Results:**
- [ ] Panel closes
- [ ] Could navigate to full notifications page (if implemented)
- [ ] Or shows message that feature is coming

---

## Integration Testing

### Integration Test 1: Complete Booking Flow with Notifications

**Scenario:** Create booking → Collect payment → Generate receipt → Check notifications

**Steps:**

1. **Create a Booking** (if not exists):
   - Go to main site (customer side)
   - Make a booking
   - Complete online payment

2. **Owner Receives Notification:**
   - Login as owner
   - Check bell icon
   - Should have notification: "New Booking Received"
   - Click notification
   - Should navigate to booking details

3. **Collect Hotel Payment:**
   - On booking detail page
   - Enter hotel payment amount
   - Click "Mark as Collected"
   - Should see success message

4. **Check Payment Notification:**
   - Check bell icon
   - Should have new notification: "Hotel Payment Collected"

5. **Generate Receipt:**
   - Scroll to payment section
   - Click "Download Receipt"
   - Verify PDF downloads

**Expected Results:**
- [ ] Each step triggers appropriate notification
- [ ] Notifications appear in real-time (within 30 seconds)
- [ ] Receipt generates correctly
- [ ] All data is consistent across pages

### Integration Test 2: Room Management with Analytics

**Scenario:** Create rooms → View in analytics → Check occupancy

**Steps:**

1. **Create Multiple Rooms:**
   - Go to `/os/properties/{id}/rooms`
   - Create 5 rooms with different statuses
   - 2 Available, 1 Occupied, 1 Maintenance, 1 Cleaning

2. **Verify Stats Update:**
   - Check stats cards on room page
   - Should show correct counts

3. **Check Analytics:**
   - Go to `/os/reports/analytics`
   - Select date range
   - Check Occupancy chart
   - Should reflect room data

4. **Change Room Status:**
   - Edit a room from Available to Occupied
   - Go back to analytics
   - Verify occupancy rate changed

**Expected Results:**
- [ ] Room creation updates stats immediately
- [ ] Analytics reflects room data
- [ ] Status changes propagate to analytics
- [ ] Calculations are accurate

### Integration Test 3: Search, Filter, and Export Flow

**Scenario:** Search bookings → Filter results → Select multiple → Attempt export

**Steps:**

1. **Search for Specific Guest:**
   - Go to `/os/bookings`
   - Search for a guest name
   - Results filter

2. **Apply Additional Filter:**
   - Click "Show Filters"
   - Select Status: "Confirmed"
   - Results further refined

3. **Select Multiple Bookings:**
   - Check 3-4 booking checkboxes
   - Verify bulk action bar appears

4. **Attempt Export:**
   - Click "Bulk Actions"
   - Click "Export Selected"
   - (May show "Coming soon" or trigger download)

5. **Clear and Reset:**
   - Click "Clear all filters"
   - Click "Clear Selection"
   - Verify return to initial state

**Expected Results:**
- [ ] Search and filters work together
- [ ] Selection persists during filtering
- [ ] Bulk actions are accessible
- [ ] Clear actions reset everything

### Integration Test 4: Multi-Property Owner

**Scenario:** Owner with multiple properties sees aggregated data

**Prerequisites:**
- Owner account linked to 2+ properties

**Steps:**

1. **Check Dashboard:**
   - View overall stats
   - Should show combined data from all properties

2. **Check Analytics (All Properties):**
   - Go to `/os/reports/analytics`
   - Don't select specific property
   - Charts should show aggregate data

3. **Check Notifications:**
   - Should receive notifications from all properties
   - Each notification should indicate which property

4. **Filter by Property:**
   - Use property filter (if exists)
   - Data should filter to that property only

**Expected Results:**
- [ ] Can see data from all properties
- [ ] Can filter to specific property
- [ ] Notifications are property-specific
- [ ] Authorization works for all owned properties

---

## Performance Testing

### Performance Test 1: Large Dataset

**Setup:**
- 1000+ bookings in database
- 50+ rooms
- 100+ notifications

**Test:**

1. Navigate to `/os/bookings`

**Measure:**
- [ ] Page load time < 3 seconds
- [ ] Search response time < 500ms
- [ ] Filter response time < 500ms
- [ ] Pagination smooth (no lag)

2. Navigate to `/os/reports/analytics`

**Measure:**
- [ ] Charts render < 2 seconds
- [ ] Date range change < 1 second
- [ ] No browser freezing

3. Open notification panel

**Measure:**
- [ ] Panel opens instantly
- [ ] List scrolling is smooth
- [ ] No lag when marking as read

### Performance Test 2: Network Throttling

**Setup:**
- Browser DevTools → Network tab
- Set throttling to "Slow 3G"

**Test All Modules:**

1. Load each page
2. Interact with features

**Expected Results:**
- [ ] Loading states show appropriately
- [ ] No features break due to slow network
- [ ] User feedback is clear
- [ ] No infinite loading spinners

### Performance Test 3: Memory Leaks

**Test:**

1. Open browser DevTools → Performance tab

2. Start recording

3. Perform actions:
   - Open/close notification panel 10 times
   - Search/filter multiple times
   - Navigate between pages
   - Open/close modals

4. Stop recording

**Expected Results:**
- [ ] Memory usage returns to baseline
- [ ] No continuous memory growth
- [ ] No memory leaks detected

---

## Bug Reporting Template

### Bug Report Format

```markdown
## Bug Report

**Bug ID:** BUG-001
**Date Found:** YYYY-MM-DD
**Severity:** Critical / High / Medium / Low
**Module:** Module 1 / Module 2 / etc.

### Description
[Clear, concise description of the issue]

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Screenshots
[Attach screenshots if applicable]

### Console Errors
[Paste any console errors]

### Environment
- Browser: Chrome 120 / Firefox 121 / etc.
- OS: Windows 11 / Mac OS / etc.
- Screen Size: 1920x1080 / Mobile / etc.

### Additional Notes
[Any other relevant information]
```

### Example Bug Report

```markdown
## Bug Report

**Bug ID:** BUG-001
**Date Found:** 2025-12-19
**Severity:** High
**Module:** Module 1 - PDF Receipt Generation

### Description
PDF receipt is not generating for bookings with partial payment.

### Steps to Reproduce
1. Go to /os/bookings
2. Find booking with onlinePaymentStatus: 'paid' and hotelPaymentStatus: 'pending'
3. Mark hotel payment as collected
4. Try to download receipt
5. Download button doesn't appear

### Expected Result
Download receipt button should appear after marking payment as collected.

### Actual Result
Button remains hidden. Page needs refresh to see button.

### Console Errors
None

### Environment
- Browser: Chrome 120
- OS: Windows 11
- Screen Size: 1920x1080

### Additional Notes
Seems like client-side state is not updating after API call.
```

---

## Test Results Tracking

### Module 1: PDF Receipt Generation

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 1.1 | Generate PDF | ☐ Pass ☐ Fail | |
| 1.2 | Button visibility | ☐ Pass ☐ Fail | |
| 1.3 | API endpoint | ☐ Pass ☐ Fail | |
| 1.4 | Error handling | ☐ Pass ☐ Fail | |

### Module 2: Room Management

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 2.1 | View page | ☐ Pass ☐ Fail | |
| 2.2 | View cards | ☐ Pass ☐ Fail | |
| 2.3 | Create room | ☐ Pass ☐ Fail | |
| 2.4 | Edit room | ☐ Pass ☐ Fail | |
| 2.5 | Delete room | ☐ Pass ☐ Fail | |
| 2.6 | Status badges | ☐ Pass ☐ Fail | |
| 2.7 | Room types | ☐ Pass ☐ Fail | |
| 2.8 | Validation | ☐ Pass ☐ Fail | |
| 2.9 | Uniqueness | ☐ Pass ☐ Fail | |
| 2.10 | Stats accuracy | ☐ Pass ☐ Fail | |

### Module 3: Interactive Charts

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 3.1 | Access page | ☐ Pass ☐ Fail | |
| 3.2 | Date picker | ☐ Pass ☐ Fail | |
| 3.3 | Presets | ☐ Pass ☐ Fail | |
| 3.4 | Revenue chart | ☐ Pass ☐ Fail | |
| 3.5 | Bookings chart | ☐ Pass ☐ Fail | |
| 3.6 | Payment chart | ☐ Pass ☐ Fail | |
| 3.7 | Occupancy chart | ☐ Pass ☐ Fail | |
| 3.8 | Loading states | ☐ Pass ☐ Fail | |
| 3.9 | Empty states | ☐ Pass ☐ Fail | |
| 3.10 | Export | ☐ Pass ☐ Fail | |
| 3.11 | Summary | ☐ Pass ☐ Fail | |
| 3.12 | Responsive | ☐ Pass ☐ Fail | |

### Module 4: Enhanced UX

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 4.1 | Search | ☐ Pass ☐ Fail | |
| 4.2 | Filters | ☐ Pass ☐ Fail | |
| 4.3 | Bulk selection | ☐ Pass ☐ Fail | |
| 4.4 | Bulk actions | ☐ Pass ☐ Fail | |
| 4.5 | Pagination | ☐ Pass ☐ Fail | |
| 4.6 | Table display | ☐ Pass ☐ Fail | |
| 4.7 | Results count | ☐ Pass ☐ Fail | |
| 4.8 | Performance | ☐ Pass ☐ Fail | |

### Module 5: Notifications

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| 5.1 | Bell icon | ☐ Pass ☐ Fail | |
| 5.2 | Open panel | ☐ Pass ☐ Fail | |
| 5.3 | View notifications | ☐ Pass ☐ Fail | |
| 5.4 | Mark as read | ☐ Pass ☐ Fail | |
| 5.5 | Mark all read | ☐ Pass ☐ Fail | |
| 5.6 | Delete | ☐ Pass ☐ Fail | |
| 5.7 | Action buttons | ☐ Pass ☐ Fail | |
| 5.8 | Notification types | ☐ Pass ☐ Fail | |
| 5.9 | Auto-refresh | ☐ Pass ☐ Fail | |
| 5.10 | Close panel | ☐ Pass ☐ Fail | |
| 5.11 | Empty state | ☐ Pass ☐ Fail | |
| 5.12 | Loading state | ☐ Pass ☐ Fail | |
| 5.13 | Templates | ☐ Pass ☐ Fail | |
| 5.14 | Limits | ☐ Pass ☐ Fail | |

---

## Final Sign-Off

### Testing Completed By:
- **Name:** ___________________
- **Date:** ___________________
- **Signature:** ___________________

### Overall Results:

**Total Tests:** _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Pass Rate:** _____%

### Critical Issues Found:
1.
2.
3.

### Recommendation:
☐ Ready for Production
☐ Needs Minor Fixes
☐ Needs Major Fixes
☐ Not Ready

### Notes:
_________________________________________
_________________________________________
_________________________________________

---

**End of Testing Guide**
