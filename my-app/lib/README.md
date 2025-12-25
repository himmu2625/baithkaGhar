# Baithaka Ghar Library

This directory contains various utilities, services, and helper functions used throughout the Baithaka Ghar application.

## Directory Structure

```
lib/
├── api/                  # API clients and utilities
│   ├── index.ts          # Main API client
│   └── host.ts           # Host-specific API functions
├── auth/                 # Authentication utilities
│   └── index.ts          # Authentication helpers
├── db/                   # Database utilities
│   ├── index.ts          # Database helpers
│   └── dbConnect.ts      # MongoDB connection utility
├── utils/                # General utilities
│   └── index.ts          # Utility functions
├── index.ts              # Main exports
├── auth.ts               # NextAuth configuration
├── mongodb.ts            # MongoDB connection logic
├── db.ts                 # Database operations
├── models.ts             # Database model helpers
├── cache.ts              # Caching utilities
├── otp.ts                # OTP types and constants
├── otp-utils.ts          # OTP utility functions
├── get-session.ts        # Session management
├── placeholder.ts        # Image placeholder utilities
├── image-utils.ts        # Image processing utilities
├── cloudinary.ts         # Cloudinary integration
├── razorpay.ts           # Razorpay payment integration
├── razorpay-client.ts    # Razorpay client
├── email.ts              # Email sending utilities
├── sms.ts                # SMS sending utilities
├── maps.ts               # Maps and location utilities
├── performance.ts        # Performance monitoring
├── analytics.ts          # Analytics tracking
├── host-analytics.ts     # Host-specific analytics
├── search.ts             # Search functionality
└── search-tracking.ts    # Search analytics tracking
```

## Import Guidelines

For importing functionality from the lib directory, you can use the following patterns:

### Generic Imports from Main Categories

```typescript
// Import from main categories
import { apiClient } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { dbConnect, convertDocToObj } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";
```

### Direct Imports (Alternative)

```typescript
// Direct imports for specific functionality
import { sendEmail } from "@/lib/email";
import { generateOtp } from "@/lib/otp-utils";
import { trackPropertyView } from "@/lib/host-analytics";
```

### Best Practices

1. Prefer importing from the main category folders when possible (`api`, `auth`, `db`, `utils`)
2. Use direct imports for specific standalone utilities
3. For server-side functionality, ensure 'server-only' is imported in the module
4. Keep imports organized and avoid circular dependencies
