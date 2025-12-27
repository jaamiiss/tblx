#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import build tools
const CleanCSS = require('clean-css');
const terser = require('terser');

console.log('🚀 Starting production build...\n');

// Configuration
const BUILD_DIR = 'src/public/assets/build';
const SRC_DIR = 'src';

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Build configuration
const buildConfig = {
  css: {
    main: {
      input: 'src/public/assets/css/style.css',
      output: 'src/public/assets/build/style.min.css'
    },
    // Combined bundle (now just main since list-pages is merged)
    bundle: {
      inputs: [
        'src/public/assets/css/style.css'
      ],
      output: 'src/public/assets/build/bundle.min.css'
    }
  },
  js: {
    core: {
      files: [
        'src/public/assets/js/vendor/htmx.min.js',
        'src/public/assets/js/core/index.js'
      ],
      output: 'src/public/assets/build/core.min.js'
    }
  }
};

// Utility functions
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`⚠️  Warning: Could not read ${filePath}: ${error.message}`);
    return '';
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error writing ${filePath}: ${error.message}`);
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2) + ' KB';
  } catch (error) {
    return 'Unknown';
  }
}

// Build CSS
async function buildCSS() {
  console.log('📦 Building CSS...\n');

  const minifier = new CleanCSS({
    level: 2,
    returnPromise: true
  });

  // Build individual CSS files
  for (const [cssName, config] of Object.entries(buildConfig.css)) {
    if (cssName === 'bundle') continue; // Handle bundle separately

    console.log(`🔨 Building ${cssName} CSS...`);

    const cssContent = readFile(config.input);
    if (!cssContent) {
      console.warn(`⚠️  No CSS content for ${cssName}`);
      continue;
    }

    try {
      const result = await minifier.minify(cssContent);
      writeFile(config.output, result.styles);

      console.log(`📊 ${cssName}: ${getFileSize(config.input)} → ${getFileSize(config.output)}`);
    } catch (error) {
      console.error(`❌ Error building ${cssName} CSS:`, error.message);
    }
  }

  // Build combined bundle
  console.log('\n🔨 Building CSS bundle...');

  let bundleContent = '';
  let totalOriginalSize = 0;

  for (const inputPath of buildConfig.css.bundle.inputs) {
    const content = readFile(inputPath);
    if (content) {
      bundleContent += `\n/* ${path.basename(inputPath)} */\n${content}\n`;
      totalOriginalSize += fs.statSync(inputPath).size;
    }
  }

  if (bundleContent.trim()) {
    try {
      const result = await minifier.minify(bundleContent);
      writeFile(buildConfig.css.bundle.output, result.styles);

      const originalSizeKB = (totalOriginalSize / 1024).toFixed(2);
      console.log(`📊 bundle: ${originalSizeKB} KB → ${getFileSize(buildConfig.css.bundle.output)}`);
      console.log(`📁 Files: ${buildConfig.css.bundle.inputs.length} CSS files combined`);
    } catch (error) {
      console.error(`❌ Error building CSS bundle:`, error.message);
    }
  }

  console.log('');
}

// Build JavaScript bundles
async function buildJS() {
  console.log('📦 Building JavaScript bundles...\n');

  for (const [bundleName, config] of Object.entries(buildConfig.js)) {
    console.log(`🔨 Building ${bundleName} bundle...`);

    let combinedContent = '';
    let totalOriginalSize = 0;

    // Combine files
    for (const filePath of config.files) {
      const content = readFile(filePath);
      if (content) {
        combinedContent += `\n/* ${path.basename(filePath)} */\n${content}\n`;
        totalOriginalSize += fs.statSync(filePath).size;
      }
    }

    if (!combinedContent.trim()) {
      console.warn(`⚠️  No content for ${bundleName} bundle`);
      continue;
    }

    // Minify JavaScript
    try {
      const result = await terser.minify(combinedContent, {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          reserved: ['window', 'document', 'htmx', 'Chart']
        },
        format: {
          comments: false
        }
      });

      if (result.error) {
        console.error(`❌ Terser error for ${bundleName}:`, result.error);
        continue;
      }

      writeFile(config.output, result.code);

      const originalSizeKB = (totalOriginalSize / 1024).toFixed(2);
      const minifiedSizeKB = getFileSize(config.output);

      console.log(`📊 ${bundleName}: ${originalSizeKB} KB → ${minifiedSizeKB}`);
      console.log(`📁 Files: ${config.files.length} files combined\n`);

    } catch (error) {
      console.error(`❌ Error building ${bundleName}:`, error.message);
    }
  }
}

// Generate build manifest
function generateManifest() {
  console.log('📋 Generating build manifest...');

  const manifest = {
    buildTime: new Date().toISOString(),
    version: require('./package.json').version,
    assets: {
      css: {},
      js: {}
    }
  };

  // Add CSS files to manifest
  for (const [cssName, config] of Object.entries(buildConfig.css)) {
    if (config.output) {
      manifest.assets.css[path.basename(config.output)] = getFileSize(config.output);
    }
  }

  // Add JS bundles to manifest
  for (const [bundleName, config] of Object.entries(buildConfig.js)) {
    manifest.assets.js[path.basename(config.output)] = getFileSize(config.output);
  }

  writeFile('src/public/assets/build/manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✅ Build manifest created\n');
}

// Main build function
async function build() {
  try {
    console.log('🔍 Analyzing project structure...');

    // Check if source files exist
    const missingFiles = [];

    // Check CSS files
    for (const [cssName, config] of Object.entries(buildConfig.css)) {
      if (config.input && !fs.existsSync(config.input)) {
        missingFiles.push(config.input);
      } else if (config.inputs) {
        for (const inputPath of config.inputs) {
          if (!fs.existsSync(inputPath)) {
            missingFiles.push(inputPath);
          }
        }
      }
    }

    // Check JS files
    for (const config of Object.values(buildConfig.js)) {
      for (const file of config.files) {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      }
    }

    if (missingFiles.length > 0) {
      console.warn('⚠️  Missing source files:');
      missingFiles.forEach(file => console.warn(`   - ${file}`));
      console.log('');
    }

    // Build assets
    await buildCSS();
    await buildJS();
    generateManifest();

    console.log('🎉 Build completed successfully!');
    console.log('📁 Build output: src/public/assets/build/');

    // Show build summary
    console.log('\n📊 Build Summary:');
    const buildFiles = fs.readdirSync(BUILD_DIR);
    buildFiles.forEach(file => {
      const filePath = path.join(BUILD_DIR, file);
      const size = getFileSize(filePath);
      console.log(`   ${file}: ${size}`);
    });

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
if (require.main === module) {
  build();
}

module.exports = { build };
