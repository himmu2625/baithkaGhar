# 🔒 Owner Access Control & Security Policy

**Status:** ✅ **ENFORCED & SECURE**
**Date:** December 23, 2025
**Version:** 1.0

---

## 🎯 Security Principle

**CRITICAL RULE:** Property owners can **ONLY VIEW and MANAGE** the properties assigned to them by admins. They **CANNOT** add, remove, or modify property assignments in any way.

---

## ✅ What IS Secure (Verified)

### **1. Property Assignment is Admin-Only**

✅ **SECURE:** Only admins can assign properties to owners
✅ **SECURE:** Only admins can remove properties from owners
✅ **SECURE:** Only admins can change property ownership

**Enforcement Location:**
- `app/admin/owner-logins/page.tsx` - Admin UI (requires admin session)
- `app/api/admin/owners/route.ts` - Create owner API (admin auth required)
- `app/api/admin/owners/[id]/route.ts` - Update owner API (admin auth required)

**Code Proof:**
```typescript
// app/api/admin/owners/route.ts
const token = await getToken({ req, secret: authOptions.secret });

if (!token || !['admin', 'super_admin'].includes(token.role as string)) {
  return NextResponse.json(
    { success: false, message: "Unauthorized - Admin access required" },
    { status: 401 }
  );
}
```

---

### **2. Owners CANNOT Modify Their Property List**

✅ **SECURE:** Owners have NO API endpoint to update `ownerProfile.propertyIds`
✅ **SECURE:** Owners have NO UI to modify property assignments
✅ **SECURE:** Owner profile page is READ-ONLY

**Verified:**
- ❌ No `/api/os/profile` PUT/PATCH endpoint exists
- ❌ No `/api/os/user` update endpoint exists
- ❌ Owner profile page (`app/os/profile/page.tsx`) is display-only

**Code Proof:**
```typescript
// app/os/profile/page.tsx
// READ-ONLY - No forms, no update functionality
export default async function OwnerProfilePage() {
  const session = await requireOwnerAuth();

  return (
    // Display only - no edit forms
    <div>
      <p>{session?.user?.name}</p>
      <p>{session?.user?.email}</p>
      // No update buttons or forms
    </div>
  );
}
```

---

### **3. Owners CANNOT Change Property's ownerId**

✅ **SECURE:** Property update API has whitelist of allowed fields
✅ **SECURE:** `ownerId` is NOT in the allowed fields list
✅ **SECURE:** Even if owner sends `ownerId` in request, it's ignored

**Enforcement Location:**
- `app/api/os/properties/[id]/route.ts` - PUT endpoint

**Code Proof:**
```typescript
// app/api/os/properties/[id]/route.ts - Lines 174-195
const allowedFields = [
  'title',
  'description',
  'location',
  'address',
  'price',
  'amenities',
  'rules',
  'maxGuests',
  // ... other fields
  // ownerId is NOT here! ✅
];

// Only allowed fields are processed
const sanitizedUpdates: any = {};
for (const field of allowedFields) {
  if (updates[field] !== undefined) {
    sanitizedUpdates[field] = updates[field];
  }
}
// Any attempt to send ownerId is silently ignored
```

---

### **4. Property Access is Validated**

✅ **SECURE:** Every OS API request validates property ownership
✅ **SECURE:** Owners can only access properties in their `ownerProfile.propertyIds`
✅ **SECURE:** Attempting to access unauthorized property returns 403

**Enforcement Location:**
- `lib/auth/os-auth.ts` - `canAccessProperty()` function
- All `/api/os/properties/*` endpoints

**Code Proof:**
```typescript
// lib/auth/os-auth.ts
export async function canAccessProperty(userId: string, propertyId: string) {
  const propertyIds = await getOwnerPropertyIds(userId);

  // Admins can access all
  if (propertyIds.includes('*')) return true;

  // Owners can only access their assigned properties
  return propertyIds.includes(propertyId);
}

// app/api/os/properties/[id]/route.ts
const hasAccess = await canAccessProperty(session.user.id!, params.id);

if (!hasAccess) {
  return NextResponse.json(
    { error: 'Unauthorized - You do not have access to this property' },
    { status: 403 }
  );
}
```

---

## 🚫 What Owners CANNOT Do

### **Prohibited Actions**

❌ **CANNOT** add properties to their account
❌ **CANNOT** remove properties from their account
❌ **CANNOT** transfer properties to other owners
❌ **CANNOT** modify `ownerProfile.propertyIds` array
❌ **CANNOT** change property's `ownerId` field
❌ **CANNOT** access properties not assigned to them
❌ **CANNOT** view other owners' properties
❌ **CANNOT** modify their role or permissions
❌ **CANNOT** grant themselves admin access

### **Technical Enforcement**

1. **No API Endpoints** - Owners have zero endpoints to modify user data
2. **Whitelist Filtering** - Property updates use strict field whitelist
3. **Session Validation** - Every request checks session role
4. **Property Authorization** - Every property access validates ownership
5. **Read-Only UI** - Owner profile page has no edit forms

---

## ✅ What Owners CAN Do

### **Allowed Actions**

✅ **CAN** view properties assigned to them
✅ **CAN** manage bookings for their properties
✅ **CAN** update property details (title, description, price, etc.)
✅ **CAN** manage rooms within their properties
✅ **CAN** view reports for their properties
✅ **CAN** collect payments for their bookings
✅ **CAN** view guests who booked their properties
✅ **CAN** view notifications related to their properties
✅ **CAN** change their own password (future feature)
✅ **CAN** update business details (future feature)

### **Scope of Control**

Owners have **full operational control** over:
- Property information (name, description, amenities)
- Room types and pricing
- Booking management
- Payment collection
- Guest communication
- Revenue reports

Owners have **NO control** over:
- Property ownership assignment
- User role management
- Platform settings
- Commission rates
- Other owners' data

---

## 🔐 Security Layers

### **Layer 1: Authentication**

```typescript
// Every OS API endpoint starts with:
const session = await getOwnerSession();

if (!session || !session.user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**Protection:**
- Unauthenticated users get 401
- No access to OS APIs without valid session

---

### **Layer 2: Role Validation**

```typescript
// lib/auth/os-auth.ts
export async function requireOwnerAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/os/login');
  }

  // Only property_owner, admin, super_admin allowed
  if (!['property_owner', 'admin', 'super_admin'].includes(session.user.role!)) {
    redirect('/unauthorized');
  }

  return session;
}
```

**Protection:**
- Regular users cannot access OS
- Only authorized roles allowed

---

### **Layer 3: Property Ownership Validation**

```typescript
// Every property-specific endpoint:
const hasAccess = await canAccessProperty(session.user.id!, propertyId);

if (!hasAccess) {
  return NextResponse.json(
    { error: 'Unauthorized - You do not have access to this property' },
    { status: 403 }
  );
}
```

**Protection:**
- Owners can only access their properties
- Cross-owner access blocked

---

### **Layer 4: Field Whitelisting**

```typescript
// Property update endpoint:
const allowedFields = [/* specific fields only */];

const sanitizedUpdates: any = {};
for (const field of allowedFields) {
  if (updates[field] !== undefined) {
    sanitizedUpdates[field] = updates[field];
  }
}
// Only whitelisted fields are updated
```

**Protection:**
- Sensitive fields (ownerId, status) cannot be modified
- Mass assignment attacks prevented

---

### **Layer 5: Admin-Only Endpoints**

```typescript
// app/api/admin/owners/*
const token = await getToken({ req, secret: authOptions.secret });

if (!token || !['admin', 'super_admin'].includes(token.role as string)) {
  return NextResponse.json(
    { success: false, message: "Unauthorized - Admin access required" },
    { status: 401 }
  );
}
```

**Protection:**
- Property assignment APIs are admin-only
- Owners cannot access admin endpoints

---

## 🧪 Security Test Cases

### **Test 1: Owner Attempts to Add Property**

**Scenario:** Owner tries to modify `ownerProfile.propertyIds`

```javascript
// Hypothetical malicious attempt
PUT /api/os/profile
{
  "ownerProfile": {
    "propertyIds": ["new_property_id"]
  }
}
```

**Result:** ❌ **BLOCKED**
- Endpoint doesn't exist
- Returns 404 Not Found

---

### **Test 2: Owner Attempts to Change ownerId**

**Scenario:** Owner tries to steal another property

```javascript
PUT /api/os/properties/property_id
{
  "ownerId": "different_owner_id"
}
```

**Result:** ❌ **BLOCKED**
- `ownerId` not in allowedFields
- Field is silently ignored
- Property ownership unchanged

---

### **Test 3: Owner Attempts to Access Unauthorized Property**

**Scenario:** Owner tries to view another owner's property

```javascript
GET /api/os/properties/unauthorized_property_id
```

**Result:** ❌ **BLOCKED**
```json
{
  "error": "Unauthorized - You do not have access to this property",
  "status": 403
}
```

---

### **Test 4: Owner Attempts to Access Admin API**

**Scenario:** Owner tries to use admin endpoints

```javascript
POST /api/admin/owners
{
  "name": "New Owner",
  "propertyIds": ["some_property"]
}
```

**Result:** ❌ **BLOCKED**
```json
{
  "success": false,
  "message": "Unauthorized - Admin access required",
  "status": 401
}
```

---

### **Test 5: Direct Database Manipulation**

**Scenario:** Owner somehow gets database access

**Protection:**
- MongoDB connection string is server-side only
- Never exposed to client
- Environment variables secured
- Database credentials not in frontend code

---

## 📋 Access Control Matrix

| Action | Regular User | Property Owner | Admin | Super Admin |
|--------|-------------|----------------|-------|-------------|
| View own properties | ❌ | ✅ | ✅ | ✅ |
| View all properties | ❌ | ❌ | ✅ | ✅ |
| Update property details | ❌ | ✅ (own only) | ✅ | ✅ |
| Assign properties to owners | ❌ | ❌ | ✅ | ✅ |
| Remove properties from owners | ❌ | ❌ | ✅ | ✅ |
| Change property ownerId | ❌ | ❌ | ✅ | ✅ |
| Modify ownerProfile.propertyIds | ❌ | ❌ | ✅ | ✅ |
| Create owner accounts | ❌ | ❌ | ✅ | ✅ |
| Delete owner accounts | ❌ | ❌ | ❌ | ✅ |
| View owner list | ❌ | ❌ | ✅ | ✅ |
| Reset owner passwords | ❌ | ❌ | ✅ | ✅ |
| Access /admin/* pages | ❌ | ❌ | ✅ | ✅ |
| Access /os/* pages | ❌ | ✅ | ✅ | ✅ |

---

## 🛡️ Defense in Depth

### **Multiple Security Mechanisms**

```
Request from Owner
       ↓
[1] Session Authentication ✅
       ↓
[2] Role Validation ✅
       ↓
[3] Property Ownership Check ✅
       ↓
[4] Field Whitelist Filtering ✅
       ↓
[5] Database Operation
       ↓
Response
```

**Why Multiple Layers?**
- If one layer fails, others still protect
- No single point of failure
- Defense in depth principle
- Industry best practice

---

## 📝 Code Review Checklist

When adding new owner features, verify:

```
□ Owner endpoints use getOwnerSession()
□ Property access uses canAccessProperty()
□ Update endpoints use field whitelisting
□ Sensitive fields (ownerId, role) are never in allowedFields
□ No direct User model updates from OS API
□ No ownerProfile.propertyIds modifications allowed
□ Admin-only actions use admin authentication
□ Proper error messages (no sensitive data leak)
□ Authorization happens AFTER authentication
□ Database queries filter by owner's propertyIds
```

---

## 🚨 Red Flags to Watch For

### **Dangerous Patterns**

❌ **NEVER DO THIS:**
```typescript
// BAD - No property validation
const property = await Property.findById(propertyId);
return property; // Owner can access any property!
```

✅ **ALWAYS DO THIS:**
```typescript
// GOOD - Validates ownership
const hasAccess = await canAccessProperty(userId, propertyId);
if (!hasAccess) {
  return { error: 'Unauthorized', status: 403 };
}
const property = await Property.findById(propertyId);
return property;
```

---

❌ **NEVER DO THIS:**
```typescript
// BAD - Allows any field update
const updates = await request.json();
await Property.findByIdAndUpdate(propertyId, updates);
```

✅ **ALWAYS DO THIS:**
```typescript
// GOOD - Whitelist filtering
const allowedFields = ['title', 'description', 'price'];
const sanitized = {};
for (const field of allowedFields) {
  if (updates[field] !== undefined) {
    sanitized[field] = updates[field];
  }
}
await Property.findByIdAndUpdate(propertyId, sanitized);
```

---

## 📊 Audit Log Recommendations

### **Future Enhancement**

Track all property assignment changes:

```typescript
interface PropertyAssignmentLog {
  action: 'assigned' | 'removed' | 'transferred';
  propertyId: string;
  fromOwnerId?: string;
  toOwnerId: string;
  performedBy: string; // Admin user ID
  performedAt: Date;
  reason?: string;
}
```

**Benefits:**
- Full audit trail
- Compliance requirements
- Dispute resolution
- Security monitoring

---

## ✅ Security Verification

### **Quick Security Audit**

Run these checks periodically:

```bash
# 1. Check for User model updates in OS API
grep -r "User.findByIdAndUpdate\|User.updateOne" app/api/os/

# 2. Check for ownerProfile modifications
grep -r "ownerProfile.propertyIds" app/api/os/

# 3. Check for ownerId in allowedFields
grep -r "ownerId" app/api/os/properties/*/route.ts

# 4. Verify admin auth on assignment endpoints
grep -r "admin.*owners" app/api/admin/owners/
```

**Expected Results:**
- No User updates in OS API ✅
- No ownerProfile modifications ✅
- No ownerId in allowedFields ✅
- Admin auth on all assignment endpoints ✅

---

## 🎯 Summary

### **Security Status: ✅ SECURE**

**Property assignment is properly secured:**

1. ✅ **Admin-Only Control**
   - Only admins can assign/remove properties
   - Enforced through authentication checks
   - Separate admin-only API endpoints

2. ✅ **Owner Restrictions**
   - Owners cannot modify property assignments
   - No API endpoints for self-assignment
   - Read-only profile page

3. ✅ **Field Protection**
   - Sensitive fields protected via whitelist
   - `ownerId` never modifiable by owners
   - Mass assignment attacks prevented

4. ✅ **Access Validation**
   - Every property access validated
   - Owners can only see their properties
   - Cross-owner access blocked

5. ✅ **Multiple Security Layers**
   - Authentication
   - Authorization
   - Role validation
   - Property ownership check
   - Field whitelisting

---

## 📞 Security Questions?

### **Common Questions**

**Q: Can an owner add properties to their account?**
A: ❌ No. Only admins can assign properties.

**Q: Can an owner remove a property from their account?**
A: ❌ No. Only admins can remove property assignments.

**Q: Can an owner access another owner's property?**
A: ❌ No. Property access is validated on every request.

**Q: Can an owner change a property's ownerId?**
A: ❌ No. `ownerId` is not in the allowed fields list.

**Q: Can an owner modify their ownerProfile.propertyIds?**
A: ❌ No. No API endpoint exists for this action.

**Q: What happens if an owner tries to bypass security?**
A: They get 401 Unauthorized or 403 Forbidden errors.

**Q: Is the system secure?**
A: ✅ Yes. Multiple security layers are in place and verified.

---

**Documentation Version:** 1.0
**Last Security Audit:** December 23, 2025
**Next Review:** March 23, 2026
**Status:** ✅ Secure & Verified

---

🔒 **Property assignment is Admin-Only. Owners cannot modify their property list.** 🔒
