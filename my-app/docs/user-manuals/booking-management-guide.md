# Booking Management User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Creating New Bookings](#creating-new-bookings)
4. [Managing Existing Bookings](#managing-existing-bookings)
5. [Guest Management](#guest-management)
6. [Room Assignment](#room-assignment)
7. [Payment Processing](#payment-processing)
8. [Reports and Analytics](#reports-and-analytics)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet**: Stable internet connection required
- **Screen Resolution**: Minimum 1024x768 (Recommended: 1440x900 or higher)
- **JavaScript**: Must be enabled

### Logging In

1. Navigate to your property management system URL
2. Enter your email address and password
3. Click "Sign In"
4. If you have multiple properties, select the property you want to manage

### First-Time Setup

After logging in for the first time:

1. **Complete Your Profile**
   - Go to Settings > Profile
   - Add your full name and contact information
   - Set your timezone and language preferences

2. **Configure Property Settings**
   - Navigate to Settings > Property
   - Verify room types and capacity
   - Set check-in/check-out times
   - Configure pricing rules

3. **Set Up Payment Methods**
   - Go to Settings > Payments
   - Connect your preferred payment gateway
   - Configure payment processing options

---

## Dashboard Overview

The booking dashboard is your central hub for managing all reservations. Here's what you'll see:

### Main Dashboard Sections

#### 1. **Summary Cards** (Top Row)
- **Total Bookings**: All bookings for selected period
- **Today's Arrivals**: Guests checking in today
- **Today's Departures**: Guests checking out today
- **Revenue**: Total revenue for selected period
- **Occupancy Rate**: Current occupancy percentage

#### 2. **Quick Actions** (Action Bar)
- **New Booking**: Create a new reservation
- **Walk-in**: Register walk-in guests
- **Check-in**: Process guest arrivals
- **Check-out**: Process guest departures
- **Reports**: Access reporting tools

#### 3. **Booking List** (Main Area)
- Displays all bookings with key information
- Sortable by date, guest name, status, etc.
- Filterable by status, date range, payment status

#### 4. **Calendar View** (Alternative View)
- Visual timeline of bookings
- Color-coded by booking status
- Drag-and-drop for easy modifications

### Status Indicators

| Status | Color | Description |
|--------|-------|-------------|
| **Confirmed** | Green | Booking confirmed and paid |
| **Pending** | Yellow | Awaiting confirmation or payment |
| **Checked In** | Blue | Guest has arrived |
| **Checked Out** | Gray | Guest has departed |
| **Cancelled** | Red | Booking has been cancelled |
| **No Show** | Orange | Guest didn't arrive |

---

## Creating New Bookings

### Method 1: Quick Booking

1. Click **"New Booking"** button
2. Enter guest information:
   - **Guest Name**: Full name as it appears on ID
   - **Email**: Valid email address for confirmations
   - **Phone**: Contact number with country code
3. Select dates:
   - **Check-in Date**: Arrival date
   - **Check-out Date**: Departure date
4. Specify guest details:
   - **Adults**: Number of adult guests
   - **Children**: Number of children (if any)
   - **Rooms**: Number of rooms needed
5. Click **"Check Availability"**
6. Select room type and rate
7. Review and confirm booking

### Method 2: Advanced Booking

1. Click **"New Booking"** → **"Advanced"**
2. Complete **Guest Information** section:
   ```
   Personal Details:
   - First Name, Last Name
   - Date of Birth (for verification)
   - Nationality
   - ID/Passport Number

   Contact Details:
   - Primary Email
   - Secondary Email (optional)
   - Phone Numbers
   - Emergency Contact

   Address:
   - Street Address
   - City, State/Province
   - ZIP/Postal Code
   - Country
   ```

3. Set **Booking Details**:
   ```
   Stay Information:
   - Check-in Date & Time
   - Check-out Date & Time
   - Number of Nights (auto-calculated)

   Guest Count:
   - Adults (required)
   - Children with ages
   - Infants (under 2)

   Room Requirements:
   - Number of Rooms
   - Room Type Preferences
   - Bed Configuration
   - Floor Preference
   - Accessibility Needs
   ```

4. Add **Special Requests**:
   - Early check-in/late check-out
   - Room location preferences
   - Dietary restrictions
   - Celebration occasions
   - Transportation needs

5. Configure **Pricing**:
   - Base room rate
   - Additional charges
   - Taxes and fees
   - Discounts or promotions
   - Total amount

6. Set **Payment Options**:
   - Payment method
   - Payment schedule (full/partial)
   - Deposit requirements
   - Cancellation policy

### Booking Sources

When creating bookings, specify the source:

- **Direct**: Direct bookings through your website
- **Phone**: Bookings made over the phone
- **Walk-in**: Guests who arrive without reservation
- **Booking.com**: From Booking.com platform
- **Expedia**: From Expedia network
- **Airbnb**: From Airbnb platform
- **Agent**: Through travel agents
- **Corporate**: Corporate bookings

---

## Managing Existing Bookings

### Finding Bookings

Use the search and filter options to quickly locate bookings:

#### Search Options:
- **Guest Name**: Type any part of the guest's name
- **Email**: Search by guest email address
- **Booking ID**: Enter the unique booking reference
- **Phone Number**: Search by contact number
- **Room Number**: Find by assigned room

#### Filter Options:
- **Date Range**: Specific check-in or check-out dates
- **Status**: Confirmed, Pending, Cancelled, etc.
- **Payment Status**: Paid, Pending, Failed, Refunded
- **Source**: Direct, Booking.com, Expedia, etc.
- **Room Type**: Standard, Deluxe, Suite, etc.

### Modifying Bookings

#### Changing Dates
1. Open the booking details
2. Click **"Modify Dates"**
3. Select new check-in/check-out dates
4. System will check availability automatically
5. Adjust pricing if rates have changed
6. Save changes and notify guest

#### Updating Guest Information
1. Click **"Edit Guest Info"**
2. Modify any guest details
3. Add additional guests if needed
4. Update contact information
5. Save changes

#### Room Changes
1. Go to **"Room Assignment"** section
2. Click **"Change Room"**
3. View available rooms for the dates
4. Select new room type or specific room
5. Adjust pricing if necessary
6. Confirm the change

#### Adding Services
1. Open booking details
2. Click **"Add Services"**
3. Select from available services:
   - Airport transfers
   - Spa treatments
   - Restaurant reservations
   - Tour bookings
   - Equipment rentals
4. Set dates and times
5. Add to booking total

### Cancellation Process

#### Guest-Initiated Cancellation
1. Open the booking to be cancelled
2. Click **"Cancel Booking"**
3. Select cancellation reason:
   - Guest request
   - No-show
   - Force majeure
   - Property issue
   - Other (specify)
4. Calculate refund amount based on cancellation policy
5. Process refund if applicable
6. Send cancellation confirmation to guest

#### Cancellation Policies
- **Flexible**: Full refund until 24 hours before check-in
- **Moderate**: Full refund until 5 days before check-in
- **Strict**: Full refund until 14 days before check-in
- **Super Strict**: No refund after booking
- **Custom**: Property-specific policies

---

## Guest Management

### Guest Profiles

The system automatically creates guest profiles from booking information:

#### Profile Information Includes:
- **Personal Details**: Name, DOB, nationality
- **Contact Information**: Email, phone, address
- **Booking History**: Previous stays and preferences
- **Payment History**: Past transactions
- **Preferences**: Room type, amenities, services
- **Special Notes**: Allergies, accessibility needs
- **VIP Status**: Loyalty program level

#### Managing Guest Profiles
1. Go to **"Guests"** section
2. Search for existing guest or click **"New Guest"**
3. Complete or update profile information
4. Add notes about guest preferences
5. Set VIP status if applicable
6. Link to existing bookings

### Communication Tools

#### Automated Messages
- **Booking Confirmation**: Sent immediately after booking
- **Pre-Arrival**: Sent 24-48 hours before check-in
- **Check-in Instructions**: Sent on arrival day
- **Welcome Message**: Sent after check-in
- **Check-out Reminder**: Sent day before departure
- **Post-Stay Survey**: Sent after departure

#### Manual Communication
1. Open guest profile or booking
2. Click **"Send Message"**
3. Choose communication method:
   - Email
   - SMS
   - WhatsApp (if available)
   - In-app notification
4. Select message template or write custom message
5. Add attachments if needed
6. Send immediately or schedule for later

### Guest Check-in Process

#### Pre-Arrival Preparation
1. Verify booking details 24 hours prior
2. Confirm room assignment
3. Prepare welcome amenities
4. Check special requests
5. Notify relevant departments

#### Check-in Steps
1. Locate booking in system
2. Verify guest identity
3. Confirm booking details with guest
4. Collect any required documents
5. Process payment if pending
6. Assign room key/access
7. Provide property information
8. Mark booking as "Checked In"

#### Express Check-in
For returning guests or VIP members:
1. Pre-register guest in system
2. Prepare room in advance
3. Send digital key to guest's mobile
4. Allow direct room access
5. Follow up via message

---

## Room Assignment

### Automatic Assignment

The system can automatically assign rooms based on:
- **Guest Preferences**: Previously stayed rooms
- **Room Type**: Booked category (Standard, Deluxe, Suite)
- **Special Requests**: High floor, quiet area, view
- **Accessibility**: ADA compliant rooms
- **Connecting Rooms**: For families or groups
- **Availability**: Real-time room status

### Manual Assignment

#### For Specific Requirements:
1. Go to **"Room Management"** section
2. View room availability grid
3. Select appropriate room based on:
   - Guest preferences
   - Room amenities
   - Location within property
   - Maintenance status
4. Drag booking to specific room
5. Confirm assignment

#### Room Status Indicators:
- **Available**: Ready for new guests
- **Occupied**: Currently occupied
- **Dirty**: Needs housekeeping
- **Clean**: Ready for next guest
- **Out of Order**: Maintenance required
- **Blocked**: Unavailable for booking

### Managing Room Changes

#### Guest-Requested Changes:
1. Check availability for preferred room type
2. Calculate any rate differences
3. Confirm change with guest
4. Update room assignment
5. Notify housekeeping of change
6. Issue new room keys

#### Property-Initiated Changes:
1. Explain reason for change to guest
2. Offer upgrade if available
3. Assist with moving luggage
4. Provide compensation if appropriate
5. Update booking records

---

## Payment Processing

### Payment Methods Supported

#### Credit/Debit Cards:
- Visa, MasterCard, American Express
- Discover, JCB, UnionPay
- Chip and PIN, Contactless

#### Digital Wallets:
- PayPal, Apple Pay, Google Pay
- Amazon Pay, Samsung Pay

#### Bank Transfers:
- Domestic wire transfers
- International SWIFT transfers
- Online banking payments

#### Cash Payments:
- Local currency only
- Change provided
- Receipt mandatory

### Processing Payments

#### At Booking:
1. Select payment method
2. Enter payment details
3. Verify billing address
4. Process authorization
5. Send payment confirmation

#### At Check-in:
1. Verify outstanding balance
2. Process payment for remaining amount
3. Handle security deposits
4. Update payment status in system

#### During Stay:
1. Add charges to room account
2. Process payment for services
3. Update running balance
4. Provide itemized receipts

### Refund Processing

#### Full Refunds:
1. Open booking with paid status
2. Click **"Process Refund"**
3. Select refund reason
4. Confirm refund amount
5. Choose refund method (original payment method preferred)
6. Process refund through payment gateway
7. Update booking status

#### Partial Refunds:
1. Calculate refund amount based on cancellation policy
2. Account for any fees or penalties
3. Process partial refund
4. Document reason in booking notes

### Payment Reports

Access payment reports through **Reports > Payments**:

- **Daily Cash Flow**: All payments received per day
- **Payment Method Analysis**: Breakdown by payment type
- **Failed Payments**: Declined or failed transactions
- **Refund Summary**: All refunds processed
- **Outstanding Balances**: Unpaid booking amounts

---

## Reports and Analytics

### Standard Reports

#### Occupancy Reports:
- **Daily Occupancy**: Rooms occupied each day
- **Monthly Summary**: Occupancy trends by month
- **Seasonal Analysis**: Peak and off-peak periods
- **Room Type Performance**: Occupancy by room category

#### Revenue Reports:
- **Daily Revenue**: Total income per day
- **Revenue per Available Room (RevPAR)**: Key performance metric
- **Average Daily Rate (ADR)**: Average room rate achieved
- **Revenue by Source**: Performance by booking channel

#### Guest Reports:
- **Guest Demographics**: Age, nationality, purpose of visit
- **Repeat Guest Analysis**: Loyalty and return rates
- **Guest Satisfaction**: Survey results and ratings
- **Length of Stay**: Average stay duration

### Custom Reports

#### Creating Custom Reports:
1. Go to **Reports > Custom Reports**
2. Select data parameters:
   - Date range
   - Property (if managing multiple)
   - Guest segments
   - Room types
   - Booking sources
3. Choose metrics to include
4. Set report format (table, chart, graph)
5. Save report template for future use

#### Scheduling Reports:
1. Create or select existing report
2. Click **"Schedule Report"**
3. Set frequency (daily, weekly, monthly)
4. Choose delivery method (email, dashboard)
5. Add recipients
6. Activate scheduled delivery

### Performance Dashboards

#### Key Performance Indicators (KPIs):

**Financial Metrics:**
- Total Revenue (daily/monthly/yearly)
- Revenue Growth (% change)
- Average Daily Rate (ADR)
- Revenue per Available Room (RevPAR)
- Gross Operating Profit per Available Room (GOPPAR)

**Operational Metrics:**
- Occupancy Rate (%)
- Length of Stay (nights)
- Cancellation Rate (%)
- No-Show Rate (%)
- Direct Booking Rate (%)

**Guest Satisfaction Metrics:**
- Average Rating (1-5 scale)
- Net Promoter Score (NPS)
- Repeat Guest Rate (%)
- Guest Complaint Rate (%)

---

## Advanced Features

### Automated Workflows

#### Booking Confirmations:
- Automatic email confirmation upon booking
- SMS confirmation for mobile-preferred guests
- Calendar invites with booking details
- Pre-arrival information packets

#### Payment Reminders:
- Automated payment due notices
- Failed payment retry attempts
- Payment confirmation messages
- Receipt generation and delivery

#### Housekeeping Coordination:
- Automatic room status updates
- Cleaning schedules based on check-outs
- Maintenance request generation
- Inventory alerts

### Integration Features

#### Channel Manager Integration:
- Sync inventory across all booking platforms
- Real-time rate and availability updates
- Unified booking management
- Automatic booking imports

#### Property Management System (PMS):
- Guest profile synchronization
- Folio management
- Service charge posting
- Night audit automation

#### Point of Sale (POS) Integration:
- Restaurant charge posting
- Spa service billing
- Gift shop purchases
- Minibar consumption

### Revenue Optimization

#### Dynamic Pricing:
- Automatic rate adjustments based on demand
- Seasonal pricing strategies
- Event-based pricing
- Competitor rate monitoring

#### Upselling Tools:
- Room upgrade suggestions
- Add-on service recommendations
- Package deal presentations
- Last-minute offer campaigns

---

## Troubleshooting

### Common Issues and Solutions

#### 1. **Cannot Find Booking**

**Problem**: Booking doesn't appear in search results

**Solutions**:
- Check spelling of guest name
- Try searching by email or phone number
- Verify date range in filters
- Check if booking was made for different property
- Look in "Cancelled" bookings if applicable

#### 2. **Payment Processing Fails**

**Problem**: Credit card payment is declined

**Solutions**:
- Verify card details are entered correctly
- Check if card has sufficient funds
- Try different payment method
- Contact guest to verify billing address
- Check if card is expired or blocked

#### 3. **Room Assignment Conflicts**

**Problem**: Multiple bookings assigned to same room

**Solutions**:
- Check room availability calendar
- Verify booking dates don't overlap
- Reassign one booking to different room
- Contact housekeeping about room status
- Update room inventory if needed

#### 4. **Guest Information Missing**

**Problem**: Incomplete guest profiles

**Solutions**:
- Contact guest to complete information
- Use information from previous stays
- Require completion at check-in
- Set mandatory fields in booking form
- Import data from channel partners

#### 5. **System Performance Issues**

**Problem**: Slow loading or timeouts

**Solutions**:
- Check internet connection
- Clear browser cache and cookies
- Try different browser
- Reduce number of open browser tabs
- Contact technical support if problem persists

### Getting Help

#### Built-in Help System:
- Click **"?"** icon in any section
- Access context-sensitive help
- View video tutorials
- Search help articles

#### Contact Support:
- **Email**: support@yourdomain.com
- **Phone**: Available 24/7
- **Live Chat**: During business hours
- **Help Desk**: Submit support tickets

#### Training Resources:
- Online training modules
- Video tutorial library
- Webinar schedules
- User community forums

---

## Best Practices

### Daily Operations

#### Morning Routine:
1. Review today's arrivals and departures
2. Check room availability and status
3. Verify payment processing for the day
4. Address any urgent guest requests
5. Coordinate with housekeeping team

#### Evening Routine:
1. Process day's walk-in bookings
2. Update room status after cleaning
3. Prepare for next day's arrivals
4. Review daily revenue reports
5. Handle any guest issues

### Data Management

#### Regular Maintenance:
- Update guest contact information
- Clean up duplicate guest profiles
- Archive old booking records
- Backup system data regularly
- Review and update room rates

#### Quality Control:
- Verify booking details accuracy
- Double-check payment processing
- Confirm room assignments
- Validate guest information
- Monitor system performance

### Security Guidelines

#### Access Management:
- Use strong passwords
- Change passwords regularly
- Limit user access based on role
- Log out when leaving workstation
- Report security concerns immediately

#### Data Protection:
- Handle guest information confidentially
- Never share login credentials
- Secure physical access to computers
- Follow PCI compliance for payments
- Report data breaches immediately

---

## Glossary

**ADR (Average Daily Rate)**: Total room revenue divided by number of rooms sold

**Channel Manager**: Software that distributes inventory across multiple booking platforms

**Direct Booking**: Reservation made directly with the property

**Folio**: Guest account showing all charges and payments

**GDS (Global Distribution System)**: Network used by travel agents to book reservations

**No-Show**: Guest who doesn't arrive for confirmed reservation

**OTA (Online Travel Agency)**: Third-party booking websites like Booking.com

**Overbooking**: Accepting more reservations than available rooms

**PMS (Property Management System)**: Software for hotel operations

**RevPAR (Revenue per Available Room)**: Total room revenue divided by total available rooms

**Walk-in**: Guest arriving without prior reservation

---

*Last Updated: January 15, 2024*
*Version: 2.1.0*

For additional support or questions about this manual, please contact our support team at support@yourdomain.com or call our 24/7 helpline.