# Database Migration and Cleanup Guide

## 🎯 Overview

This guide will help you remove all sample properties from your website and migrate to using the production database `baithakaGharDB` instead of test databases.

## 🔧 What Has Been Set Up

### 1. **Database Configuration Updates**

- ✅ Updated default database name from `baithaka` to `baithakaGharDB`
- ✅ Modified connection files to use the production database
- ✅ Updated all fallback URIs to point to `baithakaGharDB`

### 2. **Cleanup Scripts Created**

- ✅ `scripts/cleanup-and-migrate-db.js` - Comprehensive cleanup script
- ✅ `scripts/check-database-connection.js` - Database verification script
- ✅ Added npm scripts for easy execution

### 3. **Files Modified**

- `lib/db/dbConnect.ts` - Updated default database name
- `scripts/update-city-counts.js` - Updated default database name
- `scripts/cleanup-database.js` - Updated default database name
- `package.json` - Added new cleanup scripts

## 🚀 How to Complete the Migration

### Step 1: Check Current Database Status

```bash
npm run check-db
```

This will show you:

- Which database you're currently connected to
- How many properties/cities/users exist
- Sample data in your database

### Step 2: Create Environment File

Create a `.env.local` file in your `my-app` directory with:

```env
MONGODB_URI=mongodb://localhost:27017/baithakaGharDB
# Add your other environment variables here
NEXTAUTH_SECRET=your-secret-here
# etc...
```

### Step 3: Run the Cleanup (DESTRUCTIVE OPERATION)

⚠️ **WARNING: This will delete ALL existing properties, bookings, and test users!**

```bash
npm run cleanup-db
```

This script will:

- 🗑️ Delete all existing properties
- 🗑️ Delete all bookings (since they reference properties)
- 🔄 Reset all city property counts to 0
- 🗑️ Remove test/sample users (with test/demo/sample in name/email)
- ✅ Verify the database is clean

### Step 4: Verify the Cleanup

```bash
npm run check-db
```

Should show:

- Properties: 0
- Cities: (existing count) with all property counts at 0
- Users: (non-test users only)

## 📁 New Database Structure

After migration, your data will be stored in:

```
baithakaGharDB/
├── properties/     (instead of test/properties)
├── cities/
├── users/
├── bookings/
└── other collections...
```

## 🔄 What Happens After Cleanup

### Automatic Property Count Updates

- ✅ When new properties are added via the list-property form, city counts will automatically increment
- ✅ New cities will be created automatically if they don't exist
- ✅ All property creation goes through the enhanced counting system

### Clean Slate Benefits

- 🎯 No sample/test data cluttering your production environment
- 📊 Accurate city property counts starting from 0
- 🔄 Consistent data structure across all collections
- 🚀 Ready for real property listings

## 🛡️ Safety Measures

### What's Protected

- ✅ **Real user accounts** (non-test users are preserved)
- ✅ **City data** (cities remain, only property counts reset)
- ✅ **System configuration** (all settings preserved)

### What's Removed

- ❌ All sample/test properties
- ❌ All bookings (they reference deleted properties)
- ❌ Test user accounts (with test/demo/sample keywords)

## 🔍 Verification Commands

After cleanup, you can verify everything is working:

```bash
# Check database status
npm run check-db

# Update city counts (should show all 0s)
npm run update-city-counts

# Start development server
npm run dev
```

## 🎯 Expected Results

After completing the migration:

1. **Homepage city cards** will show 0 properties for all cities
2. **Clean database** with no sample data
3. **Production-ready environment** using baithakaGharDB
4. **Automatic count updates** when new properties are added
5. **Consistent data structure** across all collections

## 🆘 Troubleshooting

### If Properties Still Show on Website

1. Clear browser cache and refresh
2. Check if you're connected to the correct database: `npm run check-db`
3. Restart your development server: `npm run dev`

### If Cleanup Script Fails

1. Ensure MongoDB is running
2. Check your MONGODB_URI in `.env.local`
3. Verify database permissions
4. Check console output for specific errors

### If You Need to Rollback

The cleanup script doesn't create backups, but you can:

1. Restore from your MongoDB backups if available
2. Re-seed sample data if needed
3. Run the city count update: `npm run update-city-counts`

## 📝 Next Steps After Migration

1. **Test property listing** - Add a test property to verify the system works
2. **Verify city counts** - Check that city counts increment properly
3. **Update production environment** - Use the same database name in production
4. **Monitor new properties** - Ensure all new listings are stored correctly

## 🔐 Environment Configuration

Make sure your `.env.local` file contains:

```env
# Core Database Configuration
MONGODB_URI=mongodb://localhost:27017/baithakaGharDB

# For production, use your actual MongoDB connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/baithakaGharDB

# Other required variables...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
# Add other environment variables as needed
```

---

✅ **Ready to clean up your database?** Run `npm run cleanup-db` when you're ready to proceed!
