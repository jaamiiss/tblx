# The Blacklist - Public Routes & API Documentation

## 🌐 Public Routes Overview

The Blacklist application provides comprehensive public access to data through both web pages and API endpoints. All routes are accessible without authentication and support both traditional page loads and HTMX dynamic updates.

## 📄 Page Routes

### **Homepage**
- **URL**: `/`
- **Description**: Main homepage with animated poster and navigation
- **Content**: Static homepage with GSAP animations
- **Features**: 
  - Animated poster display
  - Navigation to list views
  - Responsive design

### **List Views**

#### **Version 1 List**
- **URL**: `/list`
- **Description**: Default list view showing all items
- **Content**: Full list with toggle navigation
- **Features**:
  - Toggle buttons (V1, V2, Stats, Old)
  - 4-column responsive grid layout
  - HTMX dynamic loading
  - Demo mode support
- **API**: `/version1`

#### **Version 2 List**
- **URL**: `/list/v2`
- **Description**: Version 2 filtered list view
- **Content**: Items filtered by V2 field
- **Features**:
  - Same layout as V1 but filtered data
  - Toggle navigation
  - Responsive design
- **API**: `/version2`

#### **The Blacklist (Legacy)**
- **URL**: `/the-blacklist`
- **Description**: Legacy blacklist view with minimal styling
- **Content**: Black text-only status badges, no toggle buttons
- **Features**:
  - Consistent header padding
  - Description: "THE-BLACKLIST: Original Blacklist"
  - Simplified styling
- **API**: `/version1`

### **Status-Filtered Pages**

#### **Deceased Status**
- **URL**: `/list/deceased`
- **Description**: Items with deceased status
- **Content**: Filtered list showing only deceased items
- **API**: `/status/deceased`

#### **Active Status**
- **URL**: `/list/active`
- **Description**: Items with active status
- **Content**: Filtered list showing only active items
- **API**: `/status/active`

#### **Incarcerated Status**
- **URL**: `/list/incarcerated`
- **Description**: Items with incarcerated status
- **Content**: Filtered list showing only incarcerated items
- **API**: `/status/incarcerated`

#### **Redacted Status**
- **URL**: `/list/redacted`
- **Description**: Items with redacted status
- **Content**: Filtered list showing only redacted items
- **API**: `/status/redacted`

#### **Unknown Status**
- **URL**: `/list/unknown`
- **Description**: Items with unknown status
- **Content**: Filtered list showing only unknown items
- **API**: `/status/unknown`

#### **Captured Status**
- **URL**: `/list/captured`
- **Description**: Items with captured status
- **Content**: Filtered list showing only captured items
- **API**: `/status/captured`

### **Statistics Page**
- **URL**: `/stats`
- **Description**: Interactive statistics and analytics dashboard
- **Content**: Charts, graphs, and data analysis
- **Features**:
  - 3-column chart layout (Category, Status Distribution, Scatter Plot)
  - HTMX auto-refresh every 30 seconds
  - Interactive charts with Chart.js
  - Filter controls for scatter plot
  - Responsive design
- **APIs**: 
  - `/stats/cards` - Stats cards data
  - `/stats/chart/pie` - Pie chart data
  - `/stats/chart/bar` - Bar chart data
  - `/stats/chart/scatter` - Scatter plot data

## 🔌 API Endpoints

### **Data APIs**

#### **Version 1 Data**
- **URL**: `/version1`
- **Method**: GET
- **Description**: Complete dataset (all 202 items)
- **Response**: JSON array of items
- **Content-Type**: `application/json`
- **Caching**: Memory-cached for performance

#### **Version 2 Data**
- **URL**: `/version2`
- **Method**: GET
- **Description**: Version 2 filtered data
- **Response**: JSON array of items filtered by V2 field
- **Content-Type**: `application/json`
- **Caching**: Memory-cached for performance

#### **Status-Filtered Data**
- **URL**: `/status/{status}`
- **Method**: GET
- **Description**: Items filtered by specific status
- **Parameters**: 
  - `status` (string): deceased, active, incarcerated, redacted, unknown, captured
- **Response**: JSON array of filtered items
- **Content-Type**: `application/json`
- **Caching**: Memory-cached for performance

### **Statistics APIs**

#### **Stats Cards**
- **URL**: `/stats/cards`
- **Method**: GET
- **Description**: Statistics cards data for HTMX updates
- **Response**: HTML with stats cards markup
- **Content-Type**: `text/html`
- **Features**:
  - Auto-refresh every 30 seconds
  - Loading states and error handling
  - Success animations

#### **Pie Chart Data**
- **URL**: `/stats/chart/pie`
- **Method**: GET
- **Description**: Category distribution data for pie chart
- **Response**: JSON with chart data
- **Content-Type**: `application/json`
- **Data**: Category counts and percentages

#### **Bar Chart Data**
- **URL**: `/stats/chart/bar`
- **Method**: GET
- **Description**: Status distribution by V1 ranges
- **Response**: JSON with chart data
- **Content-Type**: `application/json`
- **Data**: Status counts grouped by V1 ranges (0-50, 51-100, etc.)

#### **Scatter Plot Data**
- **URL**: `/stats/chart/scatter`
- **Method**: GET
- **Description**: V1 vs V2 scatter plot data
- **Response**: JSON with chart data
- **Content-Type**: `application/json`
- **Data**: Items with V1 and V2 coordinates, status-based coloring

### **Utility APIs**

#### **Quota Status**
- **URL**: `/quota-status`
- **Method**: GET
- **Description**: Check Firestore quota status
- **Response**: JSON with quota information
- **Content-Type**: `application/json`
- **Usage**: Determines if demo mode should be activated

#### **Cache Statistics**
- **URL**: `/cache-stats`
- **Method**: GET
- **Description**: Memory cache statistics
- **Response**: JSON with cache information
- **Content-Type**: `application/json`
- **Usage**: Performance monitoring and debugging

#### **Dummy Data Info**
- **URL**: `/dummy-data-info`
- **Method**: GET
- **Description**: Information about dummy data
- **Response**: JSON with dummy data details
- **Content-Type**: `application/json`
- **Usage**: Demo mode information

## 🎯 HTMX Integration

### **Dynamic Features**
- **Auto-refresh**: Stats cards refresh every 30 seconds
- **Loading States**: Professional loading indicators
- **Error Handling**: Graceful error display with retry options
- **Success Feedback**: Subtle success animations
- **Partial Updates**: Update specific page sections without full reload

### **HTMX Attributes**
```html
<!-- Stats cards with auto-refresh -->
<div id="statsCards" 
     hx-get="/stats/cards" 
     hx-trigger="load, every 30s"
     hx-indicator="#stats-loading-spinner"
     hx-target="this"
     hx-swap="innerHTML">
  <!-- Content -->
</div>

<!-- List data with HTMX loading -->
<div id="dataList" 
     hx-get="/version1" 
     hx-trigger="load" 
     hx-indicator="#spinner">
  <!-- Content -->
</div>
```

## 🔧 Error Handling

### **404 Pages**
- **Public 404**: Custom error page with navigation links
- **Admin 404**: Admin-styled error page
- **Features**:
  - Professional styling
  - Navigation options
  - Development mode technical details
  - Responsive design

### **API Error Responses**
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors
- **Quota Exceeded**: Firestore quota limits

## 📊 Data Structure

### **Item Object Structure**
```json
{
  "id": "string",
  "name": "string",
  "status": "deceased|active|incarcerated|redacted|unknown|captured",
  "category": "Male|Female|Company|Group|Unknown",
  "v1": "number",
  "v2": "number",
  "notes": "string",
  "lastUpdated": "ISO 8601 timestamp"
}
```

### **Statistics Response Structure**
```json
{
  "counts": {
    "deceased": "number",
    "active": "number",
    "incarcerated": "number",
    "redacted": "number",
    "unknown": "number",
    "captured": "number",
    "total": "number"
  },
  "percentages": {
    "deceased": "string",
    "active": "string",
    "incarcerated": "string",
    "redacted": "string",
    "unknown": "string",
    "captured": "string"
  },
  "categoryCounts": {
    "Male": "number",
    "Female": "number",
    "Company": "number",
    "Group": "number",
    "total": "number"
  },
  "categoryPercentages": {
    "Male": "string",
    "Female": "string",
    "Company": "string",
    "Group": "string"
  }
}
```

## 🚀 Usage Examples

### **Accessing List Views**
```bash
# Version 1 list
curl http://localhost:3000/list

# Version 2 list
curl http://localhost:3000/list/v2

# The Blacklist (legacy)
curl http://localhost:3000/the-blacklist

# Status-filtered pages
curl http://localhost:3000/list/deceased
curl http://localhost:3000/list/active
```

### **Accessing Data APIs**
```bash
# Get complete dataset
curl http://localhost:3000/version1

# Get version 2 data
curl http://localhost:3000/version2

# Get status-filtered data
curl http://localhost:3000/status/deceased
curl http://localhost:3000/status/active
```

### **Accessing Statistics**
```bash
# Stats page
curl http://localhost:3000/stats

# Stats cards (HTMX)
curl http://localhost:3000/stats/cards

# Chart data
curl http://localhost:3000/stats/chart/pie
curl http://localhost:3000/stats/chart/bar
curl http://localhost:3000/stats/chart/scatter
```

### **Utility APIs**
```bash
# Check quota status
curl http://localhost:3000/quota-status

# Get cache statistics
curl http://localhost:3000/cache-stats

# Get dummy data info
curl http://localhost:3000/dummy-data-info
```

## 🔒 Admin Routes (Local Development Only)

### **Admin Panel**
- **URL**: `/admin`
- **Description**: Admin dashboard with statistics and controls
- **Features**: Charts, quick actions, debug mode

- **URL**: `/admin/items`
- **Description**: Item management interface
- **Features**: CRUD operations, search, filtering

### **Admin APIs**
- **URL**: `/admin/api/items`
- **Method**: GET
- **Description**: Get all items for admin management

- **URL**: `/admin/api/items/{id}`
- **Method**: GET, PUT, DELETE
- **Description**: Manage individual items

- **URL**: `/admin/api/stats`
- **Method**: GET
- **Description**: Admin statistics (shows all 202 items)

- **URL**: `/admin/api/clear-cache`
- **Method**: POST
- **Description**: Clear admin cache

- **URL**: `/admin/api/warm-cache`
- **Method**: POST
- **Description**: Warm admin cache

## 📱 Responsive Design

### **Breakpoints**
- **Desktop**: >1200px - 4-column grid layout
- **Tablet**: 768px-1200px - 2-column grid layout
- **Mobile**: <768px - 1-column grid layout

### **Features**
- **Touch-friendly**: Large touch targets for mobile
- **Responsive charts**: Charts adapt to screen size
- **Mobile navigation**: Optimized mobile navigation
- **Performance**: Optimized for mobile networks

## 🎨 Styling & Assets

### **CSS Organization**
- **Public CSS**: `/assets/css/style.css`
- **Admin CSS**: `/admin/assets/css/admin.css`
- **Custom Fonts**: TBL and TBL-2 fonts
- **Responsive**: Mobile-first responsive design

### **JavaScript Modules**
- **Chart Utils**: `/shared/assets/js/chart-utils.js`
- **Demo Manager**: `/assets/js/demo-manager.js`
- **String Schema**: `/assets/js/string-schema.js`
- **Stats Charts**: `/assets/js/stats-page-charts.js`

### **Images**
- **Format**: AVIF and JPG for optimal performance
- **Location**: `/assets/images/posters/`
- **Optimization**: Responsive images with proper sizing

## 🔄 Caching Strategy

### **Memory Caching**
- **Data**: Cached for 5 minutes
- **Stats**: Cached for 2 minutes
- **Charts**: Cached for 3 minutes
- **Performance**: Significant performance improvement

### **Cache Keys**
- `master_data` - Complete dataset
- `stats` - Statistics data
- `admin_all_items` - Admin items data
- `admin_stats` - Admin statistics

## 📈 Performance Metrics

### **Current Performance**
- **Page Load**: <2 seconds
- **API Response**: <500ms
- **Cache Hit Rate**: >90%
- **Uptime**: >99.9%

### **Optimization Features**
- **Memory Caching**: Reduces database queries
- **HTMX**: Reduces full page reloads
- **Image Optimization**: AVIF format for better compression
- **Code Splitting**: Modular JavaScript files
- **CDN Ready**: Optimized for CDN delivery

---

## 📝 Notes

- **Authentication**: All public routes are accessible without authentication
- **Admin Access**: Admin routes are only available in local development
- **Data Format**: APIs return JSON, pages return HTML with EJS templating
- **HTMX Support**: All routes support both traditional requests and HTMX
- **Backward Compatibility**: Legacy URLs are maintained
- **Error Handling**: Comprehensive error handling with custom pages
- **Performance**: Optimized for speed and scalability
- **Accessibility**: WCAG 2.1 AA compliance features

---

*Last updated: December 2024*
*Reflects current clean, organized codebase with HTMX integration*