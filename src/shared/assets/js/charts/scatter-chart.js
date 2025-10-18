/**
 * Scatter Chart Class
 * Handles scatter chart creation and management
 */
class ScatterChart extends BaseChart {
  constructor() {
    super('Scatter');
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
      
      // Destroy existing chart
      this.destroyChart();
      
      // Show spinner
      this.showSpinner();
      
      // Prepare chart data
      const chartDataObj = this.prepareChartData(data);
      
      // Create custom options
      const customOptions = this.createCustomOptions();
      
      // Create chart
      this.chartInstance = window.ChartUtils.createScatterChart('scatterChart', chartDataObj, customOptions);
      
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
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const labels = [];

    // Process data by category
    Object.entries(data).forEach(([category, items], index) => {
      if (Array.isArray(items) && items.length > 0) {
        const filteredItems = this.filterItems(items);
        
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
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            pointRadius: 6,
            pointHoverRadius: 8
          };
          
          datasets.push(dataset);
          labels.push(category);
        }
      }
    });

    return {
      labels,
      datasets,
      colors: colors.slice(0, datasets.length)
    };
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
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            title: function(context) {
              return context[0].raw.name || 'Unknown';
            },
            label: function(context) {
              const point = context.raw;
              return [
                `V1: ${point.x}`,
                `V2: ${point.y}`,
                `Status: ${point.status}`,
                `Category: ${point.category}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'V1 Values',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          min: 0,
          max: 200
        },
        y: {
          title: {
            display: true,
            text: 'V2 Values',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          min: 0,
          max: 200
        }
      },
      interaction: {
        intersect: true,
        mode: 'point'
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      },
      plugins: {
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
              modifierKey: null,
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
            x: {min: 0, max: 200},
            y: {min: 0, max: 200}
          }
        }
      }
    };
  }

  /**
   * Calculate similarity statistics
   */
  calculateSimilarityStats(items) {
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
        const demoData = await this.fetchData('/dummy-data/scatter');
        this.createChart(demoData);
      } catch (demoError) {
        this.handleError(demoError);
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
    if (this.chartInstance && this.chartInstance.zoom) {
      this.chartInstance.zoom(1.2);
      this.logger.debug('Scatter Chart: Zoomed in');
    }
  }

  /**
   * Zoom out
   */
  zoomOut() {
    if (this.chartInstance && this.chartInstance.zoom) {
      this.chartInstance.zoom(0.8);
      this.logger.debug('Scatter Chart: Zoomed out');
    }
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScatterChart;
} else {
  window.ScatterChart = ScatterChart;
}
