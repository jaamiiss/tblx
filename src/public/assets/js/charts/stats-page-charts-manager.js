/**
 * Stats Page Charts Manager
 * Coordinates all chart types and manages the overall stats page functionality
 */
class StatsPageChartsManager {
  constructor() {
    this.pieChart = null;
    this.barChart = null;
    this.scatterChart = null;
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger('StatsPageChartsManager') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    // Register Chart.js zoom plugin
    if (typeof Chart !== 'undefined' && Chart.register) {
      Chart.register(ChartZoom);
    }
    
    this.init();
  }

  /**
   * Initialize the charts manager
   */
  init() {
    this.logger.info('Stats Page Charts Manager: Initializing...');
    
    // Wait for Chart.js to load
    if (typeof Chart !== 'undefined') {
      this.logger.info('Stats Page Charts Manager: Chart.js is available, loading charts...');
      setTimeout(() => {
        this.loadCharts();
      }, 3000);
    } else {
      this.logger.info('Stats Page Charts Manager: Chart.js not available, waiting...');
      this.waitForChartJS();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Wait for Chart.js to load
   */
  waitForChartJS() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    const checkChart = setInterval(() => {
      attempts++;
      if (typeof Chart !== 'undefined') {
        this.logger.info('Stats Page Charts Manager: Chart.js loaded after', attempts * 100, 'ms');
        clearInterval(checkChart);
        setTimeout(() => {
          this.loadCharts();
        }, 3000);
      } else if (attempts >= maxAttempts) {
        this.logger.error('Stats Page Charts Manager: Chart.js failed to load after 5 seconds');
        clearInterval(checkChart);
        this.loadDemoDataAsFallback();
      }
    }, 100);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Chart control buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('.legend-toggle')) {
        const legendId = event.target.dataset.legend;
        this.toggleLegend(legendId);
      } else if (event.target.matches('.expand-toggle')) {
        const chartId = event.target.dataset.chart;
        this.toggleExpand(chartId);
      } else if (event.target.matches('.zoom-reset')) {
        this.resetScatterZoom();
      } else if (event.target.matches('.zoom-in')) {
        this.zoomInScatter();
      } else if (event.target.matches('.zoom-out')) {
        this.zoomOutScatter();
      }
    });
  }

  /**
   * Load all charts
   */
  async loadCharts(retryCount = 0) {
    try {
      this.logger.info('Stats Page Charts Manager: Loading all charts...');
      
      // Initialize chart instances
      this.pieChart = new PieChart();
      this.barChart = new BarChart();
      this.scatterChart = new ScatterChart();
      
      // Load charts in parallel
      await Promise.all([
        this.pieChart.loadData(),
        this.barChart.loadData(),
        this.scatterChart.loadData()
      ]);
      
      this.logger.info('Stats Page Charts Manager: All charts loaded successfully');
      
    } catch (error) {
      this.logger.error('Stats Page Charts Manager: Error loading charts:', error);
      
      if (retryCount < 2) {
        this.logger.info(`Stats Page Charts Manager: Retrying in 2 seconds (attempt ${retryCount + 1}/2)`);
        setTimeout(() => {
          this.loadCharts(retryCount + 1);
        }, 2000);
      } else {
        this.logger.error('Stats Page Charts Manager: Max retries reached, loading demo data');
        await this.loadDemoDataAsFallback();
      }
    }
  }

  /**
   * Load demo data as fallback
   */
  async loadDemoDataAsFallback() {
    try {
      this.logger.info('Stats Page Charts Manager: Loading demo data as fallback');
      
      // Initialize chart instances if not already done
      if (!this.pieChart) this.pieChart = new PieChart();
      if (!this.barChart) this.barChart = new BarChart();
      if (!this.scatterChart) this.scatterChart = new ScatterChart();
      
      // Load demo data
      const demoData = await this.fetchDemoData();
      
      // Create charts with demo data
      this.pieChart.createChart(demoData.pie);
      await this.barChart.createChart(demoData.bar);
      this.scatterChart.createChart(demoData.scatter);
      
      this.logger.info('Stats Page Charts Manager: Demo data loaded successfully');
      
    } catch (error) {
      this.logger.error('Stats Page Charts Manager: Failed to load demo data:', error);
    }
  }

  /**
   * Fetch demo data
   */
  async fetchDemoData() {
    const response = await fetch('/dummy-data/stats');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Toggle legend visibility
   */
  toggleLegend(legendId) {
    if (this.pieChart && legendId === 'pieChartLegend') {
      this.pieChart.toggleLegend(legendId);
    } else if (this.barChart && legendId === 'barChartLegend') {
      this.barChart.toggleLegend(legendId);
    } else if (this.scatterChart && legendId === 'scatterChartLegend') {
      this.scatterChart.toggleLegend(legendId);
    }
  }

  /**
   * Toggle chart expansion
   */
  toggleExpand(chartId) {
    if (this.pieChart && chartId === 'pieChart') {
      this.pieChart.toggleExpand(chartId);
    } else if (this.barChart && chartId === 'barChart') {
      this.barChart.toggleExpand(chartId);
    } else if (this.scatterChart && chartId === 'scatterChart') {
      this.scatterChart.toggleExpand(chartId);
    }
  }

  /**
   * Reset scatter chart zoom
   */
  resetScatterZoom() {
    if (this.scatterChart) {
      this.scatterChart.resetZoom();
    }
  }

  /**
   * Zoom in scatter chart
   */
  zoomInScatter() {
    if (this.scatterChart) {
      this.scatterChart.zoomIn();
    }
  }

  /**
   * Zoom out scatter chart
   */
  zoomOutScatter() {
    if (this.scatterChart) {
      this.scatterChart.zoomOut();
    }
  }

  /**
   * Update charts with new data
   */
  updateCharts(data) {
    if (this.pieChart && data.pie) {
      this.pieChart.updateChart(data.pie);
    }
    if (this.barChart && data.bar) {
      this.barChart.updateChart(data.bar);
    }
    if (this.scatterChart && data.scatter) {
      this.scatterChart.updateChart(data.scatter);
    }
  }

  /**
   * Get chart instances
   */
  getChartInstances() {
    return {
      pie: this.pieChart?.getChartInstance(),
      bar: this.barChart?.getChartInstance(),
      scatter: this.scatterChart?.getChartInstance()
    };
  }

  /**
   * Destroy all charts
   */
  destroyCharts() {
    if (this.pieChart) {
      this.pieChart.destroyChart();
    }
    if (this.barChart) {
      this.barChart.destroyChart();
    }
    if (this.scatterChart) {
      this.scatterChart.destroyChart();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatsPageChartsManager;
} else {
  window.StatsPageChartsManager = StatsPageChartsManager;
}
