/**
 * Base Chart Class
 * Shared functionality for all chart types
 */
class BaseChart {
  constructor(chartType) {
    this.chartType = chartType;
    this.chartInstance = null;
    this.data = null;
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger(`Chart-${chartType}`) : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    this.logger.info(`${chartType} Chart: Initialized`);
  }

  /**
   * Show chart spinner
   */
  showSpinner() {
    const spinnerId = `${this.chartType.toLowerCase()}ChartSpinner`;
    const spinner = document.getElementById(spinnerId);
    if (spinner) {
      spinner.style.display = 'block';
      this.logger.debug(`${this.chartType} Chart: Showing spinner`);
    }
  }

  /**
   * Hide chart spinner
   */
  hideSpinner() {
    const spinnerId = `${this.chartType.toLowerCase()}ChartSpinner`;
    const spinner = document.getElementById(spinnerId);
    if (spinner) {
      spinner.style.display = 'none';
      this.logger.debug(`${this.chartType} Chart: Hiding spinner`);
    }
  }

  /**
   * Destroy existing chart instance
   */
  destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
      this.logger.debug(`${this.chartType} Chart: Destroyed existing chart`);
    }
  }

  /**
   * Get chart data from API
   */
  async fetchData(endpoint) {
    try {
      this.logger.info(`${this.chartType} Chart: Fetching data from ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.logger.info(`${this.chartType} Chart: Data fetched successfully`);
      return data;
    } catch (error) {
      this.logger.error(`${this.chartType} Chart: Failed to fetch data:`, error);
      throw error;
    }
  }

  /**
   * Handle chart creation error
   */
  handleError(error, fallbackData = null) {
    this.logger.error(`${this.chartType} Chart: Error creating chart:`, error);
    
    if (fallbackData) {
      this.logger.info(`${this.chartType} Chart: Using fallback data`);
      this.createChart(fallbackData);
    } else {
      this.showErrorMessage();
    }
  }

  /**
   * Show error message
   */
  showErrorMessage() {
    const containerId = `${this.chartType.toLowerCase()}Chart`;
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">Failed to load ${this.chartType} chart</div>
        </div>
      `;
    }
  }

  /**
   * Create custom legend
   */
  createCustomLegend(legendId, labels, colors, data, similarityStats = null) {
    const legendContainer = document.getElementById(legendId);
    if (!legendContainer) {
      this.logger.warn(`${this.chartType} Chart: Legend container ${legendId} not found`);
      return;
    }

    legendContainer.innerHTML = '';

    // Create legend items
    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.className = `legend-item ${this.chartType.toLowerCase()}-legend-item`;
      
      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = colors[index];
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'legend-label';
      labelSpan.textContent = label;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelSpan);
      legendContainer.appendChild(legendItem);
    });

    // Add similarity stats for scatter chart
    if (similarityStats && this.chartType === 'Scatter') {
      this.addSimilarityStats(legendContainer, similarityStats);
    }

    this.logger.debug(`${this.chartType} Chart: Custom legend created`);
  }

  /**
   * Add similarity stats to legend (for scatter chart)
   */
  addSimilarityStats(legendContainer, similarityStats) {
    const similaritySection = document.createElement('div');
    similaritySection.className = 'similarity-section';
    
    const similarityTitle = document.createElement('div');
    similarityTitle.className = 'similarity-title';
    similarityTitle.textContent = 'V1 & V2 Similarity';
    
    const similarityContent = document.createElement('div');
    similarityContent.className = 'similarity-content';
    similarityContent.innerHTML = `
      <div>Similar Values: ${similarityStats.similarCount}/${similarityStats.totalCount}</div>
      <div>Similarity: ${similarityStats.similarityPercentage.toFixed(1)}%</div>
    `;
    
    similaritySection.appendChild(similarityTitle);
    similaritySection.appendChild(similarityContent);
    legendContainer.appendChild(similaritySection);
  }

  /**
   * Toggle legend visibility
   */
  toggleLegend(legendId, show = null) {
    const legend = document.getElementById(legendId);
    if (!legend) return;

    if (show === null) {
      show = legend.style.display === 'none';
    }

    legend.style.display = show ? 'block' : 'none';
    this.logger.debug(`${this.chartType} Chart: Legend ${show ? 'shown' : 'hidden'}`);
  }

  /**
   * Toggle chart expansion
   */
  toggleExpand(chartContainerId) {
    const chartContainer = document.getElementById(chartContainerId);
    if (!chartContainer) return;

    const isExpanded = chartContainer.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse
      chartContainer.classList.remove('expanded');
      document.body.style.overflow = '';
      this.logger.debug(`${this.chartType} Chart: Collapsed`);
    } else {
      // Expand
      chartContainer.classList.add('expanded');
      chartContainer.style.backgroundColor = '#ffffff';
      document.body.style.overflow = 'hidden';
      this.logger.debug(`${this.chartType} Chart: Expanded`);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseChart;
} else {
  window.BaseChart = BaseChart;
}
