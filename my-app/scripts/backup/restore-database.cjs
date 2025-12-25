/**
 * Database Restore Script for Baithaka Ghar
 * Restores MongoDB database from a backup
 *
 * Usage:
 *   node scripts/backup/restore-database.js [backup-name]
 *   node scripts/backup/restore-database.js baithaka-backup-2025-12-16
 *
 * Environment Variables Required:
 *   MONGODB_URI - Target database connection string
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const BACKUP_NAME = process.argv[2];

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

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function validateBackup(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  // Check for metadata
  const metadataPath = path.join(backupPath, 'backup-metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    log('\n📋 Backup Information:', 'blue');
    log(`   Created: ${new Date(metadata.timestamp).toLocaleString()}`, 'blue');
    log(`   Purpose: ${metadata.purpose}`, 'blue');
    log(`   Node version: ${metadata.nodeVersion}`, 'blue');
  }

  return true;
}

async function listAvailableBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log('No backups found.', 'yellow');
    return [];
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('baithaka-backup-'))
    .map(name => {
      const fullPath = path.join(BACKUP_DIR, name);
      const stats = fs.statSync(fullPath);
      return {
        name,
        date: stats.mtime,
        path: fullPath
      };
    })
    .sort((a, b) => b.date - a.date);

  return backups;
}

async function restoreDatabase(backupPath) {
  return new Promise((resolve, reject) => {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      reject(new Error('MONGODB_URI environment variable is not set'));
      return;
    }

    log('\n📦 Starting database restore...', 'blue');
    log(`   Backup: ${BACKUP_NAME}`, 'blue');
    log(`   Source: ${backupPath}`, 'blue');
    log('\n⏳ This may take a few minutes...', 'yellow');

    // mongorestore command with --drop flag to replace existing data
    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${backupPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`\n✗ Restore failed: ${error.message}`, 'red');
        if (stderr) log(`   Error details: ${stderr}`, 'red');
        reject(error);
        return;
      }

      log('\n✓ Database restore completed successfully!', 'green');
      resolve();
    });
  });
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║        BAITHAKA GHAR - DATABASE RESTORE UTILITY            ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  try {
    // If no backup name provided, list available backups
    if (!BACKUP_NAME) {
      log('❌ Error: No backup name provided\n', 'red');
      log('Available backups:', 'blue');

      const backups = await listAvailableBackups();
      if (backups.length === 0) {
        log('   No backups found in backups directory', 'yellow');
        process.exit(1);
      }

      backups.forEach((backup, index) => {
        log(`   ${index + 1}. ${backup.name}`, 'blue');
        log(`      Date: ${backup.date.toLocaleString()}`, 'blue');
      });

      log('\nUsage:', 'yellow');
      log('   node scripts/backup/restore-database.js [backup-name]', 'yellow');
      log('\nExample:', 'yellow');
      log(`   node scripts/backup/restore-database.js ${backups[0].name}\n`, 'yellow');

      process.exit(1);
    }

    const backupPath = path.join(BACKUP_DIR, BACKUP_NAME);

    // Validate backup exists
    await validateBackup(backupPath);

    // Warning prompt
    log('\n⚠️  WARNING: This will replace ALL data in the target database!', 'yellow');
    log('   Make sure you have a backup of the current database state.', 'yellow');

    const answer = await askQuestion('\n❓ Are you sure you want to proceed? (yes/no): ');

    if (answer !== 'yes') {
      log('\n❌ Restore cancelled by user.', 'yellow');
      process.exit(0);
    }

    // Perform restore
    await restoreDatabase(backupPath);

    log('\n╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                  RESTORE COMPLETED ✓                       ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝\n', 'green');

    log('✅ Database has been restored successfully!', 'green');
    log('   Please verify that all data is intact.\n', 'yellow');

    process.exit(0);
  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                   RESTORE FAILED ✗                         ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝\n', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.message.includes('mongorestore')) {
      log('\n💡 Solution: Install MongoDB Database Tools:', 'yellow');
      log('   https://www.mongodb.com/try/download/database-tools', 'yellow');
    }

    process.exit(1);
  }
}

// Run the restore
main();
