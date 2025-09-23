# Booking API Documentation

## Overview

The Booking API provides comprehensive endpoints for managing hotel reservations, guest information, and booking workflows. This RESTful API supports full CRUD operations with advanced features like real-time availability checking, automated pricing, and integrated payment processing.

## Base URL

```
Production: https://your-domain.com/api/os/bookings
Development: http://localhost:3000/api/os/bookings
```

## Authentication

All API endpoints require authentication using NextAuth session cookies or API keys.

### Headers Required

```http
Content-Type: application/json
Cookie: next-auth.session-token=<session-token>
```

For API access:
```http
X-API-Key: <your-api-key>
```

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers Returned**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Error Handling

The API uses standard HTTP status codes and returns structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "field": "dateFrom",
          "message": "Check-in date is required"
        }
      ]
    },
    "requestId": "req_123456789",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHORIZATION_ERROR` | 401/403 | Authentication/permission denied |
| `RESOURCE_NOT_FOUND` | 404 | Booking or resource not found |
| `AVAILABILITY_ERROR` | 409 | Room not available for dates |
| `PAYMENT_ERROR` | 402 | Payment processing failed |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable |

---

## Endpoints

### 1. List Bookings

Retrieve bookings for a property with filtering and pagination.

```http
GET /api/os/bookings/{propertyId}
```

#### Parameters

**Path Parameters:**
- `propertyId` (string, required): Property UUID

**Query Parameters:**
- `status` (string, optional): Filter by booking status
  - Values: `pending`, `confirmed`, `cancelled`, `completed`, `all`
  - Default: `all`
- `paymentStatus` (string, optional): Filter by payment status
  - Values: `pending`, `paid`, `failed`, `refunded`, `all`
  - Default: `all`
- `dateFrom` (string, optional): Filter bookings from date (ISO 8601)
- `dateTo` (string, optional): Filter bookings to date (ISO 8601)
- `search` (string, optional): Search guest name, email, or booking ID
- `limit` (integer, optional): Number of results per page (max 100)
  - Default: `50`
- `offset` (integer, optional): Pagination offset
  - Default: `0`
- `sortBy` (string, optional): Sort field
  - Values: `createdAt`, `dateFrom`, `dateTo`, `totalAmount`, `guestName`
  - Default: `createdAt`
- `sortOrder` (string, optional): Sort direction
  - Values: `asc`, `desc`
  - Default: `desc`

#### Example Request

```bash
curl -X GET "https://api.example.com/api/os/bookings/prop_123?status=confirmed&limit=20&sortBy=dateFrom" \
  -H "X-API-Key: your-api-key"
```

#### Example Response

```json
{
  "success": true,
  "bookings": [
    {
      "id": "booking_123",
      "propertyId": "prop_123",
      "guestDetails": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
      },
      "checkInDate": "2024-02-15T15:00:00Z",
      "checkOutDate": "2024-02-18T11:00:00Z",
      "guests": 2,
      "children": 0,
      "rooms": 1,
      "totalAmount": 15000,
      "status": "confirmed",
      "paymentStatus": "paid",
      "source": "direct",
      "specialRequests": "Late check-in requested",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "total": 150,
    "confirmed": 120,
    "pending": 20,
    "cancelled": 8,
    "completed": 2,
    "todayArrivals": 5,
    "todayDepartures": 3,
    "revenue": 2500000,
    "averageBookingValue": 16667
  }
}
```

---

### 2. Create Booking

Create a new booking with guest details and room preferences.

```http
POST /api/os/bookings/{propertyId}
```

#### Request Body

```json
{
  "guestDetails": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  },
  "dateFrom": "2024-02-15T15:00:00Z",
  "dateTo": "2024-02-18T11:00:00Z",
  "guests": 2,
  "children": 0,
  "rooms": 1,
  "totalAmount": 15000,
  "specialRequests": "Late check-in requested",
  "paymentStatus": "pending",
  "status": "confirmed",
  "source": "direct",
  "roomPreference": {
    "type": "deluxe",
    "floor": "high",
    "view": "sea",
    "accessibility": false
  }
}
```

#### Validation Rules

- `guestDetails.name`: Required, 2-100 characters, letters and spaces only
- `guestDetails.email`: Required, valid email format
- `guestDetails.phone`: Optional, valid phone number format
- `dateFrom`: Required, ISO 8601 format, not in the past
- `dateTo`: Required, ISO 8601 format, after dateFrom
- `guests`: Required, 1-20 guests
- `children`: Optional, 0-10 children
- `rooms`: Required, 1-10 rooms
- `totalAmount`: Required, positive number, max ₹10,00,000
- `specialRequests`: Optional, max 1000 characters

#### Example Request

```bash
curl -X POST "https://api.example.com/api/os/bookings/prop_123" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "guestDetails": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "dateFrom": "2024-02-15T15:00:00Z",
    "dateTo": "2024-02-18T11:00:00Z",
    "guests": 2,
    "rooms": 1,
    "totalAmount": 15000
  }'
```

#### Example Response

```json
{
  "success": true,
  "booking": {
    "id": "booking_456",
    "propertyId": "prop_123",
    "guestDetails": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "checkInDate": "2024-02-15T15:00:00Z",
    "checkOutDate": "2024-02-18T11:00:00Z",
    "guests": 2,
    "children": 0,
    "rooms": 1,
    "totalAmount": 15000,
    "status": "confirmed",
    "paymentStatus": "pending",
    "source": "direct",
    "createdAt": "2024-01-15T10:45:00Z",
    "updatedAt": "2024-01-15T10:45:00Z"
  },
  "message": "Booking created successfully"
}
```

---

### 3. Update Booking

Update an existing booking's details.

```http
PUT /api/os/bookings/{propertyId}
```

#### Request Body

```json
{
  "bookingId": "booking_123",
  "status": "confirmed",
  "paymentStatus": "paid",
  "specialRequests": "Updated special requests",
  "allocatedRoom": {
    "roomNumber": "101",
    "roomId": "room_101",
    "unitTypeCode": "DLX",
    "unitTypeName": "Deluxe Room"
  }
}
```

#### Example Request

```bash
curl -X PUT "https://api.example.com/api/os/bookings/prop_123" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "bookingId": "booking_123",
    "status": "confirmed",
    "paymentStatus": "paid"
  }'
```

#### Example Response

```json
{
  "success": true,
  "booking": {
    "id": "booking_123",
    "status": "confirmed",
    "paymentStatus": "paid",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "message": "Booking updated successfully"
}
```

---

### 4. Cancel Booking

Cancel a booking with optional reason and refund processing.

```http
DELETE /api/os/bookings/{propertyId}/{bookingId}
```

#### Request Body

```json
{
  "cancellationReason": "Guest requested cancellation",
  "refundAmount": 12000,
  "refundReason": "Full refund as per policy"
}
```

#### Example Request

```bash
curl -X DELETE "https://api.example.com/api/os/bookings/prop_123/booking_123" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "cancellationReason": "Guest requested cancellation",
    "refundAmount": 12000
  }'
```

#### Example Response

```json
{
  "success": true,
  "booking": {
    "id": "booking_123",
    "status": "cancelled",
    "cancellationReason": "Guest requested cancellation",
    "refundAmount": 12000,
    "cancelledAt": "2024-01-15T11:15:00Z"
  },
  "message": "Booking cancelled successfully"
}
```

---

### 5. Check Availability

Check room availability for specific dates and guest count.

```http
GET /api/os/bookings/{propertyId}/availability
```

#### Query Parameters

- `dateFrom` (string, required): Check-in date (ISO 8601)
- `dateTo` (string, required): Check-out date (ISO 8601)
- `guests` (integer, required): Number of guests
- `rooms` (integer, required): Number of rooms needed
- `roomType` (string, optional): Specific room type to check

#### Example Request

```bash
curl -X GET "https://api.example.com/api/os/bookings/prop_123/availability?dateFrom=2024-02-15T15:00:00Z&dateTo=2024-02-18T11:00:00Z&guests=2&rooms=1" \
  -H "X-API-Key: your-api-key"
```

#### Example Response

```json
{
  "success": true,
  "availability": {
    "available": true,
    "availableRooms": 15,
    "requestedRooms": 1,
    "roomTypes": [
      {
        "code": "STD",
        "name": "Standard Room",
        "available": 8,
        "basePrice": 4000,
        "totalPrice": 12000
      },
      {
        "code": "DLX",
        "name": "Deluxe Room",
        "available": 5,
        "basePrice": 5000,
        "totalPrice": 15000
      }
    ],
    "priceBreakdown": {
      "basePrice": 12000,
      "taxes": 2160,
      "fees": 840,
      "total": 15000
    }
  },
  "message": "Rooms available for selected dates"
}
```

---

### 6. Get Booking Details

Retrieve detailed information for a specific booking.

```http
GET /api/os/bookings/{propertyId}/{bookingId}
```

#### Example Request

```bash
curl -X GET "https://api.example.com/api/os/bookings/prop_123/booking_123" \
  -H "X-API-Key: your-api-key"
```

#### Example Response

```json
{
  "success": true,
  "booking": {
    "id": "booking_123",
    "propertyId": "prop_123",
    "guestDetails": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "checkInDate": "2024-02-15T15:00:00Z",
    "checkOutDate": "2024-02-18T11:00:00Z",
    "guests": 2,
    "children": 0,
    "rooms": 1,
    "totalAmount": 15000,
    "status": "confirmed",
    "paymentStatus": "paid",
    "source": "direct",
    "specialRequests": "Late check-in requested",
    "allocatedRoom": {
      "roomNumber": "101",
      "roomId": "room_101",
      "unitTypeCode": "DLX",
      "unitTypeName": "Deluxe Room"
    },
    "paymentHistory": [
      {
        "amount": 15000,
        "method": "card",
        "status": "completed",
        "transactionId": "txn_123",
        "processedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "user": "system"
      },
      {
        "status": "confirmed",
        "timestamp": "2024-01-15T10:31:00Z",
        "user": "admin@example.com"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:31:00Z"
  }
}
```

---

### 7. Bulk Operations

Perform bulk operations on multiple bookings.

```http
POST /api/os/bookings/{propertyId}/bulk
```

#### Request Body

```json
{
  "operation": "update_status",
  "bookingIds": ["booking_123", "booking_456", "booking_789"],
  "updates": {
    "status": "confirmed",
    "paymentStatus": "paid"
  },
  "reason": "Bulk confirmation after payment verification"
}
```

#### Supported Operations

- `update_status`: Update booking status
- `cancel`: Cancel multiple bookings
- `assign_rooms`: Assign rooms to bookings
- `send_notifications`: Send email/SMS notifications

#### Example Response

```json
{
  "success": true,
  "results": {
    "processed": 3,
    "successful": 2,
    "failed": 1,
    "details": [
      {
        "bookingId": "booking_123",
        "status": "success",
        "message": "Booking updated successfully"
      },
      {
        "bookingId": "booking_456",
        "status": "success",
        "message": "Booking updated successfully"
      },
      {
        "bookingId": "booking_789",
        "status": "error",
        "message": "Booking not found"
      }
    ]
  },
  "message": "Bulk operation completed: 2/3 bookings processed successfully"
}
```

---

### 8. Export Bookings

Export booking data in various formats.

```http
GET /api/os/bookings/{propertyId}/export
```

#### Query Parameters

- `format` (string, required): Export format
  - Values: `csv`, `excel`, `pdf`
- `dateFrom` (string, optional): Start date for export
- `dateTo` (string, optional): End date for export
- `status` (string, optional): Filter by status
- `includePersonalInfo` (boolean, optional): Include guest personal info
  - Default: `true`
- `includePaymentInfo` (boolean, optional): Include payment details
  - Default: `true`

#### Example Request

```bash
curl -X GET "https://api.example.com/api/os/bookings/prop_123/export?format=csv&dateFrom=2024-01-01&dateTo=2024-01-31" \
  -H "X-API-Key: your-api-key" \
  -o bookings_january.csv
```

---

### 9. Analytics & Reports

Get booking analytics and performance metrics.

```http
GET /api/os/bookings/{propertyId}/analytics
```

#### Query Parameters

- `period` (string, optional): Analysis period
  - Values: `today`, `week`, `month`, `quarter`, `year`, `custom`
  - Default: `month`
- `dateFrom` (string, optional): Start date for custom period
- `dateTo` (string, optional): End date for custom period
- `metrics` (string, optional): Comma-separated metrics to include
  - Values: `revenue`, `occupancy`, `adr`, `revpar`, `cancellation_rate`
  - Default: All metrics

#### Example Response

```json
{
  "success": true,
  "analytics": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z",
      "label": "January 2024"
    },
    "metrics": {
      "totalBookings": 150,
      "totalRevenue": 2500000,
      "averageDailyRate": 16667,
      "occupancyRate": 75.5,
      "revenuePAR": 12583,
      "cancellationRate": 5.3,
      "averageStayLength": 2.8,
      "leadTime": 14.2
    },
    "trends": {
      "bookings": [
        { "date": "2024-01-01", "count": 8 },
        { "date": "2024-01-02", "count": 12 }
      ],
      "revenue": [
        { "date": "2024-01-01", "amount": 120000 },
        { "date": "2024-01-02", "amount": 180000 }
      ]
    },
    "breakdown": {
      "sources": {
        "direct": 45,
        "booking_com": 30,
        "expedia": 20,
        "others": 5
      },
      "roomTypes": {
        "standard": 60,
        "deluxe": 30,
        "suite": 10
      }
    }
  }
}
```

---

### 10. Webhooks

Configure webhooks for booking events.

```http
POST /api/os/bookings/{propertyId}/webhooks
```

#### Request Body

```json
{
  "url": "https://your-system.com/webhooks/bookings",
  "events": [
    "booking.created",
    "booking.updated",
    "booking.cancelled",
    "payment.completed",
    "payment.failed"
  ],
  "secret": "your-webhook-secret",
  "active": true
}
```

#### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `booking.created` | New booking created | Full booking object |
| `booking.updated` | Booking details updated | Updated booking object |
| `booking.cancelled` | Booking cancelled | Booking object with cancellation details |
| `payment.completed` | Payment processed successfully | Booking and payment objects |
| `payment.failed` | Payment processing failed | Booking and error details |
| `check_in.completed` | Guest checked in | Booking with check-in details |
| `check_out.completed` | Guest checked out | Booking with check-out details |

#### Webhook Payload Example

```json
{
  "event": "booking.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "booking": {
      "id": "booking_123",
      "propertyId": "prop_123",
      "status": "confirmed",
      "guestDetails": {
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "checkInDate": "2024-02-15T15:00:00Z",
      "checkOutDate": "2024-02-18T11:00:00Z",
      "totalAmount": 15000
    }
  },
  "signature": "sha256=signature-hash"
}
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const BookingAPI = require('@your-company/booking-api');

const client = new BookingAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.example.com'
});

// Create a booking
const booking = await client.bookings.create('prop_123', {
  guestDetails: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890'
  },
  dateFrom: '2024-02-15T15:00:00Z',
  dateTo: '2024-02-18T11:00:00Z',
  guests: 2,
  rooms: 1,
  totalAmount: 15000
});

// List bookings
const bookings = await client.bookings.list('prop_123', {
  status: 'confirmed',
  limit: 20
});

// Update booking
const updated = await client.bookings.update('prop_123', {
  bookingId: 'booking_123',
  status: 'confirmed',
  paymentStatus: 'paid'
});
```

### Python

```python
from booking_api import BookingClient

client = BookingClient(
    api_key='your-api-key',
    base_url='https://api.example.com'
)

# Create booking
booking = client.bookings.create('prop_123', {
    'guestDetails': {
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'phone': '+1234567890'
    },
    'dateFrom': '2024-02-15T15:00:00Z',
    'dateTo': '2024-02-18T11:00:00Z',
    'guests': 2,
    'rooms': 1,
    'totalAmount': 15000
})

# List bookings
bookings = client.bookings.list('prop_123', status='confirmed', limit=20)
```

---

## Testing

### Test Credentials

**Sandbox Environment:**
- Base URL: `https://sandbox-api.example.com`
- API Key: `test_sk_123456789`
- Property ID: `test_prop_123`

### Sample Test Data

```json
{
  "testBooking": {
    "guestDetails": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890"
    },
    "dateFrom": "2024-12-15T15:00:00Z",
    "dateTo": "2024-12-18T11:00:00Z",
    "guests": 2,
    "rooms": 1,
    "totalAmount": 15000
  }
}
```

---

## Support

### Contact Information

- **API Support**: api-support@example.com
- **Documentation**: https://docs.example.com/api/bookings
- **Status Page**: https://status.example.com
- **Discord Community**: https://discord.gg/example

### Response Times

- **Critical Issues**: 2 hours
- **General Support**: 24 hours
- **Feature Requests**: 48 hours

---

## Changelog

### Version 2.1.0 (2024-01-15)
- Added bulk operations endpoint
- Enhanced analytics with new metrics
- Improved error handling and validation
- Added webhook support for real-time notifications

### Version 2.0.0 (2024-01-01)
- Complete API redesign with improved REST structure
- Added comprehensive filtering and pagination
- Enhanced security with rate limiting
- New booking workflow features

---

*Last updated: January 15, 2024*