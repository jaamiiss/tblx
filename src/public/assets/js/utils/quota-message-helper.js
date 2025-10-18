// Quota Exceeded Message Helper
window.QuotaMessageHelper = {
  // Generate demo data error message with better design
  generateDemoDataError: function(errorMessage) {
    return `
      <div class="demo-data-error">
        <div class="demo-error-container">
          <div class="demo-error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#FE0000" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="#FE0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="demo-error-title">Demo Data Unavailable</div>
          <div class="demo-error-message">${errorMessage}</div>
          <div class="demo-error-note">Please try refreshing the page or contact support if the issue persists.</div>
          <div class="demo-error-actions">
            <button onclick="window.location.reload()" class="demo-error-button primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Refresh Page
            </button>
            <button onclick="window.demoManager && window.demoManager.clearDemoMode()" class="demo-error-button secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Clear Demo Mode
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // Generate message with custom parameters
  generateMessage: function(options = {}) {
    const title = options.title || 'Database Quota Exceeded';
    const message = options.message || 'We\'ve reached our database read limit. Please try again later or contact support.';
    const note = options.note || '';
    
    return `
      <div class="quota-exceeded-message">
        <div class="quota-message-content">
          <h3>${title}</h3>
          <p>${message}</p>
          ${note ? `<p class="quota-note">${note}</p>` : ''}
        </div>
      </div>
    `;
  },
  
  // Generate chart-specific error message
  generateChartError: function(chartName) {
    return this.generateMessage({
      title: window.StringSchema && window.StringSchema.getErrorMessage ? window.StringSchema.getErrorMessage('chartLoad') : 'Chart Error',
      message: `Unable to load ${chartName} chart`,
      note: 'This may be due to quota limits or connection issues.'
    });
  },
  
  // Generate status-specific error message
  generateStatusError: function(status) {
    return this.generateMessage({
      title: window.StringSchema && window.StringSchema.getErrorMessage ? window.StringSchema.getErrorMessage('dataLoad') : 'Data Error',
      message: `Unable to load data for ${status} status`,
      note: 'This may be due to quota limits or connection issues.'
    });
  },
  
  // Generate list-specific error message
  generateListError: function(version) {
    return this.generateMessage({
      title: window.StringSchema && window.StringSchema.getErrorMessage ? window.StringSchema.getErrorMessage('dataLoad') : 'Data Error',
      message: `Unable to load ${version} list data`,
      note: 'This may be due to quota limits or connection issues.'
    });
  },
  
  // Generate general quota exceeded message
  generateGeneral: function() {
    return this.generateMessage();
  },

  // Generate no data available message
  generateNoData: function() {
    return this.generateMessage({
      title: window.StringSchema ? window.StringSchema.getErrorMessage('noData') : 'No Data Available',
      message: window.StringSchema ? window.StringSchema.getErrorMessage('noItems') : 'No items found to display',
      note: ''
    });
  },

  // Generate invalid data message
  generateInvalidData: function() {
    return this.generateMessage({
      title: window.StringSchema ? window.StringSchema.getErrorMessage('invalidData') : 'Invalid Data',
      message: window.StringSchema ? window.StringSchema.getErrorMessage('missingProperties') : 'Items found but missing required properties',
      note: ''
    });
  }
};
