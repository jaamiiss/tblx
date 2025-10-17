/**
 * Pie Chart Class
 * Handles pie chart creation and management
 */
class PieChart extends BaseChart {
  constructor() {
    super('Pie');
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
      
      // Create chart
      this.chartInstance = window.ChartUtils.createPieChart('pieChart', chartDataObj);
      
      // Hide spinner
      this.hideSpinner();
      
      // Create custom legend
      this.createCustomLegend('pieChartLegend', chartDataObj.labels, chartDataObj.colors, data);
      
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
        colors.push(this.getColorForCategory(key));
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    };
  }

  /**
   * Get color for category
   */
  getColorForCategory(category) {
    const colorMap = {
      'Male': 'rgba(255, 99, 132, 0.8)',
      'Female': 'rgba(54, 162, 235, 0.8)',
      'Company': 'rgba(255, 205, 86, 0.8)',
      'Organization': 'rgba(75, 192, 192, 0.8)',
      'Unknown': 'rgba(153, 102, 255, 0.8)'
    };
    
    return colorMap[category] || 'rgba(201, 203, 207, 0.8)';
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
        const demoData = await this.fetchData('/dummy-data/pie');
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PieChart;
} else {
  window.PieChart = PieChart;
}
