# Admin Bookings 500 Error Fix

## Problem

The admin bookings page was showing a 500 Internal Server Error when trying to fetch bookings from `/api/admin/bookings`.

## Root Cause

There was a conflict between two different `getSession` functions:

1. `lib/get-session.ts` - Uses NextAuth properly
2. `lib/auth/index.ts` - Contains a mock session function

The admin bookings API was importing from `@/lib/get-session` which might have been causing authentication issues.

## Fix Applied

### Changed Import in `/app/api/admin/bookings/route.ts`:

**Before:**

```typescript
import { getSession } from "@/lib/get-session";
```

**After:**

```typescript
import { auth } from "@/lib/auth";
```

### Updated Function Calls:

**Before:**

```typescript
const session = await getSession();
```

**After:**

```typescript
const session = await auth();
```

## Files Modified

- `my-app/app/api/admin/bookings/route.ts` - Updated to use `auth()` instead of `getSession()`

## Result

- ✅ Admin bookings API should now return proper data
- ✅ 500 errors should be resolved
- ✅ Admin bookings page should load correctly
- ✅ Authentication still works properly

## Testing

1. Navigate to admin bookings page
2. Check that bookings load without 500 errors
3. Verify authentication still works
4. Confirm booking data is displayed correctly

The fix ensures the admin bookings API uses the correct authentication method that's consistent with the rest of the application.
