/**
 * Pie Chart Class
 * Handles pie chart creation and management
 */
class PieChart extends BaseChart {
  constructor(options = {}) {
    super('Pie', options);
    this.data = null;
  }

  /**
   * Create pie chart
   */
  createChart(data) {
    try {
      this.logger.info('Pie Chart: Creating chart');
      this.data = data;
      
      // Destroy existing chart
      this.destroyChart();
      
      // Show spinner
      this.showSpinner();
      
      // Prepare chart data
      const chartDataObj = this.prepareChartData(data);
      
      // Store chart data for modal recreation
      this.chartData = chartDataObj;
      
      // Create chart
      this.chartInstance = window.ChartUtils.createPieChart('pieChart', chartDataObj);
      
      // Hide spinner
      this.hideSpinner();
      
      // Create custom legend with processed data
      this.createCustomLegend('pieChartLegend', chartDataObj.labels, chartDataObj.datasets[0].backgroundColor, data);
      
      this.logger.info('Pie Chart: Chart created successfully');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepare chart data
   */
  prepareChartData(data) {
    const labels = [];
    const values = [];
    const colors = [];

    // Process data
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'total' && typeof value === 'number') {
        labels.push(key);
        values.push(value);
        const color = this.getColorForCategory(key);
        console.log(`Pie Chart Color Debug: ${key} -> ${color}`);
        colors.push(color);
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }],
      colors: colors
    };
  }

  /**
   * Get color for category - now uses global color system
   */
  getColorForCategory(category) {
    return window.ChartColors ? window.ChartColors.getCategoryColor(category) : window.ChartColors?.getDefaultColor() || 'rgba(201, 203, 207, 0.8)';
  }

  /**
   * Load chart data
   */
  async loadData() {
    try {
      this.logger.info('Pie Chart: Loading data');
      const data = await this.fetchData('/stats/chart/pie');
      this.createChart(data);
    } catch (error) {
      this.logger.error('Pie Chart: Failed to load data, trying demo data');
      try {
        // Try to fetch demo data first
        const demoData = await this.fetchData('/dummy-data/pie');
        this.createChart(demoData);
      } catch (demoError) {
        this.logger.warn('Pie Chart: Demo data fetch failed, using embedded demo data');
        // Use embedded demo data as fallback
        const embeddedDemoData = {
          "Male": 105,
          "Female": 32,
          "Company": 24,
          "Group": 30,
          "Unknown": 10
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
      this.logger.info('Pie Chart: Updating chart');
      this.createChart(newData);
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
   * Override toggleDataVisibility for pie chart specific behavior
   */
  toggleDataVisibility(label, index) {
    if (!this.chartInstance) {
      this.logger.warn('Pie Chart: Chart instance not available for toggle');
      return;
    }

    // For pie charts, we toggle individual data points, not datasets
    const chart = this.chartInstance;
    const meta = chart.getDatasetMeta(0); // Pie charts have only one dataset
    
    if (meta.data && meta.data[index]) {
      // Toggle the specific data point
      meta.data[index].hidden = !meta.data[index].hidden;
      
      // Update the legend item appearance
      const legendItem = document.querySelector(`.pie-legend-item:nth-child(${index + 1})`);
      if (legendItem) {
        const visibilityStyles = window.ChartConfig ? window.ChartConfig.getCommonSettings().visibilityStyles : {
          hiddenOpacity: '0.5',
          hiddenTextDecoration: 'line-through',
          visibleOpacity: '1',
          visibleTextDecoration: 'none'
        };
        
        if (meta.data[index].hidden) {
          legendItem.style.opacity = visibilityStyles.hiddenOpacity;
          legendItem.style.textDecoration = visibilityStyles.hiddenTextDecoration;
        } else {
          legendItem.style.opacity = visibilityStyles.visibleOpacity;
          legendItem.style.textDecoration = visibilityStyles.visibleTextDecoration;
        }
      }
      
      // Update the chart
      chart.update();
      
      this.logger.info(`Pie Chart: Toggled visibility for ${label}`);
    } else {
      this.logger.warn(`Pie Chart: Data point at index ${index} not found`);
    }
  }

  /**
   * Get tooltip text for legend items with category information
   */
  getTooltipText(label, data, index) {
    console.log('Pie Chart Tooltip Debug:', { label, data, index, hasCategoryCounts: data?.categoryCounts });
    
    // Try to extract count from the raw data
    if (data && typeof data === 'object') {
      // Look for the count value in the raw data
      const count = data[label] || data[label.toLowerCase()] || 0;
      
      // Calculate percentage if we have a total
      let percentage = '0';
      if (data.total && data.total > 0) {
        percentage = ((count / data.total) * 100).toFixed(1);
      }
      
      const legendTooltipConfig = window.ChartConfig ? 
        window.ChartConfig.getLegendTooltipConfigWithOverrides('pieChart') : (() => {
        const tooltipColors = window.ChartColors?.getTooltipColors() || {
          text: window.ChartColors?.getDefaultColor() || '#000000',
          border: window.ChartColors?.getDefaultColor() || '#FE0000'
        };
          return {
            statusLabel: window.ChartConfig?.getCommonLabels()?.legendTooltip?.statusLabel || 'Category',
            statusLabelColor: tooltipColors.border,
            statusValueColor: tooltipColors.text
          };
        })();
      
      const statusLabelColor = legendTooltipConfig.statusLabelColor || window.ChartColors?.getTooltipColors()?.border || '#FE0000';
      const statusValueColor = legendTooltipConfig.statusValueColor || window.ChartColors?.getTooltipColors()?.text || '#000000';
      
      return `<strong style="color: ${statusLabelColor};">${legendTooltipConfig.statusLabel || window.ChartConfig?.getCommonLabels()?.legendTooltip?.statusLabel || 'Category'}</strong><br/><strong><span style="color: ${statusValueColor};">${label}</span></strong><br/>${count} (${percentage}%)`;
    }
    
    const legendTooltipConfig = window.ChartConfig ? 
      window.ChartConfig.getLegendTooltipConfigWithOverrides('pieChart') : (() => {
        const tooltipColors = window.ChartColors?.getTooltipColors() || {
          text: window.ChartColors?.getDefaultColor() || '#000000',
          border: window.ChartColors?.getDefaultColor() || '#FE0000'
        };
        return {
          statusLabel: window.ChartConfig?.getCommonLabels()?.legendTooltip?.statusLabel || 'Category',
          statusLabelColor: tooltipColors.border,
          statusValueColor: tooltipColors.text
        };
      })();
    
    const statusLabelColor = legendTooltipConfig.statusLabelColor || window.ChartColors?.getTooltipColors()?.border || '#FE0000';
    const statusValueColor = legendTooltipConfig.statusValueColor || window.ChartColors?.getTooltipColors()?.text || '#000000';
    
    const fallbackText = window.ChartConfig?.getCommonLabels()?.fallbackText || 'Data available';
    return `<strong style="color: ${statusLabelColor};">${legendTooltipConfig.statusLabel || window.ChartConfig?.getCommonLabels()?.legendTooltip?.statusLabel || 'Category'}</strong><br/><span style="color: ${statusValueColor};">${label}</span><br/>${fallbackText}`;
  }

  /**
   * Toggle chart expansion
   */
  toggleExpand(chartId) {
    const container = document.getElementById(chartId);
    if (!container) {
      this.logger.warn('Pie Chart: Container not found for expansion');
      return;
    }

    const chartContainer = container.closest('.chart-container');
    if (!chartContainer) {
      this.logger.warn('Pie Chart: Chart container not found');
      return;
    }

    const isExpanded = chartContainer.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse chart
      chartContainer.classList.remove('expanded');
      this.logger.info('Pie Chart: Chart collapsed');
    } else {
      // Expand chart
      chartContainer.classList.add('expanded');
      this.logger.info('Pie Chart: Chart expanded');
      
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
  module.exports = PieChart;
} else {
  window.PieChart = PieChart;
}

