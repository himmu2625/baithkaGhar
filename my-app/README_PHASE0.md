# 🚀 PHASE 0: PREPARATION & SETUP - QUICK START GUIDE

**Status:** 🟡 In Progress (90% Complete)
**Last Updated:** December 16, 2025

---

## ✅ WHAT'S BEEN COMPLETED

Phase 0 setup has created the following:

### 📁 Files Created

```
my-app/
├── scripts/
│   └── backup/
│       ├── backup-database.js          ✅ Database backup utility
│       └── restore-database.js         ✅ Database restore utility
│
├── docs/
│   ├── PHASE_0_SETUP.md               ✅ Detailed setup guide
│   ├── ROLLBACK_PROCEDURES.md         ✅ Emergency rollback steps
│   ├── TESTING_CHECKLIST.md           ✅ Complete testing guide
│   └── PROJECT_TIMELINE.md            ✅ 8-week implementation plan
│
├── .env.staging                        ✅ Staging environment template
├── .env.production.template            ✅ Production environment template
│
└── package.json                        ✅ Updated with new scripts
```

### 🔧 NPM Scripts Added

```bash
# Database Management
npm run backup:db              # Create database backup
npm run restore:db             # Restore from backup

# Phase Execution
npm run phase0:setup           # Run Phase 0 setup
npm run phase1:migrate         # Run Phase 1 migration (future)

# Staging Environment
npm run staging:start          # Start staging server (port 3001)
npm run staging:build          # Build for staging
```

---

## 🎯 NEXT STEPS TO COMPLETE PHASE 0

### Step 1: Install MongoDB Database Tools

**Required for backup/restore scripts to work**

#### Windows
```bash
# Download from:
https://www.mongodb.com/try/download/database-tools

# Or use Chocolatey:
choco install mongodb-database-tools
```

#### Mac
```bash
brew install mongodb-database-tools
```

#### Linux
```bash
sudo apt-get install mongodb-database-tools
```

**Verify installation:**
```bash
mongodump --version
mongorestore --version
```

---

### Step 2: Test Database Backup

```bash
# Set your MongoDB URI
export MONGODB_URI="your_mongodb_connection_string"

# Windows (PowerShell):
$env:MONGODB_URI="your_mongodb_connection_string"

# Run backup
npm run backup:db

# Expected output:
✓ Created backup directory
📦 Starting database backup...
   Backup name: baithaka-backup-2025-12-16
   Database: baithaka
⏳ This may take a few minutes...
✓ Database backup completed successfully!
   Backup size: 25.4 MB
   Location: backups/baithaka-backup-2025-12-16

# Verify backup exists
ls backups/
```

---

### Step 3: Set Up Staging Environment

```bash
# 1. Copy staging template
cp .env.staging .env.local

# 2. Edit .env.local with your staging credentials
# Open in your editor and update:
#   - MONGODB_URI (use separate staging database!)
#   - RAZORPAY_KEY_ID (use TEST mode: rzp_test_xxx)
#   - SMTP credentials (use Mailtrap for testing)

# 3. Start staging server
npm run staging:start

# 4. Access staging at:
http://localhost:3001
```

**Important:** Staging should use:
- ✅ Separate database from production (`baithaka-staging`)
- ✅ Razorpay TEST mode keys (`rzp_test_*`)
- ✅ Test email service (Mailtrap.io recommended)

---

### Step 4: Set Up Error Tracking (Sentry) - RECOMMENDED

```bash
# 1. Install Sentry
npm install @sentry/nextjs

# 2. Run Sentry wizard
npx @sentry/wizard@latest -i nextjs

# 3. Follow prompts:
#    - Create Sentry account (https://sentry.io)
#    - Select "Next.js" project
#    - Copy DSN to .env

# 4. Add to .env.local:
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token

# 5. Test error tracking
# Add this temporarily to any page:
throw new Error('Test Sentry integration')

# 6. Check Sentry dashboard for the error
```

---

### Step 5: Set Up Monitoring (Optional but Recommended)

#### Option A: Sentry Performance Monitoring (Easiest)
- Already included if you set up Sentry above
- Tracks response times, database queries, API calls
- Free tier: 10K events/month

#### Option B: Custom Monitoring
```bash
# Create monitoring utility
mkdir -p lib/monitoring

# Install dependencies
npm install winston winston-daily-rotate-file
```

Create `lib/monitoring/logger.ts`:
```typescript
import winston from 'winston'
import 'winston-daily-rotate-file'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d'
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

---

### Step 6: Create Git Tags (Version Control)

```bash
# 1. Commit all Phase 0 changes
git add .
git commit -m "feat: Complete Phase 0 - Preparation & Setup

- Add database backup/restore scripts
- Add staging environment configuration
- Add comprehensive testing checklist
- Add rollback procedures
- Add project timeline documentation
- Update package.json with helpful scripts"

# 2. Tag current production version (before changes)
git tag -a v1.0.0-pre-owner-system -m "Production version before Owner System implementation"
git push origin v1.0.0-pre-owner-system

# 3. Create feature branch for development
git checkout -b feature/owner-system

# 4. Push feature branch
git push -u origin feature/owner-system
```

---

## 📋 PHASE 0 CHECKLIST

Before moving to Phase 1, verify:

### Database Backup
- [ ] MongoDB Database Tools installed
- [ ] Backup script runs successfully
- [ ] Backup file created in `backups/` directory
- [ ] Backup size looks reasonable (>1MB)
- [ ] Restore script tested (on staging only!)

### Staging Environment
- [ ] `.env.local` created from `.env.staging`
- [ ] Separate staging database created
- [ ] Staging server runs on port 3001
- [ ] Can access http://localhost:3001
- [ ] Uses Razorpay TEST mode
- [ ] Email goes to test inbox (Mailtrap)

### Error Tracking
- [ ] Sentry account created (or alternative)
- [ ] Sentry SDK installed
- [ ] SENTRY_DSN configured
- [ ] Test error captured in Sentry dashboard
- [ ] Performance monitoring enabled

### Version Control
- [ ] All changes committed to Git
- [ ] Production version tagged
- [ ] Feature branch created
- [ ] Branch pushed to remote

### Documentation
- [ ] Team reviewed Phase 0 docs
- [ ] All team members have staging access
- [ ] Backup procedures understood
- [ ] Rollback plan reviewed

### Team Readiness
- [ ] Kickoff meeting completed
- [ ] Roles and responsibilities clear
- [ ] Timeline reviewed and agreed upon
- [ ] Communication channels set up

---

## 🧪 TESTING YOUR SETUP

### Test 1: Backup & Restore
```bash
# 1. Create a backup
npm run backup:db
# Note the backup name: baithaka-backup-YYYY-MM-DD

# 2. (STAGING ONLY!) Test restore
npm run restore:db
# Select the backup you just created
# Type 'yes' to confirm

# 3. Verify data integrity
# - Check collection counts
# - Verify critical records exist
```

### Test 2: Staging Environment
```bash
# 1. Start staging server
npm run staging:start

# 2. Open browser to http://localhost:3001

# 3. Test critical flows:
# - Homepage loads
# - Can view properties
# - Can create account
# - Can log in
# - (Don't test payments yet - not ready)
```

### Test 3: Error Tracking
```bash
# 1. Add test error to a page
# app/page.tsx - add at top of component:
throw new Error('Test Sentry - Phase 0 verification')

# 2. Open page in browser
# Error should trigger

# 3. Check Sentry dashboard
# Should see error with stack trace

# 4. Remove test error
# Delete the throw statement
```

---

## 🚨 TROUBLESHOOTING

### Issue: "mongodump: command not found"
**Solution:** Install MongoDB Database Tools (see Step 1)

### Issue: "MONGODB_URI is not set"
```bash
# Set environment variable
export MONGODB_URI="your_connection_string"

# Or add to .env.local
echo "MONGODB_URI=your_connection_string" >> .env.local
```

### Issue: Staging server won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001    # Windows
lsof -i :3001                   # Mac/Linux

# Kill process on port 3001
# Windows:
taskkill /PID <PID> /F
# Mac/Linux:
kill -9 <PID>

# Try starting again
npm run staging:start
```

### Issue: Cannot connect to staging database
**Solution:**
1. Verify MongoDB URI is correct
2. Check IP whitelist in MongoDB Atlas
3. Verify network connectivity
4. Test connection: `mongosh "YOUR_MONGODB_URI"`

### Issue: Sentry errors not showing
**Solution:**
1. Verify SENTRY_DSN is correct
2. Check Sentry project is active
3. Verify error was triggered (check browser console)
4. Wait a few minutes (can take time to show)

---

## 📈 SUCCESS METRICS

Phase 0 is successfully complete when:

- ✅ **Backup Time:** Can backup database in <5 minutes
- ✅ **Restore Time:** Can restore database in <10 minutes
- ✅ **Staging Uptime:** Staging environment runs without crashes
- ✅ **Error Detection:** Sentry captures and reports errors
- ✅ **Team Access:** All developers can access staging
- ✅ **Documentation:** All Phase 0 docs reviewed and understood

---

## 🎯 READY FOR PHASE 1?

Before proceeding to Phase 1 (Database Schema Updates):

1. ✅ All checklist items above completed
2. ✅ Team meeting held to review Phase 0
3. ✅ Backup/restore procedures tested
4. ✅ Staging environment fully functional
5. ✅ Git tags created
6. ✅ Everyone knows the rollback procedure

**If all checked, you're ready for Phase 1! 🚀**

---

## 📞 SUPPORT

### Phase 0 Issues
- **Lead Developer:** [Name] - [Email]
- **DevOps:** [Name] - [Email]

### MongoDB Support
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas/support
- **Documentation:** https://www.mongodb.com/docs/

### Sentry Support
- **Documentation:** https://docs.sentry.io/
- **Community:** https://discord.gg/sentry

---

## 📝 WHAT'S NEXT?

### Phase 1: Database Schema Updates
**Start Date:** December 23, 2025
**Duration:** 1 week

**Objectives:**
1. Update User model (add `property_owner` role)
2. Update Property model (add payment settings)
3. Update Booking model (add partial payment fields)
4. Create migration scripts
5. Test on staging

**Preparation:**
- [ ] Review [docs/PHASE_0_SETUP.md](docs/PHASE_0_SETUP.md)
- [ ] Ensure all Phase 0 items complete
- [ ] Create database backup before starting
- [ ] Schedule team kickoff for Phase 1

---

## 🎉 CONGRATULATIONS!

You've completed Phase 0! The foundation is now set for safely implementing the Owner System.

**Key Achievements:**
- ✅ Backup/restore infrastructure ready
- ✅ Staging environment configured
- ✅ Testing framework in place
- ✅ Documentation complete
- ✅ Rollback procedures documented
- ✅ Team aligned and ready

**You're now ready to begin Phase 1: Database Schema Updates**

---

**Last Updated:** December 16, 2025
**Phase Status:** 90% Complete (pending Sentry setup)
**Next Review:** December 20, 2025
