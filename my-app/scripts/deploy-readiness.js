/**
 * Deploy Readiness Check
 *
 * This script checks if the application is ready for deployment by:
 * 1. Verifying environment variables are set
 * 2. Checking for console.log statements in production code
 * 3. Checking if database connection works
 * 4. Verifying there are no test properties with publish status
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const mongoose = require("mongoose");
const readline = require("readline");

// Required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

// Optional but recommended environment variables
const recommendedEnvVars = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
];

// Console log check patterns
const consoleLogPatterns = [
  "console.log",
  "console.error",
  "console.warn",
  "console.debug",
  "console.info",
];

// Files and directories to exclude from console.log checks
const excludePaths = [
  "node_modules",
  ".next",
  "scripts",
  ".git",
  "test",
  "tests",
  "__tests__",
  "__mocks__",
  "public",
  "debug",
  "log",
  "coverage",
  "dist",
];

// Check environment variables
function checkEnvironmentVariables() {
  console.log("\n🔍 Checking required environment variables...");
  const missing = [];
  const present = [];

  requiredEnvVars.forEach((variable) => {
    if (!process.env[variable]) {
      missing.push(variable);
    } else {
      present.push(variable);
    }
  });

  if (missing.length > 0) {
    console.log("❌ Missing required environment variables:");
    missing.forEach((variable) => console.log(`  - ${variable}`));
  } else {
    console.log("✅ All required environment variables are set.");
  }

  // Check recommended variables
  const missingRecommended = [];
  const presentRecommended = [];

  recommendedEnvVars.forEach((variable) => {
    if (!process.env[variable]) {
      missingRecommended.push(variable);
    } else {
      presentRecommended.push(variable);
    }
  });

  if (missingRecommended.length > 0) {
    console.log("\n⚠️ Missing recommended environment variables:");
    missingRecommended.forEach((variable) => console.log(`  - ${variable}`));
  }

  return { missing, present, missingRecommended, presentRecommended };
}

// Find console.log statements in production code
async function findConsoleLogs(directory) {
  console.log("\n🔍 Checking for console.log statements in production code...");

  let consoleLogCount = 0;
  let consoleLogsInFiles = {};

  // Build grep command to exclude specified directories and find console.log statements
  const excString = excludePaths.map((p) => `--exclude-dir="${p}"`).join(" ");
  const patternString = consoleLogPatterns.map((p) => `-e "${p}"`).join(" ");

  try {
    // Use grep to find console.log statements
    const cmd = `grep -r ${excString} ${patternString} --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" ${directory} || true`;
    const result = execSync(cmd, { encoding: "utf8" });

    if (result.trim()) {
      const lines = result.trim().split("\n");
      consoleLogCount = lines.length;

      // Organize console logs by file
      lines.forEach((line) => {
        const [file, ...rest] = line.split(":");
        const relativePath = path.relative(directory, file);

        if (!consoleLogsInFiles[relativePath]) {
          consoleLogsInFiles[relativePath] = [];
        }

        consoleLogsInFiles[relativePath].push(rest.join(":").trim());
      });

      console.log(
        `❌ Found ${consoleLogCount} console.log statements in production code.`
      );

      // Display at most 10 files with console.log statements
      const fileCount = Object.keys(consoleLogsInFiles).length;
      const displayCount = Math.min(10, fileCount);

      console.log(
        `\nShowing ${displayCount} of ${fileCount} files with console.log statements:`
      );
      Object.keys(consoleLogsInFiles)
        .slice(0, displayCount)
        .forEach((file) => {
          console.log(
            `\n  📄 ${file}: (${consoleLogsInFiles[file].length} statements)`
          );
          // Show at most 3 console.log statements per file
          consoleLogsInFiles[file].slice(0, 3).forEach((log, i) => {
            console.log(`    ${i + 1}. ${log}`);
          });
          if (consoleLogsInFiles[file].length > 3) {
            console.log(
              `    ... and ${consoleLogsInFiles[file].length - 3} more`
            );
          }
        });

      if (fileCount > displayCount) {
        console.log(`\n  ... and ${fileCount - displayCount} more files`);
      }
    } else {
      console.log("✅ No console.log statements found in production code.");
    }

    return { consoleLogCount, consoleLogsInFiles };
  } catch (error) {
    console.error("Error checking console.log statements:", error.message);
    return { consoleLogCount: -1, consoleLogsInFiles: {} };
  }
}

// Connect to MongoDB and check for test properties
async function checkDatabase() {
  console.log("\n🔍 Checking database connection and test properties...");

  if (!process.env.MONGODB_URI) {
    console.log("❌ MONGODB_URI environment variable is not set.");
    return { connected: false, testPropertiesCount: -1 };
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Successfully connected to MongoDB.");

    // Check for test properties
    // Define Property schema if it doesn't exist
    let Property;
    if (!mongoose.models.Property) {
      const PropertySchema = new mongoose.Schema(
        {
          title: { type: String },
          isPublished: { type: Boolean },
          status: { type: String },
          verificationStatus: { type: String },
        },
        {
          strict: false,
          collection: "properties",
        }
      );

      Property = mongoose.model("Property", PropertySchema);
    } else {
      Property = mongoose.models.Property;
    }

    // Count published properties
    const publishedCount = await Property.countDocuments({
      isPublished: true,
      status: "available",
    });

    console.log(
      `ℹ️ Found ${publishedCount} published properties in the database.`
    );

    if (publishedCount > 0) {
      console.log("⚠️ You have published properties in your database.");
      console.log(
        "   Run the cleanup script (scripts/cleanup-database.js) before deployment"
      );
      console.log("   to remove test properties from your database.");
    } else {
      console.log(
        "✅ No published properties found, which is good for a fresh deployment."
      );
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("ℹ️ Closed MongoDB connection.");

    return { connected: true, publishedPropertiesCount: publishedCount };
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    return { connected: false, publishedPropertiesCount: -1 };
  }
}

// Create deployment summary
function createDeploymentSummary(
  envCheckResult,
  consoleLogResult,
  dbCheckResult
) {
  console.log("\n📋 Deployment Readiness Summary");
  console.log("============================");

  // Environment variables check
  const envStatus = envCheckResult.missing.length === 0 ? "✅ PASS" : "❌ FAIL";
  console.log(`Environment Variables: ${envStatus}`);
  if (envCheckResult.missingRecommended.length > 0) {
    console.log(
      `  ⚠️ Warning: ${envCheckResult.missingRecommended.length} recommended env vars missing`
    );
  }

  // Console.log check
  const consoleStatus =
    consoleLogResult.consoleLogCount === 0 ? "✅ PASS" : "⚠️ WARNING";
  console.log(
    `Console.log Statements: ${consoleStatus} (${consoleLogResult.consoleLogCount} found)`
  );

  // Database check
  let dbStatus = "❓ UNKNOWN";
  if (dbCheckResult.connected) {
    dbStatus =
      dbCheckResult.publishedPropertiesCount === 0 ? "✅ PASS" : "⚠️ WARNING";
  } else {
    dbStatus = "❌ FAIL";
  }
  console.log(`Database Check: ${dbStatus}`);

  // Overall readiness
  let overallStatus = "🚫 NOT READY FOR DEPLOYMENT";

  if (
    envCheckResult.missing.length === 0 &&
    dbCheckResult.connected &&
    dbCheckResult.publishedPropertiesCount === 0
  ) {
    overallStatus = "🚀 READY FOR DEPLOYMENT";
  } else if (envCheckResult.missing.length === 0 && dbCheckResult.connected) {
    overallStatus = "⚠️ ALMOST READY - Clean up test properties first";
  }

  console.log("\nOverall Status: " + overallStatus);

  // Recommendations
  console.log("\n📝 Recommendations:");

  if (envCheckResult.missing.length > 0) {
    console.log("1. Set up the missing required environment variables.");
  }

  if (consoleLogResult.consoleLogCount > 0) {
    console.log(
      `2. Consider removing console.log statements before deployment.`
    );
  }

  if (dbCheckResult.publishedPropertiesCount > 0) {
    console.log("3. Run the cleanup script to remove test properties:");
    console.log("   node scripts/cleanup-database.js");
  }

  console.log(
    "\nRefer to DEPLOYMENT-CHECKLIST.md for complete deployment instructions."
  );
}

// Main function to run all checks
async function checkDeployReadiness() {
  console.log("🚀 DEPLOYMENT READINESS CHECK");
  console.log("============================");

  try {
    // Check environment variables
    const envCheckResult = checkEnvironmentVariables();

    // Check for console.log statements
    const consoleLogResult = await findConsoleLogs(path.join(__dirname, "../"));

    // Check database
    const dbCheckResult = await checkDatabase();

    // Create summary
    createDeploymentSummary(envCheckResult, consoleLogResult, dbCheckResult);
  } catch (error) {
    console.error("Error running deployment readiness check:", error);
  }
}

// Run the checks
checkDeployReadiness();
