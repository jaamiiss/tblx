// Console Log Manager
class LogManager {
  constructor() {
    this.debugMode = false;
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      VERBOSE: 4
    };
    this.currentLevel = this.logLevels.INFO; // Default to INFO level
    this.logPrefixes = {
      ERROR: '🔴 ERROR',
      WARN: '🟡 WARN',
      INFO: 'ℹ️ INFO',
      DEBUG: '🔵 DEBUG',
      VERBOSE: '⚪ VERBOSE'
    };
    
    // Initialize from localStorage or URL params
    this.initializeFromStorage();
    this.initializeFromURL();
    
    // Override console methods
    this.overrideConsoleMethods();
    
    console.log('LogManager: Initialized with level:', this.getCurrentLevelName());
  }

  initializeFromStorage() {
    const storedDebug = localStorage.getItem('debugMode');
    const storedLevel = localStorage.getItem('logLevel');
    
    if (storedDebug === 'true') {
      this.debugMode = true;
      this.currentLevel = this.logLevels.DEBUG;
    }
    
    if (storedLevel && this.logLevels[storedLevel] !== undefined) {
      this.currentLevel = this.logLevels[storedLevel];
    }
  }

  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const logLevelParam = urlParams.get('logLevel');
    
    if (debugParam === 'true' || debugParam === '1') {
      this.debugMode = true;
      this.currentLevel = this.logLevels.DEBUG;
      localStorage.setItem('debugMode', 'true');
    }
    
    if (logLevelParam && this.logLevels[logLevelParam.toUpperCase()]) {
      this.currentLevel = this.logLevels[logLevelParam.toUpperCase()];
      localStorage.setItem('logLevel', logLevelParam.toUpperCase());
    }
  }

  overrideConsoleMethods() {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Override console.log to use INFO level
    console.log = (...args) => {
      this.log('INFO', ...args);
    };

    // Override console.error to use ERROR level
    console.error = (...args) => {
      this.log('ERROR', ...args);
    };

    // Override console.warn to use WARN level
    console.warn = (...args) => {
      this.log('WARN', ...args);
    };

    // Override console.info to use INFO level
    console.info = (...args) => {
      this.log('INFO', ...args);
    };

    // Override console.debug to use DEBUG level
    console.debug = (...args) => {
      this.log('DEBUG', ...args);
    };

    // Store original methods for advanced usage
    console._original = originalConsole;
  }

  log(level, ...args) {
    const levelValue = this.logLevels[level];
    
    // Always show errors regardless of level
    if (level === 'ERROR') {
      console._original.error(this.logPrefixes[level], ...args);
      return;
    }
    
    // Check if we should show this log level
    if (levelValue <= this.currentLevel) {
      const prefix = this.logPrefixes[level];
      
      switch (level) {
        case 'ERROR':
          console._original.error(prefix, ...args);
          break;
        case 'WARN':
          console._original.warn(prefix, ...args);
          break;
        case 'INFO':
          console._original.info(prefix, ...args);
          break;
        case 'DEBUG':
          console._original.log(prefix, ...args);
          break;
        case 'VERBOSE':
          console._original.log(prefix, ...args);
          break;
        default:
          console._original.log(prefix, ...args);
      }
    }
  }

  // Public methods for different log levels
  error(...args) {
    this.log('ERROR', ...args);
  }

  warn(...args) {
    this.log('WARN', ...args);
  }

  info(...args) {
    this.log('INFO', ...args);
  }

  debug(...args) {
    this.log('DEBUG', ...args);
  }

  verbose(...args) {
    this.log('VERBOSE', ...args);
  }

  // Utility methods
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level];
      localStorage.setItem('logLevel', level);
      this.info('LogManager: Log level set to', level);
    } else {
      this.error('LogManager: Invalid log level:', level);
    }
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      this.currentLevel = this.logLevels.DEBUG;
      localStorage.setItem('debugMode', 'true');
    } else {
      this.currentLevel = this.logLevels.INFO;
      localStorage.removeItem('debugMode');
    }
    this.info('LogManager: Debug mode', enabled ? 'enabled' : 'disabled');
  }

  getCurrentLevelName() {
    return Object.keys(this.logLevels).find(key => this.logLevels[key] === this.currentLevel);
  }

  isDebugMode() {
    return this.debugMode;
  }

  // Method to temporarily enable debug logging
  enableDebugTemporarily(duration = 30000) {
    const originalLevel = this.currentLevel;
    const originalDebug = this.debugMode;
    
    this.setDebugMode(true);
    this.info('LogManager: Debug mode temporarily enabled for', duration / 1000, 'seconds');
    
    setTimeout(() => {
      this.currentLevel = originalLevel;
      this.debugMode = originalDebug;
      this.info('LogManager: Debug mode restored to previous state');
    }, duration);
  }

  // Method to clear console
  clear() {
    console._original.clear();
  }

  // Method to show current configuration
  showConfig() {
    console._original.log('🔧 LogManager Configuration:');
    console._original.log('  Debug Mode:', this.debugMode);
    console._original.log('  Current Level:', this.getCurrentLevelName());
    console._original.log('  Available Levels:', Object.keys(this.logLevels).join(', '));
    console._original.log('  URL Params: ?debug=true&logLevel=DEBUG');
    console._original.log('  Methods: logManager.setDebugMode(true), logManager.setLogLevel("DEBUG")');
  }

  // Method to create filtered loggers for specific modules
  createModuleLogger(moduleName) {
    return {
      error: (...args) => this.log('ERROR', `[${moduleName}]`, ...args),
      warn: (...args) => this.log('WARN', `[${moduleName}]`, ...args),
      info: (...args) => this.log('INFO', `[${moduleName}]`, ...args),
      debug: (...args) => this.log('DEBUG', `[${moduleName}]`, ...args),
      verbose: (...args) => this.log('VERBOSE', `[${moduleName}]`, ...args)
    };
  }
}

// Create global instance
window.logManager = new LogManager();

// Add convenience methods to window
window.enableDebug = () => window.logManager.setDebugMode(true);
window.disableDebug = () => window.logManager.setDebugMode(false);
window.setLogLevel = (level) => window.logManager.setLogLevel(level);
window.showLogConfig = () => window.logManager.showConfig();
window.clearConsole = () => window.logManager.clear();

// Add debug mode toggle to window for easy access
window.toggleDebug = () => {
  const currentDebug = window.logManager.isDebugMode();
  window.logManager.setDebugMode(!currentDebug);
  return !currentDebug;
};

console.log('LogManager: Console logging system initialized');
console.log('LogManager: Use ?debug=true&logLevel=DEBUG in URL or call enableDebug() to enable debug mode');
console.log('LogManager: Available methods: enableDebug(), disableDebug(), setLogLevel("DEBUG"), showLogConfig()');
