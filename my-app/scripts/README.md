# Scripts Directory

Organized utility scripts for database management, deployment, testing, and development tasks.

## 📁 Directory Structure

```
scripts/
├── database/               # Database-related scripts
│   ├── backups/           # Backup and restore scripts
│   ├── migrations/        # Database schema migrations
│   ├── seeds/             # Data seeding scripts
│   └── maintenance/       # Database maintenance utilities
├── deployment/            # Deployment preparation scripts
├── setup/                 # Initial setup and configuration
├── testing/               # Testing utilities
├── development/           # Development helper scripts
└── archived/              # One-time or deprecated scripts
```

## 🗂️ Script Categories

### Database Scripts (`database/`)

#### Backups (`database/backups/`)
- **`backup-database.cjs`** - Create MongoDB database backups
- **`restore-database.cjs`** - Restore from backup files
- **npm commands:**
  ```bash
  npm run backup:db    # Create backup
  npm run restore:db   # Restore from backup
  ```

#### Migrations (`database/migrations/`)
- **`phase1-database-schema.cjs`** - Phase 1 schema migration
- **`migrate-pricing-data.js`** - Migrate pricing data structure
- **`asset-import-utility.ts`** - Import assets utility
- **`room-data-migration.ts`** - Room data migration
- **npm commands:**
  ```bash
  npm run phase1:migrate    # Run phase 1 migration
  npm run migrate:pricing   # Migrate pricing data
  ```

#### Seeds (`database/seeds/`)
- **`seed-amenities.cjs`** - Seed amenities data
- **`seed-plan-types.cjs`** - Seed plan types
- **`seed-sample-events.js`** - Seed sample events

#### Maintenance (`database/maintenance/`)
- **`check-database-connection.js`** - Test DB connection
- **`check-mongodb.js`** - MongoDB health check
- **`cleanup-database.js`** - Clean up database
- **`cleanup-and-migrate-db.js`** - Clean and migrate
- **`delete-properties-only.js`** - Delete all properties
- **`update-city-counts.js`** - Update city property counts
- **`fix-city-counts.js`** - Fix city count inconsistencies
- **`check-property-counts.js`** - Verify property counts
- **`initialize-travel-picks.js`** - Initialize travel picks
- **`update-travel-picks.js`** - Update travel picks
- **`add-search-indexes.cjs`** - Add search indexes
- **`create-performance-indexes.cjs`** - Create performance indexes
- **`add-indexes.cjs`** - Add database indexes
- **npm commands:**
  ```bash
  npm run check-db              # Check DB connection
  npm run cleanup-db            # Clean database
  npm run delete-properties     # Delete all properties
  npm run update-city-counts    # Update city counts
  npm run fix-city-counts       # Fix city counts
  npm run init-travel-picks     # Initialize travel picks
  npm run update-travel-picks   # Update travel picks
  ```

### Deployment Scripts (`deployment/`)
- **`deploy-readiness.js`** - Check deployment readiness
- **`prepare-for-vercel.js`** - Prepare for Vercel deployment
- **npm commands:**
  ```bash
  npm run deploy:check      # Check deployment readiness
  npm run deploy:clean-db   # Clean database for deployment
  npm run deploy:prepare    # Full deployment preparation
  npm run prepare:vercel    # Prepare for Vercel
  ```

### Setup Scripts (`setup/`)
- **`setup-super-admin.ts`** - Create super admin user
- **`verify-phase0-setup.cjs`** - Verify Phase 0 setup
- **`setup-influencer-system.js`** - Setup influencer system
- **npm commands:**
  ```bash
  npm run setup:admin       # Create super admin
  npm run phase0:verify     # Verify Phase 0 setup
  ```

### Testing Scripts (`testing/`)
- **`test-pricing-system.js`** - Test pricing calculations
- **`test-review-api.cjs`** - Test review API
- **`create-test-owner.cjs`** - Create test owner account
- **npm commands:**
  ```bash
  npm run test:pricing      # Test pricing system
  ```

### Development Scripts (`development/`)
- **`clean-console-logs.js`** - Remove console.log statements
- **`fix-server-only-imports.js`** - Fix server-only imports
- **`validate-models.js`** - Validate database models
- **`start-dev.js`** - Development server helper
- **npm commands:**
  ```bash
  npm run fix:server-only   # Fix server-only imports
  ```

### Archived Scripts (`archived/`)
One-time or deprecated scripts kept for reference:
- `add-plan-pricing-to-existing-properties.cjs`
- `backup-and-reset-pricing.cjs`
- `check-availability.cjs`
- `check-reviews.cjs`
- `enable-meal-pricing.cjs`
- `initialize-property-pricing.cjs`
- `update-all-properties-defaults.cjs`
- `update-nexus-green-price.cjs`

## 🚀 Quick Reference

### Common Commands

```bash
# Database Management
npm run backup:db              # Backup database
npm run restore:db             # Restore from backup
npm run check-db               # Check connection
npm run cleanup-db             # Clean database

# Deployment
npm run deploy:prepare         # Full deployment prep
npm run deploy:check           # Check readiness

# Setup
npm run setup:admin            # Create admin user
npm run phase0:verify          # Verify setup

# Maintenance
npm run update-city-counts     # Update city counts
npm run init-travel-picks      # Initialize travel picks
npm run update-travel-picks    # Update travel picks
```

## 📝 Usage Guidelines

### Before Running Scripts

1. **Backup First:** Always create a backup before running maintenance scripts
   ```bash
   npm run backup:db
   ```

2. **Check Environment:** Ensure `.env.local` is properly configured

3. **Review Script:** Read the script to understand what it does

4. **Test on Staging:** Test destructive operations on staging first

### Running Scripts Directly

You can also run scripts directly with node:
```bash
node scripts/database/backups/backup-database.cjs
```

### Script File Extensions

- **`.js`** - ES Module JavaScript files
- **`.cjs`** - CommonJS JavaScript files
- **`.ts`** - TypeScript files (use ts-node)

## ⚠️ Important Notes

### Destructive Scripts

These scripts modify or delete data. **Always backup first!**
- `cleanup-database.js`
- `delete-properties-only.js`
- `cleanup-and-migrate-db.js`

### Production Usage

Before running in production:
1. ✅ Test on staging environment
2. ✅ Create database backup
3. ✅ Review script changes
4. ✅ Have rollback plan ready

## 🔧 Maintenance

### Adding New Scripts

1. Place script in appropriate category directory
2. Add npm script to `package.json` if needed
3. Update this README
4. Test the script thoroughly

### Script Organization Rules

- **Setup:** One-time configuration scripts
- **Database/Migrations:** Schema changes
- **Database/Seeds:** Data population
- **Database/Maintenance:** Regular maintenance
- **Database/Backups:** Backup and restore
- **Deployment:** Deployment preparation
- **Testing:** Test utilities
- **Development:** Development helpers
- **Archived:** Deprecated or one-time scripts

## 📚 Additional Resources

- [Main README](../README.md) - Project overview
- [Database Documentation](../docs/database/) - Database schema
- [Deployment Guide](../docs/guides/PRODUCTION-READINESS-CHECKLIST.md) - Deployment checklist

---

**Last Updated:** December 26, 2025
**Maintained by:** Baithaka GHAR Development Team
