// Automated script to clean console.log/warn/info/debug from API routes
// Keeps console.error for production debugging

const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', '..');
const apiPath = path.join(basePath, 'app', 'api');

// Stats tracking
let stats = {
  filesProcessed: 0,
  filesChanged: 0,
  statementsRemoved: 0,
  errors: 0
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function cleanFile(filePath) {
  try {
    const relativePath = path.relative(basePath, filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Count console statements before removal
    const consoleLogMatches = content.match(/console\.(log|warn|info|debug)\s*\(/g) || [];
    const beforeCount = consoleLogMatches.length;

    if (beforeCount === 0) {
      return; // Nothing to clean
    }

    // Remove console.log/warn/info/debug but keep console.error
    // Pattern 1: Standalone console statements (full line)
    content = content.replace(/^\s*console\.(log|warn|info|debug)\([^)]*\);?\s*\n/gm, '');

    // Pattern 2: Inline console statements
    content = content.replace(/console\.(log|warn|info|debug)\([^)]*\);?\s*/g, '');

    // Clean up excessive blank lines (more than 2 consecutive)
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesChanged++;
      stats.statementsRemoved += beforeCount;
      console.log(`✅ ${relativePath} - Removed ${beforeCount} statements`);
    }

    stats.filesProcessed++;

  } catch (error) {
    stats.errors++;
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Starting API Routes Console Cleanup\n');
  console.log(`📂 Scanning: ${apiPath}\n`);

  // Find all TypeScript and JavaScript files in app/api
  const files = getAllFiles(apiPath);

  console.log(`Found ${files.length} files to process\n`);

  // Process each file
  for (const file of files) {
    cleanFile(file);
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary');
  console.log('='.repeat(50));
  console.log(`Files scanned:          ${stats.filesProcessed}`);
  console.log(`Files modified:         ${stats.filesChanged}`);
  console.log(`Statements removed:     ${stats.statementsRemoved}`);
  console.log(`Errors:                 ${stats.errors}`);
  console.log('='.repeat(50));

  if (stats.errors === 0 && stats.filesChanged > 0) {
    console.log('\n✨ API routes cleaned successfully!');
    console.log('⚠️  Remember to test the application thoroughly.');
  } else if (stats.filesChanged === 0) {
    console.log('\n✅ No console statements found to remove.');
  }
}

main();
