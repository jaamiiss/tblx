# Shared Data System

This directory contains shared data resources used across the application, including fallback data for offline functionality and demo mode.

## Files

- `dummy-data.json` - Comprehensive dummy data file containing sample data for all endpoints
- `README.md` - This documentation file

## Overview

The shared data system provides fallback functionality when:
- Firestore quota is exceeded
- Network connectivity issues occur
- Cache misses happen
- Demo mode is activated
- Firestore errors occur

## Data Structure

The `dummy-data.json` file contains comprehensive sample data organized by endpoint:

### **version1**
- **Purpose**: Complete dataset for V1 list endpoint
- **Content**: Array of sample items with all required fields
- **Usage**: `/version1` API endpoint and `/list` page

### **version2**
- **Purpose**: V2 filtered dataset
- **Content**: Array of sample items filtered by V2 field
- **Usage**: `/version2` API endpoint and `/list/v2` page

### **stats**
- **Purpose**: Complete statistics data for analytics
- **Content**: Comprehensive statistics including:
  - `counts` - Status counts (deceased, active, incarcerated, etc.)
  - `percentages` - Status percentages
  - `items` - Items grouped by status
  - `categoryCounts` - Category distribution (Male, Female, Company, Group)
  - `categoryPercentages` - Category percentages
  - `v1Ranges` - Data grouped by V1 number ranges
  - `v1v2Data` - Scatter plot data for V1 vs V2 visualization

## Demo Mode Integration

### **Automatic Activation**
Demo mode is automatically activated when:
- Firestore quota is exceeded
- Network connectivity is lost
- Cache is empty and database is unavailable
- User manually triggers demo mode

### **Demo Mode Features**
- **Load Demo Data Button**: Appears when offline/quota exceeded
- **Seamless Experience**: Users can continue using the application
- **Full Functionality**: All features work with dummy data
- **Visual Indicators**: Clear indication when in demo mode

## API Endpoints

### **Data Management**
- `GET /dummy-data-info` - Get information about loaded dummy data
- `GET /quota-status` - Check Firestore quota status
- `GET /cache-stats` - Get cache statistics

### **Cache Management**
- `POST /admin/api/clear-cache` - Clear admin cache
- `POST /admin/api/warm-cache` - Warm admin cache

## Data Management

### **Updating Dummy Data**
1. Edit `dummy-data.json` with new sample data
2. Restart the server to automatically reload
3. Or use admin panel cache management features

### **Data Validation**
- **Schema Validation**: Data structure is validated on load
- **Field Requirements**: All required fields must be present
- **Type Checking**: Data types are validated
- **Fallback Safety**: System falls back to minimal data if validation fails

### **Performance Considerations**
- **Memory Usage**: Dummy data is loaded into memory for fast access
- **Cache Integration**: Works seamlessly with memory caching system
- **Size Optimization**: Data is optimized for performance
- **Lazy Loading**: Data is loaded only when needed

## Item Data Structure

### **Standard Item Format**
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

### **Status Types**
- **deceased**: Deceased individuals
- **active**: Currently active individuals
- **incarcerated**: Incarcerated individuals
- **redacted**: Redacted/sensitive information
- **unknown**: Unknown status
- **captured**: Captured individuals

### **Category Types**
- **Male**: Male individuals
- **Female**: Female individuals
- **Company**: Corporate entities
- **Group**: Group organizations
- **Unknown**: Unknown category

## Statistics Data Structure

### **Counts Object**
```json
{
  "deceased": "number",
  "active": "number",
  "incarcerated": "number",
  "redacted": "number",
  "unknown": "number",
  "captured": "number",
  "total": "number"
}
```

### **Percentages Object**
```json
{
  "deceased": "string",
  "active": "string",
  "incarcerated": "string",
  "redacted": "string",
  "unknown": "string",
  "captured": "string"
}
```

### **Category Data**
```json
{
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

## Error Handling

### **Fallback Behavior**
- **Primary**: Load from `dummy-data.json`
- **Secondary**: Use minimal hardcoded data
- **Tertiary**: Return empty arrays with error messages
- **Graceful Degradation**: Application continues to function

### **Error Scenarios**
- **File Not Found**: Falls back to hardcoded data
- **Invalid JSON**: Falls back to hardcoded data
- **Missing Fields**: Uses default values
- **Type Mismatches**: Converts or uses defaults

## Integration Points

### **Public Routes**
- **List Views**: `/list`, `/list/v2`, `/the-blacklist`
- **Status Pages**: `/list/{status}`
- **Statistics**: `/stats`

### **Admin Panel**
- **Dashboard**: Uses stats data for charts
- **Items Management**: Uses version data for CRUD operations
- **Cache Management**: Controls data loading and caching

### **API Endpoints**
- **Data APIs**: `/version1`, `/version2`, `/status/{status}`
- **Stats APIs**: `/stats/cards`, `/stats/chart/*`
- **Utility APIs**: `/quota-status`, `/cache-stats`

## Development Guidelines

### **Adding New Data**
1. **Maintain Structure**: Keep consistent data structure
2. **Validate Data**: Ensure all required fields are present
3. **Test Integration**: Verify data works with all endpoints
4. **Update Documentation**: Keep this README updated

### **Performance Optimization**
- **Minimize Size**: Keep dummy data file size reasonable
- **Optimize Structure**: Use efficient data structures
- **Cache Strategy**: Leverage memory caching
- **Lazy Loading**: Load data only when needed

### **Testing**
- **Unit Tests**: Test data loading and validation
- **Integration Tests**: Test with all endpoints
- **Error Tests**: Test fallback scenarios
- **Performance Tests**: Test loading times and memory usage

## Monitoring & Debugging

### **Logging**
- **Data Load**: Log when dummy data is loaded
- **Fallback Usage**: Log when fallback data is used
- **Error Events**: Log data loading errors
- **Performance**: Log loading times and memory usage

### **Debug Information**
- **Data Source**: Track whether data comes from file or fallback
- **Load Time**: Monitor data loading performance
- **Memory Usage**: Track memory consumption
- **Error Rates**: Monitor data loading error rates

## Security Considerations

### **Data Privacy**
- **Sample Data Only**: Dummy data contains only sample information
- **No Real Data**: Never include real personal information
- **Anonymized**: All data is anonymized and fictional
- **Compliance**: Follows data privacy best practices

### **Access Control**
- **Public Access**: Dummy data is publicly accessible
- **No Authentication**: No authentication required for demo data
- **Read-Only**: Dummy data is read-only
- **Safe Fallback**: Safe to use as fallback data

---

## Quick Reference

### **File Location**
```
src/shared/data/dummy-data.json
```

### **Key Endpoints**
- `/dummy-data-info` - Get dummy data information
- `/quota-status` - Check quota status
- `/cache-stats` - Get cache statistics

### **Demo Mode**
- Automatic activation when offline/quota exceeded
- Manual activation via "Load Demo Data" button
- Full functionality with sample data
- Clear visual indicators

### **Data Updates**
- Edit `dummy-data.json` file
- Restart server for automatic reload
- Use admin panel for cache management

---

*Last updated: December 2024*
*Reflects current clean, organized codebase with comprehensive demo mode integration*