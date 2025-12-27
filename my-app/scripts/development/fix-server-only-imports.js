/**
 * Script to fix server-only imports for Vercel compatibility
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process
const filesToFix = [
  "services/cityService.ts",
  "lib/services/sms.ts",
  "lib/services/email.ts",
  "lib/auth/otp.ts",
  "app/api/auth/[...nextauth]/route.ts",
  "app/api/auth/otp/verify/route.ts",
  "app/api/auth/otp/send/route.ts",
];

// Function to fix server-only imports
function fixServerOnlyImport(filePath) {
  const fullPath = path.join(__dirname, "..", filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, "utf8");

    // Replace import 'server-only'; with // import 'server-only';
    const updatedContent = content.replace(
      /import\s+['"]server-only['"];?/g,
      "// import 'server-only'; // Commented out for Vercel compatibility"
    );

    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent);
      console.log(`✅ Fixed server-only import in: ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log("🔧 Fixing server-only imports for Vercel compatibility...");
filesToFix.forEach(fixServerOnlyImport);
console.log("✨ Server-only imports fixed!");
