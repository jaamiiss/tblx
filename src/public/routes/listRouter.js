const express = require('express')
const router = express.Router()
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const cache = require('memory-cache');

const collectionName = process.env.COLLECTION_NAME;

// Firebase Admin SDK - initialize safely
let admin, db, DUMMY_DATA, logger, metrics, DEBUG_MODE;
try {
  const firebaseConfig = require('../../shared/config/firebase-cfg');
  admin = firebaseConfig.admin;
  DUMMY_DATA = firebaseConfig.DUMMY_DATA;
  logger = firebaseConfig.logger;
  metrics = firebaseConfig.metrics;
  DEBUG_MODE = firebaseConfig.DEBUG_MODE;
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
  } else {
    logger.warn('Firebase Admin not initialized');
    db = null;
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error.message);
  admin = null;
  db = null;
  DUMMY_DATA = null;
  logger = { info: () => {}, debug: () => {}, error: console.error, warn: console.warn };
  metrics = {};
  DEBUG_MODE = false;
}

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (increased for better efficiency)
const MASTER_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes for master data
const QUOTA_ERROR_CODE = 'resource-exhausted';

// Request deduplication - prevent multiple simultaneous requests for same data
const pendingRequests = new Map();
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout for requests

// Request throttling to prevent excessive Firebase usage
const requestThrottle = new Map();
const THROTTLE_WINDOW = 60000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per endpoint

// Helper function to check request throttling
function isRequestThrottled(endpoint) {
  const now = Date.now();
  const throttleKey = endpoint;
  
  if (!requestThrottle.has(throttleKey)) {
    requestThrottle.set(throttleKey, []);
  }
  
  const requests = requestThrottle.get(throttleKey);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < THROTTLE_WINDOW);
  requestThrottle.set(throttleKey, validRequests);
  
  // Check if we're over the limit
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    logger.warn(`Request throttled for ${endpoint}: ${validRequests.length}/${MAX_REQUESTS_PER_WINDOW} requests in window`);
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  requestThrottle.set(throttleKey, validRequests);
  
  return false;
}

// Helper function to safely access Firestore
async function safeFirestoreQuery(queryFn) {
  if (!db) {
    throw new Error('Firestore not available');
  }
  return await queryFn();
}

// Dummy data is now loaded from shared config

// Helper function to check if error is quota related
function isQuotaError(error) {
  return error.code === QUOTA_ERROR_CODE || 
         error.code === 8 || // RESOURCE_EXHAUSTED gRPC code
         error.message?.includes('quota') || 
         error.message?.includes('resource-exhausted') ||
         error.message?.includes('RESOURCE_EXHAUSTED') ||
         error.message?.includes('too many requests');
}

// Helper function to reload dummy data from file
function reloadDummyData() {
  try {
    const dummyDataPath = path.join(__dirname, '..', '..', 'shared', 'data', 'dummy-data.json');
    const dummyDataRaw = fs.readFileSync(dummyDataPath, 'utf8');
    DUMMY_DATA = JSON.parse(dummyDataRaw);
    console.log('Dummy data reloaded successfully from file');
    return true;
  } catch (error) {
    console.error('Error reloading dummy data file:', error);
    return false;
  }
}

// Master data cache - single source of truth
const MASTER_CACHE_KEY = 'master_data';

// Get master data (single comprehensive fetch) with request deduplication
async function getMasterData() {
  const cacheKey = MASTER_CACHE_KEY;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger.debug(`Master cache hit for ${cacheKey}`);
    return cachedData;
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    logger.debug(`Master data request already pending for ${cacheKey}, waiting...`);
    return await pendingRequests.get(cacheKey);
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      // Check request throttling
      if (isRequestThrottled('master_data')) {
        logger.warn('Master data request throttled, using cached data or dummy data');
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
        return DUMMY_DATA.all || [];
      }
      
      logger.info(`Master cache miss for ${cacheKey}, fetching from Firestore`);
      const snapshot = await db.collection(collectionName).get();
      
      const items = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        items.push({
          id: doc.id,
          ...docData
        });
      });
      
      cache.put(cacheKey, items, MASTER_CACHE_DURATION);
      logger.info(`Master data cached: ${items.length} items`);
      return items;
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn(`Quota exceeded for master data, using dummy data from file`);
        return DUMMY_DATA.all || [];
      }
      throw error;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the promise and add timeout
  pendingRequests.set(cacheKey, requestPromise);
  
  // Add timeout to prevent hanging requests
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      pendingRequests.delete(cacheKey);
      reject(new Error('Request timeout'));
    }, REQUEST_TIMEOUT);
  });

  return Promise.race([requestPromise, timeoutPromise]);
}

// Distribute data across 4 columns based on value ranges
function distributeDataAcrossColumns(data, valueField) {
  const columns = {
    column1: [], // 0-50
    column2: [], // 51-100
    column3: [], // 101-150
    column4: []  // 151-200
  };
  
  data.forEach(item => {
    const value = item[valueField];
    if (value >= 0 && value <= 50) {
      columns.column1.push(item);
    } else if (value >= 51 && value <= 100) {
      columns.column2.push(item);
    } else if (value >= 101 && value <= 150) {
      columns.column3.push(item);
    } else if (value >= 151 && value <= 200) {
      columns.column4.push(item);
    }
  });
  
  // Return as array of columns for frontend rendering
  return [
    columns.column1,
    columns.column2,
    columns.column3,
    columns.column4
  ];
}

// Generate derived data from master cache
function generateDerivedData(masterData, dataType) {
  switch (dataType) {
    case 'version1':
      // Filter and sort V1 data (0-200), then distribute across columns
      const v1Data = masterData
        .filter(item => item.v1 >= 0 && item.v1 <= 200)
        .sort((a, b) => a.v1 - b.v1); // Sort by V1 value ascending
      
      // Distribute data across 4 columns (0-50, 51-100, 101-150, 151-200)
      return distributeDataAcrossColumns(v1Data, 'v1');
    
    case 'version2':
      // Filter and sort V2 data (0-200), then distribute across columns
      const v2Data = masterData
        .filter(item => item.v2 >= 0 && item.v2 <= 200)
        .sort((a, b) => a.v2 - b.v2); // Sort by V2 value ascending
      
      // Distribute data across 4 columns (0-50, 51-100, 101-150, 151-200)
      return distributeDataAcrossColumns(v2Data, 'v2');
    
    case 'status':
      const statusCounts = {
        deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0
      };
      const statusItems = {
        deceased: [], active: [], incarcerated: [], redacted: [], unknown: [], captured: []
      };
      
      masterData.forEach(item => {
        const status = item.status || 'unknown';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
          statusItems[status].push(item);
        }
        statusCounts.total++;
      });
      
      return { statusCounts, statusItems };
    
    case 'stats':
      return generateStatsData(masterData);
    
    default:
      return masterData;
  }
}

// Optimized function to get data from master cache or generate it with deduplication
async function getOptimizedData(dataType, specificFilter = null) {
  const cacheKey = specificFilter ? `${dataType}_${specificFilter}` : dataType;
  
  // Try derived cache first
  const derivedCache = cache.get(cacheKey);
  if (derivedCache) {
    logger.debug(`Derived cache hit for ${cacheKey}`);
    return derivedCache;
  }
  
  // Check if request is already pending for this specific data
  if (pendingRequests.has(cacheKey)) {
    logger.debug(`Request already pending for ${cacheKey}, waiting...`);
    return await pendingRequests.get(cacheKey);
  }
  
  // Create request promise
  const requestPromise = (async () => {
    try {
      // Get master data (this is cached at master level)
      const masterData = await getMasterData();
      
      // Generate derived data
      let result;
      if (specificFilter && dataType === 'status') {
        result = masterData.filter(item => item.status === specificFilter);
      } else {
        result = generateDerivedData(masterData, dataType);
      }
      
      // Cache the derived data with longer duration since it's derived from master cache
      cache.put(cacheKey, result, CACHE_DURATION);
      logger.debug(`Generated and cached ${dataType} data: ${Array.isArray(result) ? result.length : 'object'} items`);
      
      return result;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the promise
  pendingRequests.set(cacheKey, requestPromise);
  
  // Add timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      pendingRequests.delete(cacheKey);
      reject(new Error('Request timeout'));
    }, REQUEST_TIMEOUT);
  });

  return Promise.race([requestPromise, timeoutPromise]);
}

// Cache warming function for seamless navigation
async function warmRelatedCaches(dataType) {
  logger.debug(`Warming related caches for ${dataType}`);
  
  const masterData = cache.get(MASTER_CACHE_KEY);
  if (!masterData) {
    logger.debug('No master data available for cache warming');
    return;
  }
  
  // Pre-generate related data types
  const relatedTypes = {
    'version1': ['version2', 'stats'],
    'version2': ['version1', 'stats'],
    'stats': ['version1', 'version2']
  };
  
  const typesToWarm = relatedTypes[dataType] || [];
  
  for (const type of typesToWarm) {
    const cacheKey = type;
    if (!cache.get(cacheKey)) {
      logger.debug(`Pre-generating cache for ${type}`);
      const data = generateDerivedData(masterData, type);
      cache.put(cacheKey, data, CACHE_DURATION);
    }
  }
  
  // Pre-generate status caches for common statuses
  const commonStatuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
  for (const status of commonStatuses) {
    const cacheKey = `status_${status}`;
    if (!cache.get(cacheKey)) {
      logger.debug(`Pre-generating cache for status ${status}`);
      const data = masterData.filter(item => item.status === status);
      cache.put(cacheKey, data, CACHE_DURATION);
    }
  }
}

// Enhanced caching for seamless navigation
function getSeamlessData(dataType, specificFilter = null) {
  const cacheKey = specificFilter ? `${dataType}_${specificFilter}` : dataType;
  
  // Check if we have this exact data cached
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger.debug(`Seamless cache hit for ${cacheKey}`);
    return cachedData;
  }
  
  // Check if we have master data and can generate this quickly
  const masterData = cache.get(MASTER_CACHE_KEY);
  if (masterData) {
    logger.debug(`Generating ${cacheKey} from cached master data`);
    let result;
    if (specificFilter && dataType === 'status') {
      result = masterData.filter(item => item.status === specificFilter);
    } else {
      result = generateDerivedData(masterData, dataType);
    }
    
    // Cache the result
    cache.put(cacheKey, result, CACHE_DURATION);
    return result;
  }
  
  return null; // Will fall back to getOptimizedData
}

// Generate stats data from master data
function generateStatsData(masterData) {
  const statusCounts = {
    deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0
  };
  const statusItems = {
    deceased: [], active: [], incarcerated: [], redacted: [], unknown: [], captured: []
  };
  
  const categoryCounts = {
    Male: 0, Female: 0, Company: 0, Group: 0, total: 0
  };

  masterData.forEach(item => {
    const status = (item.status || 'unknown').toLowerCase();
    const category = item.category || 'Male'; // Default to Male if category is missing
    
    statusCounts.total++;
    categoryCounts.total++;
    
    // Count by status
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
      statusItems[status].push({
        id: item.id,
        name: item.name,
        v1: item.v1,
        v2: item.v2,
        status: item.status
      });
    } else {
      statusCounts.unknown++;
      statusItems.unknown.push({
        id: item.id,
        name: item.name,
        v1: item.v1,
        v2: item.v2,
        status: item.status
      });
    }
    
    // Count by category
    if (categoryCounts.hasOwnProperty(category)) {
      categoryCounts[category]++;
    } else {
      categoryCounts.Male++; // Default to Male for unknown categories
    }
  });

  // Calculate status percentages
  const percentages = {};
  Object.keys(statusCounts).forEach(key => {
    if (key !== 'total') {
      percentages[key] = ((statusCounts[key] / statusCounts.total) * 100).toFixed(1);
    }
  });
  
  // Calculate category percentages
  const categoryPercentages = {};
  Object.keys(categoryCounts).forEach(key => {
    if (key !== 'total') {
      categoryPercentages[key] = ((categoryCounts[key] / categoryCounts.total) * 100).toFixed(1);
    }
  });

  // Calculate V1 ranges data
  const v1Ranges = {
    "0-50": { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 },
    "51-100": { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 },
    "101-150": { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 },
    "151-200": { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 },
    "200+": { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 }
  };

  // Count items by V1 ranges
  masterData.forEach(item => {
    const v1Value = item.v1;
    const status = (item.status || 'unknown').toLowerCase();
    
    if (v1Value !== undefined && v1Value !== null) {
      let range;
      if (v1Value >= 0 && v1Value <= 50) {
        range = "0-50";
      } else if (v1Value >= 51 && v1Value <= 100) {
        range = "51-100";
      } else if (v1Value >= 101 && v1Value <= 150) {
        range = "101-150";
      } else if (v1Value >= 151 && v1Value <= 200) {
        range = "151-200";
      } else if (v1Value > 200) {
        range = "200+";
      }
      
      if (range && v1Ranges[range]) {
        v1Ranges[range].total++;
        if (v1Ranges[range].hasOwnProperty(status)) {
          v1Ranges[range][status]++;
        } else {
          v1Ranges[range].unknown++;
        }
      }
    }
  });

  return {
    counts: statusCounts,
    percentages: percentages,
    items: statusItems,
    categoryCounts: categoryCounts,
    categoryPercentages: categoryPercentages,
    v1Ranges: v1Ranges
  };
}

// Helper function to get cached data or fetch from Firestore
async function getCachedData(cacheKey, fetchFunction) {
  // Try to get from cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger.debug(`Cache hit for ${cacheKey}`);
    return cachedData;
  }

  try {
    logger.debug(`Cache miss for ${cacheKey}, fetching from Firestore`);
    const data = await fetchFunction();
    cache.put(cacheKey, data, CACHE_DURATION);
    return data;
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn(`Quota exceeded for ${cacheKey}, using dummy data from file`);
      
      // Handle chart-specific dummy data
      if (cacheKey === 'stats-pie') {
        return { counts: DUMMY_DATA.stats.categoryCounts, percentages: DUMMY_DATA.stats.categoryPercentages };
      } else if (cacheKey === 'stats-bar') {
        return { v1Ranges: DUMMY_DATA.stats.v1Ranges };
      } else if (cacheKey === 'stats-scatter') {
        return { v1v2Data: DUMMY_DATA.stats.v1v2Data };
      }
      
      return DUMMY_DATA[cacheKey] || DUMMY_DATA.stats;
    }
    throw error;
  }
}

// Homepage route
router.get('/', (req, res) => {
  res.render('index', {
    title: 'The Blacklist',
    description: 'A comprehensive database of individuals and organizations'
  });
});

// Legacy routes for backward compatibility
router.get('/list', (req, res) => {
  res.render('list/index', {
    title: 'The Blacklist - Version 1',
    description: 'Version 1 list view',
    apiEndpoint: '/version1',
    hideToggleButtons: false,
    customStyling: null
  });
});

router.get('/list/v2', (req, res) => {
  res.render('list/v2/index', {
    title: 'The Blacklist - Version 2',
    description: 'Version 2 list view',
    apiEndpoint: '/version2',
    hideToggleButtons: false,
    customStyling: null
  });
});

router.get('/list/:status', (req, res) => {
  const status = req.params.status;
  res.render('list/status', {
    title: `The Blacklist - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    description: `${status} status page`,
    status: status
  });
});

router.get('/stats', async (req, res) => {
  try {
    const statsData = await getOptimizedData('stats');
    res.render('stats/index', {
      title: 'The Blacklist - Statistics',
      description: 'Statistics and analytics',
      hideToggleButtons: false,
      customStyling: null,
      includeChartJS: true,
      stats: statsData
    });
  } catch (error) {
    console.error('Error in stats route:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load statistics',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

router.get('/the-blacklist', async (req, res) => {
  try {
    const data = await getOptimizedData('version1'); // Use same data as V1
    
    // If it's an HTMX request or API request, return JSON
    if (req.headers['hx-request'] || req.query.format === 'json') {
      res.json(data);
      logger.debug(`Returned ${data.length} items for the-blacklist (JSON)`);
    } else {
      // Otherwise render the HTML page
      res.render('the-blacklist/index', {
        title: 'The Blacklist - Old View',
        description: 'The Blacklist old view',
        apiEndpoint: '/version1',
        hideToggleButtons: true,
        customStyling: 'the-blacklist'
      });
    }
  } catch (error) {
    console.error('Error in the-blacklist route:', error);
    if (req.headers['hx-request'] || req.query.format === 'json') {
      res.status(500).json({ error: 'Something went wrong' });
    } else {
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load the-blacklist page',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
});

router.get('/version1', async (req, res) => {
  try {
    // Try seamless data first, fall back to optimized data
    let data = getSeamlessData('version1');
    if (!data) {
      data = await getOptimizedData('version1');
    }
    
    // Warm related caches in background
    warmRelatedCaches('version1');
    
    res.json(data);
    
    logger.debug(`Returned ${data.length} items for version1`);
  } catch (error) {
    console.error('Error in version1 route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/version2', async (req, res) => {
  try {
    // Try seamless data first, fall back to optimized data
    let data = getSeamlessData('version2');
    if (!data) {
      data = await getOptimizedData('version2');
    }
    
    // Warm related caches in background
    warmRelatedCaches('version2');
    
    res.json(data);
    
    logger.debug(`Returned ${data.length} items for version2`);
  } catch (error) {
    console.error('Error in version2 route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// HTMX endpoint for stats cards
router.get('/stats/cards', async (req, res) => {
  console.log('Stats Cards: Endpoint called - checking data source...');
  try {
    // TESTING: Simulate stats cards failure with ?test=fail parameter
    if (req.query.test === 'fail') {
      console.log('TESTING: Simulating stats cards failure');
      return res.status(500).json({ error: 'Stats cards unavailable (TEST MODE)' });
    }
    
    const data = await getOptimizedData('stats');

    // Get V1 ranges data (0-200, excluding 200+)
    const v1Ranges = data.v1Ranges || {};
    const v1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
    
    // Calculate V1-specific totals (0-200 range)
    let v1Total = 0;
    let v1Active = 0;
    let v1Deceased = 0;
    
    v1RangesToInclude.forEach(range => {
      if (v1Ranges[range]) {
        v1Total += v1Ranges[range].total || 0;
        v1Active += v1Ranges[range].active || 0;
        v1Deceased += v1Ranges[range].deceased || 0;
      }
    });
    
    const lastUpdated = new Date().toLocaleString();
    
    // Calculate V1-specific counts for each status (0-200 range only)
    const statuses = ['active', 'deceased', 'incarcerated', 'redacted', 'unknown', 'captured'];
    const v1Counts = {};
    const v1Percentages = {};
    
    statuses.forEach(status => {
      v1Counts[status] = 0;
      v1RangesToInclude.forEach(range => {
        if (v1Ranges[range]) {
          v1Counts[status] += v1Ranges[range][status] || 0;
        }
      });
      // Calculate percentage based on V1 total
      v1Percentages[status] = v1Total > 0 ? ((v1Counts[status] / v1Total) * 100).toFixed(1) : '0.0';
    });
    
    // Return JSON data for hybrid HTMX approach
    const statsData = {
      counts: v1Counts,
      percentages: v1Percentages,
      v1Total: v1Total,
      v1Active: v1Active,
      v1Deceased: v1Deceased
    };
    
    res.json(statsData);
    logger.debug(`✅ LIVE DATA: Returned V1 status cards HTML with ${v1Total} V1 items (0-200 range)`);
    console.log(`Stats Cards: ✅ Using LIVE data - V1 Total: ${v1Total}, V1 Active: ${v1Active}, V1 Deceased: ${v1Deceased}`);
  } catch (error) {
    console.error('Error in stats/cards route:', error);
    
    // Fallback to dummy data when live data fails
    console.log('Stats Cards: 🔄 Falling back to DUMMY data due to error');
    
    try {
      const dummyData = DUMMY_DATA.stats || {};
      const dummyV1Ranges = dummyData.v1Ranges || {};
      const v1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
      
      // Calculate V1-specific totals from dummy data
      let dummyV1Total = 0;
      let dummyV1Active = 0;
      let dummyV1Deceased = 0;
      
      v1RangesToInclude.forEach(range => {
        if (dummyV1Ranges[range]) {
          dummyV1Total += dummyV1Ranges[range].total || 0;
          dummyV1Active += dummyV1Ranges[range].active || 0;
          dummyV1Deceased += dummyV1Ranges[range].deceased || 0;
        }
      });
      
      const statuses = ['active', 'deceased', 'incarcerated', 'redacted', 'unknown', 'captured'];
      const dummyV1Counts = {};
      const dummyV1Percentages = {};
      
      statuses.forEach(status => {
        dummyV1Counts[status] = 0;
        v1RangesToInclude.forEach(range => {
          if (dummyV1Ranges[range]) {
            dummyV1Counts[status] += dummyV1Ranges[range][status] || 0;
          }
        });
        dummyV1Percentages[status] = dummyV1Total > 0 ? ((dummyV1Counts[status] / dummyV1Total) * 100).toFixed(1) : '0.0';
      });
      
      const lastUpdated = new Date().toLocaleString();
      
      // Return JSON data for client-side rendering (dummy data)
      const dummyStatsData = {
        counts: dummyV1Counts,
        percentages: dummyV1Percentages,
        v1Total: dummyV1Total,
        v1Active: dummyV1Active,
        v1Deceased: dummyV1Deceased
      };
      
      res.json(dummyStatsData);
      console.log(`Stats Cards: 🔄 Using DUMMY data - V1 Total: ${dummyV1Total}, V1 Active: ${dummyV1Active}, V1 Deceased: ${dummyV1Deceased}`);
    } catch (dummyError) {
      console.error('Error loading dummy data for stats cards:', dummyError);
      
      // Return error JSON as last resort
      res.status(500).json({ 
        error: 'Unable to load statistics data',
        counts: {},
        percentages: {},
        v1Total: 0
      });
    }
  }
});

// HTMX endpoints for individual charts
router.get('/stats/chart/pie', async (req, res) => {
  try {
    // TESTING: Simulate chart failure with ?test=fail parameter
    if (req.query.test === 'fail') {
      console.log('TESTING: Simulating pie chart failure');
      return res.status(500).json({ error: 'Chart data unavailable (TEST MODE)' });
    }
    
    console.log('Pie chart endpoint called');
    const statsData = await getOptimizedData('stats');
    console.log('Stats data received:', statsData);
    
    // Extract V1-specific category data for pie chart (0-200 range only)
    const v1Ranges = statsData.v1Ranges || {};
    const v1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
    
    // Calculate V1-specific category counts
    const v1CategoryCounts = { Male: 0, Female: 0, Company: 0, Group: 0, Unknown: 0 };
    
    // Get master data to calculate V1 category counts
    const masterData = await getMasterData();
    const v1Items = masterData.filter(item => {
      const v1 = item.v1 || 0;
      return v1 >= 0 && v1 <= 200; // Only V1 range 0-200
    });
    
    v1Items.forEach(item => {
      const category = item.category || 'Unknown';
      if (v1CategoryCounts.hasOwnProperty(category)) {
        v1CategoryCounts[category]++;
      } else {
        v1CategoryCounts.Unknown++;
      }
    });
    
    const data = {
      Male: v1CategoryCounts.Male || 0,
      Female: v1CategoryCounts.Female || 0,
      Company: v1CategoryCounts.Company || 0,
      Group: v1CategoryCounts.Group || 0,
      Unknown: v1CategoryCounts.Unknown || 0
    };
    
    console.log('Pie chart data prepared:', data);
    res.json(data);
  } catch (error) {
    console.error('Error in pie chart route:', error);
    res.status(500).json({ error: 'Error loading pie chart' });
  }
});

router.get('/stats/chart/bar', async (req, res) => {
  try {
    const statsData = await getOptimizedData('stats');
    
    // Return V1 ranges data for bar chart (exclude 200+ range)
    const v1Ranges = statsData.v1Ranges || {};
    const v1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
    
    const data = {};
    v1RangesToInclude.forEach(range => {
      if (v1Ranges[range]) {
        data[range] = v1Ranges[range];
      }
    });

    res.json(data);
  } catch (error) {
    console.error('Error in bar chart route:', error);
    res.status(500).json({ error: 'Error loading bar chart' });
  }
});

router.get('/stats/chart/scatter', async (req, res) => {
  try {
    console.log('Scatter chart endpoint called');
    const masterData = await getMasterData();
    
    // Prepare V1-specific scatter data (v1 vs v2 values for V1 range 0-200 only)
    const v1Items = masterData.filter(item => {
      const v1 = item.v1 || 0;
      return v1 >= 0 && v1 <= 200; // Only V1 range 0-200
    });
    
    const items = v1Items.map(item => ({
      v1: item.v1 || 0,
      v2: item.v2 || 0,
      name: item.name || 'Unknown',
      status: item.status || 'unknown',
      category: item.category || 'Unknown'
    })).filter(item => item.v1 !== undefined && item.v2 !== undefined);

    const data = { items };

    console.log('Scatter chart data structure:', {
      hasItems: !!data.items,
      isItemsArray: Array.isArray(data.items),
      itemsLength: data.items ? data.items.length : 'no items',
      dataKeys: Object.keys(data)
    });

    res.json(data);
  } catch (error) {
    console.error('Error in scatter chart route:', error);
    res.status(500).json({ error: 'Error loading scatter chart' });
  }
});

router.get('/version1/:status', async (req, res) => {
  try {
    const status = req.params.status.toLowerCase();
    const cacheKey = `version1_${status}`;

    const data = await getCachedData(cacheKey, async () => {
    // Query Firestore to get the user data with the specified status
    const snapshot = await db.collection(collectionName)
      .where('v1', '>=', 0)
      .where('v1', '<=', 200)
      .where('status', '==', status)
      .limit(5)
      .orderBy('v1')
      .get();

      const result = [];
    snapshot.forEach((doc) => {
      const docData = doc.data();
        result.push({
        id: doc.id,
        ...docData
      });
      });
      return result;
    });

    res.json(data);
    logger.debug(`Returned ${data.length} items for status: ${status}`);
  } catch (error) {
    console.error('Error in version1/:status route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Simple test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working', 
    timestamp: new Date().toISOString(),
    env: {
      collectionName: collectionName || 'not set',
      firebaseApps: admin.apps.length,
      dbAvailable: !!db
    }
  });
});

// Quota status endpoint - must come before /status/:status to avoid route conflict
router.get('/quota-status', async (req, res) => {
  try {
    console.log('Quota status endpoint called');
    
    // TESTING: Simulate quota exceeded with ?test=quota parameter or FORCE_DEMO_MODE env var
    if (req.query.test === 'quota' || process.env.FORCE_DEMO_MODE === 'true') {
      console.log('TESTING: Simulating quota exceeded');
      return res.json({
        status: 'exceeded',
        message: 'Firestore quota exceeded (TEST MODE)',
        canUseFirestore: false,
        fallbackAvailable: true,
        testMode: true
      });
    }
    
    // Check if Firestore is available
    if (!db || !collectionName) {
      console.log('Firestore not available - missing db or collection name');
      return res.json({
        status: 'exceeded',
        message: 'Firestore not configured',
        canUseFirestore: false,
        fallbackAvailable: true
      });
    }
    
    // Test Firestore with a small query to check quota
    try {
      console.log('Testing Firestore quota with small query...');
      const testSnapshot = await db.collection(collectionName)
        .limit(1)
        .get();
      
      console.log('Firestore quota test successful - quota not exceeded');
      return res.json({
        status: 'available',
        message: 'Firestore quota available',
        canUseFirestore: true,
        fallbackAvailable: false,
        testResult: {
          docsFound: testSnapshot.size,
          isEmpty: testSnapshot.empty
        }
      });
      
    } catch (firestoreError) {
      console.log('Firestore quota test failed:', firestoreError.message);
      
      // Check if it's a quota error
      if (isQuotaError(firestoreError)) {
        return res.json({
          status: 'exceeded',
          message: 'Firestore quota exceeded',
          canUseFirestore: false,
          fallbackAvailable: true,
          error: firestoreError.message
        });
      } else {
        // Other Firestore errors
        return res.json({
          status: 'error',
          message: 'Firestore error: ' + firestoreError.message,
          canUseFirestore: false,
          fallbackAvailable: true,
          error: firestoreError.message
        });
      }
    }
    
  } catch (error) {
    console.log('Quota status error:', error.message);
    res.json({
      status: 'error',
      message: 'Server error: ' + error.message,
      canUseFirestore: false,
      fallbackAvailable: true
    });
  }
});

// Status page data endpoint - optimized for HTMX
router.get('/status/:status', async (req, res) => {
  try {
    const status = req.params.status.toLowerCase();
    
    // Try seamless data first, fall back to optimized data
    let data = getSeamlessData('status', status);
    if (!data) {
      data = await getOptimizedData('status', status);
    }

    // Always return JSON for consistency - client-side rendering handles HTML
    res.json(data);
    
    logger.debug(`Returned ${data.length} items for status page: ${status}`);
  } catch (error) {
    console.error('Error in status/:status route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Cache management endpoint
router.post('/clear-cache', (req, res) => {
  try {
    cache.clear();
    console.log('Cache cleared manually');
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Invalidate master cache and related derived caches
router.post('/invalidate-master-cache', (req, res) => {
  try {
    // Clear master cache
    cache.del(MASTER_CACHE_KEY);
    
    // Clear all derived caches
    const derivedKeys = ['version1', 'version2', 'stats', 'stats-pie', 'stats-bar', 'stats-scatter'];
    derivedKeys.forEach(key => cache.del(key));
    
    // Clear status caches
    const statuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
    statuses.forEach(status => cache.del(`status_${status}`));
    
    res.json({ 
      message: 'Master cache and derived caches invalidated successfully',
      clearedKeys: [MASTER_CACHE_KEY, ...derivedKeys, ...statuses.map(s => `status_${s}`)]
    });
  } catch (error) {
    console.error('Error invalidating master cache:', error);
    res.status(500).json({ error: 'Failed to invalidate master cache' });
  }
});

router.get('/cache-stats', (req, res) => {
  try {
    const stats = cache.getStats();
    const masterData = cache.get(MASTER_CACHE_KEY);
    res.json({
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      masterCache: {
        exists: !!masterData,
        itemCount: masterData ? masterData.length : 0,
        key: MASTER_CACHE_KEY
      },
      optimization: {
        enabled: true,
        masterCacheDuration: MASTER_CACHE_DURATION,
        derivedCacheDuration: CACHE_DURATION
      }
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Reload dummy data endpoint
router.post('/reload-dummy-data', (req, res) => {
  try {
    const success = reloadDummyData();
    if (success) {
      res.json({ message: 'Dummy data reloaded successfully' });
    } else {
      res.status(500).json({ error: 'Failed to reload dummy data' });
    }
  } catch (error) {
    console.error('Error reloading dummy data:', error);
    res.status(500).json({ error: 'Failed to reload dummy data' });
  }
});

// Get dummy data info endpoint
router.get('/dummy-data-info', (req, res) => {
  try {
    res.json({
      available: DUMMY_DATA !== null,
      keys: DUMMY_DATA ? Object.keys(DUMMY_DATA) : [],
      stats: DUMMY_DATA ? {
        version1Count: DUMMY_DATA.version1 ? DUMMY_DATA.version1.length : 0,
        version2Count: DUMMY_DATA.version2 ? DUMMY_DATA.version2.length : 0,
        statsCounts: DUMMY_DATA.stats ? DUMMY_DATA.stats.counts : null
      } : null
    });
  } catch (error) {
    console.error('Error getting dummy data info:', error);
    res.status(500).json({ error: 'Failed to get dummy data info' });
  }
});

// Endpoint to get actual dummy data for demo mode
router.get('/dummy-data/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    if (!DUMMY_DATA) {
      return res.status(404).json({ error: 'Dummy data not available' });
    }
    
    let data;
    switch (type) {
      case 'version1':
      case 'v1':
        data = DUMMY_DATA.version1 || [];
        break;
      case 'version2':
      case 'v2':
        data = DUMMY_DATA.version2 || [];
        break;
      case 'stats': // Added for stats cards
        // Return V1-specific stats from dummy data (0-200 range)
        const dummyStats = DUMMY_DATA.stats || {};
        const dummyV1Ranges = dummyStats.v1Ranges || {};
        const dummyV1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
        
        let dummyV1Total = 0;
        const dummyV1Counts = {};
        const statuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
        
        // Calculate V1 totals
        dummyV1RangesToInclude.forEach(range => {
          if (dummyV1Ranges[range]) {
            dummyV1Total += dummyV1Ranges[range].total || 0;
          }
        });
        
        // Calculate V1 counts for each status
        statuses.forEach(status => {
          dummyV1Counts[status] = 0;
          dummyV1RangesToInclude.forEach(range => {
            if (dummyV1Ranges[range]) {
              dummyV1Counts[status] += dummyV1Ranges[range][status] || 0;
            }
          });
        });
        
        data = {
          v1Total: dummyV1Total,
          v1Counts: dummyV1Counts,
          v1Ranges: dummyV1Ranges
        };
        console.log(`Stats Cards: 🔄 Using DUMMY data - V1 Total: ${dummyV1Total}, V1 Active: ${dummyV1Counts.active || 0}, V1 Deceased: ${dummyV1Counts.deceased || 0}`);
        break;
      case 'pie':
        // Return V1-specific category counts from dummy data
        const pieDummyStats = DUMMY_DATA.stats || {};
        const pieDummyV1Ranges = pieDummyStats.v1Ranges || {};
        const pieDummyV1RangesToInclude = ['0-50', '51-100', '101-150', '151-200']; // Exclude 200+
        
        // Calculate V1-specific category counts from dummy data
        const pieDummyV1CategoryCounts = { Male: 0, Female: 0, Company: 0, Group: 0, Unknown: 0 };
        
        // Simulate V1 category distribution (different from full database)
        pieDummyV1CategoryCounts.Male = 105; // V1-specific count
        pieDummyV1CategoryCounts.Female = 32; // V1-specific count  
        pieDummyV1CategoryCounts.Company = 24; // V1-specific count
        pieDummyV1CategoryCounts.Group = 30; // V1-specific count
        pieDummyV1CategoryCounts.Unknown = 10; // V1-specific count
        
        data = pieDummyV1CategoryCounts;
        break;
        case 'bar':
          data = DUMMY_DATA.stats ? DUMMY_DATA.stats.v1Ranges : {};
          break;
      case 'scatter':
        // Return V1-specific scatter data (items with v1 range 0-200 only)
        const dummyScatterItems = [];
        if (DUMMY_DATA.stats && DUMMY_DATA.stats.items) {
          // Flatten all status arrays and filter for V1 range 0-200
          Object.values(DUMMY_DATA.stats.items).forEach(statusArray => {
            if (Array.isArray(statusArray)) {
              statusArray.forEach(item => {
                const v1 = item.v1 || 0;
                if (v1 >= 0 && v1 <= 200) {
                  dummyScatterItems.push({
                    v1: item.v1 || 0,
                    v2: item.v2 || 0,
                    name: item.name || 'Unknown',
                    status: item.status || 'unknown',
                    category: item.category || 'Unknown'
                  });
                }
              });
            }
          });
        }
        data = { items: dummyScatterItems };
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error getting dummy data:', error);
    res.status(500).json({ error: 'Failed to get dummy data' });
  }
});

module.exports = router