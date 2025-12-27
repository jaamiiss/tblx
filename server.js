/**
 * The Blacklist - Main Server Entry Point
 * Restructured for better organization
 */

const express = require('express');
require('dotenv').config();
const path = require('path');
const { execSync } = require('child_process');
const compression = require('compression');

// Run build process in production if build files don't exist
if (process.env.NODE_ENV === 'production') {
  const buildDir = path.join(__dirname, 'src/public/assets/build');
  const fs = require('fs');

  if (!fs.existsSync(buildDir) || fs.readdirSync(buildDir).length === 0) {
    console.log('Production mode: Build files not found, running build process...');
    try {
      execSync('pnpm run build', { stdio: 'inherit' });
      console.log('Build process completed successfully');
    } catch (error) {
      console.error('Build process failed:', error.message);
    }
  }
}

// Import routes
const publicRoutes = require('./src/public/routes/listRouter');

const app = express();
const PORT = process.env.PORT || 3006;

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'src/public/views')
]);

// Enable gzip/brotli compression for all responses
// IMPORTANT: Must be before express.static to compress static assets
app.use(compression({
  level: 6, // Compression level (0-9, 6 is good balance)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Static file serving
app.use('/public', express.static(path.join(__dirname, 'src/public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'src/public/assets')));

// Serve optimized build files with cache headers
app.use('/assets/build', express.static(path.join(__dirname, 'src/public/assets/build'), {
  maxAge: '1y',
  lastModified: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', publicRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`The Blacklist server running on port ${PORT}`);
  });
}

module.exports = app;
