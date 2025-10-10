#!/usr/bin/env node

/**
 * Simple build script for Kit World Sports website
 * Handles HTML minification, CSS optimization, and asset copying
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

console.log("🏗️  Building Kit World Sports website...\n");

// Create dist directory
const distDir = "./dist";
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy static assets
console.log("📁 Copying assets...");
const assetsDir = "./assets";
if (fs.existsSync(assetsDir)) {
  copyDirectory(assetsDir, path.join(distDir, "assets"));
}

// Generate images manifest for dynamic catalog
console.log("🖼️  Generating images manifest...");
const distImagesDir = path.join(distDir, "assets", "images");
if (fs.existsSync(distImagesDir)) {
  const allowedExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
  ]);
  const preferenceOrder = [".webp", ".avif", ".jpg", ".jpeg", ".png"];

  // Build a map of unique images by file content hash; prefer better formats
  const hashToPick = new Map();
  const allFiles = fs.readdirSync(distImagesDir);
  for (const name of allFiles) {
    const ext = path.extname(name).toLowerCase();
    if (!allowedExtensions.has(ext)) continue;
    const filePath = path.join(distImagesDir, name);
    try {
      const buf = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha1").update(buf).digest("hex");
      const existing = hashToPick.get(hash);
      if (!existing) {
        hashToPick.set(hash, { name, ext });
      } else {
        const existingRank = preferenceOrder.indexOf(existing.ext);
        const candidateRank = preferenceOrder.indexOf(ext);
        if (
          candidateRank !== -1 &&
          (existingRank === -1 || candidateRank < existingRank)
        ) {
          hashToPick.set(hash, { name, ext });
        }
      }
    } catch (_) {
      // ignore unreadable files
    }
  }

  const pickedFiles = Array.from(hashToPick.values())
    .map((x) => x.name)
    .sort((a, b) => a.localeCompare(b));

  // Prune duplicate files from dist so only unique picks remain referenced and shipped
  const keepSet = new Set(pickedFiles);
  for (const name of allFiles) {
    const ext = path.extname(name).toLowerCase();
    if (!allowedExtensions.has(ext)) continue;
    if (!keepSet.has(name)) {
      try {
        fs.unlinkSync(path.join(distImagesDir, name));
      } catch (_) {}
    }
  }

  const imagesJsonPath = path.join(distDir, "assets", "images.json");
  const imagesPayload = {
    generatedAt: new Date().toISOString(),
    count: pickedFiles.length,
    images: pickedFiles.map((file) => {
      const title = file
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim();
      return {
        src: `assets/images/${file}`,
        title,
        alt: title,
      };
    }),
  };

  fs.writeFileSync(imagesJsonPath, JSON.stringify(imagesPayload, null, 2));
  console.log(
    `✅ Wrote ${pickedFiles.length} unique images to assets/images.json`
  );
} else {
  console.log(
    "ℹ️  No images directory found at dist/assets/images; skipping manifest generation."
  );
}

// Copy PWA files
console.log("📱 Copying PWA files...");
["manifest.json", "sw.js"].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
  }
});

// Copy root files
console.log("📄 Copying root files...");
["logo.png", "tailwind.config.js"].forEach((file) => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
  }
});

// Process HTML file
console.log("⚡ Processing HTML...");
let htmlContent = fs.readFileSync("index.html", "utf8");

// Remove development comments and unnecessary whitespace
htmlContent = htmlContent.replace(/<!--[\s\S]*?-->/g, ""); // Remove HTML comments
htmlContent = htmlContent.replace(/\s+/g, " "); // Collapse multiple spaces
htmlContent = htmlContent.replace(/>\s+</g, "><"); // Remove spaces between tags

// Write processed HTML to dist
fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

console.log("✅ Build completed successfully!");
console.log(`📊 Build output: ${distDir}/`);
console.log('🚀 Run "npm run serve" to test the build\n');

// Helper function to copy directories recursively
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const srcPath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
