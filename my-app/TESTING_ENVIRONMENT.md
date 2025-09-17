# 🧪 OS Development Testing Environment

## Overview

This testing environment provides a complete mock property setup for comprehensive OS development and feature testing without affecting real property data.

## 🚀 Quick Setup

### Step 1: Create Mock Property
```bash
cd my-app
npm run setup:mock-property
```

### Step 2: Access URLs
After setup, use the property ID provided in the console output to access:

```
Inventory Dashboard: /os/inventory/dashboard/[PROPERTY_ID]
Amenities Management: /os/inventory/amenities/[PROPERTY_ID]
Room Management: /os/inventory/rooms/[PROPERTY_ID]
F&B Dashboard: /os/fb/dashboard/[PROPERTY_ID]
Housekeeping: /os/inventory/housekeeping/[PROPERTY_ID]
Analytics: /os/inventory/analytics/[PROPERTY_ID]
```

## 👥 Test User Credentials

### 🔑 Admin User (Full Access)
- **Email**: `dev-admin@test.com`
- **Password**: `DevTest@123`
- **Role**: Admin
- **Permissions**: All modules, full CRUD access
- **Use Case**: Testing all administrative features

### 🏨 Manager User (Limited Access)
- **Email**: `test-manager@test.com`
- **Password**: `TestManager@123`
- **Role**: Manager
- **Permissions**: Inventory, F&B, Housekeeping, Analytics
- **Use Case**: Testing manager-level operations

### 👤 Staff User (Basic Access)
- **Email**: `demo-staff@test.com`
- **Password**: `DemoStaff@123`
- **Role**: Staff
- **Permissions**: Inventory, Housekeeping (read-only)
- **Use Case**: Testing staff-level features

### 🎭 Guest User (Minimal Access)
- **Email**: `test-guest@test.com`
- **Password**: `TestGuest@123`
- **Role**: Guest
- **Permissions**: None
- **Use Case**: Testing guest/customer features

## 🏨 Mock Property Details

### Property Information
- **Name**: DEV TEST HOTEL - Demo Property
- **Type**: 4-star Hotel
- **Total Rooms**: 50 (101-150)
- **Location**: Test City, Test State
- **Contact**: +91-9999-TEST-01

### Room Distribution
- **Standard Room**: 20 rooms (₹2,500/night)
- **Deluxe Room**: 15 rooms (₹3,500/night)
- **Suite**: 10 rooms (₹5,500/night)
- **Presidential Suite**: 5 rooms (₹8,500/night)

### Amenities (22 total)
✅ WiFi, AC, TV, Minibar, Room Service, Laundry
✅ Swimming Pool, Gym, Spa, Restaurant, Bar, Parking
✅ Conference Room, Business Center, Concierge
✅ 24x7 Reception, Elevator, Garden, Terrace
✅ Kitchen, Balcony, Jacuzzi

### Facilities (6 total)
- **Main Restaurant**: 80 capacity, 6 AM - 11 PM
- **Rooftop Bar**: 40 capacity, 5 PM - 1 AM
- **Swimming Pool**: 30 capacity, 6 AM - 10 PM
- **Fitness Center**: 15 capacity, 24/7
- **Conference Hall A**: 100 capacity, 9 AM - 9 PM
- **Spa & Wellness**: 8 capacity, 10 AM - 8 PM

## 📊 Mock Data Included

### Rooms (50 total)
- **Available**: ~35 rooms
- **Occupied**: ~10 rooms
- **Maintenance**: ~3 rooms
- **Cleaning**: ~2 rooms

### Bookings (25 total)
- **Confirmed**: Future bookings
- **Checked In**: Current guests
- **Checked Out**: Past stays
- **Cancelled**: Cancelled reservations

### Test Scenarios Covered
- ✅ Multi-room type management
- ✅ Various booking statuses
- ✅ Different occupancy patterns
- ✅ Amenity and facility testing
- ✅ User role permissions
- ✅ Analytics data generation

## 🧭 Testing Workflows

### 1. Inventory Management Testing
```
1. Login as dev-admin@test.com
2. Go to /os/inventory/dashboard/[PROPERTY_ID]
3. Test amenities (should show 22 amenities)
4. Test rooms (should show 50 rooms)
5. Test facilities management
6. Test room types and rates
```

### 2. Multi-User Role Testing
```
1. Login with different user credentials
2. Verify role-based access restrictions
3. Test permission levels for each role
4. Ensure data isolation per role
```

### 3. F&B Operations Testing
```
1. Access F&B dashboard
2. Test restaurant management
3. Test bar operations
4. Test catering services
5. Verify facility integration
```

### 4. Housekeeping Testing
```
1. Test room status updates
2. Test cleaning schedules
3. Test maintenance requests
4. Verify task assignments
```

### 5. Analytics Testing
```
1. Test occupancy analytics
2. Test revenue reporting
3. Test facility utilization
4. Test booking patterns
```

## 🔄 Regenerating Test Data

If you need fresh test data:

```bash
# Remove existing mock property (optional)
# Delete from MongoDB manually or run cleanup script

# Create new mock property
npm run setup:mock-property
```

## 🛡️ Security Notes

- **Development Only**: This setup is for development/testing only
- **No Production Use**: Never use these credentials in production
- **Test Data**: All data is mock and safe to modify/delete
- **Isolated Environment**: Test property is clearly marked and separated

## 🐛 Troubleshooting

### Common Issues

**1. Property ID not working**
- Ensure you're using the exact property ID from setup output
- Check MongoDB connection
- Verify property was created successfully

**2. Login issues**
- Use exact credentials (case-sensitive)
- Clear browser cache/cookies
- Check if users were created successfully

**3. Missing data**
- Re-run the setup script
- Check MongoDB for data existence
- Verify database connection

**4. Permission errors**
- Ensure you're logged in with correct user
- Check user role assignments
- Verify feature permissions

### Support Commands

```bash
# Check if mock property exists
node -e "require('./lib/db/dbConnect'); const Property = require('./models/Property'); Property.findOne({name: /DEV TEST HOTEL/}).then(p => console.log(p ? 'Found' : 'Not found'))"

# List all test users
node -e "require('./lib/db/dbConnect'); const User = require('./models/User'); User.find({email: /@test\.com/}).then(users => console.log(users.map(u => u.email)))"
```

## 📈 Development Benefits

### Advantages of Mock Property Testing

1. **Safe Testing**: No risk of affecting real property data
2. **Complete Features**: All modules and features available
3. **Multiple Scenarios**: Various booking states and room statuses
4. **Role Testing**: Different user permission levels
5. **Performance Testing**: Adequate data volume for testing
6. **Isolated Environment**: Clear separation from production data

### Best Practices

- Always use mock property for feature development
- Test with different user roles before production
- Verify analytics and reporting with mock data
- Use mock property for demo purposes
- Clean up test data regularly

---

**🎯 Happy Testing! Your complete OS development environment is ready!**