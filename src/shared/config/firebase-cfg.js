const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

// Debug mode configuration
const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Logging utility with debug mode support
const logger = {
  info: (message, ...args) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.log(message, ...args);
    }
  },
  debug: (message, ...args) => {
    if (LOG_LEVEL === 'debug' || DEBUG_MODE) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(message, ...args);
  },
  warn: (message, ...args) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info' || LOG_LEVEL === 'warn') {
      console.warn(message, ...args);
    }
  }
};

// Performance metrics
const metrics = {
  startTime: Date.now(),
  firebaseInitTime: null,
  dummyDataLoadTime: null,
  initializationComplete: false
};

// Check if Firebase Admin is already initialized to prevent duplicate initialization
if (!admin.apps.length) {
  const initStart = Date.now();
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
  metrics.firebaseInitTime = Date.now() - initStart;
  logger.info('Firebase Admin initialized successfully');
  logger.info('Collection name:', process.env.COLLECTION_NAME);
} else {
  logger.debug('Firebase Admin already initialized, skipping');
}

// Load dummy data once and cache it
let DUMMY_DATA = null;
if (!DUMMY_DATA) {
  const loadStart = Date.now();
  try {
    const dummyDataPath = path.join(__dirname, '..', 'data', 'dummy-data.json');
    const dummyDataRaw = fs.readFileSync(dummyDataPath, 'utf8');
    DUMMY_DATA = JSON.parse(dummyDataRaw);
    metrics.dummyDataLoadTime = Date.now() - loadStart;
    logger.info('Dummy data loaded successfully from file');
    logger.debug(`Dummy data load time: ${metrics.dummyDataLoadTime}ms`);
  } catch (error) {
    logger.error('Error loading dummy data file:', error);
    // Fallback to hardcoded data if file fails to load
    DUMMY_DATA = {
      all: Array.from({ length: 10 }, (_, i) => ({
        id: `dummy_${i}`,
        name: `Person ${i + 1}`,
        v1: i,
        v2: i + 100,
        status: ['deceased', 'active', 'incarcerated', 'redacted', 'unknown'][i % 5],
        category: ['Male', 'Female', 'Company', 'Group'][i % 4]
      }))
    };
  }
}

// Mark initialization as complete
metrics.initializationComplete = true;
const totalInitTime = Date.now() - metrics.startTime;
logger.debug(`Total initialization time: ${totalInitTime}ms`);

// Export with debug utilities
module.exports = { 
  admin, 
  DUMMY_DATA, 
  logger, 
  metrics,
  DEBUG_MODE 
};