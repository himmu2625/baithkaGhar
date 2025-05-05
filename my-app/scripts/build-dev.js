#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Set environment variables to disable static generation
process.env.NEXT_DISABLE_STATIC_GENERATION = "true";
process.env.NEXT_MINIMAL_BUILD = "true";
process.env.NEXT_PUBLIC_DISABLE_SSG = "true";

// Run the Next.js build command with the environment variables
const buildProcess = spawn("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_DISABLE_STATIC_GENERATION: "true",
    NEXT_MINIMAL_BUILD: "true",
    NEXT_PUBLIC_DISABLE_SSG: "true",
  },
  cwd: rootDir,
});

buildProcess.on("close", (code) => {
  if (code !== 0) {
    console.error(`Build process exited with code ${code}`);
    process.exit(code);
  }
  console.log("Build completed successfully without static generation");
});
