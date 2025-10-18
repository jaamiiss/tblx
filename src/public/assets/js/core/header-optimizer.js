/**
 * Header Optimizer - Optimizes header loading and rendering
 * Provides immediate fallback text and progressive enhancement
 */
class HeaderOptimizer {
  constructor() {
    this.isInitialized = false;
    this.fallbackTexts = {
      'main-title': 'The Blacklist',
      'confidential-stamp': 'HIGHLY CONFIDENTIAL',
      'admin-title': 'Criminal List'
    };
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger('HeaderOptimizer') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    // Unified title management
    this.titleOverrides = {
      'home': 'The Blacklist',
      'list': 'The Blacklist',
      'listV1': 'The Blacklist',
      'listV2': 'The Blacklist',
      'stats': 'Data Analytics',
      'status': 'Status',
      'deceased': 'Deceased',
      'active': 'Active',
      'incarcerated': 'Incarcerated',
      'captured': 'Captured',
      'redacted': 'Redacted',
      'unknown': 'Unknown',
      'the-blacklist': 'The Blacklist'
    };
    
    this.init();
  }

  init() {
    // Immediate header optimization
    this.optimizeHeaderImmediately();
    
    // Progressive enhancement when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhanceHeader());
    } else {
      this.enhanceHeader();
    }
  }

  optimizeHeaderImmediately() {
    // Set fallback texts immediately to prevent FOUC
    this.setFallbackTexts();
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  setFallbackTexts() {
    // Set fallback texts for all header elements
    Object.entries(this.fallbackTexts).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element && !element.textContent.trim()) {
        element.textContent = text;
      }
    });

    // Set fallback for confidential stamp
    const confidentialStamp = document.querySelector('.confidential-stamp');
    if (confidentialStamp && !confidentialStamp.textContent.trim()) {
      confidentialStamp.textContent = 'HIGHLY CONFIDENTIAL';
    }
  }

  preloadCriticalResources() {
    // Disabled font preloading to prevent errors
    // const criticalFonts = [
    //   'https://ik.imagekit.io/ivw8jbdbt/TBLX/fonts/OCR%20A%20Std%20Regular.ttf',
    //   'https://ik.imagekit.io/ivw8jbdbt/TBLX/fonts/Blacklisted.ttf'
    // ];

    // criticalFonts.forEach(fontUrl => {
    //   const link = document.createElement('link');
    //   link.rel = 'preload';
    //   link.as = 'font';
    //   link.type = 'font/ttf';
    //   link.crossOrigin = 'anonymous';
    //   link.href = fontUrl;
    //   document.head.appendChild(link);
    // });
  }

  enhanceHeader() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Wait for StringSchema to be available
    this.waitForStringSchema(() => {
      this.updateHeaderTexts();
      this.optimizeFontLoading();
      this.trackHeaderPerformance();
    });
  }

  waitForStringSchema(callback, maxAttempts = 50) {
    let attempts = 0;
    
    const checkSchema = () => {
      attempts++;
      
      if (window.StringSchema || window.AdminStringSchema) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(checkSchema, 10);
      } else {
        // Fallback if StringSchema never loads
        this.logger.warn('StringSchema not available, using fallback texts');
        callback();
      }
    };
    
    checkSchema();
  }

  updateHeaderTexts() {
    // Update main title with unified system
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) {
      const pageType = this.detectPageType();
      let newTitle = this.titleOverrides[pageType] || 'The Blacklist';
      
      // Check for StringSchema override
      if (window.StringSchema) {
        const schemaTitle = window.StringSchema.getPageTitle(pageType);
        if (schemaTitle && schemaTitle !== 'The Blacklist') {
          newTitle = schemaTitle;
        }
      }
      
      // Only update if different from current text
      if (newTitle !== mainTitle.textContent) {
        mainTitle.textContent = newTitle;
        this.logger.info(`[HeaderOptimizer] Updated main title to: ${newTitle}`);
      }
    }

    // Update admin title
    const adminTitle = document.getElementById('admin-title');
    if (adminTitle && window.AdminStringSchema) {
      const adminPageType = this.detectAdminPageType();
      const newAdminTitle = window.AdminStringSchema.getAdminTitle(adminPageType);
      if (newAdminTitle && newAdminTitle !== 'Criminal List') {
        adminTitle.textContent = newAdminTitle;
      }
    }
  }

  detectPageType() {
    const path = window.location.pathname;
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/list/v2')) return 'listV2';
    if (path.includes('/list/')) return 'status';
    if (path.includes('/list')) return 'list';
    if (path.includes('/the-blacklist')) return 'the-blacklist';
    return 'list';
  }

  detectAdminPageType() {
    const path = window.location.pathname;
    if (path.includes('/admin/items')) return 'items';
    if (path.includes('/admin')) return 'dashboard';
    return 'dashboard';
  }

  optimizeFontLoading() {
    // Add font loading optimization
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // Add loaded class to body for CSS optimizations
        document.body.classList.add('fonts-loaded');
        
        // Log font loading performance
        this.logger.info('[HeaderOptimizer] Fonts loaded successfully');
        
        // Check if font manager is available and get status
        if (window.fontManager) {
          const fontStatus = window.fontManager.getFontStatus();
          this.logger.info('[HeaderOptimizer] Font status:', fontStatus);
        }
      }).catch(error => {
        this.logger.warn('[HeaderOptimizer] Font loading failed:', error);
        // Fallback to system fonts
        document.body.classList.add('fonts-fallback');
      });
    }
  }

  trackHeaderPerformance() {
    // Track header loading performance
    const headerElements = [
      document.getElementById('main-title'),
      document.getElementById('admin-title'),
      document.querySelector('.confidential-stamp')
    ].filter(Boolean);

    if (headerElements.length > 0) {
      const loadTime = performance.now();
      this.logger.info(`[HeaderOptimizer] Header elements loaded in ${loadTime.toFixed(2)}ms`);
      
      // Mark header as loaded
      document.body.classList.add('header-loaded');
    }
  }

  // Method to force header update (for dynamic content)
  updateHeader() {
    this.setFallbackTexts();
    this.updateHeaderTexts();
  }

  // Method to override title for specific page
  setTitleOverride(pageType, title) {
    this.titleOverrides[pageType] = title;
    
    // Update immediately if on the same page
    const currentPageType = this.detectPageType();
    if (currentPageType === pageType) {
      const mainTitle = document.getElementById('main-title');
      if (mainTitle) {
        mainTitle.textContent = title;
        this.logger.info(`[HeaderOptimizer] Title override applied: ${title}`);
      }
    }
  }

  // Method to get current title override
  getTitleOverride(pageType) {
    return this.titleOverrides[pageType];
  }

  // Method to reset title to default
  resetTitle(pageType) {
    const defaultTitles = {
      'home': 'The Blacklist',
      'list': 'The Blacklist',
      'listV1': 'The Blacklist',
      'listV2': 'The Blacklist',
      'stats': 'Data Analytics',
      'status': 'Status',
      'deceased': 'Deceased',
      'active': 'Active',
      'incarcerated': 'Incarcerated',
      'captured': 'Captured',
      'redacted': 'Redacted',
      'unknown': 'Unknown',
      'the-blacklist': 'The Blacklist'
    };
    
    this.titleOverrides[pageType] = defaultTitles[pageType] || 'The Blacklist';
    this.updateHeaderTexts();
  }

  // Method to get header loading metrics
  getMetrics() {
    return {
      isInitialized: this.isInitialized,
      fallbackTextsSet: Object.keys(this.fallbackTexts).every(id => 
        document.getElementById(id)?.textContent.trim()
      ),
      fontsLoaded: document.body.classList.contains('fonts-loaded'),
      headerLoaded: document.body.classList.contains('header-loaded')
    };
  }
}

// Initialize header optimizer immediately
window.headerOptimizer = new HeaderOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeaderOptimizer;
}






