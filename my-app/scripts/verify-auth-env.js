#!/usr/bin/env node

/**
 * Authentication Environment Variables Verification Script
 *
 * This script checks that all required environment variables for authentication
 * and admin access are properly set in both development and production environments.
 *
 * Run this script before deployment to ensure your authentication will work properly.
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables
dotenv.config({ path: path.join(rootDir, ".env.local") });

// Define required environment variables for auth
const requiredAuthVars = [
  {
    name: "NEXTAUTH_URL",
    description: "The base URL of your website",
    prod: true,
  },
  {
    name: "NEXTAUTH_SECRET",
    description: "Secret key for JWT encryption",
    prod: true,
  },
  { name: "MONGODB_URI", description: "MongoDB connection string", prod: true },
  {
    name: "GOOGLE_CLIENT_ID",
    description: "Google OAuth client ID",
    prod: false,
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    description: "Google OAuth client secret",
    prod: false,
  },
];

// Constants for pretty printing
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

// Function to check environment variables
function checkEnvVars() {
  console.log(
    `${CYAN}Checking authentication environment variables...${RESET}\n`
  );

  const missingVars = [];
  const presentVars = [];

  // Check each required variable
  requiredAuthVars.forEach((variable) => {
    const value = process.env[variable.name];

    if (!value) {
      missingVars.push(variable);
    } else {
      // Simple validation for some variables
      let isValid = true;
      let validationMessage = "";

      if (variable.name === "NEXTAUTH_URL") {
        try {
          const url = new URL(value);
          if (!url.protocol || !url.host) {
            isValid = false;
            validationMessage = "Invalid URL format";
          }
        } catch (e) {
          isValid = false;
          validationMessage = "Invalid URL format";
        }
      }

      if (variable.name === "NEXTAUTH_SECRET" && value.length < 32) {
        isValid = false;
        validationMessage =
          "Secret should be at least 32 characters long for security";
      }

      presentVars.push({
        ...variable,
        isValid,
        validationMessage,
        value:
          variable.name.includes("SECRET") || variable.name.includes("KEY")
            ? value.substring(0, 3) + "..." + value.substring(value.length - 3)
            : value,
      });
    }
  });

  // Print results
  if (missingVars.length > 0) {
    console.log(`${RED}Missing required environment variables:${RESET}`);
    missingVars.forEach((variable) => {
      console.log(
        `  - ${variable.name}: ${variable.description}${
          variable.prod ? " (required for production)" : ""
        }`
      );
    });
    console.log();
  }

  if (presentVars.length > 0) {
    console.log(`${GREEN}Found environment variables:${RESET}`);
    presentVars.forEach((variable) => {
      if (variable.isValid) {
        console.log(`  - ${variable.name}: ${variable.value}`);
      } else {
        console.log(
          `  - ${variable.name}: ${variable.value} ${YELLOW}(Warning: ${variable.validationMessage})${RESET}`
        );
      }
    });
    console.log();
  }

  // Check VERCEL_ specific variables if in Vercel environment
  if (process.env.VERCEL) {
    console.log(
      `${CYAN}Detected Vercel environment. Checking Vercel-specific variables:${RESET}`
    );

    const vercelVars = ["VERCEL_URL", "VERCEL_ENV", "VERCEL_REGION"];

    vercelVars.forEach((varName) => {
      console.log(`  - ${varName}: ${process.env[varName] || "(not set)"}`);
    });

    // Check if NEXTAUTH_URL is properly set for Vercel
    if (process.env.VERCEL_URL && process.env.NEXTAUTH_URL) {
      const vercelUrlHttps = `https://${process.env.VERCEL_URL}`;

      if (!process.env.NEXTAUTH_URL.includes(process.env.VERCEL_URL)) {
        console.log(
          `${YELLOW}Warning: NEXTAUTH_URL (${process.env.NEXTAUTH_URL}) doesn't match VERCEL_URL (${vercelUrlHttps})${RESET}`
        );
        console.log(`Consider setting NEXTAUTH_URL to: ${vercelUrlHttps}`);
      }
    }

    console.log();
  }

  // Summary
  const allRequiredVarsPresent = missingVars.length === 0;
  const allVarsValid = presentVars.every((v) => v.isValid);

  if (allRequiredVarsPresent && allVarsValid) {
    console.log(
      `${GREEN}✓ All required environment variables for authentication are properly set.${RESET}`
    );
  } else if (allRequiredVarsPresent) {
    console.log(
      `${YELLOW}⚠ All required variables are present, but some may have invalid values.${RESET}`
    );
  } else {
    console.log(
      `${RED}✗ Some required environment variables are missing.${RESET}`
    );

    // Write instructions to fix
    console.log("\nTo fix these issues:");
    console.log(
      "1. Create or update your .env.local file with the missing variables"
    );
    console.log(
      "2. Make sure to set these environment variables in your deployment platform"
    );
    console.log(
      "3. For Vercel deployment, set these in the Environment Variables section of your project settings"
    );

    if (missingVars.some((v) => v.prod)) {
      console.log(
        `\n${RED}Warning: Missing variables required for production will cause authentication to fail when deployed.${RESET}`
      );
    }
  }
}

// Run the check
checkEnvVars();
