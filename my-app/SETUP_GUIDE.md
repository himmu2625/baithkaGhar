# 🏨 OTA Platform Complete Setup Guide

## Overview
This guide will walk you through setting up the OTA (Online Travel Agency) integration for your hotel management system.

## 🎯 Architecture Understanding

```
Your System (.env file)
├── Master Booking.com API Key (manages all hotels)
├── Master Expedia API Key (manages all hotels)  
├── Master Agoda API Key (manages all hotels)
└── Database stores individual hotel configs

Database (per hotel)
├── Hotel A
│   ├── Booking.com Hotel ID: "12345"
│   ├── Expedia Property ID: "ABC123"
│   └── Room Type Mappings
├── Hotel B
│   ├── Booking.com Hotel ID: "67890"
│   ├── Expedia Property ID: "DEF456"
│   └── Room Type Mappings
```

## 📋 Prerequisites

### 1. OTA Partner Accounts (Required)

You need business/partner accounts with each OTA platform:

#### **Booking.com Connectivity Partner**
- Visit: `https://partner.booking.com`
- Apply for **Connectivity Partner** status
- Once approved, you get **ONE Master API Key**
- This key manages ALL your hotels

#### **Expedia Partner Central (EPC)**
- Visit: `https://partner.expediagroup.com`
- Apply for **EPC API Access** 
- Get **Partner ID** and **API Key**
- One account manages all properties

#### **Agoda YCS Access**
- Contact Agoda business development
- Apply for **YCS (Yield Control System)** access
- Receive **API Key** and **User ID**

### 2. Individual Hotel Registration

For EACH hotel, you need to:
- Register the property on each OTA platform
- Get the **Property/Hotel ID** from each platform
- This is done through their partner portals (not API)

## 🛠️ Step-by-Step Setup

### Step 1: Environment Configuration

1. Copy the example environment file:
```bash
cp config/ota/ota-env-example.env .env.local
```

2. Add your MASTER credentials to `.env.local`:
```env
# MASTER OTA CREDENTIALS (One set for all hotels)
BOOKING_COM_API_KEY=bcom_1234567890abcdef
BOOKING_COM_ENDPOINT=https://distribution-xml.booking.com/2.0

EXPEDIA_API_KEY=exp_abcdef1234567890
EXPEDIA_ENDPOINT=https://services.expediapartnercentral.com/eqc
EXPEDIA_PARTNER_ID=your_partner_id_12345

AGODA_API_KEY=agoda_9876543210fedcba
AGODA_ENDPOINT=https://affiliateapi7.agoda.com
AGODA_USER_ID=your_user_id_67890
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Test Master Connections

```bash
npm run ota:test-connections
```

This should show:
```
✅ Booking.com: Connected successfully
✅ Expedia: Connected successfully  
✅ Agoda: Connected successfully
```

### Step 4: Configure Each Hotel

For each hotel property, visit:
```
https://yourapp.com/os/ota-config/[property_id]
```

#### Hotel Configuration Example:

**Hotel "Baithaka Grand Delhi"**
1. Go to `/os/ota-config/hotel_delhi_001`
2. Enable OTA Integration
3. Configure each channel:

   **Booking.com**
   - Enable: ✅
   - Hotel ID: `1247856` (from Booking.com extranet)
   - Sync Settings: Inventory ✅, Rates ✅, Bookings ✅

   **Expedia** 
   - Enable: ✅
   - Property ID: `DEL_GRAND_789` (from EPC)
   - Sync Settings: Inventory ✅, Rates ✅, Bookings ✅

   **Agoda**
   - Enable: ✅  
   - Property ID: `AGO_DEL_456` (from YCS)
   - Sync Settings: Inventory ✅, Rates ✅, Bookings ✅

4. Set Global Settings:
   - Timezone: `Asia/Kolkata`
   - Currency: `INR`
   - Check-in: `14:00`
   - Check-out: `11:00`

5. Add Contact Info:
   - Manager Email: `manager@baithakagrande.com`
   - Tech Contact: `tech@baithaka.com`

6. **Save Configuration**

7. **Test Connection** for each channel

### Step 5: Room Type Mapping (Important!)

Map your local room types to OTA room types:

**Your System** → **Booking.com** → **Expedia** → **Agoda**
- `deluxe_room` → `203847` → `DEL_001` → `AGODA_DLX`
- `suite` → `203848` → `SUI_001` → `AGODA_SUI`
- `standard` → `203849` → `STD_001` → `AGODA_STD`

### Step 6: Start Syncing

#### Manual Sync (Testing)
```bash
# Sync inventory for all properties
npm run ota:sync-inventory

# Sync rates for all properties  
npm run ota:sync-rates

# Sync bookings from all channels
npm run ota:sync-bookings

# Full sync (everything)
npm run ota:full-sync
```

#### Automated Sync (Production)
Sync schedules are configured in `config/ota/sync-schedules.ts`:
- **Inventory**: Every 15 minutes
- **Rates**: Every 6 hours  
- **Bookings**: Every 5 minutes
- **Full Sync**: Daily at 2 AM

## 🔄 How Syncing Works

### Inventory Sync Process:
1. **Fetch** room availability from your database
2. **Transform** to each OTA's format using mappings
3. **Push** to Booking.com using their API + Hotel ID
4. **Push** to Expedia using their API + Property ID  
5. **Push** to Agoda using their API + Property ID
6. **Log** results and handle errors

### Booking Retrieval Process:
1. **Pull** new bookings from each OTA
2. **Transform** to your system's format
3. **Save** to your database with channel reference
4. **Update** inventory to reflect bookings

## 🎛️ Management Dashboard

### Property Manager View:
- `/os/ota-config/[property_id]` - Configure OTA settings
- `/os/dashboard/[property_id]` - View sync status  
- View last sync times, errors, booking counts

### Admin View:
- `/admin/ota-overview` - All properties OTA status
- System-wide sync logs and performance metrics

## 🚨 Important Notes

### 1. **One Master Account = All Hotels**
- You don't need separate API keys for each hotel
- Each hotel gets registered under your master account
- Hotel IDs differentiate between properties

### 2. **Room Type Mapping is Critical**  
- OTAs use their own room type IDs
- You must map your room types to theirs
- Wrong mapping = inventory sync failures

### 3. **Rate Parity Monitoring**
- System monitors rate differences across channels
- Alerts when rates are significantly different
- Helps maintain rate parity compliance

### 4. **Booking Conflicts**
- System checks for double bookings
- Automatically adjusts inventory when bookings received
- Manual review for conflicting reservations

## 🔧 Troubleshooting

### Common Issues:

**"No OTA configuration found"**
- Hotel not configured in database
- Visit `/os/ota-config/[property_id]` to set up

**"Channel not configured"**  
- Channel disabled or missing Property ID
- Check channel configuration and enable

**"API Authentication Failed"**
- Wrong master API key in .env file
- Verify credentials with OTA partner portals

**"Property ID not found"**
- Wrong Hotel/Property ID in database
- Check OTA extranet for correct IDs

**"Rate sync failed"**
- Room type mapping missing or incorrect  
- Verify room type mappings in config

### Test Commands:
```bash
# Test all connections
npm run ota:test-connections

# Test specific property
curl "http://localhost:3000/api/os/ota-config/hotel_001"

# Manual sync with verbose logging
DEBUG=ota:* npm run ota:sync-inventory
```

## 📊 Success Metrics

You'll know setup is successful when:
- ✅ All OTA connections test successful
- ✅ Inventory syncs without errors  
- ✅ Rate updates push to all channels
- ✅ Bookings arrive in your system
- ✅ No rate parity alerts
- ✅ Automated syncs running on schedule

## 🎉 Go Live Checklist

- [ ] Master OTA accounts approved and active
- [ ] All hotels registered on each OTA platform  
- [ ] Master API keys added to .env.local
- [ ] Each hotel configured in `/os/ota-config/[id]`
- [ ] Room type mappings completed for all hotels
- [ ] Test syncs successful for all properties
- [ ] Automated sync schedules enabled
- [ ] Monitoring and alerts configured
- [ ] Staff trained on OTA management interface

---

**Need Help?** Contact your development team or refer to the API documentation for each OTA platform.