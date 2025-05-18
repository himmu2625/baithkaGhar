const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Create directory if it doesn't exist
const outputDir = path.join(__dirname, "logo-versions");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define the sizes we want
const sizes = [512, 192, 64, 32, 24];

// Original logo path
const logoPath = path.join(__dirname, "Logo.png");

// Process each size
async function resizeImages() {
  for (const size of sizes) {
    try {
      await sharp(logoPath)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
        })
        .toFile(path.join(outputDir, `Logo-${size}x${size}.png`));

      console.log(`Created Logo-${size}x${size}.png`);
    } catch (err) {
      console.error(`Error creating size ${size}:`, err);
    }
  }
}

resizeImages();
