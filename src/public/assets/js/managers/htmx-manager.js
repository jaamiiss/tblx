/**
 * HTMX Manager
 * Handles all HTMX-related functionality and integration with demo manager
 */
class HTMXManager {
  constructor() {
    this.logger = window.logManager ? window.logManager.createModuleLogger('HTMXManager') : console;
    this.requestStates = new Map();
    this.fallbackPaths = [
      '/version1', '/version2', '/list', '/list/v2', '/the-blacklist',
      '/stats/cards', '/stats/chart/pie', '/stats/chart/bar', '/stats/chart/scatter',
      '/status/deceased', '/status/active', '/status/incarcerated',
      '/status/redacted', '/status/unknown', '/status/captured'
    ];
    
    this.logger.info('HTMX Manager initialized');
  }

  /**
   * Initialize HTMX manager
   */
  init() {
    this.setupEventListeners();
    this.logger.info('HTMX Manager setup complete');
  }

  /**
   * Setup HTMX event listeners for fallback handling
   */
  setupEventListeners() {
    this.logger.debug('Setting up HTMX event listeners');

    // Listen for HTMX request failures
    document.addEventListener('htmx:responseError', (event) => {
      this.logger.info('HTMX Manager: responseError event received');
      this.handleHTMXFailure(event, 'responseError');
    });

    // Listen for HTMX request timeouts
    document.addEventListener('htmx:timeout', (event) => {
      this.logger.info('HTMX Manager: timeout event received');
      this.handleHTMXFailure(event, 'timeout');
    });

    // Listen for HTMX request aborts
    document.addEventListener('htmx:sendAbort', (event) => {
      this.logger.info('HTMX Manager: sendAbort event received');
      this.handleHTMXFailure(event, 'sendAbort');
    });

    // Listen for successful HTMX requests
    document.addEventListener('htmx:afterRequest', (event) => {
      this.logger.info('HTMX Manager: afterRequest event received');
      this.handleHTMXSuccess(event);
    });

    // Listen for HTMX content swaps
    document.addEventListener('htmx:afterSwap', (event) => {
      this.logger.info('HTMX Manager: afterSwap event received');
      this.handleHTMXSwap(event);
    });

    // Additional fallback: Check for empty responses after a delay
    document.addEventListener('htmx:afterRequest', (event) => {
      setTimeout(() => {
        this.checkForEmptyResponse(event);
      }, 1000);
    });
  }

  /**
   * Handle HTMX request failures
   */
  handleHTMXFailure(event, failureType) {
    const target = event.detail.target;
    const path = event.detail.pathInfo.requestPath;
    const requestId = `${target.id}_${path}`;

    this.logger.info(`HTMX ${failureType} detected for path: ${path}, target: ${target.id}`);

    // Prevent duplicate fallback for same request
    if (this.requestStates.get(requestId) === 'fallback_triggered') {
      this.logger.debug(`Fallback already triggered for ${requestId}, skipping ${failureType}`);
      return;
    }

    this.logger.info(`HTMX ${failureType} for ${path}, checking if we should fall back to demo data`);

    // Only fall back for specific endpoints
    if (this.shouldFallbackToDemo(path)) {
      this.logger.info(`HTMX Manager: Triggering demo fallback for ${failureType} on ${path}`);
      this.requestStates.set(requestId, 'fallback_triggered');

      // Notify demo manager to handle fallback
      if (window.demoManager) {
        this.logger.info(`HTMX Manager: Calling demoManager.handleHTMXFallback(${path})`);
        window.demoManager.handleHTMXFallback(path);
      } else {
        this.logger.warn('HTMX Manager: demoManager not available');
      }

      // Clean up request state after delay
      setTimeout(() => {
        this.requestStates.delete(requestId);
      }, 10000);
    } else {
      this.logger.info(`HTMX Manager: Path ${path} not in fallback paths, skipping demo fallback`);
    }
  }

  /**
   * Check for empty responses and trigger fallback if needed
   */
  checkForEmptyResponse(event) {
    const target = event.detail.target;
    const path = event.detail.pathInfo.requestPath;
    const requestId = `${target.id}_${path}`;
    
    // Don't check if we already handled this request
    if (this.requestStates.get(requestId) === 'fallback_triggered') {
      this.logger.debug(`HTMX Manager: Already handled ${requestId}, skipping empty response check`);
      return;
    }
    
    // Don't check if the request was successful
    if (event.detail.successful || this.requestStates.get(requestId) === 'successful') {
      this.logger.debug(`HTMX Manager: Request was successful for ${requestId}, skipping empty response check`);
      return;
    }
    
    // Check if target is empty and should have content
    if (target && target.id === 'dataList' && (!target.innerHTML || target.innerHTML.trim() === '')) {
      this.logger.info(`HTMX Manager: Empty response detected for ${path}, triggering demo fallback`);
      
      if (this.shouldFallbackToDemo(path)) {
        if (window.demoManager) {
          this.logger.info(`HTMX Manager: Calling demoManager.handleHTMXFallback(${path}) for empty response`);
          this.requestStates.set(requestId, 'fallback_triggered');
          window.demoManager.handleHTMXFallback(path);
        }
      }
    }
  }

  /**
   * Handle successful HTMX requests
   */
  handleHTMXSuccess(event) {
    const target = event.detail.target;
    const path = event.detail.pathInfo.requestPath;
    const requestId = `${target.id}_${path}`;
    
    if (event.detail.successful) {
      this.logger.debug(`HTMX request successful for ${requestId}`);
      
      // Mark this request as successful to prevent demo fallback
      this.requestStates.set(requestId, 'successful');
      
      // Hide demo banner if live data loaded successfully
      if (window.demoManager) {
        window.demoManager.hideDemoBanner();
      }

      // Hide spinners
      setTimeout(() => {
        this.hideSpinners();
      }, 50);
    }
  }

  /**
   * Handle HTMX content swaps
   */
  handleHTMXSwap(event) {
    this.logger.debug('HTMX content swapped');
    
    // Hide spinners after content swap
    setTimeout(() => {
      this.hideSpinners();
    }, 50);
  }

  /**
   * Check if we should fall back to demo data for a given path
   */
  shouldFallbackToDemo(path) {
    return this.fallbackPaths.some(fallbackPath => path.includes(fallbackPath));
  }

  /**
   * Disable HTMX requests temporarily
   */
  disableHTMXRequests() {
    // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.disableHTMXRequests());
      return;
    }

    // Find all HTMX elements and temporarily disable them
    const htmxElements = document.querySelectorAll('[hx-get], [hx-post], [hx-put], [hx-delete]');
    this.logger.info(`HTMX Manager: Disabling ${htmxElements.length} HTMX elements`);

    htmxElements.forEach(element => {
      this.storeOriginalAttributes(element);
      this.removeHTMXAttributes(element);
      element.setAttribute('data-htmx-disabled', 'true');
    });

    // Hide HTMX spinners
    this.hideSpinners();

    this.logger.info(`HTMX Manager: Disabled ${htmxElements.length} HTMX elements`);
  }

  /**
   * Enable HTMX requests
   */
  enableHTMXRequests() {
    // Re-enable HTMX requests
    const htmxElements = document.querySelectorAll('[data-original-hx-get], [data-original-hx-post], [data-original-hx-put], [data-original-hx-delete]');
    this.logger.info(`HTMX Manager: Re-enabling ${htmxElements.length} HTMX elements`);

    htmxElements.forEach(element => {
      this.restoreOriginalAttributes(element);
      this.removeStoredAttributes(element);
    });

    // Show HTMX spinners if not in demo mode
    if (!window.demoManager || !window.demoManager.isDemoMode()) {
      this.showSpinners();
    }

    this.logger.info(`HTMX Manager: Re-enabled ${htmxElements.length} HTMX elements`);

    // Trigger HTMX requests for elements with 'load' trigger
    this.triggerLoadRequests();
  }

  /**
   * Store original HTMX attributes
   */
  storeOriginalAttributes(element) {
    element.setAttribute('data-original-hx-get', element.getAttribute('hx-get') || '');
    element.setAttribute('data-original-hx-post', element.getAttribute('hx-post') || '');
    element.setAttribute('data-original-hx-put', element.getAttribute('hx-put') || '');
    element.setAttribute('data-original-hx-delete', element.getAttribute('hx-delete') || '');
    element.setAttribute('data-original-hx-trigger', element.getAttribute('hx-trigger') || '');
    element.setAttribute('data-original-hx-indicator', element.getAttribute('hx-indicator') || '');
  }

  /**
   * Remove HTMX attributes
   */
  removeHTMXAttributes(element) {
    element.removeAttribute('hx-get');
    element.removeAttribute('hx-post');
    element.removeAttribute('hx-put');
    element.removeAttribute('hx-delete');
    element.removeAttribute('hx-trigger');
    element.removeAttribute('hx-indicator');
  }

  /**
   * Restore original HTMX attributes
   */
  restoreOriginalAttributes(element) {
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

    this.logger.debug(`HTMX Manager: Restored attributes for ${element.id}:`, {
      hxGet: element.getAttribute('hx-get'),
      hxTrigger: element.getAttribute('hx-trigger'),
      hxIndicator: element.getAttribute('hx-indicator')
    });
  }

  /**
   * Remove stored attributes
   */
  removeStoredAttributes(element) {
    element.removeAttribute('data-original-hx-get');
    element.removeAttribute('data-original-hx-post');
    element.removeAttribute('data-original-hx-put');
    element.removeAttribute('data-original-hx-delete');
    element.removeAttribute('data-original-hx-trigger');
    element.removeAttribute('data-original-hx-indicator');
    element.removeAttribute('data-htmx-disabled');
  }

  /**
   * Trigger HTMX requests for elements with 'load' trigger
   */
  triggerLoadRequests() {
    const loadElements = document.querySelectorAll('[hx-trigger*="load"]');
    loadElements.forEach(element => {
      if (window.htmx) {
        window.htmx.trigger(element, 'load');
        this.logger.debug(`HTMX Manager: Triggered load request for ${element.id}`);
      }
    });
  }

  /**
   * Hide HTMX spinners
   */
  hideSpinners() {
    const spinners = document.querySelectorAll('.htmx-indicator, #spinner, #loading-spinner, #stats-loading-spinner');
    spinners.forEach(spinner => {
      spinner.style.display = 'none';
    });
  }

  /**
   * Show HTMX spinners
   */
  showSpinners() {
    const spinners = document.querySelectorAll('.htmx-indicator, #spinner, #loading-spinner, #stats-loading-spinner');
    spinners.forEach(spinner => {
      spinner.style.display = 'block';
    });
  }

  /**
   * Check if HTMX is disabled
   */
  isHTMXDisabled() {
    const disabledElements = document.querySelectorAll('[data-htmx-disabled="true"]');
    return disabledElements.length > 0;
  }

  /**
   * Get HTMX request state for debugging
   */
  getRequestStates() {
    return Array.from(this.requestStates.entries());
  }

  /**
   * Clear all request states
   */
  clearRequestStates() {
    this.requestStates.clear();
    this.logger.info('HTMX Manager: Cleared all request states');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HTMXManager;
} else {
  window.HTMXManager = HTMXManager;
}
