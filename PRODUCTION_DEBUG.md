# Production Admin Login Debug Guide

## Environment Variables to Check in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and ensure these are set:

### Required Environment Variables:

```bash
NEXTAUTH_SECRET=your-secret-key-here
AUTH_SECRET=your-secret-key-here  # Same as NEXTAUTH_SECRET
NEXTAUTH_URL=https://baithaka-ghar.vercel.app
MONGODB_URI=your-mongodb-connection-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Critical Notes:

1. **NEXTAUTH_SECRET**: Must be set and be a long, random string
2. **NEXTAUTH_URL**: Must match your exact production domain
3. **AUTH_SECRET**: Should be identical to NEXTAUTH_SECRET for NextAuth v5 compatibility

## Common Production Issues:

### 1. Missing NEXTAUTH_URL

- **Problem**: NextAuth doesn't know the production domain
- **Solution**: Set `NEXTAUTH_URL=https://baithaka-ghar.vercel.app`

### 2. Cookie Domain Issues

- **Problem**: Cookies not being set properly on production domain
- **Solution**: Update auth configuration

### 3. Secure Cookie Settings

- **Problem**: Production requires secure cookies
- **Solution**: Update middleware cookie configuration

## Debug Steps:

1. Check environment variables in Vercel
2. Test `/api/auth/session` endpoint in production
3. Check browser cookies on production
4. Update auth configuration if needed
