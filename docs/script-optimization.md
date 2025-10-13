# Script Import Optimization

## Current Script Structure

### Global Scripts (in `head.ejs`)
- **HTMX** - Used by all layouts for dynamic content loading
- **Chart.js** - Conditionally loaded only for stats layout
- **StringSchema** - Used by all layouts for centralized string management
- **DemoManager** - Used by all layouts for demo mode functionality
- **QuotaMessageHelper** - Used by all layouts for error messages
- **ItemRenderer** - Used by list layout for consistent item rendering

### Layout-Specific Scripts
- **`index.js`** - Only in `list-layout.ejs` (handles HTMX responses for dataList)
- **No scripts** - `status-layout.ejs` (relies on global scripts only)

### Homepage Scripts (in `public/index.html`)
- **GSAP** - Only used on homepage for animations
- **Google Analytics** - Only used on homepage for tracking

## Optimizations Applied

### 1. Conditional Chart.js Loading
- **Before**: Chart.js loaded in stats-layout.ejs
- **After**: Chart.js conditionally loaded in head.ejs only when `includeChartJS: true`
- **Benefit**: Reduces bundle size for non-stats pages

### 2. Removed Redundant Scripts
- **Removed**: `index.js` from stats-layout.ejs (not needed for charts)
- **Kept**: `index.js` in list-layout.ejs (needed for HTMX dataList handling)
- **Removed**: Chart.js from stats-layout.ejs (moved to conditional global loading)

### 3. Script Loading Order
- **HTMX** - Loaded first (required by all layouts)
- **Chart.js** - Conditionally loaded (only for stats)
- **Custom Scripts** - Loaded in dependency order

## Script Usage Analysis

### HTMX Usage
- **All layouts**: Used for dynamic content loading
- **List layout**: `hx-get`, `hx-trigger`, `hx-indicator`
- **Status layout**: `hx-boost`, `hx-get`, `hx-trigger`
- **Stats layout**: `hx-get`, `hx-trigger`, `hx-indicator`

### Chart.js Usage
- **Stats layout only**: Pie chart, bar chart, scatter chart
- **Other layouts**: Not used

### ItemRenderer Usage
- **List layout only**: For consistent item rendering
- **Other layouts**: Not used

### DemoManager Usage
- **All layouts**: For demo mode functionality

### StringSchema Usage
- **All layouts**: For centralized string management

## Performance Benefits

### Bundle Size Reduction
- **Stats pages**: Chart.js loaded only when needed
- **List pages**: No Chart.js overhead
- **Status pages**: No Chart.js overhead

### Loading Performance
- **Parallel loading**: Scripts load in parallel when possible
- **Conditional loading**: Chart.js only loads for stats pages
- **Caching**: Global scripts cached across all pages

### Memory Usage
- **Reduced**: Chart.js not loaded on non-stats pages
- **Optimized**: Scripts loaded only when needed

## File Structure

```
public/js/
├── demo-manager.js          # Global - demo mode
├── item-renderer.js         # Global - item rendering
├── quota-message-helper.js  # Global - error messages
├── string-schema.js         # Global - string management
├── index.js                 # List layout only - HTMX handling
└── gsap/
    └── script.js            # Homepage only - animations
```

## Recommendations

### 1. Further Optimizations
- Consider lazy loading Chart.js only when charts are rendered
- Implement script bundling for production
- Add script integrity checks for CDN resources

### 2. Monitoring
- Monitor script loading times
- Track Chart.js usage patterns
- Measure bundle size impact

### 3. Future Considerations
- Consider Web Components for chart rendering
- Evaluate alternative chart libraries
- Implement service worker for script caching
