# 🧪 Test Phase 2: Owner Authentication

**Quick testing guide for Phase 2 authentication system**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Server

```bash
cd my-app
npm run dev
```

Wait for: `✓ Ready in X ms`

---

### Step 2: Test Owner Login

1. **Open browser:** `http://localhost:3000/os`

2. **You'll be redirected to:** `http://localhost:3000/os/login`

3. **Login with your admin account:**
   - Email: `anuragsingh@baithakaghar.com`
   - Password: Your password

4. **After login, you should:**
   - ✅ Be redirected to `/os/dashboard`
   - ✅ See the dashboard with statistics
   - ✅ See sidebar navigation
   - ✅ See your name in the sidebar

---

### Step 3: Explore the Portal

Click through the sidebar menu:

- **Dashboard** - Main overview page
- **Properties** - Properties management (placeholder)
- **Bookings** - Bookings list (placeholder)
- **Payments** - Payment collection (placeholder)
- **Reports** - Financial reports (placeholder)
- **Profile** - Your profile information

All pages should load without errors!

---

### Step 4: Test Authorization

1. **Click "Sign Out"** in the sidebar
2. **Try accessing:** `http://localhost:3000/os/dashboard`
3. **You should be redirected to:** `/os/login`
4. **✅ This confirms route protection is working!**

---

## ✅ What Should Work

### ✓ Authentication
- [x] Login page loads
- [x] Can log in with admin/super_admin account
- [x] Redirects to dashboard after login
- [x] Session persists on page refresh
- [x] Can sign out

### ✓ Authorization
- [x] `/os` redirects to `/os/login` (if not logged in)
- [x] `/os/dashboard` requires authentication
- [x] All `/os/*` routes require authentication
- [x] Regular users cannot access (if you test with a non-owner account)

### ✓ UI/UX
- [x] Professional login page
- [x] Sidebar navigation
- [x] Collapsible sidebar
- [x] Header with search
- [x] User info displayed
- [x] Mobile responsive

---

## 📱 Mobile Testing

1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select a mobile device (e.g., iPhone 12)
4. Test navigation and login

**Should work perfectly on mobile!**

---

## 🐛 Troubleshooting

### Issue: Login shows "Invalid credentials"

**Check:**
- Is your email correct?
- Is your password correct?
- Is your account role `super_admin`, `admin`, or `property_owner`?

**Solution:**
- Use the super admin account: `anuragsingh@baithakaghar.com`

---

### Issue: Redirected to login immediately after login

**Check:**
- Browser console for errors (F12 → Console tab)
- Server terminal for errors

**Solution:**
- Clear browser cookies
- Restart development server
- Check `.env.local` has `NEXTAUTH_SECRET`

---

### Issue: Sidebar not showing or broken layout

**Check:**
- Any console errors?
- CSS loading correctly?

**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Restart dev server

---

### Issue: "Access denied" or "unauthorized" error

**Check:**
- Your account role in the database

**Solution:**
- Use admin account for testing
- Or update your user role to `property_owner`

---

## 🎯 Testing Checklist

### Basic Flow
- [ ] Visit `/os`
- [ ] Redirects to `/os/login`
- [ ] Login with admin credentials
- [ ] Redirects to `/os/dashboard`
- [ ] Dashboard displays correctly
- [ ] Sidebar shows navigation
- [ ] Header shows user info

### Navigation
- [ ] Click "Properties" → Page loads
- [ ] Click "Bookings" → Page loads
- [ ] Click "Payments" → Page loads
- [ ] Click "Reports" → Page loads
- [ ] Click "Profile" → Page loads
- [ ] Click "Dashboard" → Back to dashboard

### Authorization
- [ ] Sign out → Redirects to login
- [ ] Try `/os/dashboard` → Redirects to login
- [ ] Login again → Works correctly
- [ ] Session persists on refresh

### UI
- [ ] Sidebar is collapsible
- [ ] Active route is highlighted
- [ ] No console errors
- [ ] No visual glitches
- [ ] Mobile responsive

---

## 📊 Expected Results

### Login Page
```
✅ Professional design
✅ Baithaka Ghar OS branding
✅ Email and password fields
✅ Sign in button
✅ Error messages (if invalid login)
✅ Help contact information
```

### Dashboard
```
✅ Welcome message with your name
✅ 4 statistics cards (Properties, Bookings, Payments, Revenue)
✅ Quick action buttons
✅ Getting started section
✅ Clean, professional layout
```

### Sidebar
```
✅ Baithaka OS logo
✅ 6 navigation items
✅ User info at bottom
✅ Role badge
✅ Sign out button
✅ Collapse button
```

---

## ✨ Phase 2 Features

### What's Working Now

1. **Owner Authentication**
   - Login with email/password
   - Session management
   - Role-based access

2. **Owner Portal Routes**
   - 8 protected routes
   - All require authentication
   - Proper redirects

3. **Professional UI**
   - Clean dashboard
   - Responsive sidebar
   - Modern design

4. **Authorization**
   - Role checks
   - Property access control (ready for Phase 3)
   - Secure sessions

---

## 🚀 Next Steps

### After Testing Phase 2

Once you've confirmed everything works:

1. **Phase 2 is complete!** ✅
2. **Ready for Phase 3** (Dashboard UI with real data)
3. **No issues found?** Perfect!
4. **Found issues?** Check troubleshooting section

---

## 📝 Quick Test Script

Copy and paste this checklist:

```
Phase 2 Testing Checklist:
- [ ] Server started successfully
- [ ] /os redirects to /os/login
- [ ] Can login with admin account
- [ ] Dashboard loads after login
- [ ] Sidebar navigation works
- [ ] All menu items load pages
- [ ] Can sign out
- [ ] Redirected to login after signout
- [ ] Cannot access /os/dashboard without login
- [ ] No console errors
- [ ] Mobile responsive
```

---

## 🎉 Success!

If all the above works, **Phase 2 is successful!**

You now have:
- ✅ Secure owner authentication
- ✅ Protected owner portal
- ✅ Professional UI
- ✅ Ready for Phase 3

---

**Happy Testing!** 🚀

For detailed documentation, see: [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md)
