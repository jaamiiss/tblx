const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Add JSON parsing middleware for admin routes
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    logger.warn('Admin Router: Firebase Admin not initialized');
    db = null;
  }
} catch (error) {
  console.error('Admin Router: Failed to initialize Firebase:', error.message);
  admin = null;
  db = null;
  DUMMY_DATA = null;
  logger = { info: () => {}, debug: () => {}, error: console.error, warn: console.warn };
  metrics = {};
  DEBUG_MODE = false;
}

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const ADMIN_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for admin data
const MASTER_CACHE_KEY = 'master_data';
const ADMIN_ALL_ITEMS_KEY = 'admin_all_items';
const ADMIN_ITEM_PREFIX = 'admin_item_';
const ADMIN_STATS_KEY = 'admin_stats';

// Helper function to safely access Firestore
async function safeFirestoreQuery(queryFn) {
  if (!db) {
    throw new Error('Firestore not available');
  }
  return await queryFn();
}

// Dummy data is now loaded from shared config

// Get all items for admin view with enhanced caching
async function getAllItems() {
  const cachedData = cache.get(ADMIN_ALL_ITEMS_KEY);
  if (cachedData) {
    console.log('Admin Router: Cache hit for admin_all_items');
    return cachedData;
  }

  try {
    console.log('Admin Router: Cache miss for admin_all_items, fetching from Firestore');
    const snapshot = await db.collection(collectionName).get();
    
    const items = [];
    snapshot.forEach((doc) => {
      const docData = doc.data();
      const item = {
        id: doc.id,
        ...docData
      };
      items.push(item);
      
      // Cache individual items for faster access
      cache.put(`${ADMIN_ITEM_PREFIX}${doc.id}`, item, ADMIN_CACHE_DURATION);
    });
    
    // Cache the full list
    cache.put(ADMIN_ALL_ITEMS_KEY, items, ADMIN_CACHE_DURATION);
    
    // Update admin stats cache
    updateAdminStatsCache(items);
    
    console.log(`Admin Router: All items cached: ${items.length} items`);
    return items;
  } catch (error) {
    console.error('Admin Router: Error fetching all items:', error);
    return DUMMY_DATA.all || [];
  }
}

// Update admin statistics cache
function updateAdminStatsCache(items) {
  const stats = {
    total: items.length,
    byStatus: {},
    byCategory: {},
    lastUpdated: new Date().toISOString()
  };
  
  items.forEach(item => {
    // Count by status
    const status = item.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Count by category
    const category = item.category || 'unknown';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });
  
  cache.put(ADMIN_STATS_KEY, stats, ADMIN_CACHE_DURATION);
  console.log('Admin Router: Admin stats cache updated');
}

// Get single item by ID with caching
async function getItemById(itemId) {
  // Check cache first
  const cacheKey = `${ADMIN_ITEM_PREFIX}${itemId}`;
  const cachedItem = cache.get(cacheKey);
  if (cachedItem) {
    console.log(`Admin Router: Cache hit for item ${itemId}`);
    return cachedItem;
  }

  try {
    console.log(`Admin Router: Cache miss for item ${itemId}, fetching from Firestore`);
    const doc = await db.collection(collectionName).doc(itemId).get();
    if (doc.exists) {
      const item = {
        id: doc.id,
        ...doc.data()
      };
      
      // Cache the individual item
      cache.put(cacheKey, item, ADMIN_CACHE_DURATION);
      console.log(`Admin Router: Item ${itemId} cached`);
      
      return item;
    }
    return null;
  } catch (error) {
    console.error('Admin Router: Error fetching item by ID:', error);
    return null;
  }
}

// Update single item
async function updateItem(itemId, updateData) {
  try {
    // Validate and sanitize update data
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Invalid update data: must be an object');
    }
    
    // Create a clean object with only valid fields
    const cleanData = {};
    const validFields = ['name', 'status', 'category', 'v1', 'v2'];
    
    validFields.forEach(field => {
      if (updateData.hasOwnProperty(field) && updateData[field] !== undefined && updateData[field] !== null) {
        // For name field, allow empty strings but trim them
        if (field === 'name') {
          cleanData[field] = updateData[field].toString().trim();
        } else {
          cleanData[field] = updateData[field];
        }
      }
    });
    
    // Ensure we have at least one field to update
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    console.log(`Admin Router: Updating item ${itemId} with data:`, cleanData);
    await db.collection(collectionName).doc(itemId).update(cleanData);
    
    // Smart cache invalidation - update individual item cache
    const cacheKey = `${ADMIN_ITEM_PREFIX}${itemId}`;
    const cachedItem = cache.get(cacheKey);
    if (cachedItem) {
      // Update the cached item with new data
      Object.assign(cachedItem, cleanData);
      cache.put(cacheKey, cachedItem, ADMIN_CACHE_DURATION);
      console.log(`Admin Router: Updated cached item ${itemId}`);
    }
    
    // Clear list caches that might be affected
    cache.del(ADMIN_ALL_ITEMS_KEY);
    cache.del(ADMIN_STATS_KEY);
    cache.del(MASTER_CACHE_KEY);
    
    console.log(`Admin Router: Item ${itemId} updated successfully`);
    return { success: true, message: 'Item updated successfully' };
  } catch (error) {
    console.error('Admin Router: Error updating item:', error);
    return { success: false, message: error.message };
  }
}


// Debug mode endpoint
router.get('/api/debug-mode', (req, res) => {
  res.json({
    debugMode: DEBUG_MODE,
    logLevel: process.env.LOG_LEVEL || 'info',
    metrics: {
      ...metrics,
      uptime: Date.now() - metrics.startTime,
      cacheStats: {
        masterCache: cache.get(MASTER_CACHE_KEY) ? 'hit' : 'miss',
        adminCache: cache.get(ADMIN_ALL_ITEMS_KEY) ? 'hit' : 'miss'
      }
    }
  });
});

// Toggle debug mode endpoint
router.post('/api/toggle-debug', (req, res) => {
  const { debugMode } = req.body;
  process.env.DEBUG_MODE = debugMode ? 'true' : 'false';
  res.json({ 
    success: true, 
    debugMode: process.env.DEBUG_MODE === 'true',
    message: `Debug mode ${debugMode ? 'enabled' : 'disabled'}`
  });
});

// Routes

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    const items = await getAllItems();
    res.render('dashboard', { 
      items: items,
      totalItems: items.length,
      pageTitle: 'Admin Dashboard',
      activeTab: 'dashboard'
    });
  } catch (error) {
    console.error('Admin Router: Error in dashboard route:', error);
    res.status(500).render('error', { error: 'Failed to load dashboard' });
  }
});

// Admin items page
router.get('/items', async (req, res) => {
  try {
    const items = await getAllItems();
    res.render('items', { 
      items: items,
      totalItems: items.length,
      pageTitle: 'Item Management',
      activeTab: 'items'
    });
  } catch (error) {
    console.error('Admin Router: Error in items route:', error);
    res.status(500).render('error', { error: 'Failed to load items page' });
  }
});


// Get all items API
router.get('/api/items', async (req, res) => {
  try {
    const items = await getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Admin Router: Error in items API:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item API
router.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Admin Router: Error in single item API:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Update single item API
router.put('/api/items/:id', async (req, res) => {
  try {
    console.log('Admin Router: Update request received');
    console.log('Admin Router: Item ID:', req.params.id);
    console.log('Admin Router: Request body:', req.body);
    console.log('Admin Router: Body type:', typeof req.body);
    console.log('Admin Router: Body keys:', Object.keys(req.body || {}));
    
    const result = await updateItem(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Admin Router: Error in update item API:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});


// Get admin statistics API
router.get('/api/stats', async (req, res) => {
  try {
    // Check cache first
    const cachedStats = cache.get(ADMIN_STATS_KEY);
    if (cachedStats) {
      console.log('Admin Router: Cache hit for admin stats');
      return res.json(cachedStats);
    }

    // If no cached stats, get items and generate stats
    const items = await getAllItems();
    const stats = {
      total: items.length,
      byStatus: {},
      byCategory: {},
      lastUpdated: new Date().toISOString()
    };
    
    items.forEach(item => {
      const status = item.status || 'unknown';
      const category = item.category || 'unknown';
      
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    // Cache the stats
    cache.put(ADMIN_STATS_KEY, stats, ADMIN_CACHE_DURATION);
    
    res.json(stats);
  } catch (error) {
    console.error('Admin Router: Error in stats API:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// Search items API
router.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const items = await getAllItems();
    
    if (!query) {
      return res.json(items);
    }
    
    const filteredItems = items.filter(item => 
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.status?.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.toLowerCase().includes(query.toLowerCase()) ||
      item.id?.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filteredItems);
  } catch (error) {
    console.error('Admin Router: Error in search API:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

// Clear admin cache
router.post('/api/clear-cache', (req, res) => {
  try {
    // Clear all admin-related caches
    cache.del(ADMIN_ALL_ITEMS_KEY);
    cache.del(ADMIN_STATS_KEY);
    cache.del(MASTER_CACHE_KEY);
    
    // Clear individual item caches (approximate)
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.startsWith(ADMIN_ITEM_PREFIX)) {
        cache.del(key);
      }
    });
    
    console.log('Admin Router: All admin caches cleared');
    res.json({ success: true, message: 'Admin cache cleared' });
  } catch (error) {
    console.error('Admin Router: Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Warm admin cache
router.post('/api/warm-cache', async (req, res) => {
  try {
    console.log('Admin Router: Warming admin cache...');
    
    // Pre-load all items
    await getAllItems();
    
    // Pre-load stats
    const stats = cache.get(ADMIN_STATS_KEY);
    if (!stats) {
      const items = await getAllItems();
      updateAdminStatsCache(items);
    }
    
    console.log('Admin Router: Admin cache warmed successfully');
    res.json({ success: true, message: 'Admin cache warmed' });
  } catch (error) {
    console.error('Admin Router: Error warming cache:', error);
    res.status(500).json({ error: 'Failed to warm cache' });
  }
});

// Quota status API
router.get('/api/quota-status', async (req, res) => {
  try {
    // For now, return a mock quota status
    // In a real implementation, you would check actual Firestore quota
    const quotaStatus = {
      success: true,
      data: {
        quotaExceeded: false,
        quotaUsed: 0,
        quotaLimit: 1000000,
        quotaResetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    res.json(quotaStatus);
  } catch (error) {
    console.error('Admin Router: Quota status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check quota status' 
    });
  }
});

module.exports = router;
