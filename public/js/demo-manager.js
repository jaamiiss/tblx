// Global Demo Data Manager
class DemoManager {
  constructor() {
    this.demoMode = false;
    this.loadedPages = new Set();
    this.demoDataCache = new Map(); // Cache demo data responses
    
    // Immediately disable HTMX to prevent conflicts
    this.disableHTMXRequests();
    
    this.init();
  }

  init() {
    // Check localStorage for demo mode
    this.demoMode = localStorage.getItem('demoMode') === 'true';
    
    // Load demo data cache from localStorage
    this.loadDemoDataCache();
    
    // Listen for demo mode changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'demoMode') {
        this.demoMode = e.newValue === 'true';
        this.handleDemoModeChange();
      }
    });

    // If demo mode is already enabled, keep HTMX disabled
    if (this.demoMode) {
      console.log('Demo Manager: Demo mode already enabled, keeping HTMX disabled');
      this.showDemoModeIndicator();
      this.hideHTMXSpinner();
      this.disableHTMXRequests();
      // Trigger demo mode change event for current page
      setTimeout(() => this.handleDemoModeChange(), 100);
    } else {
      // Disable HTMX requests until quota check is complete
      this.disableHTMXRequests();
      // Check quota status on page load
      this.checkQuotaStatus();
    }
  }

  disableHTMXRequests() {
    // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.disableHTMXRequests());
      return;
    }
    
    // Find all HTMX elements and temporarily disable them
    const htmxElements = document.querySelectorAll('[hx-get], [hx-post], [hx-put], [hx-delete]');
    console.log(`Demo Manager: Disabling ${htmxElements.length} HTMX elements`);
    
    htmxElements.forEach(element => {
      // Store original attributes
      element.setAttribute('data-original-hx-get', element.getAttribute('hx-get') || '');
      element.setAttribute('data-original-hx-post', element.getAttribute('hx-post') || '');
      element.setAttribute('data-original-hx-put', element.getAttribute('hx-put') || '');
      element.setAttribute('data-original-hx-delete', element.getAttribute('hx-delete') || '');
      element.setAttribute('data-original-hx-trigger', element.getAttribute('hx-trigger') || '');
      element.setAttribute('data-original-hx-indicator', element.getAttribute('hx-indicator') || '');
      
      // Remove HTMX attributes to prevent requests
      element.removeAttribute('hx-get');
      element.removeAttribute('hx-post');
      element.removeAttribute('hx-put');
      element.removeAttribute('hx-delete');
      element.removeAttribute('hx-trigger');
      element.removeAttribute('hx-indicator');
      
      // Add a data attribute to mark as disabled
      element.setAttribute('data-htmx-disabled', 'true');
    });
    
    // Hide HTMX spinners
    const htmxSpinners = document.querySelectorAll('.htmx-indicator, #spinner, #loading-spinner, #stats-loading-spinner');
    htmxSpinners.forEach(spinner => {
      spinner.style.display = 'none';
    });
    
    console.log(`Demo Manager: Disabled ${htmxElements.length} HTMX elements and ${htmxSpinners.length} spinners`);
    
    // Check and hide spinner after content loads
    this.checkAndHideSpinner();
    
    // Set up listeners to hide spinner after HTMX requests
    this.setupSpinnerHideListeners();
  }

  // Hide spinners if content is already loaded
  hideSpinnersIfContentLoaded() {
    const containers = ['dataList', 'statusItems', 'statsCards'];
    containers.forEach(containerId => {
      if (this.hasAnyContent(containerId)) {
        const spinner = document.getElementById('spinner');
        if (spinner) {
          spinner.classList.add('content-loaded');
          console.log(`Demo Manager: Hidden spinner for ${containerId} - content already loaded`);
        }
        
        // Remove loading state class
        this.hideLoadingState();
      }
    });
  }

  // Check and hide spinner after content loads (with retry)
  checkAndHideSpinner() {
    // Check immediately
    this.hideSpinnersIfContentLoaded();
    
    // Also check after a short delay to catch content that loads asynchronously
    setTimeout(() => {
      this.hideSpinnersIfContentLoaded();
    }, 100);
    
    // Check again after HTMX requests complete
    setTimeout(() => {
      this.hideSpinnersIfContentLoaded();
    }, 500);
  }

  // Set up HTMX event listeners to hide spinner after requests
  setupSpinnerHideListeners() {
    // Hide spinner after successful HTMX requests
    document.addEventListener('htmx:afterRequest', (event) => {
      if (event.detail.successful) {
        setTimeout(() => {
          this.hideSpinnersIfContentLoaded();
        }, 50);
      }
    });

    // Hide spinner after HTMX content is swapped
    document.addEventListener('htmx:afterSwap', (event) => {
      setTimeout(() => {
        this.hideSpinnersIfContentLoaded();
      }, 50);
    });
  }

  // Force hide spinner (for immediate use)
  forceHideSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
      spinner.classList.add('content-loaded');
      console.log('Demo Manager: Force hidden spinner');
    }
    
    // Remove loading state class
    document.body.classList.remove('loading-active');
  }

  // Show loading state with opacity
  showLoadingState() {
    document.body.classList.add('loading-active');
  }

  // Hide loading state with opacity
  hideLoadingState() {
    document.body.classList.remove('loading-active');
  }

  enableHTMXRequests() {
    // Re-enable HTMX requests
    const htmxElements = document.querySelectorAll('[data-original-hx-get], [data-original-hx-post], [data-original-hx-put], [data-original-hx-delete]');
    console.log(`Demo Manager: Re-enabling ${htmxElements.length} HTMX elements`);
    htmxElements.forEach(element => {
      const originalGet = element.getAttribute('data-original-hx-get');
      const originalPost = element.getAttribute('data-original-hx-post');
      const originalPut = element.getAttribute('data-original-hx-put');
      const originalDelete = element.getAttribute('data-original-hx-delete');
      const originalTrigger = element.getAttribute('data-original-hx-trigger');
      const originalIndicator = element.getAttribute('data-original-hx-indicator');
      
      if (originalGet) element.setAttribute('hx-get', originalGet);
      if (originalPost) element.setAttribute('hx-post', originalPost);
      if (originalPut) element.setAttribute('hx-put', originalPut);
      if (originalDelete) element.setAttribute('hx-delete', originalDelete);
      if (originalTrigger) element.setAttribute('hx-trigger', originalTrigger);
      if (originalIndicator) element.setAttribute('hx-indicator', originalIndicator);
      
      element.removeAttribute('data-original-hx-get');
      element.removeAttribute('data-original-hx-post');
      element.removeAttribute('data-original-hx-put');
      element.removeAttribute('data-original-hx-delete');
      element.removeAttribute('data-original-hx-trigger');
      element.removeAttribute('data-original-hx-indicator');
      element.removeAttribute('data-htmx-disabled');
    });
    
    // Show HTMX spinners if not in demo mode
    if (!this.demoMode) {
      const htmxSpinners = document.querySelectorAll('.htmx-indicator, #spinner, #loading-spinner, #stats-loading-spinner');
      htmxSpinners.forEach(spinner => {
        spinner.style.display = 'block';
      });
    }
    
    console.log(`Demo Manager: Re-enabled ${htmxElements.length} HTMX elements`);
  }

  async checkQuotaStatus() {
    try {
      console.log('Demo Manager: Checking quota status...');
      const response = await fetch('/list/quota-status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const quotaStatus = await response.json();
      console.log('Demo Manager: Quota status response:', quotaStatus);
      
      if (!quotaStatus.canUseFirestore) {
        console.log('Demo Manager: Firestore quota exceeded, showing demo button');
        this.showDemoButton();
      } else {
        console.log('Demo Manager: Firestore available, disabling demo mode and enabling HTMX requests');
        // Disable demo mode since live data is available
        this.disableDemoMode();
        this.enableHTMXRequests();
      }
    } catch (error) {
      console.error('Demo Manager: Failed to check quota status:', error);
      // Assume quota exceeded if we can't check
      this.showDemoButton();
    }
  }

  showDemoButton() {
    console.log('Demo Manager: Showing demo button');
    // Dispatch event to show demo button on all pages
    window.dispatchEvent(new CustomEvent('showDemoButton', {
      detail: { show: true }
    }));
    // Re-enable HTMX requests so demo data can load
    this.enableHTMXRequests();
  }

  enableDemoMode() {
    this.demoMode = true;
    localStorage.setItem('demoMode', 'true');
    // Clear cache when enabling demo mode to ensure fresh data
    this.demoDataCache.clear();
    localStorage.removeItem('demoDataCache');
    this.showDemoModeIndicator();
    this.hideHTMXSpinner();
    this.handleDemoModeChange();
    // Keep HTMX disabled in demo mode to prevent conflicts
    this.disableHTMXRequests();
  }

  hideHTMXSpinner() {
    const htmxSpinner = document.getElementById('spinner');
    if (htmxSpinner) {
      htmxSpinner.style.display = 'none';
    }
  }

  // Persist demo data cache to localStorage
  saveDemoDataCache() {
    try {
      const cacheData = {};
      this.demoDataCache.forEach((value, key) => {
        cacheData[key] = value;
      });
      const serialized = JSON.stringify(cacheData);
      localStorage.setItem('demoDataCache', serialized);
      console.log(`Demo Manager: ✅ Saved demo data cache to localStorage (${serialized.length} chars, ${this.demoDataCache.size} entries)`);
    } catch (error) {
      console.warn('Demo Manager: ❌ Failed to save demo data cache:', error);
    }
  }

  // Load demo data cache from localStorage
  loadDemoDataCache() {
    try {
      const cacheData = localStorage.getItem('demoDataCache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.demoDataCache = new Map(Object.entries(parsed));
        console.log(`Demo Manager: ✅ Loaded demo data cache from localStorage: ${this.demoDataCache.size} entries`);
        console.log(`Demo Manager: Cache keys loaded:`, Array.from(this.demoDataCache.keys()));
      } else {
        console.log('Demo Manager: No demo data cache found in localStorage');
      }
    } catch (error) {
      console.warn('Demo Manager: ❌ Failed to load demo data cache:', error);
      this.demoDataCache = new Map();
    }
  }

  showDemoModeIndicator() {
    // Wait for DOM to be ready before adding indicator
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.showDemoModeIndicator());
      return;
    }
    
    // Add demo mode indicator to the page
    let indicator = document.getElementById('demo-mode-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'demo-mode-indicator';
      indicator.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          Demo Mode Active
        </div>
      `;
      document.body.appendChild(indicator);
    }
  }

  hideDemoModeIndicator() {
    const indicator = document.getElementById('demo-mode-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Add button loading state
  setButtonLoading(button, isLoading) {
    if (button) {
      if (isLoading) {
        button.disabled = true;
        button.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center;">
            <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
            Loading Demo Data...
          </div>
        `;
      } else {
        button.disabled = false;
        button.innerHTML = window.StringSchema.getButtonLabel('loadDemo');
      }
    }
  }

  disableDemoMode() {
    this.demoMode = false;
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoDataCache'); // Clear persisted cache
    this.loadedPages.clear();
    this.demoDataCache.clear(); // Clear demo data cache
    this.hideDemoModeIndicator();
    this.handleDemoModeChange();
  }

  // Method to detect successful live data loading and disable demo mode
  onLiveDataLoaded(pageId, containerId) {
    console.log(`Demo Manager: Live data loaded for ${pageId} in ${containerId}`);
    
    // Hide spinner since content is now loaded
    this.hideSpinnersIfContentLoaded();
    
    // Check if demo mode is currently active
    if (this.demoMode) {
      console.log('Demo Manager: Live data detected, disabling demo mode');
      this.disableDemoMode();
      
      // Clear any demo content from the container
      const container = document.getElementById(containerId);
      if (container) {
        // Remove demo mode indicator if present
        const demoIndicator = container.querySelector('.demo-mode-indicator');
        if (demoIndicator) {
          demoIndicator.remove();
        }
      }
    }
  }

  handleDemoModeChange() {
    // Dispatch custom event for layouts to listen to
    window.dispatchEvent(new CustomEvent('demoModeChanged', {
      detail: { demoMode: this.demoMode }
    }));
    
    // Auto-load demo data for current page if demo mode is enabled
    if (this.demoMode) {
      // Ensure DOM is ready before auto-loading
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('Demo Manager: DOM ready in handleDemoModeChange, auto-loading demo data');
          this.autoLoadCurrentPageDemoData();
        });
      } else {
        console.log('Demo Manager: DOM already ready in handleDemoModeChange, auto-loading demo data');
        this.autoLoadCurrentPageDemoData();
      }
    }
  }

  autoLoadCurrentPageDemoData() {
    const currentPath = window.location.pathname;
    const autoLoadStartTime = performance.now();
    console.log(`Demo Manager: 🚀 Auto-loading demo data for: ${currentPath}`);
    console.log(`Demo Manager: Current demo mode: ${this.demoMode}`);
    console.log(`Demo Manager: Current loaded pages: [${Array.from(this.loadedPages).join(', ')}]`);
    console.log(`Demo Manager: DOM ready state: ${document.readyState}`);
    
    // Check if demo data is already loaded for this page
    const isLoaded = this.isDemoDataLoaded(currentPath);
    console.log(`Demo Manager: Demo data loaded check for ${currentPath}: ${isLoaded}`);
    
    if (isLoaded) {
      const autoLoadEndTime = performance.now();
      console.log(`Demo Manager: ✅ Demo data already loaded for: ${currentPath} - skipping auto-load (${(autoLoadEndTime - autoLoadStartTime).toFixed(2)}ms)`);
      return;
    }
    
    console.log(`Demo Manager: 📋 Determining page type for: ${currentPath}`);
    
    // Determine page type and load appropriate demo data
    if (currentPath.includes('/list/v2')) {
      console.log(`Demo Manager: 📄 Detected V2 list page - loading demo data`);
      this.loadDemoDataForPage('list-v2', '/list/version2', 'dataList', window.renderListData);
    } else if (currentPath.includes('/list') && !currentPath.includes('/v2')) {
      console.log(`Demo Manager: 📄 Detected V1 list page - loading demo data`);
      this.loadDemoDataForPage('list-v1', '/list/version1', 'dataList', window.renderListData);
    } else if (currentPath.includes('/stats')) {
      console.log(`Demo Manager: 📊 Detected stats page - loading demo data progressively`);
      console.log(`Demo Manager: renderStatsCards available:`, typeof window.renderStatsCards);
      console.log(`Demo Manager: renderPieChart available:`, typeof window.renderPieChart);
      console.log(`Demo Manager: renderBarChart available:`, typeof window.renderBarChart);
      console.log(`Demo Manager: renderScatterChart available:`, typeof window.renderScatterChart);
      
      // Load stats cards first with a small delay to ensure render functions are available
      setTimeout(() => {
        if (typeof window.renderStatsCards === 'function') {
          console.log('Demo Manager: renderStatsCards is available, loading stats cards');
          this.loadDemoDataForPage('stats-cards', '/list/stats', 'statsCards', window.renderStatsCards);
        } else {
          console.error('Demo Manager: renderStatsCards is not available, retrying in 500ms');
          setTimeout(() => {
            if (typeof window.renderStatsCards === 'function') {
              this.loadDemoDataForPage('stats-cards', '/list/stats', 'statsCards', window.renderStatsCards);
            } else {
              console.error('Demo Manager: renderStatsCards still not available after retry');
            }
          }, 500);
        }
      }, 100);
      
      // Load charts progressively
      setTimeout(() => {
        console.log('Demo Manager: Attempting to load pie chart...');
        if (typeof window.renderPieChart === 'function') {
          console.log('Demo Manager: renderPieChart is available, loading pie chart');
          this.loadDemoDataForPage('stats-pie', '/list/stats/chart/pie', 'pieChartContainer', window.renderPieChart);
        } else {
          console.error('Demo Manager: renderPieChart not available, retrying in 500ms');
          setTimeout(() => {
            if (typeof window.renderPieChart === 'function') {
              console.log('Demo Manager: renderPieChart now available, loading pie chart');
              this.loadDemoDataForPage('stats-pie', '/list/stats/chart/pie', 'pieChartContainer', window.renderPieChart);
            } else {
              console.error('Demo Manager: renderPieChart still not available after retry');
            }
          }, 500);
        }
      }, 300);
      
      setTimeout(() => {
        console.log('Demo Manager: Attempting to load bar chart...');
        if (typeof window.renderBarChart === 'function') {
          console.log('Demo Manager: renderBarChart is available, loading bar chart');
          this.loadDemoDataForPage('stats-bar', '/list/stats/chart/bar', 'barChartContainer', window.renderBarChart);
        } else {
          console.error('Demo Manager: renderBarChart not available, retrying in 500ms');
          setTimeout(() => {
            if (typeof window.renderBarChart === 'function') {
              console.log('Demo Manager: renderBarChart now available, loading bar chart');
              this.loadDemoDataForPage('stats-bar', '/list/stats/chart/bar', 'barChartContainer', window.renderBarChart);
            } else {
              console.error('Demo Manager: renderBarChart still not available after retry');
            }
          }, 500);
        }
      }, 600);
      
      setTimeout(() => {
        console.log('Demo Manager: Attempting to load scatter chart...');
        if (typeof window.renderScatterChart === 'function') {
          console.log('Demo Manager: renderScatterChart is available, loading scatter chart');
          this.loadDemoDataForPage('stats-scatter', '/list/stats/chart/scatter', 'scatterChartContainer', window.renderScatterChart);
        } else {
          console.error('Demo Manager: renderScatterChart not available, retrying in 500ms');
          setTimeout(() => {
            if (typeof window.renderScatterChart === 'function') {
              console.log('Demo Manager: renderScatterChart now available, loading scatter chart');
              this.loadDemoDataForPage('stats-scatter', '/list/stats/chart/scatter', 'scatterChartContainer', window.renderScatterChart);
            } else {
              console.error('Demo Manager: renderScatterChart still not available after retry');
            }
          }, 500);
        }
      }, 900);
    } else if (currentPath.includes('/status/')) {
      const status = currentPath.split('/status/')[1];
      if (status) {
        console.log(`Demo Manager: 📋 Detected status page: ${status} - loading demo data`);
        this.loadDemoDataForPage(`status-${status}`, `/list/status/${status}`, 'statusItems', window.renderStatusData);
      }
    } else {
      console.log(`Demo Manager: ❓ Unknown page type: ${currentPath} - no demo data to load`);
    }
    
    const autoLoadEndTime = performance.now();
    console.log(`Demo Manager: ⏱️ Auto-load process completed for ${currentPath} in ${(autoLoadEndTime - autoLoadStartTime).toFixed(2)}ms`);
  }

  isDemoDataLoaded(path) {
    console.log(`Demo Manager: Checking if demo data is loaded for path: ${path}`);
    
    // Check if demo data is already loaded for this path
    let pageId, containerId, isLoaded;
    
    if (path.includes('/list/v2')) {
      pageId = 'list-v2';
      containerId = 'dataList';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/list') && !path.includes('/v2')) {
      pageId = 'list-v1';
      containerId = 'dataList';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/stats/chart/pie')) {
      pageId = 'stats-pie';
      containerId = 'pieChartContainer';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/stats/chart/bar')) {
      pageId = 'stats-bar';
      containerId = 'barChartContainer';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/stats/chart/scatter')) {
      pageId = 'stats-scatter';
      containerId = 'scatterChartContainer';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/stats')) {
      pageId = 'stats-cards';
      containerId = 'statsCards';
      isLoaded = this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else if (path.includes('/status/')) {
      const status = path.split('/status/')[1];
      pageId = `status-${status}`;
      containerId = 'statusItems';
      isLoaded = status && this.loadedPages.has(pageId) && this.hasDemoContent(containerId);
    } else {
      isLoaded = false;
    }
    
    console.log(`Demo Manager: isDemoDataLoaded(${path}) = ${isLoaded} (pageId: ${pageId}, containerId: ${containerId}, hasPage: ${this.loadedPages.has(pageId)}, hasContent: ${this.hasDemoContent(containerId)})`);
    return isLoaded;
  }

  hasDemoContent(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.log(`Demo Manager: hasDemoContent(${containerId}) = false (container not found)`);
      return false;
    }
    
    // Check if container has demo content (not loading indicators or error messages)
    const hasContent = container.children.length > 0;
    const hasLoadingIndicator = container.querySelector('.demo-loading-indicator');
    const hasError = container.querySelector('.quota-exceeded-message');
    
    // Check for actual demo content (list items, cards, etc.)
    const hasListItems = container.querySelector('.list-item, .item, .card, .status-item');
    const hasStatsCards = container.querySelector('.stats-card, .stat-card');
    const hasChartCanvas = container.querySelector('canvas');
    
    // For chart containers, canvas presence indicates content
    const isChartContainer = containerId.includes('ChartContainer');
    const hasActualContent = hasListItems || hasStatsCards || hasChartCanvas;
    const result = hasContent && hasActualContent && !hasLoadingIndicator && (!hasError || isChartContainer);
    
    console.log(`Demo Manager: hasDemoContent(${containerId}) = ${result} (hasContent: ${hasContent}, hasActualContent: ${hasActualContent}, hasLoadingIndicator: ${!!hasLoadingIndicator}, hasError: ${!!hasError}, children: ${container.children.length})`);
    console.log(`Demo Manager: Content details - hasListItems: ${!!hasListItems}, hasStatsCards: ${!!hasStatsCards}, hasChartCanvas: ${!!hasChartCanvas}`);
    return result;
  }

  // Check if container has any content (demo or live data)
  hasAnyContent(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      return false;
    }
    
    // Check for any content (list items, cards, charts, etc.)
    const hasListItems = container.querySelector('.list-item, .item, .card, .status-item, .legend-item');
    const hasStatsCards = container.querySelector('.stats-card, .stat-card');
    const hasChartCanvas = container.querySelector('canvas');
    const hasAnyContent = hasListItems || hasStatsCards || hasChartCanvas;
    
    // Don't count loading indicators or error messages as content
    const hasLoadingIndicator = container.querySelector('.htmx-indicator, .demo-loading-indicator, #spinner');
    const hasError = container.querySelector('.quota-exceeded-message, .error-message');
    
    return hasAnyContent && !hasLoadingIndicator && !hasError;
  }

  shouldLoadDemoData(pageId) {
    // Check if demo mode is enabled and data is not already loaded
    const hasPageInLoadedSet = this.loadedPages.has(pageId);
    
    // Also check if content is actually present in the DOM
    let containerId;
    if (pageId.includes('list-v1') || pageId.includes('list-v2')) {
      containerId = 'dataList';
    } else if (pageId.includes('stats-cards')) {
      containerId = 'statsCards';
    } else if (pageId.includes('stats-pie')) {
      containerId = 'pieChartContainer';
    } else if (pageId.includes('stats-bar')) {
      containerId = 'barChartContainer';
    } else if (pageId.includes('stats-scatter')) {
      containerId = 'scatterChartContainer';
    } else if (pageId.includes('status-')) {
      containerId = 'statusItems';
    } else {
      containerId = 'dataList'; // fallback
    }
    
    const hasActualContent = this.hasDemoContent(containerId);
    const shouldLoad = this.demoMode && (!hasPageInLoadedSet || !hasActualContent);
    
    console.log(`Demo Manager: shouldLoadDemoData(${pageId}) = ${shouldLoad} (demoMode: ${this.demoMode}, hasPageInLoadedSet: ${hasPageInLoadedSet}, hasActualContent: ${hasActualContent}, containerId: ${containerId})`);
    return shouldLoad;
  }

  markPageLoaded(pageId) {
    this.loadedPages.add(pageId);
    console.log(`Demo Manager: ✅ Marked page as loaded: ${pageId} (total loaded: [${Array.from(this.loadedPages).join(', ')}])`);
  }

  isDemoMode() {
    return this.demoMode;
  }

  // Method to check if current page has demo data loaded
  hasCurrentPageDemoData() {
    return this.isDemoDataLoaded(window.location.pathname);
  }

  // Method to check if demo data is cached for an endpoint
  isDemoDataCached(endpoint) {
    return this.demoDataCache.has(endpoint);
  }

  // Global function to load demo data for any page
  async loadDemoDataForPage(pageId, endpoint, containerId, renderFunction) {
    console.log(`Demo Manager: loadDemoDataForPage called - pageId: ${pageId}, endpoint: ${endpoint}, containerId: ${containerId}`);
    console.log(`Demo Manager: shouldLoadDemoData(${pageId}): ${this.shouldLoadDemoData(pageId)}`);
    console.log(`Demo Manager: demoDataCache size: ${this.demoDataCache.size}`);
    console.log(`Demo Manager: demoDataCache keys:`, Array.from(this.demoDataCache.keys()));
    
    // Check if we have cached data but no content - force render from cache
    if (this.demoDataCache.has(endpoint) && !this.hasDemoContent(containerId)) {
      console.log(`Demo Manager: 🔄 CACHE EXISTS BUT NO CONTENT - Force rendering cached data for ${pageId}`);
      const startTime = performance.now();
      const cachedData = this.demoDataCache.get(endpoint);
      
      // Debug cached data structure
      console.log(`Demo Manager: Cached data structure for ${endpoint}:`, {
        keys: Object.keys(cachedData),
        hasItems: !!cachedData.items,
        itemsLength: cachedData.items ? cachedData.items.length : 'no items property',
        dataType: typeof cachedData,
        isArray: Array.isArray(cachedData),
        arrayLength: Array.isArray(cachedData) ? cachedData.length : 'not array',
        hasCounts: !!cachedData.counts,
        hasV1Ranges: !!cachedData.v1Ranges,
        hasV1V2Data: !!cachedData.v1v2Data,
        fullData: cachedData
      });
      
      // Validate cached data before rendering
      if (!cachedData) {
        console.error(`Demo Manager: Cached data is null/undefined for ${endpoint}`);
        return;
      }
      
      // Check if data has valid structure
      const isValidArray = Array.isArray(cachedData) && cachedData.length > 0;
      const isValidObject = cachedData.items && Array.isArray(cachedData.items) && cachedData.items.length > 0;
      const isValidStatsData = cachedData.counts && typeof cachedData.counts === 'object';
      const isValidChartData = cachedData.v1Ranges || cachedData.v1v2Data || cachedData.counts;
      
      if (!isValidArray && !isValidObject && !isValidStatsData && !isValidChartData) {
        console.error(`Demo Manager: Invalid cached data structure for ${endpoint}:`, cachedData);
        return;
      }
      
      if (renderFunction && typeof renderFunction === 'function') {
        console.log(`Demo Manager: Force rendering cached data for ${pageId}`);
        const renderStartTime = performance.now();
        
        // Ensure DOM is ready before rendering
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            renderFunction(cachedData, containerId);
            const renderEndTime = performance.now();
            console.log(`Demo Manager: 🎨 Force render function completed for ${pageId} in ${(renderEndTime - renderStartTime).toFixed(2)}ms`);
          });
        } else {
          renderFunction(cachedData, containerId);
          const renderEndTime = performance.now();
          console.log(`Demo Manager: 🎨 Force render function completed for ${pageId} in ${(renderEndTime - renderStartTime).toFixed(2)}ms`);
        }
      }
      
      this.markPageLoaded(pageId);
      const endTime = performance.now();
      console.log(`Demo Manager: ✅ Force rendered cached data for ${pageId} in ${(endTime - startTime).toFixed(2)}ms`);
      return;
    }
    
    if (!this.shouldLoadDemoData(pageId)) {
      console.log(`Demo Manager: Skipping load for ${pageId} - already loaded or not needed`);
      return;
    }

    // Check if we have cached demo data
    if (this.demoDataCache.has(endpoint)) {
      console.log(`Demo Manager: ✅ CACHE HIT - Using cached demo data for ${pageId} from ${endpoint}`);
      const startTime = performance.now();
      const cachedData = this.demoDataCache.get(endpoint);
      console.log(`Demo Manager: Cached data preview:`, Object.keys(cachedData));
      
      // Validate cached data before rendering
      if (!cachedData) {
        console.error(`Demo Manager: Cached data is null/undefined for ${endpoint}`);
        return;
      }
      
      // Check if data has valid structure
      const isValidArray = Array.isArray(cachedData) && cachedData.length > 0;
      const isValidObject = cachedData.items && Array.isArray(cachedData.items) && cachedData.items.length > 0;
      const isValidStatsData = cachedData.counts && typeof cachedData.counts === 'object';
      const isValidChartData = cachedData.v1Ranges || cachedData.v1v2Data || cachedData.counts;
      
      if (!isValidArray && !isValidObject && !isValidStatsData && !isValidChartData) {
        console.error(`Demo Manager: Invalid cached data structure for ${endpoint}:`, cachedData);
        return;
      }
      
      // Render the cached data
      if (renderFunction && typeof renderFunction === 'function') {
        console.log(`Demo Manager: Rendering cached data for ${pageId}`);
        const renderStartTime = performance.now();
        
        // Ensure DOM is ready before rendering
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            renderFunction(cachedData, containerId);
            const renderEndTime = performance.now();
            console.log(`Demo Manager: 🎨 Render function completed for ${pageId} in ${(renderEndTime - renderStartTime).toFixed(2)}ms`);
          });
        } else {
          renderFunction(cachedData, containerId);
          const renderEndTime = performance.now();
          console.log(`Demo Manager: 🎨 Render function completed for ${pageId} in ${(renderEndTime - renderStartTime).toFixed(2)}ms`);
        }
      }
      
      this.markPageLoaded(pageId);
      const endTime = performance.now();
      console.log(`Demo Manager: ✅ Cached data rendered successfully for ${pageId} in ${(endTime - startTime).toFixed(2)}ms`);
      return;
    }

    console.log(`Demo Manager: ❌ CACHE MISS - Loading demo data for ${pageId} from ${endpoint}`);
    // Show loading indicator
    this.showLoadingIndicator(containerId);

    try {
      console.log(`Demo Manager: Making network request to ${endpoint} for pageId: ${pageId}`);
      const startTime = performance.now();
      
      // Add cache-busting parameter to ensure fresh data
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('_t', Date.now().toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const endTime = performance.now();
      console.log(`Demo Manager: Network request completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Demo Manager: Received data preview:`, Object.keys(data));
      console.log(`Demo Manager: Data structure for ${endpoint}:`, {
        hasCounts: !!data.counts,
        hasPercentages: !!data.percentages,
        hasV1Ranges: !!data.v1Ranges,
        hasV1V2Data: !!data.v1v2Data,
        hasItems: !!data.items,
        isArray: Array.isArray(data),
        dataKeys: Object.keys(data),
        fullData: data
      });
      
      // Special debug for scatter chart
      if (endpoint.includes('scatter')) {
        console.log(`Demo Manager: SCATTER CHART DEBUG - Endpoint: ${endpoint}, PageId: ${pageId}`);
        console.log(`Demo Manager: SCATTER CHART DEBUG - Data received:`, data);
        console.log(`Demo Manager: SCATTER CHART DEBUG - Expected v1v2Data, got:`, {
          hasV1V2Data: !!data.v1v2Data,
          isV1V2DataArray: Array.isArray(data.v1v2Data),
          v1v2DataLength: data.v1v2Data ? data.v1v2Data.length : 'no v1v2Data',
          actualKeys: Object.keys(data)
        });
      }
      
      // Cache the demo data
      this.demoDataCache.set(endpoint, data);
      console.log(`Demo Manager: Cached demo data for ${endpoint} (cache size: ${this.demoDataCache.size})`);
      
      // Save cache to localStorage
      this.saveDemoDataCache();
      
      // Render the data
      if (renderFunction && typeof renderFunction === 'function') {
        console.log(`Demo Manager: Rendering fresh data for ${pageId}`);
        renderFunction(data, containerId);
      }
      
      this.markPageLoaded(pageId);
      console.log(`Demo Manager: ✅ Fresh data loaded and rendered successfully for ${pageId}`);
      
    } catch (error) {
      console.error(`Demo Manager: ❌ Failed to load demo data for ${pageId}:`, error);
      this.showErrorIndicator(containerId, error.message);
    } finally {
      this.hideLoadingIndicator(containerId);
    }
  }

  showLoadingIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      // Hide any existing HTMX spinners
      const htmxSpinner = document.getElementById('spinner');
      if (htmxSpinner) {
        htmxSpinner.style.display = 'none';
      }
      
      // Check if this is a chart container - don't replace innerHTML for charts
      const isChartContainer = containerId.includes('ChartContainer');
      
      if (isChartContainer) {
        // For chart containers, add loading indicator without replacing existing content
        const existingLoader = container.querySelector('.demo-loading-indicator');
        if (!existingLoader) {
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'demo-loading-indicator';
          loadingDiv.innerHTML = `
            <div class="demo-spinner"></div>
            <div class="demo-loading-text">${window.StringSchema.getLoadingMessage('demo')}</div>
          `;
          container.appendChild(loadingDiv);
        }
      } else {
        // For non-chart containers, replace innerHTML as before
        container.innerHTML = `
          <div class="demo-loading-indicator">
            <div class="demo-spinner"></div>
            <div class="demo-loading-text">${window.StringSchema.getLoadingMessage('demo')}</div>
          </div>
        `;
      }
    }
  }

  hideLoadingIndicator(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      // Check if this is a chart container
      const isChartContainer = containerId.includes('ChartContainer');
      
      if (isChartContainer) {
        // For chart containers, remove the loading indicator
        const loadingIndicator = container.querySelector('.demo-loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
      }
      // For non-chart containers, content replacement handles hiding
    }
  }

  showErrorIndicator(containerId, errorMessage) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = window.QuotaMessageHelper.generateMessage({
        title: 'Demo Data Error',
        message: `Failed to load demo data: ${errorMessage}`,
        note: 'Please try again or contact support if the issue persists.'
      });
    }
  }
}

// Create global instance when DOM is ready
function initDemoManager() {
  if (!window.demoManager) {
    window.demoManager = new DemoManager();
  }
}

// Initialize immediately if DOM is already ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDemoManager);
} else {
  initDemoManager();
}

// Global function for button clicks
window.loadDummyDataManually = function() {
  console.log('Manual demo mode activation');
  window.demoManager.enableDemoMode();
};
