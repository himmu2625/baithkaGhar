/**
 * Script to check for case-sensitivity issues in import paths
 *
 * This script helps identify potential file path case-sensitivity issues
 * that can cause build failures, especially when deploying to case-sensitive
 * environments like Linux servers.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.join(__dirname, "..");
const excludeDirs = ["node_modules", ".next", ".git", "public"];
const extensions = [".js", ".jsx", ".ts", ".tsx"];

// Models to check (add the actual filenames with correct case)
const models = {
  Property: "@/models/Property",
  User: "@/models/User",
  Booking: "@/models/Booking",
  Review: "@/models/Review",
  Favorite: "@/models/Favorite",
  HostAnalytics: "@/models/HostAnalytics",
  AdminRequest: "@/models/AdminRequest",
  Report: "@/models/Report",
  Activity: "@/models/Activity",
  Otp: "@/models/Otp",
  SearchQuery: "@/models/SearchQuery",
  Payment: "@/models/Payment",
  city: "@/models/city",
};

// Track issues found
const issues = [];

/**
 * Check a file for case-sensitivity issues in imports
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const fileExt = path.extname(filePath);

    // Only process JavaScript/TypeScript files
    if (!extensions.includes(fileExt)) {
      return;
    }

    // Check each model import
    Object.entries(models).forEach(([modelName, correctPath]) => {
      // Create a regex to find imports with wrong case
      // This looks for import statements with the model name but wrong path case
      const wrongCasePattern = new RegExp(
        `import\\s+(?:(?:{[^}]*}|\\w+)\\s+from\\s+["'])@/models/${modelName}\\b["']`,
        "i"
      );

      if (wrongCasePattern.test(content)) {
        // Check if the import path exactly matches the correct case
        const correctImportPattern = new RegExp(
          `import\\s+(?:(?:{[^}]*}|\\w+)\\s+from\\s+["'])${correctPath}["']`
        );

        if (!correctImportPattern.test(content)) {
          // This is a case-sensitivity issue
          issues.push({
            file: path.relative(rootDir, filePath),
            model: modelName,
            correctPath: correctPath,
            line: findLineNumber(content, modelName),
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

/**
 * Find the line number for an import statement
 */
function findLineNumber(content, modelName) {
  const lines = content.split("\n");
  const lineNum = lines.findIndex(
    (line) =>
      line.includes("import") &&
      line.includes(modelName) &&
      line.includes("@/models/")
  );

  return lineNum !== -1 ? lineNum + 1 : "unknown";
}

/**
 * Process a directory recursively
 */
function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          processDirectory(fullPath);
        }
      } else {
        checkFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log("Checking for case-sensitivity issues in import paths...");

  // Process the entire project
  processDirectory(rootDir);

  // Report findings
  if (issues.length === 0) {
    console.log("✅ No case-sensitivity issues found!");
  } else {
    console.log(
      `⚠️ Found ${issues.length} case-sensitivity issues that could cause build failures:`
    );
    console.log("\nIssues found:");

    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. File: ${issue.file}`);
      console.log(`   Line: ${issue.line}`);
      console.log(`   Model: ${issue.model}`);
      console.log(`   Correct path: ${issue.correctPath}`);
    });

    console.log(
      "\nThese issues can cause build failures, especially when deploying to case-sensitive environments."
    );
    console.log("Please fix these imports to use the correct case.");
  }
}

// Run the script
main();
