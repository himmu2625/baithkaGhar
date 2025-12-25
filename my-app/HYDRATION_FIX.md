# Hydration Mismatch Fix - OS Login Link

## Issue
React hydration error when adding `target="_blank"` to the OS login link:
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

## Root Cause
The footer component is a client component (`"use client"`) that uses dynamic session-based logic for the admin portal link. When we added static `target="_blank"` to the OS link while keeping `onClick` on the admin link, it created an inconsistent pattern that caused hydration mismatch.

## Solution
Changed from static HTML attributes to consistent JavaScript-based navigation for both links.

### Before (Causing Hydration Error)
```tsx
<a
  href="/os/login"
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  Baithaka Ghar OS
</a>
```

### After (Fixed)
```tsx
<a
  href="/os/login"
  className="..."
  onClick={(e) => {
    e.preventDefault()
    window.open("/os/login", "_blank", "noopener,noreferrer")
  }}
>
  Baithaka Ghar OS
</a>
```

## Why This Fixes It
1. **Consistent Pattern**: Both admin and OS links now use `onClick` handlers
2. **Same Server/Client Render**: No dynamic attributes that differ between server and client
3. **Preserved Functionality**: Still opens in new tab with security (`noopener,noreferrer`)
4. **Progressive Enhancement**: Falls back to href if JavaScript disabled

## Technical Details
- `window.open(url, "_blank", "noopener,noreferrer")` achieves same result as `target="_blank" rel="noopener noreferrer"`
- No hydration mismatch because the DOM structure is identical on server and client
- Event handler is attached during hydration, not part of initial HTML structure

## File Modified
- [components/layout/footer.tsx:502-512](components/layout/footer.tsx#L502-L512)

## Status
✅ Fixed and tested
✅ Build succeeds
✅ No hydration warnings
✅ Opens in new tab as expected
