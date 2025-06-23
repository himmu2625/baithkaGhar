# Production Deployment Fix Guide

## Critical Environment Variables for Production

### In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add/Update these variables:

```bash
# Essential NextAuth Variables
NEXTAUTH_SECRET=your-long-random-secret-key-here
AUTH_SECRET=your-long-random-secret-key-here  # Same value as NEXTAUTH_SECRET
NEXTAUTH_URL=https://baithaka-ghar.vercel.app

# Database & Services
MONGODB_URI=your-mongodb-connection-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Important Notes:

- **NEXTAUTH_SECRET**: Generate a long random string (at least 32 characters)
- **NEXTAUTH_URL**: MUST match your exact production domain
- Set all variables to apply to "Production" environment

## Step-by-Step Fix:

### 1. Check Environment Variables

After deployment, visit: `https://baithaka-ghar.vercel.app/api/admin/debug-env`
This will show which environment variables are missing.

### 2. Test Authentication

Visit: `https://baithaka-ghar.vercel.app/api/admin/debug-auth`
This will show your current authentication status.

### 3. Generate NEXTAUTH_SECRET

If missing, generate a secret:

```bash
# In terminal:
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

### 4. Force Redeploy

After setting environment variables:

- Go to Vercel Dashboard → Deployments
- Click "..." on latest deployment → Redeploy

### 5. Clear Browser Data

- Clear cookies for baithaka-ghar.vercel.app
- Try logging in again

## Common Production Issues:

### Issue 1: Missing NEXTAUTH_URL

**Symptom**: SessionRequired error
**Fix**: Set `NEXTAUTH_URL=https://baithaka-ghar.vercel.app`

### Issue 2: Wrong Cookie Configuration

**Symptom**: Cookies not being set
**Fix**: Updated auth.ts with production cookie settings

### Issue 3: Domain Issues

**Symptom**: Redirects to wrong domain
**Fix**: Ensure NEXTAUTH_URL matches your exact domain

## Testing Checklist:

- [ ] Environment variables set in Vercel
- [ ] NEXTAUTH_URL matches production domain
- [ ] Force redeploy completed
- [ ] Browser cookies cleared
- [ ] `/api/admin/debug-env` shows all variables present
- [ ] `/api/admin/debug-auth` shows authentication working
- [ ] Admin login redirects to dashboard successfully

## If Still Having Issues:

1. Use the "Debug Environment" button on admin login page
2. Check browser Network tab for cookie issues
3. Look at Vercel Function logs for error messages
4. Try the "Recover Session" button

The key difference between localhost and production is the cookie configuration and environment variables. Once these are properly set, admin login should work smoothly in production.
