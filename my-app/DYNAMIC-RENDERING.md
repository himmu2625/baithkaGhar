# Dynamic Rendering in Next.js

This guide explains the changes made to enable full dynamic rendering in the Baithaka Ghar website, allowing for the use of server-side features like:

- Server session with `auth()`
- `headers()`
- `useSearchParams()`

## Changes Made

1. **Removed Static Export Configuration**

   - Removed `output: "standalone"` from `next.config.js`
   - Updated build scripts in `package.json` to remove static export flags

2. **Added Example Pages**
   - Created a new server component example at `/examples/server-components`
   - Added a client component that demonstrates `useSearchParams()`
   - Created a dynamic API route example

## Features Now Available

### Server Components

You can now use server-side data fetching in React Server Components:

```tsx
import { headers } from "next/headers";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Get the auth function from NextAuth
const { auth } = NextAuth(authOptions);

export default async function MyServerComponent() {
  // Access headers
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  // Get session data
  const session = await auth();

  // Return JSX with server-fetched data
  return (
    <div>
      <p>User Agent: {userAgent}</p>
      {session && <p>Logged in as: {session.user?.name}</p>}
    </div>
  );
}
```

### Client Components with Dynamic Data

For client components, you can use hooks like `useSearchParams()`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function MyClientComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  return <div>Search query: {query}</div>;
}
```

### Dynamic API Routes

API routes can access server-side information:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Get the auth function from NextAuth
const { auth } = NextAuth(authOptions);

export async function GET(request: NextRequest) {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const session = await auth();

  return NextResponse.json({
    userAgent,
    authenticated: !!session,
    timestamp: new Date().toISOString(),
  });
}
```

## Testing

You can test the dynamic rendering features by:

1. Starting the development server: `npm run dev`
2. Visiting the example page: `/examples/server-components`
3. Testing the API endpoint: `/api/examples/dynamic-route?query=test`

## Important Notes

- Server Components can't use client-side React hooks like `useState`
- Client Components (marked with `'use client'`) can't use server-side features directly
- Make sure to properly segregate client and server code
