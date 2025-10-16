// Quota Exceeded Message Helper
window.QuotaMessageHelper = {
  // Generate quota exceeded message HTML
  generateMessage: function(options = {}) {
    const title = options.title || window.StringSchema.getStatusMessage('quotaExceeded');
    const message = options.message || window.StringSchema.getStatusMessage('quotaMessage');
    const note = options.note || window.StringSchema.getStatusMessage('quotaNote');
    const showButton = options.showButton || false;
    
    let buttonHtml = '';
    if (showButton) {
      const buttonLabel = window.StringSchema.getButtonLabel('loadDemo');
      buttonHtml = `
        <div style="margin-top: 20px;">
          <button onclick="loadDummyDataManually()" class="fallback-button">
            ${buttonLabel}
          </button>
        </div>
      `;
    }
    
    return `
      <div class="quota-exceeded-message">
        <div class="quota-icon">⚠️</div>
        <div class="quota-title">${title}</div>
        <div class="quota-message">${message}</div>
        <div class="quota-note">${note}</div>
        ${buttonHtml}
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
