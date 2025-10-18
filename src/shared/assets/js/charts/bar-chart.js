/**
 * Bar Chart Class
 * Handles bar chart creation and management
 */
class BarChart extends BaseChart {
  constructor() {
    super('Bar');
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
      
      // Create chart
      this.chartInstance = window.ChartUtils.createBarChart('barChart', chartDataObj);
      
      // Hide spinner
      this.hideSpinner();
      
      // Create custom legend
      this.createCustomLegend('barChartLegend', chartDataObj.labels, chartDataObj.colors, data);
      
      this.logger.info('Bar Chart: Chart created successfully');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Prepare chart data
   */
  async prepareChartData(data) {
    const labels = [];
    const values = [];
    const colors = [];

    // Process data
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'total' && typeof value === 'number') {
        labels.push(key);
        values.push(value);
        colors.push(this.getColorForStatus(key));
      }
    });

    return {
      labels,
      datasets: [{
        label: 'Count',
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    };
  }

  /**
   * Get color for status
   */
  getColorForStatus(status) {
    const colorMap = {
      'deceased': 'rgba(255, 99, 132, 0.8)',
      'active': 'rgba(54, 162, 235, 0.8)',
      'incarcerated': 'rgba(255, 205, 86, 0.8)',
      'redacted': 'rgba(75, 192, 192, 0.8)',
      'unknown': 'rgba(153, 102, 255, 0.8)',
      'captured': 'rgba(255, 159, 64, 0.8)'
    };
    
    return colorMap[status] || 'rgba(201, 203, 207, 0.8)';
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
        const demoData = await this.fetchData('/dummy-data/bar');
        await this.createChart(demoData);
      } catch (demoError) {
        this.handleError(demoError);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BarChart;
} else {
  window.BarChart = BarChart;
}
