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
  admin = require('../config/firebase-cfg');
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
  const dummyDataPath = path.join(__dirname, '..', 'data', 'dummy-data.json');
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
    const dummyDataPath = path.join(__dirname, '..', 'data', 'dummy-data.json');
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
    const snapshot = await db.collection(collectionName)
      .where('v1', '>=', 0)
      .where('v1', '<=', 200)
      .get();
    
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
  
  // Get master data
  const masterData = await getMasterData();
  
  // Generate derived data
  let result;
  if (specificFilter && dataType === 'status') {
    result = masterData.filter(item => item.status === specificFilter);
  } else {
    result = generateDerivedData(masterData, dataType);
  }
  
  // Cache the derived data
  cache.put(cacheKey, result, CACHE_DURATION);
  console.log(`Generated and cached ${dataType} data: ${Array.isArray(result) ? result.length : 'object'} items`);
  
  return result;
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
router.get('/version1', async (req, res) => {
  try {
    const data = await getOptimizedData('version1');
    res.json(data);
    console.log(`Returned ${data.length} items for version1`);
  } catch (error) {
    console.error('Error in version1 route:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/version2', async (req, res) => {
  try {
    const data = await getOptimizedData('version2');
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
    res.status(500).send('<div class="error-container"><div class="error-message">Error loading stats cards</div></div>');
  }
});

// HTMX endpoints for individual charts
router.get('/stats/chart/pie', async (req, res) => {
  try {
    const statsData = await getOptimizedData('stats');
    
    // Extract category data for pie chart
    const data = {
      counts: statsData.categoryCounts,
      percentages: statsData.categoryPercentages
    };

    // Return HTML with embedded chart data
    res.json(data);
  } catch (error) {
    console.error('Error in pie chart route:', error);
    res.status(500).json({ error: 'Error loading pie chart' });
  }
});

router.get('/stats/chart/bar', async (req, res) => {
  try {
    const data = await getCachedData('stats-bar', async () => {
      try {
        const snapshot = await db.collection(collectionName)
          .where('v1', '>=', 0)
          .where('v1', '<=', 200)
          .get();

        const v1Ranges = {
          '0-50': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 },
          '51-100': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 },
          '101-150': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 },
          '151-200': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0 }
        };

        snapshot.forEach((doc) => {
          const docData = doc.data();
          const status = (docData.status || 'unknown').toLowerCase();
          const v1 = docData.v1;
          
          if (v1 >= 0 && v1 <= 50) {
            v1Ranges['0-50'][status]++;
          } else if (v1 >= 51 && v1 <= 100) {
            v1Ranges['51-100'][status]++;
          } else if (v1 >= 101 && v1 <= 150) {
            v1Ranges['101-150'][status]++;
          } else if (v1 >= 151 && v1 <= 200) {
            v1Ranges['151-200'][status]++;
          }
        });

        return { v1Ranges: v1Ranges };
      } catch (error) {
        console.log('Firestore query failed for bar chart:', error.message);
        if (isQuotaError(error) && DUMMY_DATA && DUMMY_DATA.stats) {
          console.log('Using dummy data fallback for bar chart due to quota exceeded');
          return { v1Ranges: DUMMY_DATA.stats.v1Ranges };
        }
        return { v1Ranges: { '0-50': {}, '51-100': {}, '101-150': {}, '151-200': {} } };
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
    const data = await getCachedData('stats-scatter', async () => {
      try {
        const snapshot = await db.collection(collectionName)
          .where('v1', '>=', 0)
          .where('v1', '<=', 200)
          .get();

        const v1v2Data = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          const status = (docData.status || 'unknown').toLowerCase();
          const v1 = docData.v1;
          const v2 = docData.v2;
          
          if (v1 !== undefined && v2 !== undefined) {
            v1v2Data.push({
              x: v1,
              y: v2,
              status: status,
              name: docData.name
            });
          }
        });

        return { v1v2Data: v1v2Data };
      } catch (error) {
        console.log('Firestore query failed for scatter chart:', error.message);
        if (isQuotaError(error) && DUMMY_DATA && DUMMY_DATA.stats) {
          console.log('Using dummy data fallback for scatter chart due to quota exceeded');
          return { v1v2Data: DUMMY_DATA.stats.v1v2Data };
        }
        return { v1v2Data: [] };
      }
    });

    console.log('Scatter chart data structure:', {
      hasV1V2Data: !!data.v1v2Data,
      isV1V2DataArray: Array.isArray(data.v1v2Data),
      v1v2DataLength: data.v1v2Data ? data.v1v2Data.length : 'no v1v2Data',
      dataKeys: Object.keys(data),
      fullData: data
    });

    res.json(data);
  } catch (error) {
    console.error('Error in scatter chart route:', error);
    res.status(500).json({ error: 'Error loading scatter chart' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const data = await getCachedData('stats', async () => {
  try {
    // Get all items to analyze status distribution
    const snapshot = await db.collection(collectionName)
      .where('v1', '>=', 0)
      .where('v1', '<=', 200)
      .get();

    const statusCounts = {
      deceased: 0,
      active: 0,
      incarcerated: 0,
      redacted: 0,
      unknown: 0,
        captured: 0,
      total: 0
    };

    const statusItems = {
      deceased: [],
      active: [],
      incarcerated: [],
      redacted: [],
        unknown: [],
        captured: []
    };

    snapshot.forEach((doc) => {
      const docData = doc.data();
      const status = (docData.status || 'unknown').toLowerCase();
      
      statusCounts.total++;
      
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
        statusItems[status].push({
          id: doc.id,
          name: docData.name,
          v1: docData.v1,
          v2: docData.v2,
          status: docData.status
        });
      } else {
        statusCounts.unknown++;
        statusItems.unknown.push({
          id: doc.id,
          name: docData.name,
          v1: docData.v1,
          v2: docData.v2,
          status: docData.status
        });
      }
    });

    // Calculate percentages
    const percentages = {};
    Object.keys(statusCounts).forEach(key => {
      if (key !== 'total') {
        percentages[key] = ((statusCounts[key] / statusCounts.total) * 100).toFixed(1);
      }
    });

      // Prepare data for additional charts
      const v1Ranges = {
        '0-50': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
        '51-100': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
        '101-150': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
        '151-200': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 }
      };

      const v1v2Data = [];

      snapshot.forEach((doc) => {
        const docData = doc.data();
        const status = (docData.status || 'unknown').toLowerCase();
        const v1 = docData.v1;
        const v2 = docData.v2;
        
        // Categorize by v1 ranges
        if (v1 >= 0 && v1 <= 50) {
          v1Ranges['0-50'][status]++;
        } else if (v1 >= 51 && v1 <= 100) {
          v1Ranges['51-100'][status]++;
        } else if (v1 >= 101 && v1 <= 150) {
          v1Ranges['101-150'][status]++;
        } else if (v1 >= 151 && v1 <= 200) {
          v1Ranges['151-200'][status]++;
        }

        // Collect v1 vs v2 data
        if (v1 !== undefined && v2 !== undefined) {
          v1v2Data.push({
            x: v1,
            y: v2,
            status: status,
            name: docData.name
          });
        }
      });

        return {
      counts: statusCounts,
      percentages: percentages,
          items: statusItems,
          v1Ranges: v1Ranges,
          v1v2Data: v1v2Data
        };
      } catch (error) {
        console.log('Firestore query failed for stats:', error.message);
        
        // Only use dummy data for quota errors
        if (isQuotaError(error) && DUMMY_DATA && DUMMY_DATA.stats) {
          console.log('Using dummy data fallback for stats due to quota exceeded');
          return DUMMY_DATA.stats;
        }
        
        // If no dummy data available, return empty stats
        return {
          counts: { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0, total: 0 },
          percentages: { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
          items: { deceased: [], active: [], incarcerated: [], redacted: [], unknown: [], captured: [] },
          v1Ranges: {
            '0-50': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
            '51-100': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
            '101-150': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 },
            '151-200': { deceased: 0, active: 0, incarcerated: 0, redacted: 0, unknown: 0, captured: 0 }
          },
          v1v2Data: []
        };
      }
    });

    res.json(data);
    console.log(`Returned stats data with ${data.counts.total} total items`);
  } catch (error) {
    console.error('Error in stats route:', error);
    res.status(500).json({ error: 'Something went wrong' });
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
    const data = await getOptimizedData('status', status);

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