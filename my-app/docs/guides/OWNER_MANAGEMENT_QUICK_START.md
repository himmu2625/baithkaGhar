# 🚀 Owner Management System - Quick Start Guide

**Status:** ✅ COMPLETE | **Ready to Use:** YES

---

## ⚡ TL;DR - Get Started in 2 Minutes

1. **Access:** Go to `/admin/owner-logins` in your admin panel
2. **Create:** Click "Create Owner" button
3. **Fill Form:** Enter name, email, password
4. **Share:** Give credentials to property owner
5. **Done:** Owner can now log in at `/os/login`

---

## 📍 How to Create Your First Owner

### Step 1: Navigate to Owner Management

```
Admin Panel → Sidebar → "Owner Logins"
OR
Direct URL: https://yourdomain.com/admin/owner-logins
```

### Step 2: Click "Create Owner"

Fill in the form:

```
✅ Required Fields:
- Name: "John Doe"
- Email: "owner@hotel.com"
- Password: "SecurePass123" (min 6 chars)

📝 Optional Fields:
- Phone: "+91 9876543210"
- Business Name: "Grand Hotel"
- Business Type: Individual/Company/Partnership
- GST Number: "22AAAAA0000A1Z5"
- PAN Number: "AAAAA0000A"
- KYC Status: Pending/Verified/Rejected
```

### Step 3: Share Credentials

Send to the owner:

```
Your Owner Portal Login:
━━━━━━━━━━━━━━━━━━━━━━━
URL: https://baithakaghar.com/os/login
Email: owner@hotel.com
Password: SecurePass123

Please change your password after first login.
```

### Step 4: Owner Logs In

- Owner visits `/os/login`
- Enters email and password
- ✅ Access granted to Owner Dashboard!

---

## 🔧 Common Tasks

### Reset Owner Password

```
1. Find owner in table
2. Click menu (⋮) → "Reset Password"
3. Check "Generate random secure password"
4. Click "Reset Password"
5. Copy temporary password
6. Share with owner
```

### Edit Owner Details

```
1. Find owner in table
2. Click menu (⋮) → "Edit Owner"
3. Update information
4. Click "Update Owner"
```

### Change KYC Status

```
1. Click menu (⋮) → "Edit Owner"
2. Scroll to "KYC Status" dropdown
3. Select: Pending/Verified/Rejected
4. Click "Update Owner"
```

### Delete Owner (Super Admin Only)

```
1. Click menu (⋮) → "Delete Owner"
2. Confirm deletion
3. Properties are unlinked (not deleted)
```

---

## 🔍 Where Everything Is

| Feature | Location | URL |
|---------|----------|-----|
| Owner Management UI | Admin Panel | `/admin/owner-logins` |
| Owner Login Page | Owner Portal | `/os/login` |
| Owner Dashboard | Owner Portal | `/os/dashboard` |
| API - List Owners | Backend | `GET /api/admin/owners` |
| API - Create Owner | Backend | `POST /api/admin/owners` |
| API - Reset Password | Backend | `POST /api/admin/owners/:id/reset-password` |

---

## 📊 What You Get

### Admin Panel Features
✅ Create property owner accounts
✅ List all owners with search & filters
✅ Edit owner profiles and business info
✅ Reset passwords (manual or auto-generate)
✅ Manage KYC status
✅ Link properties to owners
✅ Delete owners (super admin)
✅ View statistics dashboard

### Security Features
✅ Passwords hashed with bcrypt
✅ Role-based access control
✅ Admin/Super Admin permissions
✅ Session management with NextAuth
✅ Secure password generation

---

## 🐛 Troubleshooting

### Owner Can't Log In?

```
✓ Check email is correct (case sensitive)
✓ Try resetting password
✓ Verify role is "property_owner"
✓ Check KYC status is not "rejected"
✓ Ensure account is not deleted
```

### "Email Already Exists" Error?

```
✓ Email is already registered
✓ Check Users page in admin
✓ Use different email OR
✓ Change existing user's role to property_owner
```

### Owner Has No Properties?

```
✓ Go to Properties page
✓ Edit the property
✓ Set "Owner" field to the owner
✓ Save changes
```

---

## 📞 Need Help?

- **Full Documentation:** See `docs/OWNER_MANAGEMENT_SYSTEM.md`
- **API Reference:** Check API endpoints section in docs
- **Workflow Examples:** See detailed examples in docs

---

## 🎯 Quick Reference - API Calls

### Create Owner (POST)
```bash
curl -X POST /api/admin/owners \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "owner@hotel.com",
    "password": "SecurePass123",
    "businessName": "Grand Hotel",
    "kycStatus": "pending"
  }'
```

### Reset Password (POST)
```bash
curl -X POST /api/admin/owners/:id/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "generateRandom": true
  }'
```

### List All Owners (GET)
```bash
curl /api/admin/owners?search=hotel&kycStatus=verified
```

---

## ✅ Checklist - Before Going Live

- [ ] Test creating an owner account
- [ ] Verify owner can log in at `/os/login`
- [ ] Test password reset functionality
- [ ] Check KYC status updates work
- [ ] Verify property linking works
- [ ] Train admin team on using the system
- [ ] Set up password sharing procedures
- [ ] Document internal workflows

---

## 🎉 That's It!

You now have a complete property owner management system.

**Created:** 7 files
- ✅ 3 API routes
- ✅ 1 Admin UI page
- ✅ 1 Comprehensive documentation
- ✅ 1 Quick start guide

**Ready to use:** YES
**Testing required:** YES (recommended)
**Production ready:** YES (after testing)

---

**Last Updated:** December 23, 2025
**Version:** 1.0

🚀 Start creating owners now at `/admin/owner-logins`
