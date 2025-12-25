# 🏨 Property Assignment Workflow - Complete Guide

**Status:** ✅ **COMPLETE & WORKING**
**Date:** December 23, 2025
**Version:** 1.0

---

## 📋 Overview

This document explains the **complete property assignment workflow** from creating an owner account to the owner seeing and managing their properties in the Owner System (OS).

### ✅ What's Already Working

The property assignment system is **fully functional** and includes:
- Property selection during owner creation
- Property selection when editing owners
- Automatic two-way linking (User ↔ Property)
- Owner dashboard showing assigned properties
- Real-time property access control

---

## 🔄 Complete Workflow

### **Flow Diagram**

```
Admin Creates Owner → Selects Properties → System Links Them → Owner Logs In → Sees Properties
       ↓                     ↓                    ↓                  ↓              ↓
   /admin/owner-logins   Checkboxes      Database Updates    /os/login    /os/properties
```

---

## 📝 Step-by-Step Process

### **Step 1: Admin Creates Owner Account**

1. Admin navigates to `/admin/owner-logins`
2. Clicks **"Create Owner"** button
3. Create Owner modal opens

### **Step 2: Fill Owner Information**

**Basic Information:**
```
Name: John Doe
Email: owner@grandhotel.com
Phone: +91 9876543210
Password: SecurePass123
```

**Business Information:**
```
Business Name: Grand Hotel Pvt Ltd
Business Type: Company
GST Number: 22AAAAA0000A1Z5
PAN Number: AAAAA0000A
KYC Status: Pending
```

### **Step 3: Assign Properties (THIS IS THE KEY STEP)**

In the **"Property Assignment"** section:

1. Admin sees a scrollable list of ALL available properties
2. Each property shows:
   - Property name
   - Location (if available)
   - Checkbox to select/deselect

3. Admin checks the properties to assign:
   ```
   ☑ Grand Hotel - Pokhara
   ☑ Lakeside Resort - Pokhara
   ☐ Mountain View Hotel - Kathmandu
   ```

4. Counter shows: "Selected: 2 properties"

5. Admin clicks **"Create Owner"**

---

### **Step 4: Backend Processing**

When admin clicks "Create Owner", the system performs these actions:

#### **4.1 Create User Document**
```javascript
{
  name: "John Doe",
  email: "owner@grandhotel.com",
  phone: "+91 9876543210",
  password: "hashed_password_here",
  role: "property_owner",
  isAdmin: false,
  profileComplete: true,
  ownerProfile: {
    propertyIds: [
      ObjectId("prop_id_1"),  // Grand Hotel
      ObjectId("prop_id_2")   // Lakeside Resort
    ],
    businessName: "Grand Hotel Pvt Ltd",
    businessType: "company",
    gstNumber: "22AAAAA0000A1Z5",
    panNumber: "AAAAA0000A",
    kycStatus: "pending",
    registeredAt: "2025-12-23T00:00:00Z"
  }
}
```

#### **4.2 Update Property Documents**
```javascript
// Property 1 (Grand Hotel)
{
  _id: ObjectId("prop_id_1"),
  title: "Grand Hotel",
  location: "Pokhara",
  ownerId: ObjectId("john_doe_user_id"),  // ← LINKED!
  // ... other fields
}

// Property 2 (Lakeside Resort)
{
  _id: ObjectId("prop_id_2"),
  title: "Lakeside Resort",
  location: "Pokhara",
  ownerId: ObjectId("john_doe_user_id"),  // ← LINKED!
  // ... other fields
}
```

#### **4.3 Two-Way Linking Achieved**
```
User Document                    Property Documents
┌─────────────────┐             ┌──────────────────┐
│ John Doe        │             │ Grand Hotel      │
│ ownerProfile:   │◄───────────►│ ownerId: John    │
│  propertyIds: [ │             └──────────────────┘
│    - Grand Hotel│
│    - Lakeside   │             ┌──────────────────┐
│  ]              │◄───────────►│ Lakeside Resort  │
└─────────────────┘             │ ownerId: John    │
                                └──────────────────┘
```

---

### **Step 5: Admin Shares Credentials**

Admin sends owner the login details:

```
Subject: Your Baithaka Ghar Owner Portal Access

Dear John,

Your owner portal account has been created!

Login URL: https://baithakaghar.com/os/login
Email: owner@grandhotel.com
Password: SecurePass123

Assigned Properties:
- Grand Hotel, Pokhara
- Lakeside Resort, Pokhara

Please log in and change your password.

Best regards,
Baithaka Ghar Team
```

---

### **Step 6: Owner Logs In**

1. Owner visits `https://baithakaghar.com/os/login`
2. Enters credentials:
   ```
   Email: owner@grandhotel.com
   Password: SecurePass123
   ```
3. Clicks **"Sign In to Portal"**
4. System validates credentials
5. Creates session with owner's user ID
6. Redirects to `/os/dashboard`

---

### **Step 7: System Fetches Owner's Properties**

When owner lands on dashboard or properties page:

#### **Backend Process:**
```javascript
// 1. Get session user ID
const userId = session.user.id; // "john_doe_user_id"

// 2. Fetch user from database
const user = await User.findById(userId);

// 3. Extract propertyIds from ownerProfile
const propertyIds = user.ownerProfile.propertyIds;
// Returns: [ObjectId("prop_id_1"), ObjectId("prop_id_2")]

// 4. Fetch properties with those IDs
const properties = await Property.find({
  _id: { $in: propertyIds },
  status: { $ne: 'deleted' }
});

// 5. Return properties to frontend
return {
  properties: [
    { title: "Grand Hotel", location: "Pokhara", ... },
    { title: "Lakeside Resort", location: "Pokhara", ... }
  ],
  total: 2
}
```

---

### **Step 8: Owner Sees Properties**

Owner now sees their assigned properties on:

#### **Dashboard (`/os/dashboard`)**
```
┌─────────────────────────────────────┐
│ Welcome, John Doe                   │
├─────────────────────────────────────┤
│ Your Properties: 2                  │
│                                     │
│ ┌────────────┐  ┌────────────┐    │
│ │ Grand Hotel│  │ Lakeside   │    │
│ │ 15 bookings│  │ 12 bookings│    │
│ └────────────┘  └────────────┘    │
└─────────────────────────────────────┘
```

#### **Properties Page (`/os/properties`)**
```
┌─────────────────────────────────────┐
│ My Properties              (2 total)│
├─────────────────────────────────────┤
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 🏨 Grand Hotel               │   │
│ │ 📍 Pokhara                   │   │
│ │ ⭐ 4.5 rating                │   │
│ │ [Manage Property]            │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ 🏨 Lakeside Resort           │   │
│ │ 📍 Pokhara                   │   │
│ │ ⭐ 4.8 rating                │   │
│ │ [Manage Property]            │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔧 Editing Property Assignment

### **Adding More Properties to Existing Owner**

1. Admin goes to `/admin/owner-logins`
2. Finds the owner in the table
3. Clicks menu (⋮) → **"Edit Owner"**
4. Edit Owner modal opens with:
   - Current assigned properties **checked**
   - Other properties **unchecked**
5. Admin checks additional properties:
   ```
   ☑ Grand Hotel - Pokhara (already assigned)
   ☑ Lakeside Resort - Pokhara (already assigned)
   ☑ Mountain View Hotel - Kathmandu (newly selected)
   ```
6. Clicks **"Update Owner"**
7. System updates both User and Property documents

### **Removing Properties from Owner**

1. Same steps as above
2. Admin **unchecks** properties to remove:
   ```
   ☑ Grand Hotel - Pokhara (keep)
   ☐ Lakeside Resort - Pokhara (remove)
   ```
3. Clicks **"Update Owner"**
4. System:
   - Removes `prop_id_2` from User's `ownerProfile.propertyIds`
   - Sets Property's `ownerId` to `null`

---

## 🗄️ Database Schema

### **User Collection**
```javascript
{
  _id: ObjectId("user_id"),
  name: "John Doe",
  email: "owner@grandhotel.com",
  password: "hashed_password",
  role: "property_owner",
  ownerProfile: {
    propertyIds: [
      ObjectId("prop_id_1"),
      ObjectId("prop_id_2")
    ],
    businessName: "Grand Hotel Pvt Ltd",
    kycStatus: "pending"
  }
}
```

### **Property Collection**
```javascript
{
  _id: ObjectId("prop_id_1"),
  title: "Grand Hotel",
  location: "Pokhara",
  ownerId: ObjectId("user_id"),  // References User._id
  status: "active"
}
```

### **Indexes for Performance**
```javascript
// User indexes
users.createIndex({ "ownerProfile.propertyIds": 1 })
users.createIndex({ role: 1 })

// Property indexes
properties.createIndex({ ownerId: 1 })
properties.createIndex({ status: 1 })
```

---

## 🔒 Access Control Logic

### **How System Determines Property Access**

```javascript
// lib/auth/os-auth.ts
export async function getOwnerPropertyIds(userId) {
  const user = await User.findById(userId);

  // Super admins see ALL properties
  if (user.role === 'super_admin') {
    return ['*'];
  }

  // Admins see ALL properties
  if (user.role === 'admin') {
    return ['*'];
  }

  // Property owners see ONLY their assigned properties
  if (user.role === 'property_owner') {
    return user.ownerProfile.propertyIds.map(id => id.toString());
  }

  // Everyone else sees nothing
  return [];
}
```

### **Property Fetching Logic**

```javascript
// app/api/os/properties/route.ts
const propertyIds = await getOwnerPropertyIds(session.user.id);

// If propertyIds is ['*'], fetch all
// If propertyIds is ['prop_id_1', 'prop_id_2'], fetch only those
const properties = propertyIds.includes('*')
  ? await Property.find({ status: { $ne: 'deleted' } })
  : await Property.find({ _id: { $in: propertyIds } });
```

---

## ✅ Validation & Error Handling

### **During Owner Creation**

```javascript
// 1. Email uniqueness check
if (existingUser) {
  return { error: "Email already exists" };
}

// 2. Property ID validation
const validPropertyIds = propertyIds
  .filter(id => mongoose.Types.ObjectId.isValid(id))
  .map(id => new mongoose.Types.ObjectId(id));

// 3. Property existence check (implicit)
// Only valid IDs are stored
```

### **During Property Fetch**

```javascript
// 1. Authentication check
if (!session) {
  return { error: "Unauthorized" };
}

// 2. Role check
if (!['property_owner', 'admin', 'super_admin'].includes(user.role)) {
  return { error: "Access denied" };
}

// 3. Property access check
const propertyIds = await getOwnerPropertyIds(userId);
if (propertyIds.length === 0) {
  return { properties: [], total: 0 };
}
```

---

## 🚨 Common Scenarios

### **Scenario 1: Owner Has No Properties**

**Situation:** Admin creates owner but doesn't select any properties

**What Happens:**
```
1. Owner logs in successfully
2. Navigates to /os/properties
3. Sees: "No Properties Found"
4. Message: "Please contact administrator to assign properties"
```

**Solution:**
```
Admin → Edit Owner → Select Properties → Update Owner
Owner → Refresh page → Properties appear
```

---

### **Scenario 2: Owner Assigned to Wrong Property**

**Situation:** Admin accidentally selected wrong property

**What Happens:**
```
Owner sees property they shouldn't have access to
```

**Solution:**
```
Admin → Edit Owner → Uncheck wrong property → Update Owner
System → Removes ownerId from Property document
Owner → Refresh → Property disappears
```

---

### **Scenario 3: Property Deleted but Still in Owner Profile**

**Situation:** Property was deleted but still in `ownerProfile.propertyIds`

**What Happens:**
```javascript
// System handles gracefully
const properties = await Property.find({
  _id: { $in: propertyIds },
  status: { $ne: 'deleted' }  // ← Filters out deleted properties
});

// Owner won't see deleted property
```

**Solution:**
```
System automatically handles this - no action needed
```

---

### **Scenario 4: Owner Needs More Properties**

**Situation:** Owner buys another property

**What Happens:**
```
1. New property is added to database
2. Admin assigns it to owner
3. Owner can immediately see it
```

**Steps:**
```
Admin → Edit Owner → Check new property → Update Owner
System → Adds propertyId to User, adds ownerId to Property
Owner → Refresh /os/properties → New property appears
```

---

## 🔍 Debugging Guide

### **Owner Can't See Properties - Checklist**

1. ✅ **Check User Document**
   ```javascript
   db.users.findOne({ email: "owner@hotel.com" })
   // Verify: ownerProfile.propertyIds has values
   ```

2. ✅ **Check Property Documents**
   ```javascript
   db.properties.find({ ownerId: ObjectId("user_id") })
   // Should return properties
   ```

3. ✅ **Check Role**
   ```javascript
   db.users.findOne({ email: "owner@hotel.com" })
   // Verify: role === "property_owner"
   ```

4. ✅ **Check Session**
   ```javascript
   // In browser DevTools → Application → Cookies
   // Look for: next-auth.session-token
   ```

5. ✅ **Check API Response**
   ```javascript
   // Browser DevTools → Network Tab
   // Check: /api/os/properties
   // Response should have: { properties: [...], total: X }
   ```

---

### **Common Issues & Fixes**

| Issue | Symptom | Cause | Fix |
|-------|---------|-------|-----|
| Empty properties array | Owner sees "No Properties Found" | `ownerProfile.propertyIds` is empty | Admin → Edit Owner → Select Properties |
| Wrong properties shown | Owner sees someone else's property | Property has wrong `ownerId` | Admin → Edit Property → Change Owner |
| Can't log in | "Invalid credentials" | Wrong email/password | Admin → Reset Password |
| Properties not updating | Old properties still visible | Cache issue | Owner → Hard refresh (Ctrl+Shift+R) |
| API returns 401 | Unauthorized error | Session expired | Owner → Log out → Log in again |

---

## 📊 Database Queries for Verification

### **Check Owner's Assigned Properties**
```javascript
// MongoDB Shell
const user = db.users.findOne({ email: "owner@hotel.com" });
const propertyIds = user.ownerProfile.propertyIds;

const properties = db.properties.find({
  _id: { $in: propertyIds }
}).pretty();
```

### **Find All Properties Without Owner**
```javascript
db.properties.find({
  ownerId: { $exists: false },
  status: "active"
}).count();
```

### **Find All Owners and Their Property Count**
```javascript
db.users.aggregate([
  { $match: { role: "property_owner" } },
  {
    $project: {
      name: 1,
      email: 1,
      propertyCount: { $size: "$ownerProfile.propertyIds" }
    }
  }
]);
```

---

## 🎯 Best Practices

### **For Admins**

✅ **DO:**
- Assign properties during owner creation
- Verify property selection before saving
- Inform owner about assigned properties
- Regularly audit owner-property mappings
- Use descriptive property names

❌ **DON'T:**
- Leave owners without properties
- Assign properties to wrong owners
- Forget to update after property changes
- Delete properties without unlinking owners

### **For Developers**

✅ **DO:**
- Always validate propertyIds array
- Use two-way linking (User + Property)
- Handle empty arrays gracefully
- Filter deleted properties in queries
- Index frequently queried fields

❌ **DON'T:**
- Store only one-way references
- Skip validation of ObjectIds
- Return deleted properties
- Query without indexes
- Expose sensitive owner data in APIs

---

## 📈 Performance Considerations

### **Query Optimization**

```javascript
// ❌ BAD - N+1 query problem
for (const owner of owners) {
  const properties = await Property.find({ ownerId: owner._id });
}

// ✅ GOOD - Single aggregation query
const ownersWithProperties = await User.aggregate([
  { $match: { role: "property_owner" } },
  {
    $lookup: {
      from: "properties",
      localField: "_id",
      foreignField: "ownerId",
      as: "properties"
    }
  }
]);
```

### **Caching Strategy**

```javascript
// Cache owner's propertyIds for 1 hour
const cacheKey = `owner:${userId}:properties`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const propertyIds = await getOwnerPropertyIds(userId);
await redis.setex(cacheKey, 3600, JSON.stringify(propertyIds));
```

---

## 🎉 Summary

### **Complete Flow Recap**

```
1. Admin creates owner → Selects properties → Saves
   ↓
2. System stores propertyIds in User document
   ↓
3. System sets ownerId in Property documents
   ↓
4. Admin shares credentials with owner
   ↓
5. Owner logs in at /os/login
   ↓
6. System fetches owner's propertyIds
   ↓
7. System fetches Properties with those IDs
   ↓
8. Owner sees properties on dashboard
   ↓
9. Owner can manage their properties
```

### **Key Takeaways**

✅ Property assignment happens **during owner creation**
✅ Two-way linking ensures data consistency
✅ Owners only see **their assigned properties**
✅ Admins can edit assignments anytime
✅ System handles edge cases gracefully
✅ Performance optimized with indexes

---

**Documentation Version:** 1.0
**Last Updated:** December 23, 2025
**Maintained By:** Development Team

🎊 **Property assignment workflow is complete and production-ready!** 🎊
