/**
 * Database Backup Script for Baithaka Ghar
 * Creates a complete backup of MongoDB database before major changes
 *
 * Usage:
 *   node scripts/backup/backup-database.js
 *
 * Environment Variables Required:
 *   MONGODB_URI - Production database connection string
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const BACKUP_NAME = `baithaka-backup-${TIMESTAMP}`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

// MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createBackupDirectory() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      log(`✓ Created backup directory: ${BACKUP_DIR}`, 'green');
    } else {
      log(`✓ Backup directory exists: ${BACKUP_DIR}`, 'green');
    }
    return true;
  } catch (error) {
    log(`✗ Error creating backup directory: ${error.message}`, 'red');
    return false;
  }
}

async function backupDatabase() {
  return new Promise((resolve, reject) => {
    if (!MONGODB_URI) {
      reject(new Error('MONGODB_URI environment variable is not set'));
      return;
    }

    log('\n📦 Starting database backup...', 'blue');
    log(`   Backup name: ${BACKUP_NAME}`, 'blue');
    log(`   Backup path: ${BACKUP_PATH}`, 'blue');

    // Extract database name from URI
    const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'baithaka';

    log(`   Database: ${dbName}`, 'blue');
    log('\n⏳ This may take a few minutes...', 'yellow');

    // mongodump command
    const command = `mongodump --uri="${MONGODB_URI}" --out="${BACKUP_PATH}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`\n✗ Backup failed: ${error.message}`, 'red');
        if (stderr) log(`   Error details: ${stderr}`, 'red');
        reject(error);
        return;
      }

      log('\n✓ Database backup completed successfully!', 'green');

      // Get backup size
      try {
        const stats = getDirectorySize(BACKUP_PATH);
        log(`   Backup size: ${formatBytes(stats)}`, 'green');
        log(`   Location: ${BACKUP_PATH}`, 'green');
      } catch (err) {
        log(`   Location: ${BACKUP_PATH}`, 'green');
      }

      resolve(BACKUP_PATH);
    });
  });
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }

  calculateSize(dirPath);
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function createBackupMetadata(backupPath) {
  const metadata = {
    timestamp: new Date().toISOString(),
    backupName: BACKUP_NAME,
    backupPath: backupPath,
    mongodbUri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
    nodeVersion: process.version,
    platform: process.platform,
    purpose: 'Pre-migration backup for Owner System implementation'
  };

  const metadataPath = path.join(backupPath, 'backup-metadata.json');

  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    log(`   Metadata saved: ${metadataPath}`, 'green');
  } catch (error) {
    log(`   Warning: Could not save metadata: ${error.message}`, 'yellow');
  }
}

async function listRecentBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return;
    }

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(name => name.startsWith('baithaka-backup-'))
      .map(name => {
        const fullPath = path.join(BACKUP_DIR, name);
        const stats = fs.statSync(fullPath);
        return {
          name,
          date: stats.mtime,
          size: getDirectorySize(fullPath)
        };
      })
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    if (backups.length > 0) {
      log('\n📋 Recent backups:', 'blue');
      backups.forEach((backup, index) => {
        log(`   ${index + 1}. ${backup.name}`, 'blue');
        log(`      Date: ${backup.date.toLocaleString()}`, 'blue');
        log(`      Size: ${formatBytes(backup.size)}`, 'blue');
      });
    }
  } catch (error) {
    log(`   Warning: Could not list backups: ${error.message}`, 'yellow');
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║         BAITHAKA GHAR - DATABASE BACKUP UTILITY            ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  try {
    // Step 1: Create backup directory
    const dirCreated = await createBackupDirectory();
    if (!dirCreated) {
      process.exit(1);
    }

    // Step 2: Perform backup
    const backupPath = await backupDatabase();

    // Step 3: Create metadata
    await createBackupMetadata(backupPath);

    // Step 4: List recent backups
    await listRecentBackups();

    log('\n╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                   BACKUP COMPLETED ✓                       ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝\n', 'green');

    log('⚠️  IMPORTANT NOTES:', 'yellow');
    log('   1. Keep this backup safe - it\'s your rollback point', 'yellow');
    log('   2. Test the backup integrity before proceeding', 'yellow');
    log('   3. Store a copy in a separate location', 'yellow');
    log('\n📝 Next step: Test backup restoration with:', 'blue');
    log(`   node scripts/backup/restore-database.js ${BACKUP_NAME}\n`, 'blue');

    process.exit(0);
  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                    BACKUP FAILED ✗                         ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝\n', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.message.includes('mongodump')) {
      log('\n💡 Solution: Install MongoDB Database Tools:', 'yellow');
      log('   https://www.mongodb.com/try/download/database-tools', 'yellow');
    }

    process.exit(1);
  }
}

// Run the backup
main();
