// Script to remove console.log statements for production
// This is a temporary script - run once and delete

const fs = require('fs');
const path = require('path');

const filesToClean = [
  'app/booking/payment/page.tsx',
  'app/api/bookings/route.ts',
  'services/booking-service.ts',
  'lib/services/payment-service.ts'
];

const basePath = path.join(__dirname, '..');

filesToClean.forEach(file => {
  const filePath = path.join(basePath, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalLines = content.split('\n').length;

  // Remove console.log statements (but keep console.error for production debugging)
  content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
  content = content.replace(/console\.log\([^)]*\);?\s*/g, '');

  // Clean up excessive blank lines (more than 2 consecutive)
  content = content.replace(/\n\n\n+/g, '\n\n');

  const newLines = content.split('\n').length;
  const removed = originalLines - newLines;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Cleaned ${file} - Removed ~${removed} lines`);
});

console.log('\n✨ Console logs cleaned! Delete this script file.');
