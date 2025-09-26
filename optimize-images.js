#!/usr/bin/env node

/**
 * Image optimization script for Kit World Sports website
 * Converts images to modern formats and creates responsive variants
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const imagesDir = "./assets/images";
const outputDir = "./dist/assets/images";

console.log("🖼️  Optimizing images...\n");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process all images
async function processImages() {
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    if (
      file.endsWith(".JPG") ||
      file.endsWith(".JPEG") ||
      file.endsWith(".PNG")
    ) {
      const inputPath = path.join(imagesDir, file);
      const baseName = path.parse(file).name;

      try {
        // Create WebP version
        const webpPath = path.join(outputDir, `${baseName}.webp`);
        await sharp(inputPath).webp({ quality: 80 }).toFile(webpPath);

        // Create AVIF version
        const avifPath = path.join(outputDir, `${baseName}.avif`);
        await sharp(inputPath).avif({ quality: 80 }).toFile(avifPath);

        // Create responsive versions
        const sizes = [400, 800, 1200, 1600];
        for (const size of sizes) {
          const resizedPath = path.join(outputDir, `${baseName}-${size}.webp`);
          await sharp(inputPath)
            .resize(size)
            .webp({ quality: 80 })
            .toFile(resizedPath);
        }

        console.log(`✅ Optimized: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to optimize ${file}:`, error.message);
      }
    }
  }
}

// Run image optimization
processImages()
  .then(() => {
    console.log("\n🎉 Image optimization completed!");
    console.log("💡 Generated WebP and AVIF formats for better performance");
  })
  .catch((error) => {
    console.error("❌ Image optimization failed:", error);
    process.exit(1);
  });
