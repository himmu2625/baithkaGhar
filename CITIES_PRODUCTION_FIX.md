# Cities Production Loading Issue - Fix Guide

## Problem

Cities are not loading in production with error "Failed to load cities. Please try again later."

## Root Causes Identified

### 1. Missing Environment Variables

- **MONGODB_URI** might not be properly set in Vercel production environment
- Database connection string could be incorrect for production

### 2. Database Connection Issues

- MongoDB Atlas network restrictions
- Connection timeouts in production environment
- Different connection pooling behavior

### 3. Model Import Issues

- Case sensitivity in file imports (`City` vs `city`)
- Build-time module resolution differences

## Immediate Fixes Applied

### 1. Enhanced API Route (`/api/cities/route.ts`)

- Added comprehensive error logging
- Better environment variable checking
- Fallback to direct model queries
- Automatic seeding if no cities found
- Production-specific error handling

### 2. Debug Endpoint Created (`/api/cities/debug/route.ts`)

- Real-time database connection testing
- Environment variable validation
- Collection statistics
- Detailed error reporting

### 3. Frontend Error Handling Enhanced

- Better error messages with details
- Automatic debug info collection in production
- Retry mechanisms
- Console logging for debugging

## Step-by-Step Fix Process

### Step 1: Check Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `MONGODB_URI` is set correctly:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```
3. Ensure it's applied to "Production" environment

### Step 2: Test Database Connection

Visit these URLs in production:

- `https://baithaka-ghar.vercel.app/api/cities/debug` - Full diagnostic info
- `https://baithaka-ghar.vercel.app/api/cities` - Test cities API

### Step 3: MongoDB Atlas Configuration

1. **IP Whitelist**: Ensure `0.0.0.0/0` is whitelisted (or specific Vercel IPs)
2. **Database User**: Verify username/password in connection string
3. **Network Access**: Check if VPC or firewall is blocking connections
4. **Connection Limits**: Ensure you haven't exceeded connection limits

### Step 4: Force Seed Cities (if database is empty)

Visit: `https://baithaka-ghar.vercel.app/api/seed-cities?force=true`

### Step 5: Clear Caches and Redeploy

1. In Vercel Dashboard: Deployments → Redeploy latest
2. Clear browser cache and cookies
3. Test the main site again

## Common Production Issues & Solutions

### Issue 1: "MONGODB_URI environment variable is not set"

**Solution**:

- Set MONGODB_URI in Vercel environment variables
- Redeploy the application

### Issue 2: "Database connection failed"

**Solution**:

- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has proper permissions

### Issue 3: "No cities found after seeding operation"

**Solution**:

- Manually seed cities: `/api/seed-cities?force=true`
- Check database permissions for write operations

### Issue 4: Cities loading locally but not in production

**Solution**:

- Compare local vs production environment variables
- Check MongoDB Atlas connection from production
- Verify model imports are case-sensitive correct

## Debug Commands

### Check Environment

```bash
curl https://baithaka-ghar.vercel.app/api/cities/debug
```

### Force Seed Cities

```bash
curl -X POST https://baithaka-ghar.vercel.app/api/seed-cities
```

### Test Cities API

```bash
curl https://baithaka-ghar.vercel.app/api/cities
```

## Monitoring & Logs

### Vercel Function Logs

1. Go to Vercel Dashboard → Functions
2. Click on any function to see real-time logs
3. Look for MongoDB connection errors

### Browser Console

Open Developer Tools and check Console tab for:

- Cities API response status
- Debug information
- Error details

## Prevention

### 1. Environment Variable Backup

Keep a backup of all production environment variables

### 2. Database Monitoring

- Set up MongoDB Atlas alerts for connection issues
- Monitor connection limits and usage

### 3. Health Checks

- Regularly test `/api/cities/debug` endpoint
- Set up uptime monitoring for cities functionality

## Emergency Rollback

If issues persist:

1. Check git history for recent changes to cities functionality
2. Rollback to previous working deployment in Vercel
3. Use manual database seeding as temporary fix

## Support Contacts

- MongoDB Atlas Support: For database connection issues
- Vercel Support: For deployment and environment variable issues
- Check GitHub Issues: For known problems and solutions

---

## Quick Fix Checklist

- [ ] MONGODB_URI set in Vercel production environment
- [ ] IP whitelist includes 0.0.0.0/0 in MongoDB Atlas
- [ ] Database user has read/write permissions
- [ ] Cities debug endpoint shows success
- [ ] Cities API returns data
- [ ] Frontend successfully loads cities
- [ ] No console errors in browser

If all items are checked and cities still don't load, check Vercel function logs for specific error details.
