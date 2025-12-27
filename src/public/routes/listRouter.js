const express = require('express')
const router = express.Router()
const fs = require('fs');
const path = require('path');

// Load static data
const DATA_PATH = path.join(__dirname, '..', 'data', 'blacklist.json');
let BLACKLIST_DATA = [];

function loadData() {
  try {
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    BLACKLIST_DATA = JSON.parse(rawData);
    console.log(`Successfully loaded ${BLACKLIST_DATA.length} items from blacklist.json`);
  } catch (error) {
    console.error('Error loading blacklist.json:', error);
    BLACKLIST_DATA = [];
  }
}

// Initial load
loadData();

// Distribute data across 4 balanced columns (51+50+50+50=201)
function distributeDataAcrossColumns(data) {
  const columns = [[], [], [], []];
  const itemsPerColumn = Math.ceil(data.length / 4); // 51 for first column

  data.forEach((item, index) => {
    const columnIndex = Math.min(Math.floor(index / itemsPerColumn), 3);
    columns[columnIndex].push(item);
  });

  return columns;
}

// Main landing page
router.get('/', (req, res) => {
  const schemaData = BLACKLIST_DATA
    .filter(item => item.v1 >= 0 && item.v1 <= 200)
    .sort((a, b) => (a.v1 || 0) - (b.v1 || 0));

  res.render('index', {
    title: process.env.SITE_TITLE || 'The Blacklist',
    pageUrl: process.env.APP_URL || 'http://localhost:3006',
    includeStructuredData: true,
    preloadFonts: true,
    schemaData: schemaData
  });
});

// Main blacklist route
router.get('/the-blacklist', (req, res) => {
  // Check if request is from mobile device
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (req.headers['hx-request'] || req.query.format === 'json') {
    const v1Data = BLACKLIST_DATA
      .filter(item => item.v1 >= 0 && item.v1 <= 200)
      .sort((a, b) => (a.v1 || 0) - (b.v1 || 0));

    // Pagination logic
    const pageParam = req.query.page;
    const limitParam = req.query.limit;

    // Default: Mobile = 20, Desktop = All (v1Data.length)
    let page = 1;
    let limit = v1Data.length;

    if (pageParam || (isMobile && !limitParam)) {
      page = parseInt(pageParam) || 1;
      // If mobile and no explicit limit, use 10. If desktop and no explicit limit, use full length.
      limit = parseInt(limitParam) || (isMobile ? 10 : v1Data.length);
    } else if (limitParam) {
      limit = parseInt(limitParam);
    }
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};
    results.items = v1Data.slice(startIndex, endIndex);
    results.total = v1Data.length;
    results.hasMore = endIndex < v1Data.length;

    if (results.hasMore) {
      results.next = `/the-blacklist?format=json&page=${page + 1}&limit=${limit}`;
    }

    // Return flat items with metadata for infinite scroll
    res.json(results);
  } else {
    const schemaData = BLACKLIST_DATA
      .filter(item => item.v1 >= 0 && item.v1 <= 200)
      .sort((a, b) => (a.v1 || 0) - (b.v1 || 0));

    // Set init endpoint based on device
    // Mobile gets paginated init for infinite scroll, Desktop gets full init for column layout
    const apiEndpoint = isMobile
      ? '/the-blacklist?format=json&page=1&limit=20'
      : '/the-blacklist?format=json';

    res.render('the-blacklist/index', {
      title: process.env.SITE_TITLE || 'The Blacklist',
      description: process.env.SITE_DESCRIPTION || 'The Blacklist Criminals',
      apiEndpoint: apiEndpoint,
      hideToggleButtons: true,
      customStyling: 'the-blacklist',
      includeStructuredData: true,
      schemaData: schemaData,
      showConfidentialStamp: process.env.SHOW_CONFIDENTIAL_STAMP !== 'false'
    });
  }
});

module.exports = router;