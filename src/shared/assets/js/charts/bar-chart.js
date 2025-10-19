/**
 * Bar Chart Class
 * Handles bar chart creation and management
 */
class BarChart extends BaseChart {
  constructor(options = {}) {
    super('Bar', options);
    this.data = null;
  }

  /**
   * Create bar chart
   */
  async createChart(data) {
    try {
      this.logger.info('Bar Chart: Creating chart');
      this.data = data;
      
      // Destroy existing chart
      this.destroyChart();
      
      // Show spinner
      this.showSpinner();
      
      // Prepare chart data
      const chartDataObj = await this.prepareChartData(data);
      
      // Store chart data for modal recreation
      this.chartData = chartDataObj;
      
      // Create chart
      this.chartInstance = window.ChartUtils.createBarChart('barChart', chartDataObj, this.createCustomOptions());
      
      // Hide spinner
      this.hideSpinner();
      
      // Create custom legend with status labels instead of range labels
      const statusLabels = chartDataObj.datasets.map(dataset => dataset.label);
      const statusColors = chartDataObj.datasets.map(dataset => dataset.backgroundColor);
      this.createCustomLegend('barChartLegend', statusLabels, statusColors, data);
      
      this.logger.info('Bar Chart: Chart created successfully');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepare chart data
   */
  async prepareChartData(data) {
    const datasets = [];
    const labels = [];

    // Get all unique statuses from the data
    const allStatuses = new Set();
    Object.values(data).forEach(rangeData => {
      if (typeof rangeData === 'object') {
        Object.keys(rangeData).forEach(status => {
          if (status !== 'total') {
            allStatuses.add(status);
          }
        });
      }
    });

    const statuses = Array.from(allStatuses);
    
    // Create datasets for each status
    statuses.forEach((status, statusIndex) => {
      const statusData = [];
      const rangeLabels = [];
      
      // Process each range
      Object.entries(data).forEach(([range, rangeData]) => {
        if (typeof rangeData === 'object' && rangeData[status] !== undefined) {
          statusData.push(rangeData[status]);
          rangeLabels.push(range);
        }
      });
      
      if (statusData.length > 0) {
        datasets.push({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          data: statusData,
          backgroundColor: this.getColorForStatus(status),
          borderColor: this.getColorForStatus(status),
          borderWidth: 1
        });
      }
    });

    // Use the first range's labels
    labels.push(...Object.keys(data).filter(key => typeof data[key] === 'object'));

    // Extract colors from datasets for legend
    const legendColors = datasets.map(dataset => dataset.backgroundColor);

    return {
      labels,
      datasets,
      colors: legendColors
    };
  }

  /**
   * Create custom options for bar chart
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
          mode: 'index',
          intersect: false,
          ...(window.ChartConfig ? window.ChartConfig.getTooltipConfigWithOverrides('barChart') : (() => {
            const tooltipColors = window.ChartColors ? window.ChartColors.getTooltipColors() : {
              background: window.ChartColors?.getDefaultColor() || '#ffffff',
              text: window.ChartColors?.getDefaultColor() || '#000000',
              border: window.ChartColors?.getDefaultColor() || '#FE0000'
            };
            return {
              backgroundColor: tooltipColors.background,
              titleColor: tooltipColors.text,
              bodyColor: tooltipColors.text,
              borderColor: tooltipColors.border,
              borderWidth: 1,
              padding: 5,
              titleSpacing: 4,
              bodySpacing: 3,
              cornerRadius: 6,
              displayColors: true
            };
          })()),
          callbacks: {
            title: function(context) {
              // Show the rows (e.g., "0-50", "51-100")
              const tooltipTitle = window.ChartConfig ? window.ChartConfig.getTooltipTitleText('barChart') : window.ChartConfig?.getChartLabels('barChart')?.tooltipTitle || 'Rows';
              return `${tooltipTitle} ${context[0].label}`;
            },
            label: function(context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              return ` ${datasetLabel}: ${value}`;
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
      },
      scales: window.ChartConfig ? window.ChartConfig.getAxisConfig('barChart') : (() => {
        const fallbackLabels = window.ChartConfig ? window.ChartConfig.getFallbackAxisLabels('barChart') : { 
          xAxis: window.ChartConfig?.getChartLabels('barChart')?.xAxis || 'Ranges', 
          yAxis: window.ChartConfig?.getChartLabels('barChart')?.yAxis || 'Count' 
        };
        return {
          x: {
            display: true,
            title: {
              display: true,
              text: fallbackLabels.xAxis
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: fallbackLabels.yAxis
            },
            beginAtZero: true
          }
        };
      })(),
      interaction: {
        mode: 'index',
        intersect: false
      }
    };
  }

  /**
   * Get tooltip text for legend items with combined range information
   */
  getTooltipText(label, data, index) {
    console.log('Bar Chart Tooltip Debug:', { label, data, index, hasV1Ranges: data?.v1Ranges });
    
    // Try to extract data from the raw data structure
    if (data && typeof data === 'object') {
      // Calculate total count for this status across all ranges
      let totalCount = 0;
      let grandTotal = 0;
      
      // First pass: calculate totals
      Object.values(data).forEach(rangeData => {
        if (typeof rangeData === 'object') {
          Object.entries(rangeData).forEach(([status, count]) => {
            if (typeof count === 'number') {
              grandTotal += count;
              if (status.toLowerCase() === label.toLowerCase()) {
                totalCount += count;
              }
            }
          });
        }
      });
      
      // Calculate percentage
      const percentage = grandTotal > 0 ? ((totalCount / grandTotal) * 100).toFixed(1) : '0.0';
      
      if (totalCount > 0) {
        const legendTooltipConfig = window.ChartConfig ? 
          window.ChartConfig.getLegendTooltipConfigWithOverrides('barChart') : {
            statusLabel: 'Status',
            statusLabelColor: '#FE0000',
            statusValueColor: '#000000'
          };
        
        const statusLabelColor = legendTooltipConfig.statusLabelColor || window.ChartColors?.getTooltipColors()?.border || '#FE0000';
        const statusValueColor = legendTooltipConfig.statusValueColor || window.ChartColors?.getTooltipColors()?.text || '#000000';
        
        return `<strong style="color: ${statusLabelColor};">${legendTooltipConfig.statusLabel || 'Status'}</strong><br/><strong style="color: ${statusValueColor};">${label}</strong><br/>${totalCount} (${percentage}%)`;
      }
    }
    
    // Fallback - use global fallback text
    const fallbackText = window.ChartConfig?.getCommonLabels()?.fallbackText || 'Data available';
    return fallbackText;
  }

  /**
   * Get color for status - now uses global color system
   */
  getColorForStatus(status) {
    return window.ChartColors ? window.ChartColors.getStatusColor(status) : window.ChartColors?.getDefaultColor() || 'rgba(201, 203, 207, 0.8)';
  }

  /**
   * Load chart data
   */
  async loadData() {
    try {
      this.logger.info('Bar Chart: Loading data');
      const data = await this.fetchData('/stats/chart/bar');
      await this.createChart(data);
    } catch (error) {
      this.logger.error('Bar Chart: Failed to load data, trying demo data');
      try {
        // Try to fetch demo data first
        const demoData = await this.fetchData('/dummy-data/bar');
        await this.createChart(demoData);
      } catch (demoError) {
        this.logger.warn('Bar Chart: Demo data fetch failed, using embedded demo data');
        // Use embedded demo data as fallback
        const embeddedDemoData = {
          "0-50": {"deceased": 10, "active": 10, "incarcerated": 10, "redacted": 10, "unknown": 5, "captured": 5, "total": 50},
          "51-100": {"deceased": 10, "active": 10, "incarcerated": 10, "redacted": 10, "unknown": 5, "captured": 5, "total": 50},
          "101-150": {"deceased": 10, "active": 10, "incarcerated": 10, "redacted": 10, "unknown": 5, "captured": 6, "total": 51},
          "151-200": {"deceased": 10, "active": 10, "incarcerated": 10, "redacted": 10, "unknown": 5, "captured": 6, "total": 51}
        };
        await this.createChart(embeddedDemoData);
      }
    }
  }

  /**
   * Update chart with new data
   */
  async updateChart(newData) {
    if (this.chartInstance && newData) {
      this.logger.info('Bar Chart: Updating chart');
      await this.createChart(newData);
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

  /**
   * Toggle chart expansion
   */
  toggleExpand(chartId) {
    const container = document.getElementById(chartId);
    if (!container) {
      this.logger.warn('Bar Chart: Container not found for expansion');
      return;
    }

    const chartContainer = container.closest('.chart-container');
    if (!chartContainer) {
      this.logger.warn('Bar Chart: Chart container not found');
      return;
    }

    const isExpanded = chartContainer.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse chart
      chartContainer.classList.remove('expanded');
      this.logger.info('Bar Chart: Chart collapsed');
    } else {
      // Expand chart
      chartContainer.classList.add('expanded');
      this.logger.info('Bar Chart: Chart expanded');
      
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
  module.exports = BarChart;
} else {
  window.BarChart = BarChart;
}

