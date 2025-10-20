/**
 * The Blacklist - Main Server Entry Point
 * Restructured for better organization
 */

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { execSync } = require('child_process');

// Run build process in production if build files don't exist
if (process.env.NODE_ENV === 'production') {
  const buildDir = path.join(__dirname, 'src/public/assets/build');
  const fs = require('fs');
  
  if (!fs.existsSync(buildDir) || fs.readdirSync(buildDir).length === 0) {
    console.log('Production mode: Build files not found, running build process...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build process completed successfully');
    } catch (error) {
      console.error('Build process failed:', error.message);
    }
  }
}

// Import routes
const publicRoutes = require('./src/public/routes/listRouter');
const adminRoutes = require('./src/admin/routes/adminRouter');

const app = express();
const PORT = process.env.PORT || 3006;

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'src/public/views'),
  path.join(__dirname, 'src/admin/views')
]);

// Static file serving
app.use('/public', express.static(path.join(__dirname, 'src/public/assets')));
app.use('/admin/assets', express.static(path.join(__dirname, 'src/admin/assets')));
app.use('/shared/assets', express.static(path.join(__dirname, 'src/shared/assets')));
app.use('/assets', express.static(path.join(__dirname, 'src/public/assets')));

// Serve optimized build files with cache headers
app.use('/assets/build', express.static(path.join(__dirname, 'src/public/assets/build'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true
}));

// Debug: Log static file serving
console.log('Static file paths:');
console.log('Build files:', path.join(__dirname, 'src/public/assets/build'));
console.log('Public assets:', path.join(__dirname, 'src/public/assets'));

// Check if build files exist
const buildDir = path.join(__dirname, 'src/public/assets/build');
const fs = require('fs');
if (fs.existsSync(buildDir)) {
  const buildFiles = fs.readdirSync(buildDir);
  console.log('Build files found:', buildFiles);
} else {
  console.log('Build directory does not exist:', buildDir);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

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
    console.log(`Public views: ${path.join(__dirname, 'src/public/views')}`);
    console.log(`Admin views: ${path.join(__dirname, 'src/admin/views')}`);
  });
}

module.exports = app;




