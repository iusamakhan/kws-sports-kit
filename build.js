#!/usr/bin/env node

/**
 * Simple build script for Kit World Sports website
 * Handles HTML minification, CSS optimization, and asset copying
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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
