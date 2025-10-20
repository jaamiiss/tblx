/**
 * Scatter Chart Class
 * Handles scatter chart creation and management
 */
class ScatterChart extends BaseChart {
  constructor(options = {}) {
    super('Scatter', options);
    this.data = null;
    this.dataFilter = 'both'; // 'both', 'v1', 'v2'
    this.statusFilter = 'all'; // 'all', 'deceased', 'active', etc.
  }

  /**
   * Create scatter chart
   */
  createChart(data) {
    try {
      this.logger.info('Scatter Chart: Creating chart');
      this.data = data;
      
      // Check if zoom plugin is available
      if (typeof ChartZoom === 'undefined') {
        this.logger.warn('Scatter Chart: Zoom plugin not available, creating chart without zoom functionality');
      } else {
        this.logger.debug('Scatter Chart: Zoom plugin available');
      }
      
      // Destroy existing chart
      this.destroyChart();
      
      // Show spinner
      this.showSpinner();
      
      // Prepare chart data
      const chartDataObj = this.prepareChartData(data);
      
      // Store chart data for modal recreation
      this.chartData = chartDataObj;
      
      // Create custom options
      const customOptions = this.createCustomOptions();
      
      // Debug: Log the custom options being passed to ChartUtils
      console.log('Scatter Chart - Custom Options:', JSON.stringify(customOptions, null, 2));
      console.log('Scatter Chart - Tooltip Config:', JSON.stringify(customOptions.plugins.tooltip, null, 2));
      console.log('Scatter Chart - Scales Config:', JSON.stringify(customOptions.scales, null, 2));
      
      // Debug: Check if tooltip callbacks exist in custom options
      if (customOptions.plugins?.tooltip?.callbacks) {
        console.log('Scatter Chart - Tooltip Callbacks Found:', Object.keys(customOptions.plugins.tooltip.callbacks));
        console.log('Scatter Chart - Tooltip Callbacks Content:', customOptions.plugins.tooltip.callbacks);
        
        // Test if callbacks are actually functions
        const callbacks = customOptions.plugins.tooltip.callbacks;
        console.log('Scatter Chart - Callback Types:', {
          title: typeof callbacks.title,
          label: typeof callbacks.label,
          labelColor: typeof callbacks.labelColor
        });
      } else {
        console.log('Scatter Chart - No Tooltip Callbacks Found!');
        console.log('Scatter Chart - Custom Options Plugins:', customOptions.plugins);
      }
      
      // Create chart
      this.chartInstance = window.ChartUtils.createScatterChart('scatterChart', chartDataObj, customOptions);
      
      // Check if zoom functionality is available after chart creation
      if (this.chartInstance) {
        this.logger.debug('Scatter Chart: Chart created successfully');
        
        if (this.chartInstance.zoom) {
          this.logger.debug('Scatter Chart: Zoom functionality available');
        } else {
          this.logger.warn('Scatter Chart: Zoom functionality not available on chart instance');
        }
      } else {
        this.logger.error('Scatter Chart: Failed to create chart');
      }
      
      // Debug: Log chart instance and canvas dimensions (commented out for production)
      // if (this.chartInstance) {
      //   const canvas = document.getElementById('scatterChart');
      //   console.log('Scatter Chart Canvas Dimensions:', {
      //     width: canvas.width,
      //     height: canvas.height,
      //     clientWidth: canvas.clientWidth,
      //     clientHeight: canvas.clientHeight,
      //     offsetWidth: canvas.offsetWidth,
      //     offsetHeight: canvas.offsetHeight
      //   });
      //   console.log('Scatter Chart Instance:', this.chartInstance);
      // }
      
      // Hide spinner
      this.hideSpinner();
      
      // Calculate similarity stats
      const similarityStats = this.calculateSimilarityStats(data);
      
      // Create custom legend
      this.createCustomLegend('scatterChartLegend', chartDataObj.labels, chartDataObj.colors, data, similarityStats);
      
      this.logger.info('Scatter Chart: Chart created successfully');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepare chart data
   */
  prepareChartData(data) {
    const datasets = [];
    const colors = window.ChartColors ? window.ChartColors.getStatusColors() : window.ChartColors?.getDefaultColor() || 'rgba(201, 203, 207, 0.8)';
    const labels = [];

    // Handle different data structures
    let items = [];
    
    if (data.items && Array.isArray(data.items)) {
      // New structure: { items: [...] }
      items = data.items;
    } else if (Array.isArray(data)) {
      // Direct array structure
      items = data;
    } else if (typeof data === 'object') {
      // Object with categories - process by category
      Object.entries(data).forEach(([category, categoryItems], index) => {
        if (Array.isArray(categoryItems) && categoryItems.length > 0) {
          const filteredItems = this.filterItems(categoryItems);
        
        if (filteredItems.length > 0) {
          const dataset = {
            label: category,
            data: filteredItems.map(item => ({
              x: item.v1,
              y: item.v2,
              name: item.name,
              status: item.status,
              category: item.category
            })),
              backgroundColor: this.getColorForCategory(category),
              borderColor: this.getColorForCategory(category),
            pointRadius: 6,
            pointHoverRadius: 8
          };
          datasets.push(dataset);
          labels.push(category);
        }
      }
    });
      
      return {
        datasets,
        labels,
        colors: datasets.map(dataset => dataset.backgroundColor)
      };
    }

    // If we have a flat array of items, group by status
    if (items.length > 0) {
      const filteredItems = this.filterItems(items);
      
      // Group by status
      const statusGroups = {};
      filteredItems.forEach(item => {
        const status = item.status || window.ChartConfig?.getCommonLabels()?.fallbackStatus || 'unknown';
        if (!statusGroups[status]) {
          statusGroups[status] = [];
        }
        statusGroups[status].push(item);
      });

      // Create datasets for each status
      Object.entries(statusGroups).forEach(([status, statusItems], index) => {
        if (statusItems.length > 0) {
          const dataset = {
            label: status.charAt(0).toUpperCase() + status.slice(1),
            data: statusItems.map(item => ({
              x: item.v1,
              y: item.v2,
              name: item.name,
              status: item.status,
              category: item.category
            })),
            backgroundColor: this.getColorForStatus(status),
            borderColor: this.getColorForStatus(status),
            pointRadius: 6,
            pointHoverRadius: 8
          };
          datasets.push(dataset);
          labels.push(status.charAt(0).toUpperCase() + status.slice(1));
        }
      });
    }

    return {
      labels,
      datasets,
      colors: datasets.map(dataset => dataset.backgroundColor)
    };
  }

  /**
   * Get color for category - uses global color system
   */
  getColorForCategory(category) {
    return window.ChartColors ? window.ChartColors.getCategoryColor(category) : window.ChartColors?.getDefaultColor() || 'rgba(201, 203, 207, 0.8)';
  }

  /**
   * Get color for status - now uses global color system
   */
  getColorForStatus(status) {
    return window.ChartColors ? window.ChartColors.getStatusColor(status) : window.ChartColors?.getDefaultColor() || 'rgba(201, 203, 207, 0.8)';
  }

  /**
   * Filter items based on current filters
   */
  filterItems(items) {
    return items.filter(item => {
      // Status filter
      if (this.statusFilter !== 'all' && item.status !== this.statusFilter) {
        return false;
      }
      
      // Data filter
      if (this.dataFilter === 'v1' && item.v1 === 0) {
        return false;
      }
      if (this.dataFilter === 'v2' && item.v2 === 0) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Create custom options for scatter chart
   */
  createCustomOptions() {
    // Create base plugins configuration
    const basePlugins = {
        legend: {
          display: false
        },
      tooltip: window.ChartConfig ? (() => {
        console.log('Scatter Chart - ChartConfig is available:', !!window.ChartConfig);
        console.log('Scatter Chart - ChartConfig methods:', Object.keys(window.ChartConfig));
        const config = window.ChartConfig.getTooltipConfigWithOverrides('scatterChart');
        console.log('Scatter Chart - Chart Config Tooltip Result:', JSON.stringify(config, null, 2));
        return config;
      })() : {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#FE0000',
          borderWidth: 1,
          cornerRadius: 8,
        padding: 18,  // Increased padding
        displayColors: true,  // Enable color indicators
          titleFont: {
            size: 14,
          weight: 'bold',
          family: "'TBL-2', monospace"
          },
          bodyFont: {
          size: 12,
          family: "'TBL-2', monospace"
          },
          callbacks: {
            title: function(context) {
                 console.log('🎯 CHART TOOLTIP TITLE CALLBACK TRIGGERED:', context);
                 
                 // Clear previous multiple labels when starting new tooltip
                 window.scatterChartMultipleLabels = null;
                 
                 // Store multiple points info for label callback
                 window.scatterChartMultiplePoints = context.length > 1;
                 window.scatterChartAllPoints = context;
                 
                 // Handle multiple points
                 if (context.length > 1) {
                   const count = context.length;
                   console.log('🎯 CHART TOOLTIP TITLE RESULT (Multiple):', `${count} Data Points`);
                   return `${count} Data Points`;
                 } else {
                   const point = context[0].raw;
                   const name = point.name || window.ChartConfig?.getCommonLabels()?.fallbackName || 'Unknown';
                   console.log('🎯 CHART TOOLTIP TITLE RESULT (Single):', name);
                   return name;
                 }
            },
            label: function(context) {
            console.log('🎯 CHART TOOLTIP LABEL CALLBACK TRIGGERED:', context);
            
            // Check if we have multiple points from title callback
            if (window.scatterChartMultiplePoints && window.scatterChartAllPoints) {
              console.log('🎯 Multiple points detected, using special layout');
              
              // Get the current point data
              const point = context.raw;
              const capitalizedStatus = point.status ? point.status.charAt(0).toUpperCase() + point.status.slice(1) : 'Unknown';
              const name = point.name || 'Unknown';
              
              // Format for multiple points - include name as header
              const labels = [
                ` ${name}`,
                ` (${point.x}, ${point.y})`
              ];
              
              console.log('🎯 CHART TOOLTIP LABEL RESULT (Multiple):', labels);
              return labels;
            } else {
              // Single point - compact format
              const point = context.raw;
              const capitalizedStatus = point.status ? point.status.charAt(0).toUpperCase() + point.status.slice(1) : 'Unknown';
              const labels = [];
              
              // Add category first if it exists
              if (point.category && point.category !== 'undefined') {
                labels.push(` ${point.category}`);
              }
              
              // Add status
              labels.push(` ${capitalizedStatus}`);
              
              // Add coordinates
              labels.push(` (${point.x}, ${point.y})`);
              
              console.log('🎯 CHART TOOLTIP LABEL RESULT (Single):', labels);
              return labels;
            }
          },
          labelColor: function(context) {
            return {
              borderColor: context.dataset.borderColor || context.dataset.backgroundColor,
              backgroundColor: context.dataset.backgroundColor,
              borderWidth: 0,
              borderRadius: 6, // Half of width/height for perfect circle
              width: 12,
              height: 12
            };
          }
        }
      }
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...basePlugins,
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
            drag: {
              enabled: true,
              modifierKey: 'ctrl',  // Require Ctrl key for dragging
              threshold: 4
            }
          },
          pan: {
            enabled: true,
            modifierKey: 'shift',
            threshold: 4,
            onPan: function({chart}) {
              console.log('Panning scatter chart');
            }
          },
          limits: {
            x: {min: 0, max: 222},
            y: {min: 0, max: 222}
          },
          // Ensure chart stays within container bounds
          onZoom: function({chart}) {
            // Force chart to stay within container bounds
            chart.resize();
          }
        }
      },
      scales: window.ChartConfig ? window.ChartConfig.getAxisConfig('scatterChart') : {
        x: {
          title: {
            display: true   // Show x-axis title
          },
          min: 0,
          max: 222
        },
        y: {
          title: {
            display: true   // Show y-axis title
          },
          min: 0,
          max: 222
        }
      },
      interaction: {
        intersect: true,
        mode: 'point'
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    };
    
    // Debug: Log the scales configuration (commented out for production)
    // console.log('Scatter Chart Scales Config:', JSON.stringify(options.scales, null, 2));
    
    return options;
  }

  /**
   * Calculate similarity statistics
   */
  calculateSimilarityStats(data) {
    // Handle different data structures
    let items = [];
    
    if (data.items && Array.isArray(data.items)) {
      // New structure: { items: [...] }
      items = data.items;
    } else if (Array.isArray(data)) {
      // Direct array structure
      items = data;
    } else if (typeof data === 'object') {
      // Object with categories - flatten all items
      items = [];
      Object.values(data).forEach(categoryItems => {
        if (Array.isArray(categoryItems)) {
          items = items.concat(categoryItems);
        }
      });
    }
    
    const filteredItems = this.filterItems(items);
    let similarCount = 0;
    
    filteredItems.forEach(item => {
      if (item.v1 === item.v2) {
        similarCount++;
      }
    });
    
    const totalCount = filteredItems.length;
    const similarityPercentage = totalCount > 0 ? (similarCount / totalCount) * 100 : 0;
    
    return {
      similarCount,
      totalCount,
      similarityPercentage
    };
  }

  /**
   * Update chart with current filters (without fetching new data)
   */
  updateWithCurrentFilters() {
    if (this.data && this.chartInstance) {
      this.logger.info('Scatter Chart: Updating chart with current filters');
      
      // Prepare chart data with current filters
      const chartDataObj = this.prepareChartData(this.data);
      
      // Update the chart instance
      this.chartInstance.data = chartDataObj;
      this.chartInstance.update();
      
      this.logger.info('Scatter Chart: Chart updated with filters');
    } else {
      this.logger.warn('Scatter Chart: No data or chart instance available for filter update');
    }
  }

  /**
   * Load chart data
   */
  async loadData() {
    try {
      this.logger.info('Scatter Chart: Loading data');
      const data = await this.fetchData('/stats/chart/scatter');
      this.createChart(data);
    } catch (error) {
      this.logger.error('Scatter Chart: Failed to load data, trying demo data');
      try {
        // Try to fetch demo data first
        const demoData = await this.fetchData('/dummy-data/scatter');
        this.createChart(demoData);
      } catch (demoError) {
        this.logger.warn('Scatter Chart: Demo data fetch failed, using embedded demo data');
        // Use embedded demo data as fallback
        const embeddedDemoData = {
          "items": [
            {"v1": 1, "v2": 101, "name": "John Smith", "status": "deceased", "category": "Unknown"},
            {"v1": 2, "v2": 102, "name": "Sarah Johnson", "status": "active", "category": "Unknown"},
            {"v1": 3, "v2": 103, "name": "TechCorp Inc.", "status": "incarcerated", "category": "Unknown"},
            {"v1": 4, "v2": 104, "name": "Alpha Group", "status": "redacted", "category": "Unknown"},
            {"v1": 5, "v2": 105, "name": "Unknown Entity", "status": "unknown", "category": "Unknown"},
            {"v1": 6, "v2": 106, "name": "Robert Wilson", "status": "deceased", "category": "Unknown"},
            {"v1": 7, "v2": 107, "name": "Jennifer Garcia", "status": "active", "category": "Unknown"},
            {"v1": 8, "v2": 108, "name": "DataFlow Systems", "status": "incarcerated", "category": "Unknown"},
            {"v1": 9, "v2": 109, "name": "Beta Organization", "status": "redacted", "category": "Unknown"},
            {"v1": 10, "v2": 110, "name": "Mystery Person", "status": "unknown", "category": "Unknown"}
          ]
        };
        this.createChart(embeddedDemoData);
      }
    }
  }

  /**
   * Update chart with new data
   */
  updateChart(newData) {
    if (this.chartInstance && newData) {
      this.logger.info('Scatter Chart: Updating chart');
      this.createChart(newData);
    }
  }

  /**
   * Set data filter
   */
  setDataFilter(filter) {
    this.dataFilter = filter;
    if (this.data) {
      this.createChart(this.data);
    }
  }

  /**
   * Set status filter
   */
  setStatusFilter(filter) {
    this.statusFilter = filter;
    if (this.data) {
      this.createChart(this.data);
    }
  }

  /**
   * Reset zoom
   */
  resetZoom() {
    if (this.chartInstance && this.chartInstance.resetZoom) {
      this.chartInstance.resetZoom();
      this.logger.debug('Scatter Chart: Zoom reset');
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    if (!this.chartInstance) {
      this.logger.warn('Scatter Chart: Chart instance not available for zoom in');
      return;
    }

    try {
      // Check if zoom plugin is available and chart has proper options
      if (typeof ChartZoom !== 'undefined' && this.chartInstance.zoom && this.chartInstance.options) {
        // Use Chart.js zoom plugin API
        if (this.chartInstance.zoom) {
          this.chartInstance.zoom(1.2);
          this.logger.debug('Scatter Chart: Zoomed in using Chart.js zoom plugin');
        } else {
          this.logger.warn('Scatter Chart: Zoom method not available on chart instance');
        }
      } else {
        // Fallback: manually adjust scales
        this.manualZoomIn();
      }
    } catch (error) {
      this.logger.warn('Scatter Chart: Error zooming in:', error.message);
      // Fallback to manual zoom
      this.manualZoomIn();
    }
  }

  /**
   * Manual zoom in (fallback method)
   */
  manualZoomIn() {
    if (!this.chartInstance || !this.chartInstance.options || !this.chartInstance.options.scales) {
      this.logger.warn('Scatter Chart: Chart instance or options not available for manual zoom in');
      return;
    }

    const scales = this.chartInstance.options.scales;
    
    // Get current scale ranges
    const xScale = this.chartInstance.scales?.x;
    const yScale = this.chartInstance.scales?.y;
    
    if (!xScale || !yScale) {
      this.logger.warn('Scatter Chart: Scale instances not available for manual zoom in');
      return;
    }

    const xRange = xScale.max - xScale.min;
    const yRange = yScale.max - yScale.min;
    
    // Zoom in by 20%
    const zoomFactor = 0.8;
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    
    const xCenter = (xScale.max + xScale.min) / 2;
    const yCenter = (yScale.max + yScale.min) / 2;
    
    // Update scales
    this.chartInstance.options.scales.x.min = xCenter - newXRange / 2;
    this.chartInstance.options.scales.x.max = xCenter + newXRange / 2;
    this.chartInstance.options.scales.y.min = yCenter - newYRange / 2;
    this.chartInstance.options.scales.y.max = yCenter + newYRange / 2;
    
    this.chartInstance.update();
    this.logger.debug('Scatter Chart: Manual zoom in applied');
  }

  /**
   * Zoom out
   */
  zoomOut() {
    if (!this.chartInstance) {
      this.logger.warn('Scatter Chart: Chart instance not available for zoom out');
      return;
    }

    try {
      // Check if zoom plugin is available and chart has proper options
      if (typeof ChartZoom !== 'undefined' && this.chartInstance.zoom && this.chartInstance.options) {
        // Use Chart.js zoom plugin API
        if (this.chartInstance.zoom) {
          this.chartInstance.zoom(0.8);
          this.logger.debug('Scatter Chart: Zoomed out using Chart.js zoom plugin');
        } else {
          this.logger.warn('Scatter Chart: Zoom method not available on chart instance');
        }
      } else {
        // Fallback: manually adjust scales
        this.manualZoomOut();
      }
    } catch (error) {
      this.logger.warn('Scatter Chart: Error zooming out:', error.message);
      // Fallback to manual zoom
      this.manualZoomOut();
    }
  }

  /**
   * Manual zoom out (fallback method)
   */
  manualZoomOut() {
    if (!this.chartInstance || !this.chartInstance.options || !this.chartInstance.options.scales) {
      this.logger.warn('Scatter Chart: Chart instance or options not available for manual zoom out');
      return;
    }

    const scales = this.chartInstance.options.scales;
    
    // Get current scale ranges
    const xScale = this.chartInstance.scales?.x;
    const yScale = this.chartInstance.scales?.y;
    
    if (!xScale || !yScale) {
      this.logger.warn('Scatter Chart: Scale instances not available for manual zoom out');
      return;
    }

    const xRange = xScale.max - xScale.min;
    const yRange = yScale.max - yScale.min;
    
    // Zoom out by 20%
    const zoomFactor = 1.25;
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    
    const xCenter = (xScale.max + xScale.min) / 2;
    const yCenter = (yScale.max + yScale.min) / 2;
    
    // Update scales
    this.chartInstance.options.scales.x.min = xCenter - newXRange / 2;
    this.chartInstance.options.scales.x.max = xCenter + newXRange / 2;
    this.chartInstance.options.scales.y.min = yCenter - newYRange / 2;
    this.chartInstance.options.scales.y.max = yCenter + newYRange / 2;
    
    this.chartInstance.update();
    this.logger.debug('Scatter Chart: Manual zoom out applied');
  }

  /**
   * Get chart instance
   */
  getChartInstance() {
    return this.chartInstance;
  }

  /**
   * Get chart data
   */
  getData() {
    return this.data;
  }

  /**
   * Get tooltip text for legend items with status information and percentages
   */
  getTooltipText(label, data, index) {
    console.log('Scatter Chart Tooltip Debug:', { label, data, index, hasSimilarityStats: data?.similarityStats });
    
    // Try to extract data from the raw data structure
    if (data && typeof data === 'object') {
      // Look for items with this status
      let items = [];
      
      if (data.items && Array.isArray(data.items)) {
        items = data.items.filter(item => item.status === label.toLowerCase());
      } else if (Array.isArray(data)) {
        items = data.filter(item => item.status === label.toLowerCase());
      }
      
      if (items.length > 0) {
        // Calculate basic stats
        const count = items.length;
        const totalItems = data.items ? data.items.length : data.length;
        const percentage = totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : '0.0';
        
        // Calculate similarity stats if possible
        let avgSimilarity = 0;
        let maxSimilarity = 0;
        
        if (items.length > 0) {
          const similarities = items.map(item => {
            if (item.v1 && item.v2) {
              return Math.abs(item.v1 - item.v2);
            }
            return 0;
          }).filter(sim => sim > 0);
          
          if (similarities.length > 0) {
            avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
            maxSimilarity = Math.max(...similarities);
          }
        }
        
        const legendTooltipConfig = window.ChartConfig ? 
          window.ChartConfig.getLegendTooltipConfigWithOverrides('scatterChart') : {
            statusLabel: 'Status',
            statusLabelColor: '#FE0000',
            statusValueColor: '#000000'
          };
        
        const statusLabelColor = legendTooltipConfig.statusLabelColor || window.ChartColors?.getTooltipColors()?.border || '#FE0000';
        const statusValueColor = legendTooltipConfig.statusValueColor || window.ChartColors?.getTooltipColors()?.text || '#000000';
        
        return `<strong style="color: ${statusLabelColor};">${legendTooltipConfig.statusLabel || 'Status'}</strong><br/><strong style="color: ${statusValueColor};">${label}</strong><br/>${count} items (${percentage}%)`;
      }
    }
    
    const legendTooltipConfig = window.ChartConfig ? 
      window.ChartConfig.getLegendTooltipConfigWithOverrides('scatterChart') : {
        statusLabel: 'Status',
        statusLabelColor: '#FE0000',
        statusValueColor: '#000000'
      };
    
    const statusLabelColor = legendTooltipConfig.statusLabelColor || window.ChartColors?.getTooltipColors()?.border || '#FE0000';
    const statusValueColor = legendTooltipConfig.statusValueColor || window.ChartColors?.getTooltipColors()?.text || '#000000';
    const fallbackText = window.ChartConfig?.getCommonLabels()?.fallbackText || 'Data available';
    
    return `<strong style="color: ${statusLabelColor};">${legendTooltipConfig.statusLabel || 'Status'}</strong><br/><strong style="color: ${statusValueColor};">${label}</strong><br/>${fallbackText}`;
  }

  /**
   * Toggle chart expansion
   */
  toggleExpand(chartId) {
    const container = document.getElementById(chartId);
    if (!container) {
      this.logger.warn('Scatter Chart: Container not found for expansion');
      return;
    }

    const chartContainer = container.closest('.chart-container');
    if (!chartContainer) {
      this.logger.warn('Scatter Chart: Chart container not found');
      return;
    }

    const isExpanded = chartContainer.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse chart
      chartContainer.classList.remove('expanded');
      this.logger.info('Scatter Chart: Chart collapsed');
    } else {
      // Expand chart
      chartContainer.classList.add('expanded');
      this.logger.info('Scatter Chart: Chart expanded');
      
      // Resize chart after expansion
      if (this.chartInstance) {
        setTimeout(() => {
          this.chartInstance.resize();
        }, 300);
      }
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScatterChart;
} else {
  window.ScatterChart = ScatterChart;
}

