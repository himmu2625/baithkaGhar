# 🚨 EMERGENCY ROLLBACK INSTRUCTIONS

## Immediate Fix for Broken Authentication

If normal user login is still broken after these changes, follow these steps:

### Option 1: Quick Environment Fix

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure these are set correctly:
   ```
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=https://baithaka-ghar.vercel.app
   ```
3. **Force redeploy** the project

### Option 2: Test Authentication Status

Visit these URLs to debug:

- `https://baithaka-ghar.vercel.app/api/auth/session` - Should show your session
- `https://baithaka-ghar.vercel.app/api/admin/debug-env` - Shows environment config

### Option 3: Minimal Auth Configuration Rollback

If the above doesn't work, replace the cookies section in `lib/auth.ts` with this minimal version:

```typescript
// In lib/auth.ts, replace the cookies section with:
session: {
  strategy: "jwt",
  maxAge: 60 * 24 * 60 * 60, // 60 days
  updateAge: 24 * 60 * 60, // 24 hours
},

// Remove the entire cookies section temporarily
// cookies: { ... } // Comment this out

events: {
  async signIn({ user }) {
    console.log(`User signed in: ${user.email}`)
  },
},

secret: NEXTAUTH_SECRET,
trustHost: true,
```

### Option 4: Disable Middleware Temporarily

If still broken, temporarily comment out admin route protection in `middleware.ts`:

```typescript
// In middleware.ts, around line 200, comment out admin route checking:

// Handle admin routes
// if (pathMatches(pathname, ADMIN_ROUTES)) {
//   const userRole = user.role || ''
//   const isAdmin = userRole === "admin" || userRole === "super_admin" || isUserSuperAdmin(user)
//
//   if (!isAdmin) {
//     console.log(`[Middleware] Access denied to admin route ${pathname} for non-admin user ${user.email}`)
//     const homeUrl = req.nextUrl.clone()
//     homeUrl.pathname = "/"
//     homeUrl.searchParams.set("error", "Unauthorized")
//     const res = NextResponse.redirect(homeUrl)
//     incrementRedirectCount(res)
//     return res
//   }
//
//   console.log(`[Middleware] Admin access granted to ${pathname} for ${user.email}`)
//   return NextResponse.next()
// }
```

## Testing After Rollback:

1. Clear browser cookies for your domain
2. Try logging in as a normal user
3. Check if you can access regular pages like `/dashboard`, `/profile`
4. Once normal auth works, we can re-implement admin fixes safely

## Priority Order:

1. **First**: Fix normal user authentication
2. **Second**: Re-implement admin login fixes without breaking normal auth

The admin login can wait - normal user authentication is critical!
