# String Schema Documentation

The String Schema provides centralized string management with fallbacks, attributes, and easy global changes across the application.

## Overview

The `StringSchema` class manages all text content in the application, providing:
- Centralized string management
- Automatic fallbacks
- HTML attributes for accessibility
- Easy global updates
- Custom overrides
- Variable substitution

## Basic Usage

### Loading the Schema

The String Schema is automatically loaded globally via `head.ejs`:

```html
<script src="/js/string-schema.js"></script>
```

### Getting Strings

```javascript
// Basic string retrieval
const loadingMessage = window.StringSchema.get('loading.items');
// Returns: "Loading items..."

// With fallback
const errorMessage = window.StringSchema.get('errors.network');
// Returns: "Network error occurred"

// With variables
const customMessage = window.StringSchema.get('errors.generic', {
  variables: { context: 'user action' }
});
```

### Convenience Methods

```javascript
// Loading messages
const itemsLoading = window.StringSchema.getLoadingMessage('items');
const statsLoading = window.StringSchema.getLoadingMessage('statistics');

// Error messages
const networkError = window.StringSchema.getErrorMessage('network');
const quotaError = window.StringSchema.getErrorMessage('quota');

// Button labels
const demoButton = window.StringSchema.getButtonLabel('loadDemo');
const cancelButton = window.StringSchema.getButtonLabel('cancel');

// Page titles
const homeTitle = window.StringSchema.getPageTitle('home');
const statsTitle = window.StringSchema.getPageTitle('stats');
```

## String Categories

### Loading Messages
- `loading.items` - "Loading items..."
- `loading.statistics` - "Loading statistics..."
- `loading.charts` - "Loading charts..."
- `loading.data` - "Loading data..."
- `loading.demo` - "Loading demo data..."
- `loading.fallback` - "Loading fallback data..."

### Error Messages
- `errors.network` - "Network error occurred"
- `errors.quota` - "Firestore quota exceeded"
- `errors.timeout` - "Request timeout"
- `errors.generic` - "An error occurred"
- `errors.dataLoad` - "Failed to load data"
- `errors.chartLoad` - "Failed to load chart"
- `errors.statsLoad` - "Failed to load statistics"

### Status Messages
- `status.quotaExceeded` - "Data Service Unavailable"
- `status.quotaMessage` - "Firestore quota exceeded or connection issues"
- `status.quotaNote` - "Click \"Load Demo Data\" to enable demo mode across all pages."
- `status.demoMode` - "Demo Mode Active"
- `status.liveData` - "Live Data Active"
- `status.cached` - "Using cached data"
- `status.offline` - "Offline mode"

### Button Labels
- `buttons.loadDemo` - "Load Demo Data"
- `buttons.cancel` - "Cancel"
- `buttons.retry` - "Retry"
- `buttons.refresh` - "Refresh"
- `buttons.close` - "Close"
- `buttons.back` - "Back"
- `buttons.next` - "Next"
- `buttons.submit` - "Submit"

### Page Titles
- `titles.home` - "The Blacklist"
- `titles.list` - "The Blacklist"
- `titles.listV1` - "The Blacklist - Version 1"
- `titles.listV2` - "The Blacklist - Version 2"
- `titles.stats` - "Statistics"
- `titles.status` - "Status"
- `titles.deceased` - "Deceased"
- `titles.active` - "Active"
- `titles.incarcerated` - "Incarcerated"
- `titles.captured` - "Captured"
- `titles.redacted` - "Redacted"

## Advanced Features

### HTML Attributes

```javascript
// Get string with attributes
const { text, attributes } = window.StringSchema.getWithAttributes('loading.items');
console.log('Text:', text); // "Loading items..."
console.log('Attributes:', attributes); // { class: "htmx-indicator loading-spinner", "aria-label": "Loading content", role: "status" }

// Create HTML element
const loadingElement = window.StringSchema.createElement('loading.items', 'div');
// Returns: <div class="htmx-indicator loading-spinner" aria-label="Loading content" role="status">Loading items...</div>
```

### Custom Overrides

```javascript
// Set custom override
window.StringSchema.setOverride('loading.items', 'Please wait, loading...', 'custom');

// Get custom version
const customLoading = window.StringSchema.get('loading.items', { custom: 'custom' });
// Returns: "Please wait, loading..."

// Get original version
const originalLoading = window.StringSchema.get('loading.items');
// Returns: "Loading items..."
```

### Bulk Updates

```javascript
// Update multiple strings at once
const updates = {
  'loading.items': 'Fetching items...',
  'loading.statistics': 'Calculating statistics...',
  'buttons.loadDemo': 'Load Sample Data',
  'status.demoMode': 'Sample Mode Active'
};

window.StringSchema.updateStrings(updates, 'bulk');

// Use the updated strings
const updatedLoading = window.StringSchema.get('loading.items', { custom: 'bulk' });
// Returns: "Fetching items..."
```

### Variable Substitution

```javascript
// Strings with variables use {{variableName}} syntax
const message = window.StringSchema.get('errors.generic', {
  variables: { context: 'user action' }
});
// If the string contains "An error occurred during {{context}}"
// Returns: "An error occurred during user action"
```

## Integration Examples

### Replacing Hardcoded Strings

**Before:**
```javascript
function showLoading() {
  document.getElementById('loading').innerHTML = 'Loading items...';
}

function showError() {
  alert('An error occurred');
}

function createDemoButton() {
  return '<button>Load Demo Data</button>';
}
```

**After:**
```javascript
function showLoading() {
  const message = window.StringSchema.getLoadingMessage('items');
  document.getElementById('loading').innerHTML = message;
}

function showError() {
  const message = window.StringSchema.getErrorMessage('generic');
  alert(message);
}

function createDemoButton() {
  const label = window.StringSchema.getButtonLabel('loadDemo');
  return `<button>${label}</button>`;
}
```

### Dynamic Content Generation

```javascript
// Generate loading spinner HTML
function createLoadingSpinner(context = 'items') {
  const message = window.StringSchema.getLoadingMessage(context);
  const { attributes } = window.StringSchema.getWithAttributes('loading.items');
  
  return `
    <div class="loading-container">
      <div class="spinner"></div>
      <div ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')}>
        ${message}
      </div>
    </div>
  `;
}

// Generate error message HTML
function createErrorMessage(errorType = 'generic') {
  const title = window.StringSchema.getErrorMessage(errorType);
  const { attributes } = window.StringSchema.getWithAttributes('errors.generic');
  
  return `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <div ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')}>
        ${title}
      </div>
    </div>
  `;
}
```

## Fallback System

The String Schema includes a comprehensive fallback system:

1. **Primary Value**: Gets the string from the main schema
2. **Fallback Value**: If primary not found, uses fallback schema
3. **Generic Fallback**: If still not found, uses category-specific generic fallback
4. **Custom Fallback**: Can be overridden with custom fallback values

```javascript
// Explicit fallback control
const message = window.StringSchema.get('nonexistent.path', { fallback: true });
// Returns: Generic fallback based on category

// No fallback
const noFallback = window.StringSchema.get('nonexistent.path', { fallback: false });
// Returns: undefined

// Custom fallback
const customFallback = window.StringSchema.get('nonexistent.path', { 
  fallback: 'Custom fallback message' 
});
// Returns: "Custom fallback message"
```

## Accessibility Features

The String Schema includes accessibility attributes:

```javascript
// Loading elements get appropriate ARIA attributes
const { attributes } = window.StringSchema.getWithAttributes('loading.items');
// Returns: { class: "htmx-indicator loading-spinner", "aria-label": "Loading content", role: "status" }

// Error elements get alert roles
const { attributes } = window.StringSchema.getWithAttributes('errors.generic');
// Returns: { class: "error-message", "aria-label": "Error message", role: "alert" }
```

## Global Changes

To make global changes to strings:

1. **Update the schema directly** (affects all users):
```javascript
window.StringSchema.setOverride('loading.items', 'New loading message', 'global');
```

2. **Use bulk updates** for multiple changes:
```javascript
const globalUpdates = {
  'loading.items': 'Fetching items...',
  'loading.statistics': 'Calculating statistics...',
  'buttons.loadDemo': 'Load Sample Data'
};
window.StringSchema.updateStrings(globalUpdates, 'global');
```

3. **Update specific categories**:
```javascript
// Get all loading messages
const loadingMessages = window.StringSchema.getCategory('loading');

// Update specific category
Object.keys(loadingMessages).forEach(key => {
  window.StringSchema.setOverride(`loading.${key}`, `New ${key} message`, 'global');
});
```

## Best Practices

1. **Use convenience methods** when possible for better readability
2. **Always provide fallbacks** for critical user-facing strings
3. **Use attributes** for accessibility compliance
4. **Group related strings** in the same category
5. **Use descriptive paths** that indicate the string's purpose
6. **Test fallbacks** to ensure graceful degradation
7. **Document custom overrides** for team members

## Future Enhancements

- Multi-language support
- String validation
- Performance optimization
- String usage analytics
- Automatic string extraction from code
- Integration with translation services
