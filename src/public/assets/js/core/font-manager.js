/**
 * Font Manager - Handles font loading with automatic CDN fallback
 * Downloads fonts from CDN if local fonts are not available
 */
class FontManager {
  constructor() {
    this.fontUrls = {
      // Local fonts to check and load
      'Blacklisted.woff2': null, // Local only, no CDN fallback
      'Blacklisted.woff': null,  // Local only, no CDN fallback
      'OCR A Std Regular.ttf': null // Local only, no CDN fallback
    };
    this.fontsPath = '/shared/assets/fonts/';
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger('FontManager') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    this.init();
  }

  init() {
    // Suppress font loading warnings globally
    this.suppressFontWarnings();
    
    // Check font availability after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.checkFonts());
    } else {
      this.checkFonts();
    }
  }

  suppressFontWarnings() {
    // Override console.warn to suppress font validation warnings
    const originalWarn = console.warn;
    console.warn = function(message) {
      if (typeof message === 'string' && 
          (message.includes('maxp: Bad maxZones') || 
           message.includes('downloadable font') ||
           message.includes('font-family'))) {
        // Suppress font-related warnings
        return;
      }
      originalWarn.apply(console, arguments);
    };
  }

  async checkFonts() {
    this.logger.info('[FontManager] Checking font availability...');
    
    for (const [filename, cdnUrl] of Object.entries(this.fontUrls)) {
      try {
        const localUrl = this.fontsPath + filename;
        const isAvailable = await this.testFontUrl(localUrl);
        
        if (!isAvailable) {
          if (cdnUrl) {
            this.logger.warn(`[FontManager] Local font ${filename} not available, downloading from CDN...`);
            await this.downloadFont(filename, cdnUrl);
          } else {
            this.logger.warn(`[FontManager] Local font ${filename} not available (no CDN fallback)`);
          }
        } else {
          this.logger.info(`[FontManager] Local font ${filename} is available`);
        }
      } catch (error) {
        this.logger.error(`[FontManager] Error checking font ${filename}:`, error);
      }
    }
    
    // Force font loading by creating hidden elements
    this.forceFontLoading();
  }

  async testFontUrl(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async downloadFont(filename, cdnUrl) {
    try {
      this.logger.info(`[FontManager] Downloading ${filename} from CDN...`);
      
      const response = await fetch(cdnUrl);
      if (!response.ok) {
        throw new Error(`Failed to download font: ${response.status}`);
      }
      
      const fontData = await response.arrayBuffer();
      
      // Create a blob URL for immediate use
      const blob = new Blob([fontData], { type: 'font/ttf' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Update CSS to use the downloaded font
      this.updateFontCSS(filename, blobUrl);
      
      this.logger.info(`[FontManager] Successfully downloaded and cached ${filename}`);
      
      // Optionally, you could store it in localStorage for future use
      this.storeFontInCache(filename, fontData);
      
    } catch (error) {
      this.logger.error(`[FontManager] Failed to download ${filename}:`, error);
      // Fall back to CDN URL directly
      this.updateFontCSS(filename, cdnUrl);
    }
  }

  updateFontCSS(filename, fontUrl) {
    const fontFamily = filename.includes('OCR') ? 'TBL-2' : 'TBL';
    
    // Create a new @font-face rule
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}-Downloaded';
        src: url('${fontUrl}') format('truetype');
        font-display: swap;
        font-weight: normal;
        font-style: normal;
      }
      
      .main-header h1,
      .main-header .confidential-stamp {
        font-family: '${fontFamily}-Downloaded', '${fontFamily}', 'TBL-Fallback', Arial, Helvetica, sans-serif !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Trigger font loading
    if (document.fonts) {
      document.fonts.load(`16px ${fontFamily}-Downloaded`).then(() => {
        this.logger.info(`[FontManager] Font ${fontFamily}-Downloaded loaded successfully`);
        document.body.classList.add('fonts-loaded');
      }).catch(error => {
        this.logger.warn(`[FontManager] Font loading failed:`, error);
        document.body.classList.add('fonts-fallback');
      });
    }
  }

  storeFontInCache(filename, fontData) {
    try {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fontData)));
      localStorage.setItem(`font_${filename}`, base64);
      localStorage.setItem(`font_${filename}_timestamp`, Date.now().toString());
      this.logger.info(`[FontManager] Cached ${filename} in localStorage`);
    } catch (error) {
      this.logger.warn(`[FontManager] Failed to cache font:`, error);
    }
  }

  loadFontFromCache(filename) {
    try {
      const cachedFont = localStorage.getItem(`font_${filename}`);
      const timestamp = localStorage.getItem(`font_${filename}_timestamp`);
      
      if (cachedFont && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (age < maxAge) {
          const fontData = Uint8Array.from(atob(cachedFont), c => c.charCodeAt(0));
          const blob = new Blob([fontData], { type: 'font/ttf' });
          const blobUrl = URL.createObjectURL(blob);
          
          this.logger.info(`[FontManager] Loaded ${filename} from cache`);
          return blobUrl;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(`font_${filename}`);
          localStorage.removeItem(`font_${filename}_timestamp`);
        }
      }
    } catch (error) {
      this.logger.warn(`[FontManager] Failed to load font from cache:`, error);
    }
    
    return null;
  }

  // Method to force font refresh
  async refreshFonts() {
    this.logger.info('[FontManager] Refreshing fonts...');
    await this.checkFonts();
  }

  // Force font loading by creating hidden elements
  forceFontLoading() {
    this.logger.info('[FontManager] Forcing font loading...');
    
    // Create hidden elements with different font families to trigger loading
    const fontFamilies = ['Blacklisted', 'TBL-2'];
    const testText = 'THE BLACKLIST';
    
    fontFamilies.forEach(fontFamily => {
      const element = document.createElement('div');
      element.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        font-family: '${fontFamily}', Arial, sans-serif;
        font-size: 16px;
        visibility: hidden;
      `;
      element.textContent = testText;
      document.body.appendChild(element);
      
      // Remove after a short delay
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 1000);
    });
    
    // Add font loading classes to body
    document.body.classList.add('fonts-loading');
    
    // Check if fonts are actually loaded after a delay
    setTimeout(() => {
      this.checkFontLoadingStatus();
    }, 2000);
  }
  
  checkFontLoadingStatus() {
    const blacklistedLoaded = document.fonts.check('16px Blacklisted');
    const tbl2Loaded = document.fonts.check('16px TBL-2');
    
    this.logger.info(`[FontManager] Font loading status - Blacklisted: ${blacklistedLoaded}, TBL-2: ${tbl2Loaded}`);
    
    if (blacklistedLoaded || tbl2Loaded) {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-loaded');
      this.logger.info('[FontManager] Fonts loaded successfully');
    } else {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-fallback');
      this.logger.warn('[FontManager] Using fallback fonts');
    }
  }

  // Method to get font loading status
  getFontStatus() {
    return {
      fontsLoaded: document.body.classList.contains('fonts-loaded'),
      fontsFallback: document.body.classList.contains('fonts-fallback'),
      availableFonts: Array.from(document.fonts).map(font => font.family)
    };
  }
}

// Initialize Font Manager
window.fontManager = new FontManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FontManager;
}




