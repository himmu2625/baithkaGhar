# Property Owner Management System - Complete Guide

**Status:** ✅ **COMPLETE & READY TO USE**
**Date:** December 23, 2025
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [How to Use](#how-to-use)
5. [API Endpoints](#api-endpoints)
6. [Workflow Examples](#workflow-examples)
7. [Security & Permissions](#security--permissions)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Property Owner Management System is a comprehensive admin panel feature that allows super admins and admins to:

- **Create** property owner accounts with login credentials
- **Manage** owner profiles, business information, and KYC status
- **Reset** passwords for property owners
- **Link** properties to owners
- **Monitor** owner statistics and activity

This system is the **complete solution** for managing property owner credentials and access to the Owner System (OS).

---

## Features

### ✅ Implemented Features

#### 1. **Owner Account Creation**
- Create new property owner accounts directly from admin panel
- Set initial password and send credentials
- Assign business information (GST, PAN, business type)
- Set KYC status (pending, verified, rejected)
- Link properties to owners during creation

#### 2. **Owner Listing & Search**
- View all property owners in a table
- Search by name, email, or business name
- Filter by KYC status (All, Verified, Pending, Rejected)
- See property count for each owner
- Real-time statistics dashboard

#### 3. **Owner Profile Management**
- Edit owner basic information (name, email, phone)
- Update business details (business name, type, GST, PAN)
- Change KYC status
- Link/unlink properties
- View registration date and history

#### 4. **Password Management**
- Reset owner passwords
- Generate secure random passwords
- Copy temporary password to share with owner
- Manual password setting option

#### 5. **Owner Deletion** (Super Admin Only)
- Delete owner accounts
- Automatically unlink properties
- Confirmation dialog for safety

#### 6. **Statistics Dashboard**
- Total owners count
- Verified owners count
- Pending verification count
- Rejected applications count

---

## System Architecture

### Backend API Routes

```
/api/admin/owners
├── GET     - List all property owners
├── POST    - Create new property owner
└── [id]
    ├── GET    - Get single owner details
    ├── PUT    - Update owner information
    ├── DELETE - Delete owner (super admin only)
    └── reset-password
        └── POST - Reset owner password
```

### Admin UI Pages

```
/admin/owner-logins
└── Main management page with:
    ├── Owner listing table
    ├── Create owner modal
    ├── Edit owner modal
    ├── Password reset modal
    └── Statistics cards
```

### Database Models Used

- **User Model** - Stores owner credentials and profile
  - `role: 'property_owner'`
  - `ownerProfile` - Business and KYC information

- **Property Model** - Links properties to owners
  - `ownerId` - Reference to owner user

---

## How to Use

### **Step 1: Access the Owner Management Page**

1. Log in to admin panel with admin or super_admin role
2. Navigate to **"Owner Logins"** from the sidebar menu
3. You'll see the owner management dashboard

---

### **Step 2: Create a New Property Owner**

#### Using the Admin UI (Recommended)

1. Click **"Create Owner"** button
2. Fill in the required information:

   **Basic Information:**
   - Full Name (required)
   - Email (required)
   - Phone Number (optional)
   - Password (required, min 6 characters)

   **Business Information:**
   - Business Name
   - Business Type (Individual/Company/Partnership)
   - GST Number (optional)
   - PAN Number (optional)
   - KYC Status (Pending/Verified/Rejected)

3. Click **"Create Owner"**
4. Owner account is created with login credentials
5. Share the email and password with the property owner

#### Result:
- ✅ Owner can now log in at `/os/login`
- ✅ Owner has access to the OS dashboard
- ✅ Owner profile is set up in the database

---

### **Step 3: Link Properties to Owner**

There are two ways to link properties:

#### Option A: During Owner Creation
- In the "Create Owner" modal, you can assign properties
- Currently, properties are linked via property management

#### Option B: Edit Existing Owner
1. Find the owner in the table
2. Click the three-dot menu → **"Edit Owner"**
3. Update the owner information
4. Click **"Update Owner"**

---

### **Step 4: Reset Owner Password**

When an owner forgets their password:

1. Find the owner in the table
2. Click three-dot menu → **"Reset Password"**
3. Choose one of two options:

   **Option A: Generate Random Password**
   - Check "Generate random secure password"
   - Click "Reset Password"
   - Copy the displayed temporary password
   - Share it with the owner securely

   **Option B: Set Custom Password**
   - Enter a new password (min 6 characters)
   - Click "Reset Password"
   - Inform the owner of the new password

---

### **Step 5: Manage KYC Status**

To update an owner's KYC verification status:

1. Click three-dot menu → **"Edit Owner"**
2. Scroll to "Business Information"
3. Change **KYC Status** dropdown:
   - **Pending** - Owner has not completed KYC
   - **Verified** - Owner is verified and active
   - **Rejected** - Owner's KYC was rejected
4. Click "Update Owner"

---

### **Step 6: Delete an Owner** (Super Admin Only)

⚠️ **Warning:** This action cannot be undone

1. Only super admins can delete owners
2. Click three-dot menu → **"Delete Owner"**
3. Confirm the deletion
4. All linked properties will be unlinked (not deleted)

---

## API Endpoints

### 1. **List All Owners**

```http
GET /api/admin/owners
```

**Query Parameters:**
- `search` - Search by name, email, or business name
- `kycStatus` - Filter by KYC status (pending, verified, rejected)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Response:**
```json
{
  "success": true,
  "owners": [
    {
      "_id": "owner_id",
      "name": "John Doe",
      "email": "owner@hotel.com",
      "phone": "+91 9876543210",
      "role": "property_owner",
      "ownerProfile": {
        "businessName": "Grand Hotel",
        "businessType": "company",
        "kycStatus": "verified",
        "propertyIds": ["prop_id_1", "prop_id_2"],
        "gstNumber": "22AAAAA0000A1Z5",
        "panNumber": "AAAAA0000A"
      },
      "propertyCount": 2,
      "createdAt": "2025-12-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

---

### 2. **Create New Owner**

```http
POST /api/admin/owners
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "owner@hotel.com",
  "phone": "+91 9876543210",
  "password": "SecurePass123",
  "businessName": "Grand Hotel",
  "businessType": "company",
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "kycStatus": "pending",
  "propertyIds": ["prop_id_1", "prop_id_2"]
}
```

**Required Fields:**
- `name` - Owner's full name
- `email` - Unique email address
- `password` - Password (min 6 characters)

**Optional Fields:**
- `phone` - Contact number
- `businessName` - Business name
- `businessType` - individual | company | partnership
- `gstNumber` - GST registration number
- `panNumber` - PAN card number
- `kycStatus` - pending | verified | rejected
- `propertyIds` - Array of property IDs to link

**Response:**
```json
{
  "success": true,
  "message": "Property owner created successfully",
  "owner": {
    "_id": "new_owner_id",
    "name": "John Doe",
    "email": "owner@hotel.com",
    // ... owner details
  }
}
```

---

### 3. **Get Single Owner**

```http
GET /api/admin/owners/:id
```

**Response:**
```json
{
  "success": true,
  "owner": {
    "_id": "owner_id",
    "name": "John Doe",
    "email": "owner@hotel.com",
    "ownerProfile": { /* ... */ },
    "properties": [
      {
        "_id": "prop_id",
        "name": "Grand Hotel",
        "location": "Pokhara",
        "status": "active"
      }
    ]
  }
}
```

---

### 4. **Update Owner**

```http
PUT /api/admin/owners/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@hotel.com",
  "phone": "+91 1234567890",
  "businessName": "Updated Business Name",
  "kycStatus": "verified",
  "propertyIds": ["prop_id_1"]
}
```

**Notes:**
- All fields are optional
- Only include fields you want to update
- Email must be unique if changing

**Response:**
```json
{
  "success": true,
  "message": "Owner updated successfully",
  "owner": { /* updated owner */ }
}
```

---

### 5. **Reset Password**

```http
POST /api/admin/owners/:id/reset-password
Content-Type: application/json
```

**Request Body (Option A - Custom Password):**
```json
{
  "newPassword": "NewSecurePass123"
}
```

**Request Body (Option B - Generate Random):**
```json
{
  "generateRandom": true
}
```

**Response (Custom Password):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Random Password):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "temporaryPassword": "aB3$xY9@mK2#"
}
```

**Important:** If `generateRandom: true`, the API returns the temporary password. **This is the only time the password is shown**. Make sure to copy and share it with the owner.

---

### 6. **Delete Owner** (Super Admin Only)

```http
DELETE /api/admin/owners/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Owner deleted successfully"
}
```

**Notes:**
- Only super admins can delete owners
- All properties will be unlinked (but not deleted)
- This action cannot be undone

---

## Workflow Examples

### Example 1: New Hotel Joins Platform

**Scenario:** A new hotel owner wants to list their property

1. **Admin creates owner account:**
   - Go to `/admin/owner-logins`
   - Click "Create Owner"
   - Fill in:
     - Name: "Rajesh Kumar"
     - Email: "rajesh@mountainviewhotel.com"
     - Password: "TempPass123"
     - Business Name: "Mountain View Hotel"
     - KYC Status: "pending"
   - Click "Create Owner"

2. **Admin shares credentials with owner:**
   - Send email to rajesh@mountainviewhotel.com
   - "Your Owner Portal login:"
   - "URL: https://baithakaghar.com/os/login"
   - "Email: rajesh@mountainviewhotel.com"
   - "Password: TempPass123"
   - "Please change your password after first login"

3. **Owner logs in:**
   - Owner visits `/os/login`
   - Enters credentials
   - Access to OS dashboard granted
   - Can now manage their properties

4. **Admin verifies KYC:**
   - Owner uploads documents
   - Admin reviews KYC
   - Admin updates KYC status to "verified"
   - Owner now has full access

---

### Example 2: Owner Forgot Password

**Scenario:** Owner cannot log in

1. **Owner contacts support:**
   - "I forgot my password"

2. **Admin resets password:**
   - Admin goes to `/admin/owner-logins`
   - Searches for owner's email
   - Clicks menu → "Reset Password"
   - Checks "Generate random secure password"
   - Clicks "Reset Password"
   - Copies temporary password: "xY9@aB3$mK2#"

3. **Admin shares new password:**
   - Sends secure message to owner
   - "Your temporary password: xY9@aB3$mK2#"
   - "Please change it after logging in"

4. **Owner logs in with new password:**
   - Access restored
   - Changes password in profile settings

---

### Example 3: Owner Has Multiple Properties

**Scenario:** Owner wants to add a second property

1. **Owner lists new property:**
   - Property is created in database

2. **Admin links property to owner:**
   - Admin goes to `/admin/properties`
   - Finds the new property
   - Edits property and sets `ownerId` to the owner's ID

   OR

   - Admin goes to `/admin/owner-logins`
   - Edits the owner
   - Updates `propertyIds` array
   - Saves changes

3. **Owner sees new property:**
   - Owner logs into OS dashboard
   - New property appears in their properties list
   - Can now manage both properties

---

## Security & Permissions

### Role-Based Access

| Action | Super Admin | Admin | Owner |
|--------|-------------|-------|-------|
| Create owners | ✅ | ✅ | ❌ |
| List all owners | ✅ | ✅ | ❌ |
| Edit owner profile | ✅ | ✅ | ❌ |
| Reset owner password | ✅ | ✅ | ❌ |
| Delete owners | ✅ | ❌ | ❌ |
| View own profile | — | — | ✅ |
| Change own password | — | — | ✅ |

### Password Security

- ✅ All passwords are hashed with **bcrypt** (salt rounds: 10)
- ✅ Passwords are never returned in API responses
- ✅ Password reset generates secure random passwords (12 chars)
- ✅ Minimum password length: 6 characters
- ✅ Passwords are encrypted at rest in MongoDB

### Authentication

- ✅ All API endpoints require valid NextAuth session
- ✅ JWT tokens used for session management
- ✅ Session expires after 30 days
- ✅ CSRF protection enabled
- ✅ Role verification on every request

---

## Troubleshooting

### Common Issues

#### Issue 1: Cannot Create Owner - "Email already exists"

**Cause:** Another user (owner or regular user) already has that email

**Solution:**
1. Check if the email is registered in Users page
2. If it's a regular user, change their role to `property_owner`
3. Or use a different email address

---

#### Issue 2: Owner Cannot Log In

**Possible Causes:**
- Wrong password
- Email typo
- Account not created yet
- KYC status is "rejected" (blocks login)

**Solution:**
1. Verify email is correct in admin panel
2. Reset password using admin panel
3. Check KYC status - must be "pending" or "verified"
4. Check role is set to "property_owner"

---

#### Issue 3: Owner Sees No Properties

**Possible Causes:**
- No properties linked to owner
- Property `ownerId` field is empty

**Solution:**
1. Go to `/admin/owner-logins`
2. Edit the owner
3. Check `propertyIds` array
4. Ensure property documents have `ownerId` set
5. Or link properties from property management page

---

#### Issue 4: Password Reset Not Working

**Possible Causes:**
- Invalid owner ID
- Session expired
- Insufficient permissions

**Solution:**
1. Refresh the page
2. Verify you're logged in as admin
3. Try again with generated password
4. Check browser console for errors

---

#### Issue 5: API Returns 401 Unauthorized

**Cause:** Session is invalid or expired

**Solution:**
1. Log out and log back in
2. Check your role is admin or super_admin
3. Verify session cookie is present
4. Try in incognito mode to rule out cache issues

---

## Best Practices

### Creating Owner Accounts

✅ **DO:**
- Use business email addresses
- Generate strong initial passwords
- Set KYC status to "pending" initially
- Verify GST and PAN numbers before approval
- Document all owner communications

❌ **DON'T:**
- Use personal email addresses for businesses
- Set weak passwords (use generator)
- Leave KYC as "verified" without verification
- Create duplicate accounts for same business
- Share passwords via unsecure channels

---

### Password Management

✅ **DO:**
- Use the random password generator
- Share passwords via secure channels (encrypted email, SMS)
- Ask owners to change password after first login
- Reset passwords promptly when requested
- Document password reset requests

❌ **DON'T:**
- Reuse passwords across accounts
- Share passwords in plain text emails
- Store passwords in unsecured documents
- Give out passwords over phone without verification
- Skip password expiry reminders

---

### KYC Verification

✅ **DO:**
- Review all uploaded documents carefully
- Verify GST and PAN numbers with government databases
- Set status to "verified" only after thorough check
- Document rejection reasons clearly
- Give owners opportunity to re-submit documents

❌ **DON'T:**
- Auto-approve without verification
- Accept poor quality documents
- Skip background checks
- Verify based on owner's word alone
- Reject without giving feedback

---

## Summary

### What You Can Do Now

✅ **Create property owner accounts** with full credentials
✅ **Manage owner profiles** and business information
✅ **Reset passwords** when owners forget them
✅ **Link properties** to owners
✅ **Monitor KYC status** and approvals
✅ **Search and filter** owners by various criteria
✅ **View statistics** on owner counts and status
✅ **Delete owner accounts** (super admin)

### Benefits

1. **No Manual Database Work** - Everything via UI
2. **Secure** - Passwords hashed, role-based access
3. **Scalable** - Handle hundreds of owners easily
4. **User-Friendly** - Intuitive admin interface
5. **Complete** - Create, read, update, delete operations
6. **Auditable** - Track creation dates and changes

---

## Next Steps

### Immediate

1. **Test the System:**
   - Create a test owner account
   - Verify they can log in at `/os/login`
   - Test password reset
   - Test KYC status changes

2. **Train Your Team:**
   - Share this documentation
   - Do a walkthrough demo
   - Create admin guidelines
   - Set up support procedures

### Future Enhancements

Consider adding:
- **Email Notifications** - Auto-send credentials to new owners
- **Password Expiry** - Force password change after X days
- **Activity Logs** - Track all admin actions
- **Bulk Import** - CSV upload for multiple owners
- **Owner Dashboard** - Enhanced analytics for owners
- **2FA** - Two-factor authentication for owners

---

**Documentation Version:** 1.0
**Last Updated:** December 23, 2025
**Maintained By:** Development Team
**Questions?** Refer to this guide or contact the development team

---

🎉 **Owner Management System is now fully operational!** 🎉
