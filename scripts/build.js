#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔨 Building Bakamoonaas extension...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy source files to dist
const srcDir = path.join(__dirname, '..', 'src');
const manifestPath = path.join(__dirname, '..', 'manifest.json');

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const items = fs.readdirSync(src);
        for (const item of items) {
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    // Copy src directory
    copyRecursive(srcDir, path.join(distDir, 'src'));
    
    // Copy manifest.json
    fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Extension files are in the dist/ directory');
    console.log('🚀 Load the dist/ directory in chrome://extensions/');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}