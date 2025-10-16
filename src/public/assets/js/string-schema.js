/**
 * Centralized string management with fallbacks and attributes
 */
class StringSchema {
  constructor() {
    this.schema = {
      titles: {
        home: "The Blacklist",
        list: "The Blacklist",
        listV1: "The Blacklist",
        listV2: "The Blacklist",
        stats: "Statistics",
        status: "Status",
        deceased: "Deceased",
        active: "Active",
        incarcerated: "Incarcerated",
        captured: "Captured",
        redacted: "Redacted"
      }
    }
  }

  get(keyPath, options = {}) {
    const keys = keyPath.split('.');
    let value = this.schema;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return keyPath; // Return key path if not found
      }
    }
    
    if (typeof value === 'string' && Object.keys(options).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return options[key] !== undefined ? options[key] : match;
      });
    }
    
    return value || keyPath;
  }

  // List-specific helper methods
  getListItemRendering(type = 'unknown', options = {}) {
    return this.get(`list.itemRendering.${type}`, options);
  }

  getListColumnLayout(layout = 'largeDesktop', options = {}) {
    return this.get(`list.columnLayout.${layout}`, options);
  }

  // Loading messages
  getLoadingMessage(type = 'default', options = {}) {
    const messages = {
      default: 'Loading...',
      chart: 'Loading chart...',
      data: 'Loading data...',
      stats: 'Loading statistics...'
    };
    return messages[type] || messages.default;
  }

  // Error messages
  getErrorMessage(type = 'default', options = {}) {
    const messages = {
      default: 'An error occurred',
      chart: 'Failed to load chart',
      data: 'Failed to load data',
      stats: 'Failed to load statistics',
      network: 'Network error',
      timeout: 'Request timeout'
    };
    return messages[type] || messages.default;
  }

  // Button labels
  getButtonLabel(type = 'default', options = {}) {
    const labels = {
      default: 'Button',
      loadDemo: 'Load Demo Data',
      refresh: 'Refresh',
      export: 'Export',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View'
    };
    return labels[type] || labels.default;
  }

  // Page titles
  getPageTitle(page = 'default') {
    const titles = {
      default: 'The Blacklist',
      list: 'The Blacklist',
      stats: 'Data Analytics',
      admin: 'Admin Dashboard',
      'the-blacklist': 'The Blacklist'
    };
    return titles[page] || titles.default;
  }
}

// Create global instance
window.StringSchema = new StringSchema();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StringSchema;
}