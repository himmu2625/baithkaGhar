# Console Cleanup Plan

## Current State Analysis

### Total Console Statements: **2,060**

### Breakdown by Directory
| Directory | Count | Priority |
|-----------|-------|----------|
| app/ | 1,433 | High (API routes & pages) |
| lib/ | 445 | Medium (Utilities) |
| components/ | 156 | Medium (UI components) |
| proxy.ts | 18 | Low (Auth middleware) |
| models/ | 8 | Low (Database models) |

### Breakdown by Type
| Type | Count | Action |
|------|-------|--------|
| console.error | 1,073 | Keep (production errors) |
| console.log | 944 | Remove/Replace (debugging) |
| console.warn | 43 | Review (warnings) |
| console.debug | 0 | N/A |

## Cleanup Strategy

### Phase 1: Quick Wins (Remove Debug Logs)
**Target:** Development-only console.log statements
**Categories:**
1. Simple debug logs (e.g., "Fetching data...", "User clicked...")
2. Variable dumps (e.g., console.log(data))
3. Function entry/exit logs
4. Request/response logs in API routes

**Approach:** Remove completely

### Phase 2: Convert to Proper Error Handling
**Target:** console.error in try-catch blocks
**Categories:**
1. API route error handlers
2. Database operation errors
3. Validation errors

**Approach:** Keep for production, ensure proper formatting

### Phase 3: Strategic Logging
**Target:** Important console.log that should be kept
**Categories:**
1. Server startup logs
2. Critical operation logs
3. Security-related logs
4. Authentication flow logs

**Approach:** Keep or convert to proper logger

### Phase 4: Proxy/Middleware Logs
**Target:** Console statements in proxy.ts
**Categories:**
1. Authentication checks
2. Route matching
3. Redirect logging

**Approach:** Keep important ones, format consistently

## Manual Cleanup Process

### Step-by-Step Approach

#### Step 1: Models (8 statements) ✓ EASIEST
- Review all 8 console statements
- Remove debugging logs
- Keep error logs if needed

#### Step 2: Proxy (18 statements) ✓ EASY
- Review authentication logs
- Keep security-related logs
- Remove debug logs

#### Step 3: Components (156 statements)
- Focus on removing debug logs
- Keep error handling
- Review client-side logging

#### Step 4: Lib (445 statements)
- Utilities and helpers
- Remove development logs
- Keep critical error logs

#### Step 5: App/API Routes (1,433 statements)
- Focus on API error handling
- Remove debug logs
- Keep production error logs
- Ensure proper error responses

## Cleanup Rules

### ✅ KEEP These Console Statements
```typescript
// Production errors
console.error('[API] Database connection failed:', error)

// Security logs
console.log('[Security] Unauthorized access attempt detected')

// Critical operations
console.log('[Payment] Processing payment:', transactionId)

// Server lifecycle
console.log('[Server] Application started on port 3000')
```

### ❌ REMOVE These Console Statements
```typescript
// Debug logs
console.log('here')
console.log('testing')
console.log(data)

// Development tracking
console.log('Component mounted')
console.log('Fetching data...')

// Variable dumps
console.log('user:', user)
console.log('response:', response)
```

### 🔄 REPLACE These Console Statements
```typescript
// Before
console.log('Error:', error)

// After (use proper error handling)
throw new Error(`Operation failed: ${error.message}`)

// Before
console.log('User logged in')

// After (use proper logger if needed)
// Remove or keep based on production needs
```

## Recommended Tools

### Create Logger Utility (Future Enhancement)
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, meta)
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta)
  }
}
```

## Progress Tracking

### Cleanup Phases
- [ ] Step 1: Models (8 statements)
- [ ] Step 2: Proxy (18 statements)
- [ ] Step 3: Components (156 statements)
- [ ] Step 4: Lib (445 statements)
- [ ] Step 5: App/API Routes (1,433 statements)

### Target Reduction
- **Start:** 2,060 console statements
- **Target:** ~500 console statements (75% reduction)
- **Keep:** Critical errors and production logs
- **Remove:** Debug and development logs

## Notes
- This is a manual process - review each file carefully
- Don't remove error handling console.error statements
- Focus on removing debug console.log statements first
- Build and test after each major cleanup phase
