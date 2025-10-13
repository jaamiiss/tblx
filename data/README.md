# Dummy Data System

This directory contains fallback data used when Firestore quota is exceeded or cache misses occur.

## Files

- `dummy-data.json` - Main dummy data file containing sample data for all endpoints

## Usage

The dummy data is automatically loaded when the server starts and used as fallback when:
- Firestore quota is exceeded
- Cache misses occur
- Firestore errors happen

## Data Structure

The JSON file contains three main sections:

### version1
Array of sample items for the V1 list endpoint

### version2  
Array of sample items for the V2 list endpoint

### stats
Complete statistics data including:
- `counts` - Status counts
- `percentages` - Status percentages
- `items` - Items grouped by status
- `v1Ranges` - Data grouped by V1 number ranges
- `v1v2Data` - Scatter plot data

## Management Endpoints

- `GET /list/dummy-data-info` - Get information about loaded dummy data
- `POST /list/reload-dummy-data` - Reload dummy data from file
- `GET /list/cache-stats` - Get cache statistics
- `POST /list/clear-cache` - Clear cache

## Updating Dummy Data

1. Edit `dummy-data.json` with new sample data
2. Call `POST /list/reload-dummy-data` to reload without restarting server
3. Or restart the server to automatically reload

## Fallback Behavior

If the JSON file fails to load, the system falls back to minimal hardcoded data to ensure the application continues to function.
