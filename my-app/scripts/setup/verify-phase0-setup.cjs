/**
 * Phase 0 Setup Verification Script
 * Checks if all Phase 0 requirements are met
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors
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

function checkExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✓ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - NOT INSTALLED`, 'red');
    return false;
  }
}

async function verifySetup() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║     PHASE 0 SETUP VERIFICATION                         ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  let score = 0;
  let total = 0;

  // 1. Check Required Directories
  log('📁 Checking Directories...', 'blue');
  total++;
  if (checkExists('backups', 'Backups directory exists')) score++;
  total++;
  if (checkExists('logs', 'Logs directory exists')) score++;
  total++;
  if (checkExists('scripts/backup', 'Backup scripts directory')) score++;
  total++;
  if (checkExists('docs', 'Documentation directory')) score++;
  console.log();

  // 2. Check Required Files
  log('�� Checking Files...', 'blue');
  total++;
  if (checkExists('.env.local', 'Environment configuration')) score++;
  total++;
  if (checkExists('scripts/backup/backup-database.cjs', 'Backup script')) score++;
  total++;
  if (checkExists('scripts/backup/restore-database.cjs', 'Restore script')) score++;
  total++;
  if (checkExists('docs/PHASE_0_SETUP.md', 'Phase 0 documentation')) score++;
  total++;
  if (checkExists('docs/ROLLBACK_PROCEDURES.md', 'Rollback procedures')) score++;
  total++;
  if (checkExists('docs/TESTING_CHECKLIST.md', 'Testing checklist')) score++;
  total++;
  if (checkExists('docs/PROJECT_TIMELINE.md', 'Project timeline')) score++;
  console.log();

  // 3. Check Environment Variables
  log('🔐 Checking Environment Variables...', 'blue');
  const envContent = fs.readFileSync('.env.local', 'utf-8');

  total++;
  if (envContent.includes('MONGODB_URI')) {
    log('✓ MONGODB_URI configured', 'green');
    score++;
  } else {
    log('✗ MONGODB_URI not configured', 'red');
  }

  total++;
  if (envContent.includes('NEXTAUTH_SECRET')) {
    log('✓ NEXTAUTH_SECRET configured', 'green');
    score++;
  } else {
    log('✗ NEXTAUTH_SECRET not configured', 'red');
  }

  total++;
  if (envContent.includes('RAZORPAY_KEY_ID')) {
    log('✓ Razorpay keys configured', 'green');
    score++;
  } else {
    log('✗ Razorpay keys not configured', 'red');
  }

  total++;
  if (envContent.includes('ENABLE_PARTIAL_PAYMENTS')) {
    log('✓ Feature flags configured', 'green');
    score++;
  } else {
    log('✗ Feature flags not configured', 'yellow');
  }
  console.log();

  // 4. Check MongoDB Tools
  log('🔧 Checking MongoDB Tools...', 'blue');
  total++;
  const mongoToolsInstalled = checkCommand('mongodump --version', 'mongodump installed');
  if (mongoToolsInstalled) score++;

  total++;
  const mongoRestoreInstalled = checkCommand('mongorestore --version', 'mongorestore installed');
  if (mongoRestoreInstalled) score++;
  console.log();

  // 5. Check Node Dependencies
  log('📦 Checking Node.js Setup...', 'blue');
  total++;
  if (checkExists('node_modules', 'Node modules installed')) score++;
  total++;
  if (checkExists('package.json', 'package.json exists')) score++;
  console.log();

  // 6. Calculate Score
  const percentage = Math.round((score / total) * 100);

  log('═══════════════════════════════════════════════════════', 'blue');
  log(`\n📊 SCORE: ${score}/${total} (${percentage}%)`, 'blue');

  if (percentage === 100) {
    log('\n✅ PHASE 0 COMPLETE! Ready for Phase 1!', 'green');
    log('   All requirements met.\n', 'green');
    return true;
  } else if (percentage >= 80) {
    log('\n⚠️  PHASE 0 MOSTLY COMPLETE', 'yellow');
    log('   Address missing items before proceeding to Phase 1.\n', 'yellow');

    if (!mongoToolsInstalled) {
      log('   📝 TODO: Install MongoDB Database Tools', 'yellow');
      log('      See: INSTALL_MONGO_TOOLS.md\n', 'yellow');
    }
    return false;
  } else {
    log('\n❌ PHASE 0 INCOMPLETE', 'red');
    log('   Please complete setup before proceeding.\n', 'red');
    log('   📖 See: README_PHASE0.md for instructions\n', 'red');
    return false;
  }
}

// Run verification
verifySetup()
  .then(ready => {
    if (ready) {
      console.log('🚀 Next step: npm run backup:db\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    log(`\n❌ Error during verification: ${error.message}`, 'red');
    process.exit(1);
  });
