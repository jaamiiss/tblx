const express = require('express')
const router = express.Router()
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const cache = require('memory-cache');

const collectionName = process.env.COLLECTION_NAME;

// Firebase Admin SDK - initialize safely
let admin, db;
try {
  admin = require('../../shared/config/firebase-cfg');
  console.log('Firebase Admin apps:', admin.apps.length);
  console.log('Collection name:', collectionName);
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
    console.log('Firestore database initialized successfully');
} else {
    console.log('Firebase Admin not initialized');
    db = null;
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error.message);
  admin = null;
  db = null;
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (increased from 5 minutes)
const MASTER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for master data
const QUOTA_ERROR_CODE = 'resource-exhausted';

// Helper function to safely access Firestore
async function safeFirestoreQuery(queryFn) {
  if (!db) {
    throw new Error('Firestore not available');
  }
  return await queryFn();
}

// Load dummy data from JSON file
let DUMMY_DATA = null;
try {
  const dummyDataPath = path.join(__dirname, '..', '..', 'shared', 'data', 'dummy-data.json');
  const dummyDataRaw = fs.readFileSync(dummyDataPath, 'utf8');
  DUMMY_DATA = JSON.parse(dummyDataRaw);
  console.log('Dummy data loaded successfully from file');
} catch (error) {
  console.error('Error loading dummy data file:', error);
  // Fallback to hardcoded data if file fails to load
  DUMMY_DATA = {
    version1: Array.from({ length: 5 }, (_, i) => ({
      id: `dummy_${i}`,
      name: `Person ${i + 1}`,
      v1: i,
      v2: i + 100,
      status: ['deceased', 'active', 'incarcerated', 'redacted', 'unknown'][i % 5],
      category: ['Male', 'Female', 'Company', 'Group'][i % 4]
    })),
    version2: Array.from({ length: 5 }, (_, i) => ({
      id: `dummy_${i}`,
      name: `Person ${i + 1}`,
      v1: i,
      v2: i + 100,
      status: ['deceased', 'active', 'incarcerated', 'redacted', 'unknown'][i % 5],
      category: ['Male', 'Female', 'Company', 'Group'][i % 4]
    })),
    stats: {
      counts: { deceased: 1, active: 1, incarcerated: 1, redacted: 1, unknown: 1, total: 5 },
      percentages: { deceased: "20.0", active: "20.0", incarcerated: "20.0", redacted: "20.0", unknown: "20.0" },
      items: {
        deceased: [{ id: 'dummy_0', name: 'Person 1', v1: 0, v2: 100, status: 'deceased' }],
        active: [{ id: 'dummy_1', name: 'Person 2', v1: 1, v2: 101, status: 'active' }],
        incarcerated: [{ id: 'dummy_2', name: 'Person 3', v1: 2, v2: 102, status: 'incarcerated' }],
        redacted: [{ id: 'dummy_3', name: 'Person 4', v1: 3, v2: 103, status: 'redacted' }],
        unknown: [{ id: 'dummy_4', name: 'Person 5', v1: 4, v2: 104, status: 'unknown' }]
      },
      v1Ranges: {
        '0-50': { deceased: 1, active: 1, incarcerated: 1, redacted: 1, unknown: 1 },
        '51-100': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 },
        '101-150': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 },
        '151-200': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 }
      },
      v1v2Data: [
        { x: 15, y: 120, status: 'deceased', name: 'Person 1' },
        { x: 45, y: 85, status: 'active', name: 'Person 2' },
        { x: 78, y: 156, status: 'incarcerated', name: 'Person 3' },
        { x: 112, y: 92, status: 'redacted', name: 'Person 4' },
        { x: 145, y: 178, status: 'unknown', name: 'Person 5' },
        { x: 23, y: 145, status: 'deceased', name: 'Person 6' },
        { x: 67, y: 67, status: 'active', name: 'Person 7' },
        { x: 89, y: 134, status: 'incarcerated', name: 'Person 8' },
        { x: 134, y: 45, status: 'redacted', name: 'Person 9' },
        { x: 167, y: 189, status: 'unknown', name: 'Person 10' },
        { x: 34, y: 98, status: 'deceased', name: 'Person 11' },
        { x: 56, y: 123, status: 'active', name: 'Person 12' },
        { x: 98, y: 76, status: 'incarcerated', name: 'Person 13' },
        { x: 123, y: 167, status: 'redacted', name: 'Person 14' },
        { x: 156, y: 34, status: 'unknown', name: 'Person 15' },
        { x: 12, y: 67, status: 'deceased', name: 'Person 16' },
        { x: 78, y: 189, status: 'active', name: 'Person 17' },
        { x: 134, y: 112, status: 'incarcerated', name: 'Person 18' },
        { x: 189, y: 78, status: 'redacted', name: 'Person 19' },
        { x: 45, y: 156, status: 'unknown', name: 'Person 20' }
      ]
    }
  };
}

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

// Get master data (single comprehensive fetch)
async function getMasterData() {
  const cachedData = cache.get(MASTER_CACHE_KEY);
  if (cachedData) {
    console.log(`Master cache hit for ${MASTER_CACHE_KEY}`);
    return cachedData;
  }

  try {
    console.log(`Master cache miss for ${MASTER_CACHE_KEY}, fetching from Firestore`);
    const snapshot = await db.collection(collectionName).get();
    
    const items = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
      items.push({
            id: doc.id,
            ...docData
          });
        });
    
    cache.put(MASTER_CACHE_KEY, items, MASTER_CACHE_DURATION);
    console.log(`Master data cached: ${items.length} items`);
    return items;
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn(`Quota exceeded for master data, using dummy data from file`);
      return DUMMY_DATA.all || [];
    }
    throw error;
  }
}

// Generate derived data from master cache
function generateDerivedData(masterData, dataType) {
  switch (dataType) {
    case 'version1':
      return masterData.filter(item => item.v1 >= 0 && item.v1 <= 200);
    
    case 'version2':
      return masterData.filter(item => item.v2 >= 0 && item.v2 <= 200);
    
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

// Optimized function to get data from master cache or generate it
async function getOptimizedData(dataType, specificFilter = null) {
  const cacheKey = specificFilter ? `${dataType}_${specificFilter}` : dataType;
  
  // Try derived cache first
  const derivedCache = cache.get(cacheKey);
  if (derivedCache) {
    console.log(`Derived cache hit for ${cacheKey}`);
    return derivedCache;
  }
  
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
  console.log(`Generated and cached ${dataType} data: ${Array.isArray(result) ? result.length : 'object'} items`);
  
  return result;
}

// Cache warming function for seamless navigation
async function warmRelatedCaches(dataType) {
  console.log(`Warming related caches for ${dataType}`);
  
  const masterData = cache.get(MASTER_CACHE_KEY);
  if (!masterData) {
    console.log('No master data available for cache warming');
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
      console.log(`Pre-generating cache for ${type}`);
      const data = generateDerivedData(masterData, type);
      cache.put(cacheKey, data, CACHE_DURATION);
    }
  }
  
  // Pre-generate status caches for common statuses
  const commonStatuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
  for (const status of commonStatuses) {
    const cacheKey = `status_${status}`;
    if (!cache.get(cacheKey)) {
      console.log(`Pre-generating cache for status ${status}`);
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
    console.log(`Seamless cache hit for ${cacheKey}`);
    return cachedData;
  }
  
  // Check if we have master data and can generate this quickly
  const masterData = cache.get(MASTER_CACHE_KEY);
  if (masterData) {
    console.log(`Generating ${cacheKey} from cached master data`);
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

  return {
    counts: statusCounts,
    percentages: percentages,
    items: statusItems,
    categoryCounts: categoryCounts,
    categoryPercentages: categoryPercentages
  };
}

// Helper function to get cached data or fetch from Firestore
async function getCachedData(cacheKey, fetchFunction) {
  // Try to get from cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    return cachedData;
  }

  try {
    console.log(`Cache miss for ${cacheKey}, fetching from Firestore`);
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
      console.log(`Returned ${data.length} items for the-blacklist (JSON)`);
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
    console.log(`Returned ${data.length} items for version1`);
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
    console.log(`Returned ${data.length} items for version2`);
  } catch (error) {
    console.error('Error in version2 route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// HTMX endpoint for stats cards
router.get('/stats/cards', async (req, res) => {
  try {
    const data = await getOptimizedData('stats');

    // Return HTML for stats cards with optimized layout
    const statuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
    
    // Status cards in a balanced 3x2 grid
    let html = '<div class="stats-cards-container">';
    html += '<div class="status-cards-grid">';
    
    statuses.forEach(status => {
      html += `
        <div class="stat-card ${status}" onclick="window.location.href='/list/${status}'">
          <div class="stat-number">${data.counts[status]}</div>
          <div class="stat-label">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
          <div class="stat-percentage">${data.percentages[status]}%</div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Total card separated and centered
    html += `
      <div class="total-card-container">
        <div class="stat-card total">
          <div class="stat-number">${data.counts.total}</div>
          <div class="stat-label">Total</div>
          <div class="stat-percentage">100%</div>
        </div>
      </div>
    </div>
    `;
    
    res.send(html);
    console.log(`Returned stats cards HTML with ${data.counts.total} total items`);
  } catch (error) {
    console.error('Error in stats/cards route:', error);
    
    // Return error HTML for HTMX
    const errorHtml = `
      <div class="htmx-error">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Update Failed</div>
        <div class="error-message">Unable to refresh statistics. Please try again.</div>
        <button class="retry-button" onclick="htmx.trigger('#statsCards', 'htmx:trigger')">
          Retry
        </button>
      </div>
    `;
    
    res.status(500).send(errorHtml);
  }
});

// HTMX endpoints for individual charts
router.get('/stats/chart/pie', async (req, res) => {
  try {
    console.log('Pie chart endpoint called');
    const statsData = await getOptimizedData('stats');
    console.log('Stats data received:', statsData);
    
    // Extract category data for pie chart
    const data = {
      Male: statsData.categoryCounts.Male || 0,
      Female: statsData.categoryCounts.Female || 0,
      Company: statsData.categoryCounts.Company || 0,
      Group: statsData.categoryCounts.Group || 0
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
    
    // Extract status data for bar chart
    const data = {
      deceased: statsData.counts.deceased || 0,
      active: statsData.counts.active || 0,
      incarcerated: statsData.counts.incarcerated || 0,
      redacted: statsData.counts.redacted || 0,
      unknown: statsData.counts.unknown || 0,
      captured: statsData.counts.captured || 0
    };

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
    
    // Prepare scatter data (v1 vs v2 values)
    const items = masterData.map(item => ({
      v1: item.v1 || 0,
      v2: item.v2 || 0,
      name: item.name || 'Unknown',
      status: item.status || 'unknown'
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
    console.log(`Returned ${data.length} items for status: ${status}`);
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

    // Return HTML fragment for HTMX instead of JSON
    if (req.headers['hx-request']) {
      let html = '';
      if (data && data.length > 0) {
        data.forEach((item, index) => {
          // Use the same ItemRenderer logic as the client-side
          const status = item.status || 'unknown';
          const name = item.name || 'Unknown';
          const v1 = item.v1 || 0;
          const v2 = item.v2 || null;
          
          // Apply status-specific styling
          const statusClass = status === 'redacted' ? 'legend-item redacted' : `legend-item ${status}`;
          
          html += `<div class="${statusClass}">`;
          html += `<span class="guide">#${v1}.</span>`;
          
          if (status === 'redacted') {
            html += '<span class="item-redacted"></span>';
          } else {
            html += '<div class="item-content">';
            html += `<div class="item-name">${name}</div>`;
            html += '</div>';
          }
          
          html += '</div>';
        });
      } else {
        html = '<p style="color: #666; font-style: italic;">No items found</p>';
      }
      res.send(html);
    } else {
      res.json(data);
    }
    
    console.log(`Returned ${data.length} items for status page: ${status}`);
  } catch (error) {
    console.error('Error in status/:status route:', error);
    if (req.headers['hx-request']) {
      res.status(500).send('<p style="color: #FE0000;">Error loading data</p>');
    } else {
      res.status(500).json({ error: 'Something went wrong' });
    }
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

module.exports = router