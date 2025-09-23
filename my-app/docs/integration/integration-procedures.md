# Integration Procedures Documentation

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Pre-Integration Planning](#pre-integration-planning)
3. [Channel Manager Integration](#channel-manager-integration)
4. [Payment Gateway Integration](#payment-gateway-integration)
5. [PMS Integration](#pms-integration)
6. [Third-Party Service Integration](#third-party-service-integration)
7. [API Integration Guidelines](#api-integration-guidelines)
8. [Testing Procedures](#testing-procedures)
9. [Go-Live Procedures](#go-live-procedures)
10. [Maintenance and Monitoring](#maintenance-and-monitoring)
11. [Troubleshooting Integration Issues](#troubleshooting-integration-issues)

---

## Integration Overview

### Supported Integration Types

| Integration Type | Purpose | Complexity | Timeline |
|-----------------|---------|------------|----------|
| **Channel Manager** | OTA connectivity | Medium | 2-4 weeks |
| **Payment Gateway** | Payment processing | Low | 1-2 weeks |
| **PMS Integration** | Property management | High | 4-8 weeks |
| **Revenue Management** | Dynamic pricing | Medium | 3-6 weeks |
| **CRM Integration** | Guest management | Medium | 2-4 weeks |
| **Email/SMS** | Communication | Low | 1 week |
| **Accounting** | Financial reporting | Medium | 3-4 weeks |
| **Keycard System** | Room access | High | 4-6 weeks |

### Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Booking       │◄──►│   Integration   │◄──►│   External      │
│   System        │    │   Middleware    │    │   Systems       │
│                 │    │                 │    │                 │
│ • Guest Mgmt    │    │ • Data Mapping  │    │ • Channel Mgr   │
│ • Reservations  │    │ • Rate Limiting │    │ • Payment GW    │
│ • Payments      │    │ • Error Handling│    │ • PMS Systems   │
│ • Reporting     │    │ • Monitoring    │    │ • CRM Tools     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Patterns

#### Real-time Synchronization:
- **Inventory Updates**: Room availability changes
- **Rate Updates**: Pricing modifications
- **Booking Creation**: New reservations
- **Payment Processing**: Transaction status

#### Batch Synchronization:
- **Guest Profiles**: Daily bulk updates
- **Historical Reports**: End-of-day summaries
- **Inventory Reconciliation**: Weekly adjustments
- **Financial Reconciliation**: Monthly reports

---

## Pre-Integration Planning

### Integration Checklist

#### Business Requirements
```
□ Define integration objectives
□ Identify data flow requirements
□ Specify performance expectations
□ Determine security requirements
□ Plan fallback procedures
□ Set success criteria
□ Define maintenance procedures
```

#### Technical Requirements
```
□ API documentation review
□ Authentication method selection
□ Data mapping specification
□ Error handling design
□ Monitoring setup
□ Testing environment preparation
□ Production deployment plan
```

#### Resource Planning
```
□ Technical team assignment
□ Timeline development
□ Budget allocation
□ Training requirements
□ Support procedures
□ Documentation needs
□ Change management plan
```

### Risk Assessment

| Risk Level | Risk Factor | Mitigation Strategy |
|------------|-------------|-------------------|
| **High** | Data corruption | Implement robust validation and rollback procedures |
| **High** | Service downtime | Design circuit breakers and fallback mechanisms |
| **Medium** | Performance impact | Load testing and optimization |
| **Medium** | Security vulnerabilities | Security audits and encryption |
| **Low** | User adoption issues | Training and documentation |

### Success Criteria

#### Technical KPIs:
- **Uptime**: >99.5% availability
- **Response Time**: <2 seconds average
- **Error Rate**: <0.1% of transactions
- **Data Accuracy**: >99.9% synchronization accuracy

#### Business KPIs:
- **Booking Volume**: No decrease in conversion
- **Guest Satisfaction**: No decline in ratings
- **Operational Efficiency**: Time savings measurable
- **Revenue Impact**: No negative revenue effects

---

## Channel Manager Integration

### Overview

Channel managers distribute room inventory and rates across multiple online travel agencies (OTAs) and booking platforms.

### Popular Channel Managers

#### Tier 1 (Enterprise):
- **SiteMinder**: Global reach, comprehensive features
- **D-EDGE**: European leader, hotel chains
- **RateGain**: AI-powered, revenue optimization
- **Cloudbeds**: All-in-one solution

#### Tier 2 (Mid-Market):
- **ChannelManager.com**: Cost-effective, reliable
- **MyAllocator**: User-friendly interface
- **Cubilis**: European focus
- **eRevMax**: Asia-Pacific specialist

### Integration Process

#### Phase 1: Setup and Configuration (Week 1)

1. **Account Creation**
   ```bash
   # Example API credentials setup
   export CM_API_KEY="your_api_key_here"
   export CM_API_SECRET="your_secret_here"
   export CM_PROPERTY_ID="prop_12345"
   export CM_ENDPOINT="https://api.channelmanager.com/v2"
   ```

2. **Property Configuration**
   ```json
   {
     "property": {
       "id": "prop_12345",
       "name": "Your Hotel Name",
       "address": {
         "street": "123 Main Street",
         "city": "City Name",
         "country": "Country",
         "zipCode": "12345"
       },
       "contact": {
         "email": "reservations@yourhotel.com",
         "phone": "+1234567890"
       },
       "policies": {
         "checkIn": "15:00",
         "checkOut": "11:00",
         "cancellation": "24_hours"
       }
     }
   }
   ```

3. **Room Type Mapping**
   ```json
   {
     "roomTypes": [
       {
         "internal_id": "std_001",
         "cm_id": "STD",
         "name": "Standard Room",
         "capacity": 2,
         "amenities": ["wifi", "ac", "tv"],
         "images": ["room1.jpg", "room2.jpg"]
       },
       {
         "internal_id": "dlx_001",
         "cm_id": "DLX",
         "name": "Deluxe Room",
         "capacity": 3,
         "amenities": ["wifi", "ac", "tv", "balcony"],
         "images": ["deluxe1.jpg", "deluxe2.jpg"]
       }
     ]
   }
   ```

#### Phase 2: Rate Plan Setup (Week 2)

1. **Create Rate Plans**
   ```javascript
   // Example rate plan configuration
   const ratePlans = [
     {
       id: "BAR", // Best Available Rate
       name: "Best Available Rate",
       description: "Standard flexible rate",
       cancellationPolicy: "24_hours_free",
       mealPlan: "room_only",
       refundable: true
     },
     {
       id: "NRF", // Non-Refundable
       name: "Non-Refundable Rate",
       description: "Lower rate, no refunds",
       cancellationPolicy: "non_refundable",
       mealPlan: "room_only",
       refundable: false
     }
   ];
   ```

2. **Set Base Rates**
   ```javascript
   // Rate setting API call
   async function updateRates(roomType, ratePlan, dates, price) {
     const rateData = {
       roomType: roomType,
       ratePlan: ratePlan,
       rates: dates.map(date => ({
         date: date,
         price: price,
         currency: "USD",
         minimumStay: 1,
         maximumStay: 30
       }))
     };

     return await fetch(`${CM_ENDPOINT}/rates`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${CM_API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(rateData)
     });
   }
   ```

#### Phase 3: Inventory Synchronization (Week 3)

1. **Initial Inventory Upload**
   ```javascript
   // Bulk inventory update
   async function updateInventory(inventoryData) {
     return await fetch(`${CM_ENDPOINT}/inventory/bulk`, {
       method: 'PUT',
       headers: {
         'Authorization': `Bearer ${CM_API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         propertyId: CM_PROPERTY_ID,
         inventory: inventoryData
       })
     });
   }

   // Example inventory data
   const inventoryData = [
     {
       date: "2024-01-15",
       roomType: "STD",
       totalRooms: 50,
       availableRooms: 45,
       rate: 120.00,
       restrictions: {
         minimumStay: 1,
         maximumStay: 14,
         closedToArrival: false,
         closedToDeparture: false
       }
     }
   ];
   ```

2. **Real-time Updates**
   ```javascript
   // Webhook handler for booking updates
   app.post('/webhooks/booking-update', async (req, res) => {
     const booking = req.body;

     try {
       // Update inventory in channel manager
       await updateChannelManagerInventory(
         booking.roomType,
         booking.checkInDate,
         booking.checkOutDate,
         -1 // Decrease availability
       );

       res.status(200).json({ success: true });
     } catch (error) {
       console.error('Failed to update CM inventory:', error);
       res.status(500).json({ error: 'Update failed' });
     }
   });
   ```

#### Phase 4: Booking Import Setup (Week 4)

1. **Webhook Configuration**
   ```javascript
   // Configure webhook endpoints
   const webhookConfig = {
     endpoints: [
       {
         event: "booking.created",
         url: "https://yourdomain.com/webhooks/booking-created",
         authentication: {
           type: "bearer",
           token: "your_webhook_secret"
         }
       },
       {
         event: "booking.modified",
         url: "https://yourdomain.com/webhooks/booking-modified",
         authentication: {
           type: "bearer",
           token: "your_webhook_secret"
         }
       },
       {
         event: "booking.cancelled",
         url: "https://yourdomain.com/webhooks/booking-cancelled",
         authentication: {
           type: "bearer",
           token: "your_webhook_secret"
         }
       }
     ]
   };
   ```

2. **Booking Import Handler**
   ```javascript
   // Process incoming bookings from channel manager
   async function processChannelBooking(bookingData) {
     try {
       // Validate booking data
       const validatedBooking = await validateBookingData(bookingData);

       // Map channel manager data to internal format
       const internalBooking = {
         guestDetails: {
           name: `${bookingData.guest.firstName} ${bookingData.guest.lastName}`,
           email: bookingData.guest.email,
           phone: bookingData.guest.phone
         },
         dateFrom: bookingData.checkIn,
         dateTo: bookingData.checkOut,
         guests: bookingData.guestCount,
         rooms: bookingData.roomCount,
         totalAmount: bookingData.totalPrice,
         status: mapBookingStatus(bookingData.status),
         source: bookingData.source || 'channel_manager',
         externalId: bookingData.id,
         specialRequests: bookingData.comments
       };

       // Create booking in internal system
       const booking = await createBooking(internalBooking);

       // Send confirmation
       await sendBookingConfirmation(booking);

       return booking;
     } catch (error) {
       console.error('Booking import failed:', error);
       throw error;
     }
   }
   ```

### Testing Procedures

#### Unit Testing
```javascript
// Test rate updates
describe('Channel Manager Rate Updates', () => {
   test('should update rates successfully', async () => {
     const result = await updateRates('STD', 'BAR', ['2024-01-15'], 120.00);
     expect(result.success).toBe(true);
   });

   test('should handle rate update failures', async () => {
     const result = await updateRates('INVALID', 'BAR', ['2024-01-15'], 120.00);
     expect(result.success).toBe(false);
   });
});
```

#### Integration Testing
```bash
# Test booking flow end-to-end
curl -X POST "${CM_ENDPOINT}/test/booking" \
  -H "Authorization: Bearer ${CM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "guest": {
      "firstName": "Test",
      "lastName": "Guest",
      "email": "test@example.com"
    },
    "checkIn": "2024-01-15",
    "checkOut": "2024-01-17",
    "roomType": "STD",
    "totalPrice": 240.00
  }'
```

---

## Payment Gateway Integration

### Supported Payment Gateways

#### Tier 1 Gateways:
- **Stripe**: Global coverage, developer-friendly
- **PayPal**: Consumer trust, global reach
- **Square**: Integrated POS solutions
- **Adyen**: Enterprise-level, global

#### Regional Gateways:
- **Razorpay**: India market leader
- **Paytm**: India mobile payments
- **Alipay**: China market
- **iDEAL**: Netherlands banking

### Stripe Integration Example

#### 1. Initial Setup
```javascript
// Install Stripe SDK
npm install stripe

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configure webhook endpoint
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
```

#### 2. Payment Intent Creation
```javascript
// Create payment intent for booking
async function createPaymentIntent(bookingData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(bookingData.totalAmount * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        bookingId: bookingData.id,
        propertyId: bookingData.propertyId,
        guestEmail: bookingData.guestDetails.email
      },
      receipt_email: bookingData.guestDetails.email,
      description: `Booking ${bookingData.id} - ${bookingData.propertyName}`
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
}
```

#### 3. Frontend Payment Handling
```javascript
// Frontend payment processing
async function processPayment(clientSecret, paymentMethod) {
  const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);

  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    {
      payment_method: paymentMethod
    }
  );

  if (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }

  if (paymentIntent.status === 'succeeded') {
    // Payment successful
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    };
  }
}
```

#### 4. Webhook Processing
```javascript
// Handle Stripe webhooks
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

#### 5. Refund Processing
```javascript
// Process refunds
async function processRefund(paymentIntentId, amount, reason) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Amount in cents
      reason: reason, // 'duplicate', 'fraudulent', or 'requested_by_customer'
      metadata: {
        processedBy: 'booking_system',
        refundReason: reason
      }
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    };
  } catch (error) {
    console.error('Refund processing failed:', error);
    throw error;
  }
}
```

### Payment Security Best Practices

#### PCI Compliance:
```javascript
// Never store card data - use tokens
const paymentMethod = {
  type: 'card',
  card: {
    // Use Stripe Elements - don't handle raw card data
    // Card data is tokenized by Stripe
  }
};

// Store only payment metadata
const paymentRecord = {
  paymentIntentId: 'pi_xxx',
  amount: 150.00,
  currency: 'usd',
  status: 'succeeded',
  lastFour: '4242', // Only last 4 digits
  cardBrand: 'visa',
  bookingId: 'booking_123'
  // Never store: full card number, CVV, PIN
};
```

#### Fraud Prevention:
```javascript
// Implement fraud checks
const fraudChecks = {
  // Velocity checks
  sameCardMultipleBookings: async (cardFingerprint) => {
    const recentBookings = await getRecentBookingsByCard(cardFingerprint);
    return recentBookings.length > 5; // Flag if >5 bookings in 24h
  },

  // Geographic checks
  ipCountryMismatch: (ipCountry, cardCountry) => {
    return ipCountry !== cardCountry;
  },

  // Amount checks
  unusualAmount: (amount, averageBookingAmount) => {
    return amount > (averageBookingAmount * 3);
  }
};
```

---

## PMS Integration

### Popular PMS Systems

#### Enterprise Level:
- **Oracle Opera**: Global hotel chains
- **Amadeus**: Large properties, complex needs
- **Infor HMS**: Enterprise resource planning
- **Protel**: European market leader

#### Mid-Market:
- **Cloudbeds**: All-in-one cloud solution
- **RoomRaccoon**: Modern cloud PMS
- **Mews**: Next-generation platform
- **Clock PMS**: Flexible, scalable

#### Budget/Small Properties:
- **Frontdesk Anywhere**: Cost-effective cloud
- **Little Hotelier**: Small property focus
- **innRoad**: Feature-rich, affordable
- **WebRezPro**: Independent hotels

### Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Booking       │    │   Integration   │    │   PMS System    │
│   System        │    │   Layer         │    │                 │
│                 │◄──►│                 │◄──►│ • Guest Profiles│
│ • Reservations  │    │ • Data Mapping  │    │ • Folios        │
│ • Guest Data    │    │ • Transformation│    │ • Room Status   │
│ • Payments      │    │ • Validation    │    │ • Reporting     │
│ • Reporting     │    │ • Error Handling│    │ • Housekeeping  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Synchronization

#### Guest Profile Sync:
```javascript
// Sync guest profile to PMS
async function syncGuestToPMS(guestData) {
  const pmsGuestFormat = {
    profileId: guestData.id,
    personalInfo: {
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      dateOfBirth: guestData.dateOfBirth,
      nationality: guestData.nationality
    },
    contactInfo: {
      email: guestData.email,
      phone: guestData.phone,
      address: {
        street: guestData.address.street,
        city: guestData.address.city,
        state: guestData.address.state,
        country: guestData.address.country,
        postalCode: guestData.address.postalCode
      }
    },
    preferences: {
      roomType: guestData.preferences.roomType,
      bedType: guestData.preferences.bedType,
      smokingPreference: guestData.preferences.smoking,
      floorPreference: guestData.preferences.floor
    },
    vipStatus: guestData.vipLevel,
    loyaltyProgram: {
      number: guestData.loyaltyNumber,
      tier: guestData.loyaltyTier
    }
  };

  return await callPMSAPI('POST', '/guests', pmsGuestFormat);
}
```

#### Reservation Sync:
```javascript
// Sync booking to PMS reservation
async function syncBookingToPMS(bookingData) {
  const pmsReservationFormat = {
    reservationId: bookingData.id,
    guestId: bookingData.guestId,
    arrival: {
      date: bookingData.checkInDate,
      time: bookingData.checkInTime || '15:00'
    },
    departure: {
      date: bookingData.checkOutDate,
      time: bookingData.checkOutTime || '11:00'
    },
    roomInfo: {
      roomType: bookingData.roomType,
      roomNumber: bookingData.roomNumber,
      adults: bookingData.adults,
      children: bookingData.children
    },
    rateInfo: {
      ratePlan: bookingData.ratePlan,
      roomRate: bookingData.roomRate,
      totalAmount: bookingData.totalAmount,
      currency: bookingData.currency
    },
    status: mapBookingStatusToPMS(bookingData.status),
    source: bookingData.source,
    specialRequests: bookingData.specialRequests,
    paymentInfo: {
      method: bookingData.paymentMethod,
      status: bookingData.paymentStatus,
      deposits: bookingData.deposits
    }
  };

  return await callPMSAPI('POST', '/reservations', pmsReservationFormat);
}
```

#### Room Status Integration:
```javascript
// Get room status from PMS
async function getRoomStatusFromPMS() {
  const pmsRoomStatus = await callPMSAPI('GET', '/rooms/status');

  // Map PMS status to internal format
  return pmsRoomStatus.rooms.map(room => ({
    roomNumber: room.number,
    roomType: room.type,
    status: mapPMSRoomStatus(room.status),
    housekeepingStatus: mapHousekeepingStatus(room.housekeeping),
    maintenanceIssues: room.maintenance || [],
    currentGuest: room.occupancy ? {
      guestId: room.occupancy.guestId,
      checkInDate: room.occupancy.checkIn,
      checkOutDate: room.occupancy.checkOut
    } : null,
    lastCleaned: room.lastCleaned,
    amenities: room.amenities,
    rateCategory: room.rateCategory
  }));
}

// Status mapping functions
function mapPMSRoomStatus(pmsStatus) {
  const statusMap = {
    'OCC': 'occupied',
    'VAC': 'vacant_clean',
    'VD': 'vacant_dirty',
    'OOO': 'out_of_order',
    'OOS': 'out_of_service'
  };
  return statusMap[pmsStatus] || 'unknown';
}
```

---

## Third-Party Service Integration

### Communication Services

#### Email Service Integration (SendGrid):
```javascript
// Email service setup
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send booking confirmation
async function sendBookingConfirmation(booking) {
  const msg = {
    to: booking.guestDetails.email,
    from: 'reservations@yourhotel.com',
    templateId: 'd-1234567890abcdef', // SendGrid template ID
    dynamicTemplateData: {
      guestName: booking.guestDetails.name,
      bookingId: booking.id,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      roomType: booking.roomType,
      totalAmount: booking.totalAmount,
      propertyName: booking.propertyName,
      propertyAddress: booking.propertyAddress,
      confirmationUrl: `https://yourhotel.com/booking/${booking.id}`
    }
  };

  try {
    await sgMail.send(msg);
    return { success: true, messageId: msg.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}
```

#### SMS Service Integration (Twilio):
```javascript
// SMS service setup
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS confirmation
async function sendSMSConfirmation(booking) {
  try {
    const message = await client.messages.create({
      body: `Hi ${booking.guestDetails.name}! Your booking ${booking.id} is confirmed. Check-in: ${booking.checkInDate}. See you soon!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: booking.guestDetails.phone
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}
```

### Review Management Integration

#### TripAdvisor Integration:
```javascript
// Fetch property reviews
async function fetchTripAdvisorReviews(propertyId) {
  const response = await fetch(`https://api.tripadvisor.com/api/partner/2.0/location/${propertyId}/reviews`, {
    headers: {
      'X-TripAdvisor-API-Key': process.env.TRIPADVISOR_API_KEY
    }
  });

  const reviews = await response.json();

  return reviews.data.map(review => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    text: review.text,
    author: review.user.username,
    date: review.published_date,
    source: 'tripadvisor'
  }));
}
```

#### Google Reviews Integration:
```javascript
// Fetch Google My Business reviews
async function fetchGoogleReviews(placeId) {
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${process.env.GOOGLE_API_KEY}`);

  const data = await response.json();

  return data.result.reviews.map(review => ({
    id: review.time.toString(),
    rating: review.rating,
    text: review.text,
    author: review.author_name,
    date: new Date(review.time * 1000).toISOString(),
    source: 'google'
  }));
}
```

---

## API Integration Guidelines

### Authentication Standards

#### OAuth 2.0 Implementation:
```javascript
// OAuth 2.0 client credentials flow
async function getAccessToken() {
  const response = await fetch('https://api.provider.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: 'bookings:read bookings:write'
    })
  });

  const tokenData = await response.json();

  return {
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type
  };
}
```

#### API Key Authentication:
```javascript
// API key in header
const apiRequest = async (endpoint, data = null, method = 'GET') => {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BookingSystem/1.0'
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};
```

### Rate Limiting Handling

```javascript
// Rate limiting with exponential backoff
class RateLimitedAPI {
  constructor(baseURL, apiKey, maxRetries = 3) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
  }

  async makeRequest(endpoint, options = {}) {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (2 ** attempt) * 1000;

          console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}`);
          await this.sleep(waitTime);
          attempt++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }

        const waitTime = (2 ** attempt) * 1000;
        console.log(`Request failed. Retrying in ${waitTime}ms`);
        await this.sleep(waitTime);
        attempt++;
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Error Handling Patterns

```javascript
// Comprehensive error handling
class IntegrationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.details = details;
  }
}

// Error handler with retry logic
async function safeAPICall(apiFunction, ...args) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction(...args);
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors
      if (error.status === 401 || error.status === 403) {
        throw new IntegrationError(
          'Authentication failed',
          'AUTH_ERROR',
          { originalError: error }
        );
      }

      // Don't retry on client errors (except rate limiting)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw new IntegrationError(
          'Client error',
          'CLIENT_ERROR',
          { originalError: error }
        );
      }

      // Retry on server errors and rate limiting
      if (attempt < maxRetries) {
        const waitTime = (2 ** attempt) * 1000;
        console.log(`Attempt ${attempt} failed. Retrying in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new IntegrationError(
    'Max retries exceeded',
    'MAX_RETRIES_EXCEEDED',
    { attempts: maxRetries, lastError }
  );
}
```

---

## Testing Procedures

### Integration Testing Framework

```javascript
// Jest test setup for integrations
describe('Channel Manager Integration', () => {
  let mockChannelManager;

  beforeEach(() => {
    mockChannelManager = {
      updateInventory: jest.fn(),
      updateRates: jest.fn(),
      createBooking: jest.fn()
    };
  });

  test('should sync inventory successfully', async () => {
    mockChannelManager.updateInventory.mockResolvedValue({ success: true });

    const result = await syncInventoryToChannelManager({
      roomType: 'STD',
      date: '2024-01-15',
      available: 10
    });

    expect(result.success).toBe(true);
    expect(mockChannelManager.updateInventory).toHaveBeenCalledWith({
      roomType: 'STD',
      date: '2024-01-15',
      available: 10
    });
  });

  test('should handle inventory sync failures', async () => {
    mockChannelManager.updateInventory.mockRejectedValue(
      new Error('API timeout')
    );

    await expect(syncInventoryToChannelManager({
      roomType: 'STD',
      date: '2024-01-15',
      available: 10
    })).rejects.toThrow('API timeout');
  });
});
```

### Load Testing

```javascript
// Load testing with artillery.js
module.exports = {
  config: {
    target: 'https://api.yourhotel.com',
    phases: [
      { duration: 60, arrivalRate: 10 }, // 10 requests/sec for 1 minute
      { duration: 120, arrivalRate: 20 }, // 20 requests/sec for 2 minutes
      { duration: 60, arrivalRate: 50 }   // 50 requests/sec for 1 minute
    ],
    defaults: {
      headers: {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
      }
    }
  },
  scenarios: [
    {
      name: 'Create Booking',
      weight: 70,
      flow: [
        {
          post: {
            url: '/api/bookings',
            json: {
              guestDetails: {
                name: 'Test Guest',
                email: 'test@example.com'
              },
              checkInDate: '2024-01-15',
              checkOutDate: '2024-01-17',
              roomType: 'STD'
            }
          }
        }
      ]
    },
    {
      name: 'Update Inventory',
      weight: 30,
      flow: [
        {
          put: {
            url: '/api/inventory',
            json: {
              roomType: 'STD',
              date: '2024-01-15',
              available: 10
            }
          }
        }
      ]
    }
  ]
};
```

### Monitoring and Alerting

```javascript
// Health check endpoints
app.get('/health/integrations', async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    integrations: {}
  };

  try {
    // Check channel manager
    const cmHealth = await checkChannelManagerHealth();
    healthStatus.integrations.channelManager = cmHealth;

    // Check payment gateway
    const pgHealth = await checkPaymentGatewayHealth();
    healthStatus.integrations.paymentGateway = pgHealth;

    // Check PMS
    const pmsHealth = await checkPMSHealth();
    healthStatus.integrations.pms = pmsHealth;

    // Determine overall status
    const allHealthy = Object.values(healthStatus.integrations)
      .every(integration => integration.status === 'healthy');

    healthStatus.status = allHealthy ? 'healthy' : 'degraded';

    res.status(allHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Individual health checks
async function checkChannelManagerHealth() {
  try {
    const start = Date.now();
    await channelManagerAPI.getStatus();
    const responseTime = Date.now() - start;

    return {
      status: 'healthy',
      responseTime: responseTime,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}
```

---

## Go-Live Procedures

### Pre-Launch Checklist

#### Technical Validation
```
□ All API endpoints tested and responding
□ Authentication working correctly
□ Data mapping validated with sample data
□ Error handling tested with various scenarios
□ Rate limiting configured and tested
□ Monitoring and alerting set up
□ Backup procedures tested
□ Rollback plan prepared
```

#### Business Validation
```
□ Test bookings processed correctly
□ Payment flows working end-to-end
□ Inventory synchronization accurate
□ Guest communications working
□ Reporting data correct
□ Staff training completed
□ Documentation updated
□ Support procedures in place
```

### Launch Sequence

#### Phase 1: Soft Launch (Week 1)
1. **Enable Integration in Test Mode**
   - Process 10% of real traffic
   - Monitor for issues
   - Validate data accuracy
   - Gather performance metrics

2. **Monitor Key Metrics**
   ```javascript
   const launchMetrics = {
     bookingSuccessRate: 0, // Target: >95%
     paymentSuccessRate: 0, // Target: >98%
     syncAccuracy: 0,       // Target: >99%
     averageResponseTime: 0, // Target: <2s
     errorRate: 0           // Target: <1%
   };
   ```

#### Phase 2: Gradual Rollout (Week 2)
1. **Increase Traffic Gradually**
   - Day 1-2: 25% traffic
   - Day 3-4: 50% traffic
   - Day 5-6: 75% traffic
   - Day 7: 100% traffic

2. **Continuous Monitoring**
   ```bash
   # Monitor system metrics
   watch -n 30 'curl -s https://api.yourhotel.com/health/integrations | jq .'

   # Monitor application logs
   tail -f /var/log/application.log | grep -i "integration\|error"

   # Monitor business metrics
   mysql -e "SELECT COUNT(*) as bookings, AVG(response_time) as avg_response FROM booking_logs WHERE created_at > NOW() - INTERVAL 1 HOUR"
   ```

#### Phase 3: Full Production (Week 3)
1. **Complete Cutover**
   - Disable legacy systems
   - Route all traffic through new integration
   - Remove test flags and debugging

2. **Post-Launch Validation**
   ```
   □ 24-hour monitoring of all metrics
   □ Business reconciliation completed
   □ No critical issues reported
   □ Performance within acceptable limits
   □ Stakeholder sign-off received
   ```

### Rollback Procedures

#### Immediate Rollback Triggers
- Error rate > 5%
- Response time > 10 seconds
- Payment failure rate > 2%
- Data corruption detected
- Security breach suspected

#### Rollback Steps
1. **Immediate Actions**
   ```bash
   # Disable new integration
   kubectl scale deployment integration-service --replicas=0

   # Enable legacy system
   kubectl scale deployment legacy-booking-service --replicas=3

   # Update load balancer
   kubectl patch service booking-service -p '{"spec":{"selector":{"app":"legacy-booking"}}}'
   ```

2. **Data Recovery**
   ```bash
   # Restore from backup if needed
   mysql booking_db < backup_$(date +%Y%m%d).sql

   # Sync any missing data
   ./scripts/sync_missing_bookings.sh
   ```

3. **Communication**
   - Notify stakeholders immediately
   - Update status page
   - Inform support team
   - Document incident

---

## Maintenance and Monitoring

### Ongoing Monitoring

#### Key Performance Indicators
```javascript
// Integration KPI dashboard
const integrationKPIs = {
  availability: {
    target: 99.9,
    current: 99.95,
    trend: 'stable'
  },
  responseTime: {
    target: 2000, // milliseconds
    current: 1500,
    trend: 'improving'
  },
  errorRate: {
    target: 0.1, // percentage
    current: 0.05,
    trend: 'stable'
  },
  dataAccuracy: {
    target: 99.9,
    current: 99.95,
    trend: 'stable'
  }
};
```

#### Automated Monitoring
```javascript
// Monitoring script
async function monitorIntegrations() {
  const checks = [
    checkChannelManagerSync(),
    checkPaymentGatewayHealth(),
    checkPMSConnectivity(),
    validateDataConsistency()
  ];

  const results = await Promise.allSettled(checks);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      sendAlert(`Integration check ${index} failed: ${result.reason}`);
    }
  });
}

// Run every 5 minutes
setInterval(monitorIntegrations, 5 * 60 * 1000);
```

### Regular Maintenance Tasks

#### Daily Tasks
```bash
#!/bin/bash
# daily_integration_maintenance.sh

# Check integration health
curl -f https://api.yourhotel.com/health/integrations || echo "Health check failed"

# Validate data sync
python3 ./scripts/validate_daily_sync.py

# Check error logs
grep -c "ERROR" /var/log/integration.log

# Monitor API usage
./scripts/check_api_quotas.sh

# Update rate limit counters
redis-cli EVAL "$(cat scripts/reset_daily_limits.lua)" 0
```

#### Weekly Tasks
```bash
#!/bin/bash
# weekly_integration_maintenance.sh

# Performance analysis
./scripts/generate_performance_report.sh

# Data consistency audit
python3 ./scripts/weekly_data_audit.py

# Update integration certificates
./scripts/update_certificates.sh

# Clean up old logs
find /var/log/integration -name "*.log" -mtime +30 -delete

# Backup integration configurations
tar -czf "integration_config_$(date +%Y%m%d).tar.gz" /etc/integration/
```

#### Monthly Tasks
```bash
#!/bin/bash
# monthly_integration_maintenance.sh

# Full system integration test
./scripts/run_integration_tests.sh

# Capacity planning analysis
./scripts/analyze_usage_trends.sh

# Security audit
./scripts/security_audit.sh

# Update dependencies
npm audit fix
composer update --no-dev

# Review and update API documentation
./scripts/update_api_docs.sh
```

### Troubleshooting Common Issues

#### Integration Sync Failures
```javascript
// Debug sync issues
async function debugSyncFailure(integrationName, startTime, endTime) {
  const logs = await getLogs(integrationName, startTime, endTime);
  const errors = logs.filter(log => log.level === 'ERROR');

  const errorSummary = errors.reduce((summary, error) => {
    const key = error.message.split(':')[0];
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  console.log('Error Summary:', errorSummary);

  // Check common issues
  if (errorSummary['Connection timeout']) {
    console.log('Action: Check network connectivity and increase timeout settings');
  }

  if (errorSummary['Authentication failed']) {
    console.log('Action: Verify API credentials and token expiration');
  }

  if (errorSummary['Rate limit exceeded']) {
    console.log('Action: Implement exponential backoff and reduce request frequency');
  }

  return errorSummary;
}
```

#### Performance Degradation
```javascript
// Performance analysis
async function analyzePerformance(timeRange) {
  const metrics = await getPerformanceMetrics(timeRange);

  const analysis = {
    slowQueries: metrics.queries.filter(q => q.duration > 1000),
    highMemoryUsage: metrics.memory.filter(m => m.usage > 80),
    cpuSpikes: metrics.cpu.filter(c => c.usage > 90),
    networkLatency: metrics.network.filter(n => n.latency > 500)
  };

  // Generate recommendations
  const recommendations = [];

  if (analysis.slowQueries.length > 0) {
    recommendations.push('Optimize database queries or add indexes');
  }

  if (analysis.highMemoryUsage.length > 0) {
    recommendations.push('Investigate memory leaks or increase memory allocation');
  }

  if (analysis.cpuSpikes.length > 0) {
    recommendations.push('Optimize CPU-intensive operations or scale horizontally');
  }

  return { analysis, recommendations };
}
```

---

*Last Updated: January 15, 2024*
*Version: 2.1.0*

This integration documentation provides comprehensive procedures for connecting your booking system with external services. For specific integration support, contact our technical team at integrations@yourdomain.com.