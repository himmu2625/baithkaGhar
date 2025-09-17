#!/usr/bin/env node

/**
 * 🚀 Quick Test Environment Setup
 *
 * One-command setup for complete OS testing environment
 */

const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (s) => s, blue: (s) => s, yellow: (s) => s, red: (s) => s, bold: (s) => s };

console.log(chalk.bold.blue('\n🚀 BAITHAKA GHAR OS - QUICK TEST SETUP\n'));
console.log('Setting up complete testing environment...\n');

try {
  // Step 1: Create mock property
  console.log(chalk.yellow('📋 Step 1: Creating mock property and test data...'));
  execSync('npm run setup:mock-property', { stdio: 'inherit' });

  console.log(chalk.green('\n✅ TEST ENVIRONMENT READY!\n'));

  console.log(chalk.bold('🎯 QUICK ACCESS CREDENTIALS:'));
  console.log(chalk.blue('Admin: dev-admin@test.com | DevTest@123'));
  console.log(chalk.blue('Manager: test-manager@test.com | TestManager@123'));
  console.log(chalk.blue('Staff: demo-staff@test.com | DemoStaff@123\n'));

  console.log(chalk.bold('📖 Next Steps:'));
  console.log('1. Start development server: npm run dev');
  console.log('2. Login with any test credentials above');
  console.log('3. Use the Property ID shown above in URLs');
  console.log('4. Read TESTING_ENVIRONMENT.md for detailed guide\n');

  console.log(chalk.green('🎉 Happy Testing!\n'));

} catch (error) {
  console.error(chalk.red('\n❌ Setup failed:'), error.message);
  console.log(chalk.yellow('\n🔧 Try running manually:'));
  console.log('npm run setup:mock-property\n');
  process.exit(1);
}