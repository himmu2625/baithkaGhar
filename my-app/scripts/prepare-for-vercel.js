/**
 * Prepare for Vercel Deployment Script
 *
 * This script cleans up unnecessary files and prepares the project for Vercel deployment.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Files and directories to be removed (relative to project root)
const toRemove = [
  // Test and debug files
  "app/test-property-status",
  "app/api-test",
  "app/api/debug-submit",
  "app/api/admin/debug-auth",
  "app/complete-profile-alt",
  "app/examples",

  // Unnecessary scripts
  "scripts/verify-cities.js",
  "scripts/check-cities.js",
  "scripts/check-case-sensitivity.js",
  "scripts/importUsersFromJSON.js",
  "scripts/exportLocalUsers.js",
  "scripts/fix-exports.js",
  "scripts/build-dev.js",
  "scripts/verify-auth-env.js",

  // Keep these scripts but move them to a backup folder
  // 'scripts/cleanup-database.js',
  // 'scripts/deploy-readiness.js',
  // 'scripts/update-city-counts.js',
  // 'scripts/check-mongodb.js',
  // 'scripts/setup-super-admin.ts',
];

// Create backups directory
const backupDir = path.join(rootDir, "scripts-backup");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log("Created backup directory:", backupDir);
}

// Scripts to be backed up (but not deleted)
const toBackup = [
  "scripts/cleanup-database.js",
  "scripts/deploy-readiness.js",
  "scripts/update-city-counts.js",
  "scripts/check-mongodb.js",
  "scripts/setup-super-admin.ts",
];

// Create .vercelignore file
const vercelIgnoreContent = `
# Development files
.env.local
.env.development
.env.development.local
.vercel
.vscode/
scripts-backup/
coverage/
jest.config.js
jest.setup.js
__tests__/
*.test.js
*.test.ts
*.test.tsx
*.spec.js
*.spec.ts
*.spec.tsx

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
*.swp
*.swo
`;

// Write .vercelignore file
fs.writeFileSync(path.join(rootDir, ".vercelignore"), vercelIgnoreContent);
console.log("Created .vercelignore file");

// Function to safely delete a file or directory
function safeRemove(target) {
  const fullPath = path.join(rootDir, target);

  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Remove directory recursively
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${target}`);
      } else {
        // Remove file
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed file: ${target}`);
      }
    } else {
      console.log(`⚠️ File/directory does not exist: ${target}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${target}:`, error.message);
  }
}

// Function to backup a file
function backupFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, fileName);

  try {
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, backupPath);
      console.log(`📋 Backed up file: ${filePath} to scripts-backup/`);
    } else {
      console.log(`⚠️ File does not exist for backup: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error backing up ${filePath}:`, error.message);
  }
}

// Create vercel.json file with optimizations
const vercelJsonContent = {
  version: 2,
  buildCommand: "next build",
  outputDirectory: ".next",
  github: {
    silent: true,
  },
  headers: [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
      ],
    },
    {
      source: "/api/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, max-age=0",
        },
      ],
    },
    {
      source: "/_next/static/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/images/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400",
        },
      ],
    },
  ],
};

// Write vercel.json
fs.writeFileSync(
  path.join(rootDir, "vercel.json"),
  JSON.stringify(vercelJsonContent, null, 2)
);
console.log("Created vercel.json with optimized caching and security headers");

// Backup important files
console.log("\n📋 Backing up important files before removal...");
toBackup.forEach(backupFile);

// Remove unnecessary files
console.log("\n🗑️ Removing unnecessary files and directories...");
toRemove.forEach(safeRemove);

// Additional project optimizations
console.log("\n🔧 Performing additional project optimizations...");

// Update package.json to include Vercel-specific build commands
try {
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Add Vercel-specific scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "vercel-build": "next build",
    postinstall: "next build", // Ensures build runs on deployment
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log("✅ Updated package.json with Vercel-specific build commands");
} catch (error) {
  console.error("❌ Error updating package.json:", error.message);
}

console.log("\n✨ Project preparation for Vercel deployment completed!");
console.log("\nNext steps:");
console.log('1. Run "npm run build" to verify the build works correctly');
console.log(
  "2. Make sure you have the following environment variables set in your Vercel project:"
);
console.log("   - MONGODB_URI");
console.log("   - NEXTAUTH_SECRET");
console.log("   - NEXTAUTH_URL");
console.log("   - CLOUDINARY_CLOUD_NAME");
console.log("   - CLOUDINARY_API_KEY");
console.log("   - CLOUDINARY_API_SECRET");
console.log("3. Deploy to Vercel using the Vercel CLI or GitHub integration");
