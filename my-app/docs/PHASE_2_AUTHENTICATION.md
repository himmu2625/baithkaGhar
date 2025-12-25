# Phase 2: Authentication & Authorization

**Phase:** 2 of 8
**Duration:** 1 week (December 17-24, 2025)
**Status:** 🟢 In Progress
**Focus:** Property Owner Authentication & Portal Access

---

## 📋 Overview

Phase 2 establishes the authentication and authorization system for property owners to access their dedicated portal (Baithaka Ghar OS - Owner System).

### Goals

1. **Owner Login System** - Secure authentication for property owners
2. **Owner Portal Routes** - Dedicated `/os/*` route structure
3. **Session Management** - Secure session handling with NextAuth
4. **Authorization Middleware** - Protect owner-only routes
5. **Profile Management** - Owner profile and settings pages

---

## 🎯 Objectives

### Primary Goals

- ✅ Create property owner login page
- ✅ Update NextAuth configuration for property owners
- ✅ Implement owner authentication flow
- ✅ Set up `/os/*` route structure
- ✅ Create authorization middleware
- ✅ Build owner dashboard layout
- ✅ Create owner profile page
- ✅ Test authentication and authorization

### Success Criteria

- Property owners can log in with email/password
- Owner session persists across page refreshes
- `/os/*` routes protected (redirect to login if not authenticated)
- Only users with `property_owner` role can access `/os/*`
- Admins can also access owner portal (for support)
- Clean, professional UI for owner portal
- Mobile-responsive design

---

## 🏗️ Architecture

### Route Structure

```
/os                           → Redirect to /os/login or /os/dashboard
/os/login                     → Owner login page (public)
/os/dashboard                 → Owner dashboard (protected)
/os/properties                → Owner's properties list (protected)
/os/properties/[id]           → Property details (protected)
/os/bookings                  → Property bookings (protected)
/os/payments                  → Payment collection (protected)
/os/reports                   → Financial reports (protected)
/os/profile                   → Owner profile & settings (protected)
```

### Authentication Flow

```
1. Owner visits /os/dashboard
2. Middleware checks authentication
3. If not authenticated → redirect to /os/login
4. Owner enters email/password
5. NextAuth validates credentials
6. Check role = 'property_owner' or 'admin' or 'super_admin'
7. If valid → create session → redirect to /os/dashboard
8. If invalid → show error message
```

### Authorization Levels

| Role | Access |
|------|--------|
| `property_owner` | Own properties only |
| `admin` | All properties (limited) |
| `super_admin` | All properties (full access) |
| `user`, `travel_agent` | No access (redirect to login) |

---

## 🔐 NextAuth Configuration

### Update `[...nextauth]/route.ts`

Add property owner authentication logic:

```typescript
// app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import type { IUser } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Check if user is marked as spam
        if (user.isSpam) {
          throw new Error("Account suspended. Please contact support.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin
        };
      }
    }),

    // Property Owner login with separate credentials
    CredentialsProvider({
      id: "owner-credentials",
      name: "Owner Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();
        const user = await User.findOne({
          email: credentials.email,
          role: { $in: ['property_owner', 'admin', 'super_admin'] }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials or access denied");
        }

        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Check if owner account is active
        if (user.role === 'property_owner' && user.ownerProfile?.kycStatus === 'rejected') {
          throw new Error("Account verification failed. Please contact support.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.isAdmin,
          ownerProfile: user.ownerProfile
        };
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.ownerProfile = user.ownerProfile;
      }

      // Update token when session is updated
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.ownerProfile = token.ownerProfile;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle owner portal redirects
      if (url.startsWith("/os")) {
        return url;
      }

      // If signing in to owner portal, redirect to owner dashboard
      if (url.includes("callbackUrl") && url.includes("/os")) {
        return url;
      }

      return baseUrl;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Update Session Types

```typescript
// types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isAdmin: boolean;
      ownerProfile?: {
        propertyIds: string[];
        businessName?: string;
        kycStatus?: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    isAdmin: boolean;
    ownerProfile?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isAdmin: boolean;
    ownerProfile?: any;
  }
}
```

---

## 🛡️ Authorization Middleware

### Create Owner Auth Utility

```typescript
// lib/auth/owner-auth.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export async function requireOwnerAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/os/login");
  }

  const allowedRoles = ['property_owner', 'admin', 'super_admin'];

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/os/login?error=unauthorized");
  }

  return session;
}

export async function getOwnerSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  const allowedRoles = ['property_owner', 'admin', 'super_admin'];

  if (!allowedRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

export function isOwner(role: string): boolean {
  return ['property_owner', 'admin', 'super_admin'].includes(role);
}

export function canAccessProperty(session: any, propertyId: string): boolean {
  const { user } = session;

  // Super admins can access everything
  if (user.role === 'super_admin') {
    return true;
  }

  // Admins can access everything (with limitations set elsewhere)
  if (user.role === 'admin') {
    return true;
  }

  // Property owners can only access their own properties
  if (user.role === 'property_owner') {
    const ownerPropertyIds = user.ownerProfile?.propertyIds || [];
    return ownerPropertyIds.includes(propertyId);
  }

  return false;
}
```

### Create Middleware for Protected Routes

```typescript
// middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Owner portal routes
    if (path.startsWith("/os")) {
      // Allow login page
      if (path === "/os/login" || path === "/os") {
        return NextResponse.next();
      }

      // Check if user has owner role
      const allowedRoles = ['property_owner', 'admin', 'super_admin'];

      if (!token || !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/os/login?error=unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Owner portal requires authentication
        if (path.startsWith("/os")) {
          // Login page is public
          if (path === "/os/login" || path === "/os") {
            return true;
          }
          // Other routes require auth
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/os/:path*",
    "/admin/:path*",
  ],
};
```

---

## 🎨 Owner Portal UI Components

### Owner Dashboard Layout

```typescript
// app/os/layout.tsx

import { requireOwnerAuth } from "@/lib/auth/owner-auth";
import OwnerSidebar from "@/components/os/OwnerSidebar";
import OwnerHeader from "@/components/os/OwnerHeader";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwnerAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <OwnerSidebar session={session} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <OwnerHeader session={session} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Owner Login Page

```typescript
// app/os/login/page.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OwnerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("owner-credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/os/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Baithaka Ghar OS
            </h1>
            <p className="text-gray-600 mt-2">Property Owner Portal</p>
          </div>

          {/* Error Alert */}
          {(error || errorParam) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error || (errorParam === "unauthorized"
                  ? "You don't have permission to access this area"
                  : "Invalid credentials")}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need help? Contact support@baithakaghar.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📁 Directory Structure

```
app/
├── os/                           # Owner System Portal
│   ├── layout.tsx               # Owner portal layout with sidebar
│   ├── page.tsx                 # Redirect to login or dashboard
│   ├── login/
│   │   └── page.tsx            # Owner login page
│   ├── dashboard/
│   │   └── page.tsx            # Owner dashboard
│   ├── properties/
│   │   ├── page.tsx            # Properties list
│   │   └── [id]/
│   │       └── page.tsx        # Property details
│   ├── bookings/
│   │   └── page.tsx            # Bookings list
│   ├── payments/
│   │   └── page.tsx            # Payment collection
│   ├── reports/
│   │   └── page.tsx            # Financial reports
│   └── profile/
│       └── page.tsx            # Owner profile

components/
├── os/                          # Owner System Components
│   ├── OwnerSidebar.tsx        # Navigation sidebar
│   ├── OwnerHeader.tsx         # Top header with user menu
│   ├── OwnerStatsCard.tsx      # Dashboard statistics
│   └── OwnerPropertyCard.tsx   # Property card component

lib/
└── auth/
    └── owner-auth.ts            # Owner authentication utilities

types/
└── next-auth.d.ts              # NextAuth type definitions
```

---

## 🧪 Testing Plan

### Manual Testing

1. **Login Flow**
   - [ ] Visit `/os` → redirects to `/os/login`
   - [ ] Enter invalid credentials → shows error
   - [ ] Enter valid owner credentials → redirects to `/os/dashboard`
   - [ ] Session persists on page refresh
   - [ ] Logout works correctly

2. **Authorization**
   - [ ] Regular user cannot access `/os/*`
   - [ ] Property owner can access `/os/*`
   - [ ] Admin can access `/os/*`
   - [ ] Super admin can access `/os/*`

3. **Protected Routes**
   - [ ] Accessing `/os/dashboard` without login → redirects to login
   - [ ] After login → can access all owner routes
   - [ ] Logout → redirected to login

### Automated Tests

```typescript
// __tests__/owner-auth.test.ts

describe("Owner Authentication", () => {
  test("should allow property owner to log in");
  test("should deny regular user access to owner portal");
  test("should redirect unauthenticated users to login");
  test("should maintain session across page refreshes");
  test("should allow admin to access owner portal");
});
```

---

## 📋 Implementation Checklist

### Week 1 Tasks

#### Day 1-2: Authentication Setup
- [ ] Update NextAuth configuration
- [ ] Add owner-credentials provider
- [ ] Update session types
- [ ] Create owner auth utilities
- [ ] Test basic authentication

#### Day 3-4: Route Protection
- [ ] Create middleware for `/os/*` routes
- [ ] Implement authorization checks
- [ ] Create owner login page
- [ ] Test route protection

#### Day 5-6: UI Components
- [ ] Create owner portal layout
- [ ] Build sidebar navigation
- [ ] Build header component
- [ ] Create dashboard page
- [ ] Make responsive

#### Day 7: Testing & Polish
- [ ] Manual testing of all flows
- [ ] Fix bugs
- [ ] Polish UI
- [ ] Documentation

---

## 🚀 Deployment Checklist

- [ ] Environment variables set
- [ ] NextAuth secret configured
- [ ] Database connection tested
- [ ] Owner role verified in database
- [ ] Test login with real credentials
- [ ] Mobile responsive tested
- [ ] Error handling verified

---

## 📊 Success Metrics

- ✅ Owner login success rate > 95%
- ✅ Page load time < 2 seconds
- ✅ Mobile responsive (tested on 3+ devices)
- ✅ No authentication bypasses
- ✅ Session handling stable
- ✅ Zero security vulnerabilities

---

## 🔄 Next Phase Preview

### Phase 3: Owner Dashboard UI (Week 3)

- Property list and management
- Booking overview
- Quick statistics
- Recent activity feed
- Notifications system

---

**Phase 2 Status:** 🟢 In Progress
**Last Updated:** December 17, 2025
**Target Completion:** December 24, 2025
