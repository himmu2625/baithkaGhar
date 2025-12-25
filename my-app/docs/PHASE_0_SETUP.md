# 🚀 PHASE 0: PREPARATION & SETUP

**Status:** In Progress
**Started:** December 16, 2025
**Estimated Completion:** 1 week

---

## 📋 OVERVIEW

Phase 0 establishes the foundation for safely implementing the Owner System and Partial Payment features. This phase focuses on:

- Database backup and recovery procedures
- Staging environment configuration
- Error tracking and monitoring setup
- Testing infrastructure
- Documentation and rollback procedures

---

## ✅ TASKS CHECKLIST

### 1. Database Backup Strategy

#### 1.1 Backup Scripts Created
- [x] `scripts/backup/backup-database.js` - Full database backup utility
- [x] `scripts/backup/restore-database.js` - Database restoration utility
- [ ] Test backup on staging environment
- [ ] Verify backup integrity
- [ ] Document backup procedures

#### 1.2 Backup Schedule
- [ ] Set up automated daily backups (cron job)
- [ ] Configure backup retention policy (30 days)
- [ ] Set up off-site backup storage (AWS S3 or similar)

**How to Create Backup:**
```bash
# Set environment variable
export MONGODB_URI="your_mongodb_connection_string"

# Run backup
node scripts/backup/backup-database.js

# Backups saved to: my-app/backups/
```

**How to Restore Backup:**
```bash
# List available backups
node scripts/backup/restore-database.js

# Restore specific backup
node scripts/backup/restore-database.js baithaka-backup-2025-12-16
```

---

### 2. Staging Environment

#### 2.1 Environment Configuration
- [x] Created `.env.staging` template
- [x] Created `.env.production.template`
- [ ] Set up staging database (separate from production)
- [ ] Configure Razorpay TEST mode credentials
- [ ] Set up test email service (Mailtrap)
- [ ] Configure staging deployment

#### 2.2 Staging Database Setup
```bash
# Create staging database in MongoDB Atlas
# Database name: baithaka-staging

# Import production data to staging (one-time)
mongodump --uri="PROD_URI" --out=./temp-backup
mongorestore --uri="STAGING_URI" --drop ./temp-backup
```

#### 2.3 Staging URL
- **Local Staging:** http://localhost:3001
- **Remote Staging:** https://staging.baithakaghar.com (if deployed)

---

### 3. Error Tracking & Monitoring

#### 3.1 Sentry Setup (Recommended)
- [ ] Create Sentry account (https://sentry.io)
- [ ] Create new project for Baithaka Ghar
- [ ] Install Sentry SDK
- [ ] Configure error tracking
- [ ] Set up performance monitoring

**Installation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration Files to Create:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

#### 3.2 Logging Setup
- [ ] Configure Winston or Pino for structured logging
- [ ] Set up log rotation
- [ ] Configure different log levels per environment
- [ ] Set up log aggregation (CloudWatch, Datadog, or Logtail)

---

### 4. Testing Infrastructure

#### 4.1 Testing Tools Setup
- [ ] Install Jest for unit tests
- [ ] Install Playwright or Cypress for E2E tests
- [ ] Set up test database
- [ ] Create test data fixtures

**Install Testing Dependencies:**
```bash
# Unit & Integration Testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# E2E Testing
npm install --save-dev @playwright/test

# API Testing
npm install --save-dev supertest
```

#### 4.2 Test Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:api": "jest --testPathPattern=api"
  }
}
```

---

### 5. Project Timeline & Milestones

#### 5.1 Gantt Chart Created
- [ ] Use Project Management Tool (Notion, Jira, or Trello)
- [ ] Define milestones for each phase
- [ ] Assign responsibilities
- [ ] Set deadline dates

#### 5.2 Milestones Overview

| Phase | Milestone | Target Date | Status |
|-------|-----------|-------------|--------|
| Phase 0 | Setup Complete | Week 1 | 🟡 In Progress |
| Phase 1 | Database Models | Week 2 | ⏳ Pending |
| Phase 2 | Authentication | Week 2 | ⏳ Pending |
| Phase 3 | Owner UI | Week 3 | ⏳ Pending |
| Phase 4 | Payment Collection | Week 4 | ⏳ Pending |
| Phase 5 | Admin Panel | Week 5 | ⏳ Pending |
| Phase 6 | Notifications | Week 5 | ⏳ Pending |
| Phase 7 | Testing | Week 6 | ⏳ Pending |
| Phase 8 | Deployment | Week 6 | ⏳ Pending |

---

### 6. Documentation

#### 6.1 Technical Documentation
- [x] This setup guide (PHASE_0_SETUP.md)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

#### 6.2 User Documentation
- [ ] Owner System user guide
- [ ] Payment collection workflow guide
- [ ] Admin panel guide
- [ ] FAQ document

---

### 7. Rollback Procedures

#### 7.1 Emergency Rollback Plan
**Created:** `docs/ROLLBACK_PROCEDURES.md`

**Quick Rollback Steps:**
1. Stop the application
2. Restore database from backup
3. Deploy previous code version
4. Verify system functionality
5. Notify stakeholders

#### 7.2 Version Control
- [ ] Tag current production version: `v1.0.0-pre-owner-system`
- [ ] Create feature branch: `feature/owner-system`
- [ ] Set up branch protection rules

```bash
# Tag current production
git tag -a v1.0.0-pre-owner-system -m "Production version before Owner System"
git push origin v1.0.0-pre-owner-system

# Create feature branch
git checkout -b feature/owner-system
```

---

## 🔧 CONFIGURATION CHECKLIST

### Environment Variables Documented
- [x] `.env.staging` template created
- [x] `.env.production.template` created
- [ ] All developers have staging credentials
- [ ] Production credentials stored in secure vault (1Password, AWS Secrets Manager)

### Required Environment Variables

#### Database
- `MONGODB_URI` - MongoDB connection string
- Database must support:
  - Transactions
  - Change streams (for real-time updates)
  - Indexes

#### Authentication
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Random secret (min 32 characters)
- `GOOGLE_CLIENT_ID` - Google OAuth (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)

#### Payment Gateway
- `RAZORPAY_KEY_ID` - Razorpay key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public Razorpay key

#### Email Service
- `SMTP_HOST` - Email server
- `SMTP_PORT` - Email port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `SMTP_FROM` - From email address

#### Monitoring (Optional but Recommended)
- `SENTRY_DSN` - Sentry project DSN
- `SENTRY_AUTH_TOKEN` - Sentry authentication

---

## 🧪 TESTING PHASE 0

### Pre-flight Checklist

Before moving to Phase 1, verify:

#### Database Backup
```bash
# 1. Create a backup
node scripts/backup/backup-database.js

# 2. Verify backup was created
ls -lh backups/

# 3. Test restore (on staging only!)
node scripts/backup/restore-database.js [backup-name]

# 4. Verify data integrity
# - Check collection counts
# - Verify critical records exist
# - Test application functionality
```

#### Staging Environment
```bash
# 1. Copy staging environment variables
cp .env.staging .env.local

# 2. Update with actual staging credentials
# Edit .env.local

# 3. Start staging server
npm run dev -- -p 3001

# 4. Verify staging works
# - Can access http://localhost:3001
# - Can connect to staging database
# - Can make test bookings
# - Razorpay TEST mode works
```

#### Error Tracking
```bash
# 1. Trigger a test error
# Add this to any page temporarily:
throw new Error('Test error for Sentry')

# 2. Verify error appears in Sentry dashboard
# 3. Remove test error
```

---

## 📊 SUCCESS CRITERIA

Phase 0 is complete when:

- ✅ Database backup script runs successfully
- ✅ Backup can be restored without errors
- ✅ Staging environment is configured and running
- ✅ Staging uses separate database from production
- ✅ Error tracking is active and capturing errors
- ✅ Testing tools are installed and configured
- ✅ Project timeline is documented
- ✅ Rollback procedures are documented
- ✅ All team members have access to staging
- ✅ Production credentials are secured
- ✅ Git tags created for current version

---

## 🚨 IMPORTANT NOTES

### Security Reminders
1. **NEVER** commit `.env` files to Git
2. **ALWAYS** use different credentials for staging/production
3. **ALWAYS** use Razorpay TEST mode in staging
4. **BACKUP** production before any major changes
5. **TEST** everything in staging first

### Common Issues

#### Issue: mongodump not found
**Solution:** Install MongoDB Database Tools
- Windows: https://www.mongodb.com/try/download/database-tools
- Mac: `brew install mongodb-database-tools`
- Linux: `sudo apt-get install mongodb-database-tools`

#### Issue: Cannot connect to staging database
**Solution:**
1. Verify MongoDB URI is correct
2. Check IP whitelist in MongoDB Atlas
3. Verify network connectivity

#### Issue: Razorpay test mode not working
**Solution:**
1. Use `rzp_test_` prefix keys (not `rzp_live_`)
2. Verify keys in Razorpay dashboard (Test Mode)
3. Check CORS settings

---

## 📞 SUPPORT

If you encounter issues during Phase 0 setup:

1. Check the troubleshooting section above
2. Review logs in `logs/` directory
3. Check Sentry for error details
4. Contact: anuragsingh@baithakaghar.com

---

## 📝 NEXT STEPS

Once Phase 0 is complete:

1. **Review** this document with the team
2. **Verify** all checklist items are complete
3. **Test** backup and restore procedures
4. **Document** any custom configurations
5. **Proceed** to Phase 1: Database Schema Updates

---

**Last Updated:** December 16, 2025
**Document Owner:** Development Team
**Version:** 1.0
