/**
 * Performance Monitor for The Blacklist
 * Tracks header loading, font loading, and overall page performance
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      headerLoadTime: null,
      fontLoadTime: null,
      domContentLoaded: null,
      pageLoad: null,
      firstPaint: null,
      firstContentfulPaint: null
    };
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger('PerformanceMonitor') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    this.init();
  }

  init() {
    // Track DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.domContentLoaded = performance.now() - this.metrics.startTime;
      this.trackHeaderLoading();
    });

    // Track Page Load
    window.addEventListener('load', () => {
      this.metrics.pageLoad = performance.now() - this.metrics.startTime;
      this.trackFontLoading();
      this.trackPaintMetrics();
      this.logMetrics();
    });

    // Track Font Loading
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.metrics.fontLoadTime = performance.now() - this.metrics.startTime;
      });
    }
  }

  trackHeaderLoading() {
    const headerStart = performance.now();
    
    // Check if header elements are loaded
    const mainTitle = document.getElementById('main-title');
    const confidentialStamp = document.querySelector('.confidential-stamp');
    
    if (mainTitle && confidentialStamp) {
      this.metrics.headerLoadTime = performance.now() - headerStart;
      
      // Check if StringSchema is available
      if (window.StringSchema) {
        const schemaLoadTime = performance.now() - headerStart;
        this.logger.info(`[Performance] StringSchema loaded in ${schemaLoadTime.toFixed(2)}ms`);
      }
    }
  }

  trackFontLoading() {
    if (document.fonts) {
      const fonts = Array.from(document.fonts);
      const customFonts = fonts.filter(font => 
        font.family.includes('TBL') || font.family.includes('TBL-2')
      );
      
      this.logger.info(`[Performance] Custom fonts loaded: ${customFonts.length}`);
      customFonts.forEach(font => {
        this.logger.info(`[Performance] Font loaded: ${font.family}`);
      });
    }
  }

  trackPaintMetrics() {
    // Track paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        this.metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        this.metrics.firstContentfulPaint = entry.startTime;
      }
    });
  }

  logMetrics() {
    this.logger.info('🚀 Performance Metrics - The Blacklist');
    
    this.logger.info(`📊 Total Load Time: ${this.metrics.pageLoad?.toFixed(2) || 'N/A'}ms`);
    this.logger.info(`📄 DOM Content Loaded: ${this.metrics.domContentLoaded?.toFixed(2) || 'N/A'}ms`);
    this.logger.info(`🎨 First Paint: ${this.metrics.firstPaint?.toFixed(2) || 'N/A'}ms`);
    this.logger.info(`✨ First Contentful Paint: ${this.metrics.firstContentfulPaint?.toFixed(2) || 'N/A'}ms`);
    this.logger.info(`🔤 Font Load Time: ${this.metrics.fontLoadTime?.toFixed(2) || 'N/A'}ms`);
    this.logger.info(`📋 Header Load Time: ${this.metrics.headerLoadTime?.toFixed(2) || 'N/A'}ms`);
    
    // Performance recommendations
    this.generateRecommendations();
    
    this.logger.info();
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.pageLoad > 3000) {
      recommendations.push('⚠️ High load time detected. Consider optimizing assets.');
    }
    
    if (this.metrics.fontLoadTime > 1000) {
      recommendations.push('⚠️ Slow font loading. Consider using font-display: swap.');
    }
    
    if (this.metrics.headerLoadTime > 100) {
      recommendations.push('⚠️ Header loading delay. Check for JavaScript dependencies.');
    }
    
    if (this.metrics.firstContentfulPaint > 2000) {
      recommendations.push('⚠️ Slow First Contentful Paint. Optimize critical rendering path.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Good performance metrics detected.');
    }
    
    this.logger.info('💡 Recommendations:');
    recommendations.forEach(rec => this.logger.info(`   ${rec}`));
  }

  // Method to get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Method to measure specific operations
  measureOperation(name, operation) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    this.logger.info(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
}

// Initialize performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}
