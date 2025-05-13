# API Improvements for Property Management

## Overview

This documentation outlines the improvements made to the property management API to fix 405 (Method Not Allowed) errors when using PUT, PATCH, and DELETE operations.

## Key Changes

### 1. Added OPTIONS Handlers

Added OPTIONS handlers to all API routes to properly support CORS preflight requests:

- `/api/properties/[id]/route.ts`
- `/api/properties/[id]/images/route.ts`
- `/api/properties/[id]/images/[publicId]/route.ts`

Example implementation:

```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

### 2. Updated Middleware Configuration

The middleware.ts file was updated to explicitly allow all HTTP methods for property API routes:

```typescript
// For properties API, explicitly allow all HTTP methods
if (pathname.startsWith("/api/properties/")) {
  const response = NextResponse.next();
  response.headers.set("X-Properties-API-Debug", "Allowed-All-Methods");
  return response;
}
```

### 3. Improved Client-Side API Calls

The PropertyEditModal component was updated with better error handling and proper headers:

- Added Accept headers to all API requests
- Improved error handling with detailed logging
- Added response parsing and validation

### 4. Created HTTP Method Fallbacks

To address environments where certain HTTP methods might be blocked or not supported:

#### 4.1 Fallback API Endpoints

Created POST-based fallback endpoints that perform the same operations as their PUT/PATCH/DELETE counterparts:

- `/api/properties/[id]/update/route.ts` - POST endpoint for updating properties (PATCH/PUT fallback)
- `/api/properties/[id]/delete/route.ts` - POST endpoint for deleting properties (DELETE fallback)
- `/api/properties/[id]/images/remove/route.ts` - POST endpoint for removing images (DELETE fallback)

#### 4.2 Progressive Method Attempts

Updated client-side code to progressively try different HTTP methods:

1. First attempt: Use the standard RESTful method (PATCH/PUT/DELETE)
2. If 405 error occurs: Try alternative standard methods (e.g., PATCH → PUT)
3. Final fallback: Use POST-based endpoints with `_method` parameter

Example:

```typescript
// First try PATCH
try {
  const response = await fetch(`/api/properties/${id}`, {
    method: "PATCH",
    // ...
  });

  if (response.ok) {
    // Success!
    return;
  }

  // If PATCH not allowed (405), try PUT
  if (response.status === 405) {
    const putResponse = await fetch(`/api/properties/${id}`, {
      method: "PUT",
      // ...
    });

    if (putResponse.ok) {
      // Success with PUT!
      return;
    }

    // If PUT also fails, try POST fallback
    if (putResponse.status === 405) {
      const postResponse = await fetch(`/api/properties/${id}/update`, {
        method: "POST",
        // ...
        body: JSON.stringify({
          ...payload,
          _method: "patch", // Signal that this is an update operation
        }),
      });

      // Handle POST response
    }
  }
} catch (error) {
  // Handle errors
}
```

## Debugging Tools

To help diagnose HTTP method issues in the application, we've added several debugging tools:

### 1. HTTP Method Test Page (`/method-test`)

A test interface that allows you to:

- Test different HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Try requests against different API endpoints
- See detailed response data, headers, and status codes

### 2. Update Test Page (`/update-test`)

A dedicated page for testing property updates with:

- Simple title/description update form
- Option to test against the test endpoint or real property endpoint
- Detailed response visualization

### 3. Method Check API (`/api/method-check`)

A special API endpoint that:

- Accepts all HTTP methods
- Returns detailed information about the request
- Logs method usage on the server

### 4. Test Update API (`/api/test-update`)

A simplified update API that:

- Accepts POST requests
- Validates and returns the request data
- Helps diagnose update-specific issues

### Diagnose Issues

Use these tools to identify:

- Which HTTP methods are allowed by your browser/network
- If middleware is correctly processing the requests
- Whether the API endpoints are properly handling requests
- What specific errors occur during updates

## Testing

To verify the changes, you can use the API test page at `/api-test/direct-fetch` which allows testing:

- All HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Different endpoints
- Request/response visualization

## Troubleshooting

If you encounter API issues:

1. Check the browser console for detailed logs and trace which HTTP methods were attempted
2. Look for HTTP status codes, especially 405 Method Not Allowed
3. Verify OPTIONS preflight requests are succeeding
4. Ensure the Content-Type and Accept headers are set correctly
5. Check server logs to see if any HTTP methods are being blocked at the server level
6. Use the method-test page to validate which HTTP methods are supported
7. Try the /update-test page to isolate update-specific issues

## Browser and Server Limitations

Some environments might restrict certain HTTP methods:

- Certain proxies and firewalls block PUT, PATCH, DELETE
- Some shared hosting environments only allow GET and POST
- Corporate networks might filter non-standard HTTP methods
- Older browsers might have limited support for some methods

The implemented fallback system ensures your application works across these environments.
