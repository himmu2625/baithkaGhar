# API Structure Planning - F&B & Events Management

## Base URL Structure
```
/api/v1/properties/{propertyId}/
```

## Authentication
- JWT tokens for staff authentication
- Role-based access control (RBAC)
- Property-based data isolation
- API key authentication for external integrations

---

## F&B API ENDPOINTS

### 1. Menu Management APIs

#### Menu Categories
```
GET    /api/v1/properties/{propertyId}/fb/menu/categories
POST   /api/v1/properties/{propertyId}/fb/menu/categories
GET    /api/v1/properties/{propertyId}/fb/menu/categories/{id}
PUT    /api/v1/properties/{propertyId}/fb/menu/categories/{id}
DELETE /api/v1/properties/{propertyId}/fb/menu/categories/{id}
GET    /api/v1/properties/{propertyId}/fb/menu/categories/by-type/{categoryType}
PUT    /api/v1/properties/{propertyId}/fb/menu/categories/{id}/reorder
```

**Query Parameters:**
- `active`: boolean - Filter active/inactive categories
- `type`: string - Filter by category type
- `sort`: string - Sort by name, displayOrder, createdAt
- `limit`: number - Pagination limit
- `offset`: number - Pagination offset

#### Menu Items
```
GET    /api/v1/properties/{propertyId}/fb/menu/items
POST   /api/v1/properties/{propertyId}/fb/menu/items
GET    /api/v1/properties/{propertyId}/fb/menu/items/{id}
PUT    /api/v1/properties/{propertyId}/fb/menu/items/{id}
DELETE /api/v1/properties/{propertyId}/fb/menu/items/{id}
GET    /api/v1/properties/{propertyId}/fb/menu/items/category/{categoryId}
GET    /api/v1/properties/{propertyId}/fb/menu/items/available
GET    /api/v1/properties/{propertyId}/fb/menu/items/popular
PUT    /api/v1/properties/{propertyId}/fb/menu/items/{id}/stock
PUT    /api/v1/properties/{propertyId}/fb/menu/items/{id}/rating
POST   /api/v1/properties/{propertyId}/fb/menu/items/bulk-update
```

**Query Parameters:**
- `category`: string - Filter by category ID
- `dietary`: string - Filter by dietary restrictions (vegetarian, vegan, etc.)
- `price_min`: number - Minimum price filter
- `price_max`: number - Maximum price filter
- `available`: boolean - Only show available items
- `tags`: string - Filter by tags
- `search`: string - Search in name/description

#### Menu Modifiers
```
GET    /api/v1/properties/{propertyId}/fb/menu/modifiers
POST   /api/v1/properties/{propertyId}/fb/menu/modifiers
GET    /api/v1/properties/{propertyId}/fb/menu/modifiers/{id}
PUT    /api/v1/properties/{propertyId}/fb/menu/modifiers/{id}
DELETE /api/v1/properties/{propertyId}/fb/menu/modifiers/{id}
GET    /api/v1/properties/{propertyId}/fb/menu/modifiers/for-item/{itemId}
PUT    /api/v1/properties/{propertyId}/fb/menu/modifiers/{id}/options/{optionId}/stock
```

### 2. Order Management APIs

#### F&B Orders
```
GET    /api/v1/properties/{propertyId}/fb/orders
POST   /api/v1/properties/{propertyId}/fb/orders
GET    /api/v1/properties/{propertyId}/fb/orders/{id}
PUT    /api/v1/properties/{propertyId}/fb/orders/{id}
DELETE /api/v1/properties/{propertyId}/fb/orders/{id}
PUT    /api/v1/properties/{propertyId}/fb/orders/{id}/status
POST   /api/v1/properties/{propertyId}/fb/orders/{id}/items
PUT    /api/v1/properties/{propertyId}/fb/orders/{id}/items/{itemId}
DELETE /api/v1/properties/{propertyId}/fb/orders/{id}/items/{itemId}
POST   /api/v1/properties/{propertyId}/fb/orders/{id}/payment
GET    /api/v1/properties/{propertyId}/fb/orders/active
GET    /api/v1/properties/{propertyId}/fb/orders/by-table/{tableId}
GET    /api/v1/properties/{propertyId}/fb/orders/by-guest/{guestId}
POST   /api/v1/properties/{propertyId}/fb/orders/{id}/feedback
```

**Query Parameters:**
- `status`: string - Filter by order status
- `type`: string - Filter by order type (dine_in, room_service, etc.)
- `table`: string - Filter by table ID
- `date_from`: date - Start date filter
- `date_to`: date - End date filter
- `waiter`: string - Filter by assigned waiter

#### Kitchen Display System
```
GET    /api/v1/properties/{propertyId}/fb/orders/kitchen/queue
GET    /api/v1/properties/{propertyId}/fb/orders/kitchen/active
PUT    /api/v1/properties/{propertyId}/fb/orders/{id}/kitchen/assign
PUT    /api/v1/properties/{propertyId}/fb/orders/{id}/items/{itemId}/kitchen/status
GET    /api/v1/properties/{propertyId}/fb/orders/kitchen/performance
POST   /api/v1/properties/{propertyId}/fb/orders/kitchen/bulk-update
```

### 3. Restaurant Operations APIs

#### Tables Management
```
GET    /api/v1/properties/{propertyId}/fb/tables
POST   /api/v1/properties/{propertyId}/fb/tables
GET    /api/v1/properties/{propertyId}/fb/tables/{id}
PUT    /api/v1/properties/{propertyId}/fb/tables/{id}
DELETE /api/v1/properties/{propertyId}/fb/tables/{id}
GET    /api/v1/properties/{propertyId}/fb/tables/available
GET    /api/v1/properties/{propertyId}/fb/tables/by-area/{area}
PUT    /api/v1/properties/{propertyId}/fb/tables/{id}/status
PUT    /api/v1/properties/{propertyId}/fb/tables/{id}/assign-order
POST   /api/v1/properties/{propertyId}/fb/tables/{id}/issue
PUT    /api/v1/properties/{propertyId}/fb/tables/{id}/rating
GET    /api/v1/properties/{propertyId}/fb/tables/occupancy
```

**Query Parameters:**
- `area`: string - Filter by table area
- `capacity_min`: number - Minimum capacity
- `capacity_max`: number - Maximum capacity
- `status`: string - Filter by table status
- `features`: string - Filter by table features

#### Reservations Management
```
GET    /api/v1/properties/{propertyId}/fb/reservations
POST   /api/v1/properties/{propertyId}/fb/reservations
GET    /api/v1/properties/{propertyId}/fb/reservations/{id}
PUT    /api/v1/properties/{propertyId}/fb/reservations/{id}
DELETE /api/v1/properties/{propertyId}/fb/reservations/{id}
PUT    /api/v1/properties/{propertyId}/fb/reservations/{id}/status
PUT    /api/v1/properties/{propertyId}/fb/reservations/{id}/check-in
PUT    /api/v1/properties/{propertyId}/fb/reservations/{id}/assign-table
GET    /api/v1/properties/{propertyId}/fb/reservations/today
GET    /api/v1/properties/{propertyId}/fb/reservations/upcoming
POST   /api/v1/properties/{propertyId}/fb/reservations/{id}/notification
POST   /api/v1/properties/{propertyId}/fb/reservations/{id}/feedback
GET    /api/v1/properties/{propertyId}/fb/reservations/availability
```

#### Kitchen Management
```
GET    /api/v1/properties/{propertyId}/fb/kitchens
POST   /api/v1/properties/{propertyId}/fb/kitchens
GET    /api/v1/properties/{propertyId}/fb/kitchens/{id}
PUT    /api/v1/properties/{propertyId}/fb/kitchens/{id}
GET    /api/v1/properties/{propertyId}/fb/kitchens/{id}/load
PUT    /api/v1/properties/{propertyId}/fb/kitchens/{id}/load
GET    /api/v1/properties/{propertyId}/fb/kitchens/{id}/stations
POST   /api/v1/properties/{propertyId}/fb/kitchens/{id}/temperature-log
GET    /api/v1/properties/{propertyId}/fb/kitchens/performance
```

#### Inventory Management
```
GET    /api/v1/properties/{propertyId}/fb/inventory
POST   /api/v1/properties/{propertyId}/fb/inventory
GET    /api/v1/properties/{propertyId}/fb/inventory/{id}
PUT    /api/v1/properties/{propertyId}/fb/inventory/{id}
DELETE /api/v1/properties/{propertyId}/fb/inventory/{id}
PUT    /api/v1/properties/{propertyId}/fb/inventory/{id}/stock
POST   /api/v1/properties/{propertyId}/fb/inventory/{id}/batch
GET    /api/v1/properties/{propertyId}/fb/inventory/low-stock
GET    /api/v1/properties/{propertyId}/fb/inventory/near-expiry
POST   /api/v1/properties/{propertyId}/fb/inventory/{id}/consumption
GET    /api/v1/properties/{propertyId}/fb/inventory/value-report
POST   /api/v1/properties/{propertyId}/fb/inventory/bulk-update
```

#### Recipe Management
```
GET    /api/v1/properties/{propertyId}/fb/recipes
POST   /api/v1/properties/{propertyId}/fb/recipes
GET    /api/v1/properties/{propertyId}/fb/recipes/{id}
PUT    /api/v1/properties/{propertyId}/fb/recipes/{id}
DELETE /api/v1/properties/{propertyId}/fb/recipes/{id}
POST   /api/v1/properties/{propertyId}/fb/recipes/{id}/scale
GET    /api/v1/properties/{propertyId}/fb/recipes/by-ingredient/{ingredientId}
PUT    /api/v1/properties/{propertyId}/fb/recipes/{id}/costing
POST   /api/v1/properties/{propertyId}/fb/recipes/{id}/feedback
GET    /api/v1/properties/{propertyId}/fb/recipes/popular
GET    /api/v1/properties/{propertyId}/fb/recipes/cost-analysis
```

### 4. F&B Reporting APIs

#### Sales Reports
```
GET    /api/v1/properties/{propertyId}/fb/reports/sales/summary
GET    /api/v1/properties/{propertyId}/fb/reports/sales/daily
GET    /api/v1/properties/{propertyId}/fb/reports/sales/by-category
GET    /api/v1/properties/{propertyId}/fb/reports/sales/by-waiter
GET    /api/v1/properties/{propertyId}/fb/reports/sales/trending
POST   /api/v1/properties/{propertyId}/fb/reports/sales/custom
```

#### Analytics Reports
```
GET    /api/v1/properties/{propertyId}/fb/reports/popular-items
GET    /api/v1/properties/{propertyId}/fb/reports/table-turnover
GET    /api/v1/properties/{propertyId}/fb/reports/kitchen-performance
GET    /api/v1/properties/{propertyId}/fb/reports/inventory-usage
GET    /api/v1/properties/{propertyId}/fb/reports/customer-satisfaction
GET    /api/v1/properties/{propertyId}/fb/reports/profit-analysis
```

---

## EVENTS API ENDPOINTS

### 1. Event Booking APIs

#### Event Bookings
```
GET    /api/v1/properties/{propertyId}/events/bookings
POST   /api/v1/properties/{propertyId}/events/bookings
GET    /api/v1/properties/{propertyId}/events/bookings/{id}
PUT    /api/v1/properties/{propertyId}/events/bookings/{id}
DELETE /api/v1/properties/{propertyId}/events/bookings/{id}
PUT    /api/v1/properties/{propertyId}/events/bookings/{id}/status
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/payment
GET    /api/v1/properties/{propertyId}/events/bookings/upcoming
GET    /api/v1/properties/{propertyId}/events/bookings/by-coordinator/{coordinatorId}
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/communication
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/staff
PUT    /api/v1/properties/{propertyId}/events/bookings/{id}/staff/{staffId}
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/modification
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/issue
POST   /api/v1/properties/{propertyId}/events/bookings/{id}/feedback
```

#### Availability Check
```
GET    /api/v1/properties/{propertyId}/events/availability/venues
GET    /api/v1/properties/{propertyId}/events/availability/date/{date}
POST   /api/v1/properties/{propertyId}/events/availability/check
GET    /api/v1/properties/{propertyId}/events/availability/venues/{venueId}
GET    /api/v1/properties/{propertyId}/events/availability/staff/{date}
GET    /api/v1/properties/{propertyId}/events/availability/equipment/{date}
```

#### Event Packages
```
GET    /api/v1/properties/{propertyId}/events/packages
POST   /api/v1/properties/{propertyId}/events/packages
GET    /api/v1/properties/{propertyId}/events/packages/{id}
PUT    /api/v1/properties/{propertyId}/events/packages/{id}
DELETE /api/v1/properties/{propertyId}/events/packages/{id}
GET    /api/v1/properties/{propertyId}/events/packages/by-category/{category}
GET    /api/v1/properties/{propertyId}/events/packages/for-guest-count/{count}
POST   /api/v1/properties/{propertyId}/events/packages/{id}/quote
GET    /api/v1/properties/{propertyId}/events/packages/featured
GET    /api/v1/properties/{propertyId}/events/packages/popular
POST   /api/v1/properties/{propertyId}/events/packages/{id}/feedback
GET    /api/v1/properties/{propertyId}/events/packages/analytics
```

### 2. Venue Management APIs

#### Event Venues
```
GET    /api/v1/properties/{propertyId}/events/venues
POST   /api/v1/properties/{propertyId}/events/venues
GET    /api/v1/properties/{propertyId}/events/venues/{id}
PUT    /api/v1/properties/{propertyId}/events/venues/{id}
DELETE /api/v1/properties/{propertyId}/events/venues/{id}
GET    /api/v1/properties/{propertyId}/events/venues/by-type/{type}
GET    /api/v1/properties/{propertyId}/events/venues/by-capacity/{capacity}
PUT    /api/v1/properties/{propertyId}/events/venues/{id}/status
POST   /api/v1/properties/{propertyId}/events/venues/{id}/maintenance
POST   /api/v1/properties/{propertyId}/events/venues/{id}/issue
GET    /api/v1/properties/{propertyId}/events/venues/{id}/utilization
GET    /api/v1/properties/{propertyId}/events/venues/occupancy-report
```

#### Equipment Management
```
GET    /api/v1/properties/{propertyId}/events/equipment
POST   /api/v1/properties/{propertyId}/events/equipment
GET    /api/v1/properties/{propertyId}/events/equipment/{id}
PUT    /api/v1/properties/{propertyId}/events/equipment/{id}
DELETE /api/v1/properties/{propertyId}/events/equipment/{id}
GET    /api/v1/properties/{propertyId}/events/equipment/available
GET    /api/v1/properties/{propertyId}/events/equipment/by-category/{category}
POST   /api/v1/properties/{propertyId}/events/equipment/{id}/book
PUT    /api/v1/properties/{propertyId}/events/equipment/{id}/return
POST   /api/v1/properties/{propertyId}/events/equipment/{id}/maintenance
POST   /api/v1/properties/{propertyId}/events/equipment/{id}/issue
GET    /api/v1/properties/{propertyId}/events/equipment/maintenance-due
GET    /api/v1/properties/{propertyId}/events/equipment/utilization-report
POST   /api/v1/properties/{propertyId}/events/equipment/{id}/quote
```

#### Services Management
```
GET    /api/v1/properties/{propertyId}/events/services
POST   /api/v1/properties/{propertyId}/events/services
GET    /api/v1/properties/{propertyId}/events/services/{id}
PUT    /api/v1/properties/{propertyId}/events/services/{id}
DELETE /api/v1/properties/{propertyId}/events/services/{id}
GET    /api/v1/properties/{propertyId}/events/services/by-category/{category}
GET    /api/v1/properties/{propertyId}/events/services/available/{date}
POST   /api/v1/properties/{propertyId}/events/services/{id}/book
POST   /api/v1/properties/{propertyId}/events/services/{id}/quote
POST   /api/v1/properties/{propertyId}/events/services/{id}/review
GET    /api/v1/properties/{propertyId}/events/services/in-house
GET    /api/v1/properties/{propertyId}/events/services/performance-report
```

### 3. Event Operations APIs

#### Event Timeline
```
GET    /api/v1/properties/{propertyId}/events/timeline/{eventId}
POST   /api/v1/properties/{propertyId}/events/timeline
PUT    /api/v1/properties/{propertyId}/events/timeline/{id}
DELETE /api/v1/properties/{propertyId}/events/timeline/{id}
PUT    /api/v1/properties/{propertyId}/events/timeline/{id}/phase/{phaseId}/status
PUT    /api/v1/properties/{propertyId}/events/timeline/{id}/task/{taskId}/status
POST   /api/v1/properties/{propertyId}/events/timeline/{id}/communication
POST   /api/v1/properties/{propertyId}/events/timeline/{id}/modification
POST   /api/v1/properties/{propertyId}/events/timeline/{id}/risk
GET    /api/v1/properties/{propertyId}/events/timeline/{id}/active-tasks
GET    /api/v1/properties/{propertyId}/events/timeline/{id}/critical-path
GET    /api/v1/properties/{propertyId}/events/timeline/{id}/upcoming-milestones
GET    /api/v1/properties/{propertyId}/events/timeline/active
GET    /api/v1/properties/{propertyId}/events/timeline/by-date/{date}
GET    /api/v1/properties/{propertyId}/events/timeline/by-coordinator/{coordinatorId}
```

#### Staff Assignment
```
GET    /api/v1/properties/{propertyId}/events/staff
POST   /api/v1/properties/{propertyId}/events/staff
GET    /api/v1/properties/{propertyId}/events/staff/{id}
PUT    /api/v1/properties/{propertyId}/events/staff/{id}
DELETE /api/v1/properties/{propertyId}/events/staff/{id}
PUT    /api/v1/properties/{propertyId}/events/staff/{id}/status
PUT    /api/v1/properties/{propertyId}/events/staff/{id}/task/{taskId}
POST   /api/v1/properties/{propertyId}/events/staff/{id}/task
POST   /api/v1/properties/{propertyId}/events/staff/{id}/attendance
POST   /api/v1/properties/{propertyId}/events/staff/{id}/communication
POST   /api/v1/properties/{propertyId}/events/staff/{id}/feedback
POST   /api/v1/properties/{propertyId}/events/staff/{id}/issue
GET    /api/v1/properties/{propertyId}/events/staff/by-event/{eventId}
GET    /api/v1/properties/{propertyId}/events/staff/by-member/{staffMemberId}
GET    /api/v1/properties/{propertyId}/events/staff/schedule/{date}
GET    /api/v1/properties/{propertyId}/events/staff/performance-report
```

#### Event Menu Management
```
GET    /api/v1/properties/{propertyId}/events/menus
POST   /api/v1/properties/{propertyId}/events/menus
GET    /api/v1/properties/{propertyId}/events/menus/{id}
PUT    /api/v1/properties/{propertyId}/events/menus/{id}
DELETE /api/v1/properties/{propertyId}/events/menus/{id}
GET    /api/v1/properties/{propertyId}/events/menus/by-type/{type}
GET    /api/v1/properties/{propertyId}/events/menus/by-cuisine/{cuisine}
GET    /api/v1/properties/{propertyId}/events/menus/for-guest-count/{count}
POST   /api/v1/properties/{propertyId}/events/menus/{id}/quote
POST   /api/v1/properties/{propertyId}/events/menus/{id}/dietary-check
POST   /api/v1/properties/{propertyId}/events/menus/{id}/feedback
GET    /api/v1/properties/{propertyId}/events/menus/popular
PUT    /api/v1/properties/{propertyId}/events/menus/{id}/version
GET    /api/v1/properties/{propertyId}/events/menus/analytics
```

### 4. Event Billing APIs

#### Event Invoicing
```
GET    /api/v1/properties/{propertyId}/events/invoices
POST   /api/v1/properties/{propertyId}/events/invoices
GET    /api/v1/properties/{propertyId}/events/invoices/{id}
PUT    /api/v1/properties/{propertyId}/events/invoices/{id}
DELETE /api/v1/properties/{propertyId}/events/invoices/{id}
PUT    /api/v1/properties/{propertyId}/events/invoices/{id}/status
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/payment
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/reminder
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/adjustment
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/dispute
GET    /api/v1/properties/{propertyId}/events/invoices/by-booking/{bookingId}
GET    /api/v1/properties/{propertyId}/events/invoices/overdue
GET    /api/v1/properties/{propertyId}/events/invoices/by-status/{status}
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/document
POST   /api/v1/properties/{propertyId}/events/invoices/{id}/send
GET    /api/v1/properties/{propertyId}/events/invoices/revenue-report
GET    /api/v1/properties/{propertyId}/events/invoices/ageing-report
```

### 5. Event Types Management
```
GET    /api/v1/properties/{propertyId}/events/types
POST   /api/v1/properties/{propertyId}/events/types
GET    /api/v1/properties/{propertyId}/events/types/{id}
PUT    /api/v1/properties/{propertyId}/events/types/{id}
DELETE /api/v1/properties/{propertyId}/events/types/{id}
GET    /api/v1/properties/{propertyId}/events/types/by-category/{category}
GET    /api/v1/properties/{propertyId}/events/types/for-capacity/{capacity}
POST   /api/v1/properties/{propertyId}/events/types/{id}/estimate
GET    /api/v1/properties/{propertyId}/events/types/popular
GET    /api/v1/properties/{propertyId}/events/types/analytics
```

### 6. Event Reporting APIs

#### Event Analytics
```
GET    /api/v1/properties/{propertyId}/events/reports/bookings-summary
GET    /api/v1/properties/{propertyId}/events/reports/revenue-analysis
GET    /api/v1/properties/{propertyId}/events/reports/venue-utilization
GET    /api/v1/properties/{propertyId}/events/reports/popular-packages
GET    /api/v1/properties/{propertyId}/events/reports/staff-performance
GET    /api/v1/properties/{propertyId}/events/reports/client-satisfaction
GET    /api/v1/properties/{propertyId}/events/reports/seasonal-trends
POST   /api/v1/properties/{propertyId}/events/reports/custom
```

---

## API STANDARDS & CONVENTIONS

### 1. HTTP Methods
- **GET**: Retrieve data
- **POST**: Create new resources
- **PUT**: Update entire resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

### 2. Response Formats
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### 3. Error Responses
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

### 4. Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Server Error

### 5. Query Parameters Standards
- **Pagination**: `page`, `limit`, `offset`
- **Sorting**: `sort`, `order` (asc/desc)
- **Filtering**: Field-specific parameters
- **Search**: `search`, `q`
- **Date Ranges**: `date_from`, `date_to`

### 6. Headers
- **Authorization**: `Bearer {token}`
- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **X-Property-ID**: Property identifier

---

## AUTHENTICATION & SECURITY

### 1. JWT Authentication
- Access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry)
- Role-based permissions

### 2. Rate Limiting
- 100 requests per minute per user
- 1000 requests per minute per property

### 3. Input Validation
- Request body validation
- Query parameter validation
- File upload validation

### 4. Security Headers
- CORS configuration
- CSRF protection
- XSS protection