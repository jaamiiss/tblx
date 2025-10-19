/**
 * Demo Manager - Refactored
 * Handles all demo-related functionality, delegates HTMX to HTMXManager
 */
class DemoManager {
  constructor() {
    this.logger = window.logManager ? window.logManager.createModuleLogger('DemoManager') : console;
    this.demoMode = localStorage.getItem('demoMode') === 'true';
    this.cache = new Map();
    this.logger.info('Demo Manager initialized');
  }

  /**
   * Initialize demo manager
   */
  init() {
    // Initialize HTMX manager first
    if (!window.htmxManager) {
      window.htmxManager = new HTMXManager();
      window.htmxManager.init();
    }

    if (this.demoMode) {
      this.logger.info('Demo mode already enabled, will load demo data if HTMX fails');
      // Don't load demo data immediately - let HTMX try first
      // The HTMX fallback will handle loading demo data if needed
    } else {
      this.logger.debug('Demo mode not enabled, letting HTMX handle data loading');
      // HTMX fallback is already set up
    }

    // Show demo banner if in demo mode
    if (this.demoMode) {
      this.showDemoDataBanner();
    }
  }

  /**
   * Handle HTMX fallback - called by HTMXManager
   */
  handleHTMXFallback(path) {
    this.logger.info(`Demo Manager: Handling HTMX fallback for ${path}`);
    
    // Only enable demo mode if not already enabled
    if (!this.demoMode) {
      this.enableDemoMode();
    }
    
    this.loadDemoDataForCurrentPage();
  }

  /**
   * Load demo data for the current page
   */
  loadDemoDataForCurrentPage() {
    const currentPath = window.location.pathname;
    this.logger.info(`Demo Manager: Loading demo data for current page: ${currentPath}`);

    if (currentPath.includes('/list/v2')) {
      this.loadDemoDataForPage('list-v2', '/dummy-data/v2', 'dataList', window.renderListData);
    } else if (currentPath.includes('/list') || currentPath.includes('/the-blacklist')) {
      this.loadDemoDataForPage('list-v1', '/dummy-data/v1', 'dataList', window.renderListData);
    } else if (currentPath.includes('/stats')) {
      this.loadDemoDataForPage('stats-cards', '/dummy-data/stats', 'statsCards', window.renderStatsCards);
    } else if (currentPath.includes('/status/')) {
      const status = currentPath.split('/status/')[1];
      if (status) {
        this.loadDemoDataForPage(`status-${status}`, '/dummy-data/v1', 'statusItems', window.renderStatusData);
      }
    }
  }

  /**
   * Load demo data for a specific page
   */
  async loadDemoDataForPage(pageId, endpoint, containerId, renderFunction) {
    try {
      this.logger.info(`Demo Manager: Loading demo data for ${pageId} from ${endpoint}`);

      // Only show loading indicator if we're actually in demo mode
      if (this.demoMode) {
        this.showLoadingIndicator(containerId);
      }

      // Check cache first
      const cacheKey = `${pageId}_${endpoint}`;
      if (this.cache.has(cacheKey)) {
        this.logger.info(`Demo Manager: Using cached demo data for ${pageId}`);
        const cachedData = this.cache.get(cacheKey);
        this.renderDemoData(cachedData, containerId, renderFunction);
        return;
      }

      // Fetch fresh data
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, data);
      
      // Render the data
      this.renderDemoData(data, containerId, renderFunction);
      
      this.logger.info(`Demo Manager: Successfully loaded demo data for ${pageId}`);

    } catch (error) {
      this.logger.error(`Demo Manager: Failed to load demo data for ${pageId}:`, error);
      this.showErrorIndicator(containerId, error);
    }
  }

  /**
   * Render demo data using the provided render function
   */
  renderDemoData(data, containerId, renderFunction) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.logger.error(`Demo Manager: Container ${containerId} not found`);
      return;
    }

    if (typeof renderFunction === 'function') {
      // Call render function with data and containerId
      renderFunction(data, containerId);
      this.logger.info(`Demo Manager: Rendered demo data in ${containerId}`);
    } else {
      this.logger.error(`Demo Manager: Render function not available for ${containerId}`);
    }

    // Hide loading indicator
    this.hideLoadingIndicator(containerId);

    // Show demo banner only if we're in demo mode
    if (this.demoMode) {
      this.showDemoDataBanner();
    }
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator(containerId) {
    if (window.spinnerManager) {
      window.spinnerManager.showDemoSpinner(containerId);
    } else {
      // Fallback to basic spinner
      const spinner = document.getElementById('spinner') || document.getElementById('loading-spinner');
      if (spinner) {
        spinner.style.display = 'block';
      }
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator(containerId) {
    if (window.spinnerManager) {
      window.spinnerManager.hideDemoSpinner(containerId);
    } else {
      // Fallback to basic spinner
      const spinner = document.getElementById('spinner') || document.getElementById('loading-spinner');
      if (spinner) {
        spinner.style.display = 'none';
      }
    }
  }

  /**
   * Show error indicator
   */
  showErrorIndicator(containerId, error) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (window.QuotaMessageHelper) {
      container.innerHTML = window.QuotaMessageHelper.generateDemoDataError();
    } else {
      container.innerHTML = `
        <div class="demo-error-container">
          <div class="demo-error-icon">⚠️</div>
          <div class="demo-error-title">Demo Data Unavailable</div>
          <div class="demo-error-message">Unable to load demo data. Please check your connection.</div>
        </div>
      `;
    }

    this.hideLoadingIndicator(containerId);
  }

  /**
   * Show demo data banner
   */
  showDemoDataBanner() {
    // Update banner content based on current page
    const currentPath = window.location.pathname;
    let context = 'Demo data';
    
    if (currentPath.includes('/stats')) {
      context = 'Charts using demo data';
    } else if (currentPath.includes('/list')) {
      context = 'List using demo data';
    } else if (currentPath.includes('/status')) {
      context = 'Status using demo data';
    }
    
    // Use the global banner function
    if (window.showDemoBanner) {
      window.showDemoBanner(context);
      this.logger.info(`Demo Manager: Demo banner shown with context: ${context}`);
    } else {
      this.logger.warn('Demo Manager: showDemoBanner function not available');
    }
  }

  /**
   * Hide demo data banner
   */
  hideDemoBanner() {
    // Use the global banner function
    if (window.hideDemoBanner) {
      window.hideDemoBanner();
      this.logger.info('Demo Manager: Demo banner hidden');
    } else {
      this.logger.warn('Demo Manager: hideDemoBanner function not available');
    }
  }

  /**
   * Enable demo mode
   */
  enableDemoMode() {
    this.demoMode = true;
    localStorage.setItem('demoMode', 'true');
    this.logger.info('Demo Manager: Demo mode enabled');
    
    // Disable HTMX requests
    if (window.htmxManager) {
      window.htmxManager.disableHTMXRequests();
    }
  }

  /**
   * Disable demo mode
   */
  disableDemoMode() {
    this.demoMode = false;
    localStorage.removeItem('demoMode');
    this.logger.info('Demo Manager: Demo mode disabled');
    
    // Enable HTMX requests
    if (window.htmxManager) {
      window.htmxManager.enableHTMXRequests();
    }
    
    // Hide demo banner
    this.hideDemoBanner();
  }

  /**
   * Clear demo mode and reload page
   */
  clearDemoMode() {
    this.disableDemoMode();
    window.location.reload();
  }

  /**
   * Check if demo mode is enabled
   */
  isDemoMode() {
    return this.demoMode;
  }

  /**
   * Check if demo data is loaded for current page
   */
  isDemoDataLoaded() {
    const currentPath = window.location.pathname;
    const containers = ['dataList', 'statusItems', 'statsCards'];
    
    return containers.some(containerId => {
      const container = document.getElementById(containerId);
      return container && container.children.length > 0;
    });
  }

  /**
   * Clear demo data cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Demo Manager: Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if current page has demo data loaded
   */
  hasCurrentPageDemoData() {
    const currentPath = window.location.pathname;
    let pageId;
    
    if (currentPath.includes('/list/v2')) {
      pageId = 'list-v2';
    } else if (currentPath.includes('/list') || currentPath.includes('/the-blacklist')) {
      pageId = 'list-v1';
    } else if (currentPath.includes('/stats')) {
      pageId = 'stats-cards';
    } else if (currentPath.includes('/status/')) {
      const status = currentPath.split('/status/')[1];
      pageId = `status-${status}`;
    }
    
    if (pageId) {
      const cacheKey = `${pageId}_/dummy-data/${pageId.includes('list') ? (pageId.includes('v2') ? 'v2' : 'v1') : (pageId.includes('stats') ? 'stats' : 'v1')}`;
      return this.cache.has(cacheKey);
    }
    
    return false;
  }

  /**
   * Handle live data loaded event
   */
  onLiveDataLoaded(dataType, containerId) {
    this.logger.info(`Demo Manager: Live data loaded for ${dataType}`);
    
    // Hide demo banner using proper method
    this.hideDemoBanner();
    
    // Update cache with live data flag
    this.cache.set(`${dataType}-live`, true);
  }

  /**
   * Check quota status
   */
  checkQuotaStatus() {
    this.logger.info('Demo Manager: Checking quota status');
    
    // For now, just log that quota check was performed
    // This could be expanded to check actual quota limits
    this.logger.info('Demo Manager: Quota status check completed');
    
    return {
      status: 'ok',
      remaining: 'unlimited',
      resetTime: null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemoManager;
} else {
  window.DemoManager = DemoManager;
}

// Global initialization function
window.initDemoManager = function() {
  if (!window.demoManager) {
    window.demoManager = new DemoManager();
    window.demoManager.init();
  }
  return window.demoManager;
};
