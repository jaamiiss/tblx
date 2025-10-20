/**
 * Stats Page Charts Manager
 * Coordinates all chart types and manages the overall stats page functionality
 */
class StatsPageChartsManager {
  constructor() {
    this.pieChart = null;
    this.barChart = null;
    this.scatterChart = null;
    this.isLoadingCharts = false; // Prevent multiple simultaneous chart loading
    this.isLoadingDemoData = false; // Prevent multiple simultaneous demo data loading
    this.chartsLoaded = false; // Track if charts have been loaded successfully
    
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
        if (!this.chartsLoaded) {
          this.loadCharts();
        } else {
          this.logger.debug('Stats Page Charts Manager: Charts already loaded, skipping');
        }
      }, 1000);
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
          if (!this.chartsLoaded) {
            this.loadCharts();
          } else {
            this.logger.debug('Stats Page Charts Manager: Charts already loaded, skipping');
          }
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
    // Prevent multiple simultaneous chart loading
    if (this.isLoadingCharts) {
      this.logger.debug('Stats Page Charts Manager: Charts already loading, skipping');
      return;
    }
    
    this.isLoadingCharts = true;
    
    try {
      this.logger.info('Stats Page Charts Manager: Loading all charts...');
      
      // Check if all chart classes are available
      if (!window.PieChart || !window.BarChart || !window.ScatterChart) {
        throw new Error('Chart classes not loaded yet');
      }
      
      // Initialize chart instances with configuration
      if (!this.pieChart) {
        this.pieChart = new PieChart({ enableLegendToggle: true, enableTooltips: true });
      }
      if (!this.barChart) {
        this.barChart = new BarChart({ enableLegendToggle: true, enableTooltips: true });
      }
      if (!this.scatterChart) {
        this.scatterChart = new ScatterChart({ enableLegendToggle: true, enableTooltips: true });
      }
      
      // Progressive loading: Load charts one by one with delays
      this.logger.info('Stats Page Charts Manager: Loading pie chart...');
      await this.pieChart.loadData();
      await this.delay(500); // 500ms delay between charts
      
      this.logger.info('Stats Page Charts Manager: Loading bar chart...');
      await this.barChart.loadData();
      await this.delay(500); // 500ms delay between charts
      
      this.logger.info('Stats Page Charts Manager: Loading scatter chart...');
      await this.scatterChart.loadData();
      
      this.logger.info('Stats Page Charts Manager: All charts loaded progressively');
      
      // Mark charts as loaded
      this.chartsLoaded = true;
      
      // Trigger button initialization after charts are ready
      this.triggerButtonInitialization();
      
    } catch (error) {
      this.logger.error('Stats Page Charts Manager: Error loading charts:', error);
      
      if (retryCount < 2) {
        this.logger.info(`Stats Page Charts Manager: Retrying in 2 seconds (attempt ${retryCount + 1}/2)`);
        this.isLoadingCharts = false; // Reset flag for retry
        setTimeout(() => {
          this.loadCharts(retryCount + 1);
        }, 2000);
      } else {
        this.logger.error('Stats Page Charts Manager: Max retries reached, loading demo data');
        await this.loadDemoDataAsFallback();
      }
    } finally {
      // Only reset flag if not retrying
      if (retryCount >= 2) {
        this.isLoadingCharts = false;
      }
    }
  }

  /**
   * Utility method for delays in progressive loading
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Trigger button initialization after charts are ready
   */
  triggerButtonInitialization() {
    this.logger.info('Stats Page Charts Manager: Triggering button initialization...');
    
    // Dispatch custom event for button initialization
    window.dispatchEvent(new CustomEvent('chartsReady', { 
      detail: { 
        statsPageCharts: this,
        pieChart: this.pieChart,
        barChart: this.barChart,
        scatterChart: this.scatterChart
      } 
    }));
    
    // Also try direct initialization if chartButtonsManager is available
    if (window.chartButtonsManager) {
      this.logger.info('Stats Page Charts Manager: Direct button initialization');
      window.chartButtonsManager.initializeButtons(this);
    } else {
      this.logger.warn('Stats Page Charts Manager: chartButtonsManager not available for direct initialization');
    }
  }

  /**
   * Load demo data as fallback
   */
  async loadDemoDataAsFallback() {
    // Prevent multiple simultaneous demo data loading
    if (this.isLoadingDemoData) {
      this.logger.debug('Stats Page Charts Manager: Demo data already loading, skipping');
      return;
    }
    
    this.isLoadingDemoData = true;
    
    try {
      this.logger.info('Stats Page Charts Manager: Loading demo data as fallback');
      
      // Initialize chart instances if not already done
      if (!this.pieChart) {
        this.pieChart = new PieChart({ enableLegendToggle: true, enableTooltips: true });
      }
      if (!this.barChart) {
        this.barChart = new BarChart({ enableLegendToggle: true, enableTooltips: true });
      }
      if (!this.scatterChart) {
        this.scatterChart = new ScatterChart({ enableLegendToggle: true, enableTooltips: true });
      }
      
      // Load demo data
      const demoData = await this.fetchDemoData();
      
      // Create charts with demo data
      this.pieChart.createChart(demoData.pie);
      await this.barChart.createChart(demoData.bar);
      this.scatterChart.createChart(demoData.scatter);
      
      this.logger.info('Stats Page Charts Manager: Demo data loaded successfully');
      
    } catch (error) {
      this.logger.error('Stats Page Charts Manager: Failed to load demo data:', error);
    } finally {
      this.isLoadingDemoData = false; // Reset loading flag
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
    console.log('StatsPageChartsManager: toggleLegend called with:', legendId);
    if (this.pieChart && legendId === 'pieChartLegend') {
      console.log('StatsPageChartsManager: Toggling pie chart legend');
      this.pieChart.toggleLegend(legendId);
    } else if (this.barChart && legendId === 'barChartLegend') {
      console.log('StatsPageChartsManager: Toggling bar chart legend');
      this.barChart.toggleLegend(legendId);
    } else if (this.scatterChart && legendId === 'scatterChartLegend') {
      console.log('StatsPageChartsManager: Toggling scatter chart legend');
      this.scatterChart.toggleLegend(legendId);
    } else {
      console.log('StatsPageChartsManager: No matching chart found for legendId:', legendId);
    }
  }

  /**
   * Close the chart modal
   */
  closeModal() {
    const modal = document.getElementById('chartModal');
    const modalChartContainer = document.getElementById('modalChartContainer');
    
    if (modal) {
      // Destroy any existing modal chart instances
      if (modalChartContainer) {
        const modalCanvas = modalChartContainer.querySelector('canvas');
        if (modalCanvas) {
          const chartInstance = Chart.getChart(modalCanvas);
          if (chartInstance) {
            chartInstance.destroy();
            this.logger.info('Modal chart instance destroyed');
          }
        }
        
        // Clear modal content
        modalChartContainer.innerHTML = '';
      }
      
      modal.classList.remove('active');
      document.body.classList.remove('chart-modal-open');
      document.body.style.overflow = '';
      
      this.logger.info('Chart modal closed and cleaned up');
    }
  }

  /**
   * Create chart controls using reusable button system
   * @param {string} chartId - Chart identifier
   * @param {boolean} isScatter - Whether this is a scatter chart
   * @returns {Array} Array of button elements
   */
  createChartControls(chartId, isScatter = false) {
    const clickHandlers = {
      legendToggle: () => this.toggleLegend(`${chartId}Legend`),
      refresh: () => {
        if (isScatter) {
          this.refreshScatterChart();
        } else {
          this.refreshChart(chartId);
        }
      },
      expand: () => this.toggleExpand(chartId),
      zoomIn: () => this.zoomInScatter(),
      zoomOut: () => this.zoomOutScatter()
    };

    let buttons;
    if (isScatter) {
      buttons = window.ChartButtonIcons.createScatterControls(clickHandlers);
    } else {
      buttons = window.ChartButtonIcons.createStandardControls(clickHandlers);
    }
    
    return buttons;
  }

  /**
   * Create modal chart controls using reusable button system
   * @param {string} chartId - Chart identifier
   * @param {boolean} isScatter - Whether this is a scatter chart
   * @returns {Array} Array of button elements
   */
  createModalChartControls(chartId, isScatter = false) {
    const clickHandlers = {
      legendToggle: () => this.toggleLegend(`${chartId}LegendModal`),
      refresh: () => {
        if (isScatter) {
          this.refreshScatterChart();
        } else {
          this.refreshModalChart(chartId);
        }
      },
      close: () => this.closeModal(),
      zoomIn: () => this.zoomInScatter(),
      zoomOut: () => this.zoomOutScatter()
    };

    if (isScatter) {
      return window.ChartButtonIcons.createModalScatterControls(clickHandlers);
    } else {
      return window.ChartButtonIcons.createModalControls(clickHandlers);
    }
  }

  /**
   * Refresh chart data (generic method)
   * @param {string} chartId - Chart identifier
   */
  refreshChart(chartId) {
    // Trigger HTMX refresh instead of manual loading state
    const chartWrapper = document.getElementById(`${chartId}Wrapper`);
    if (chartWrapper) {
      // Trigger HTMX refresh event - this will show the chart spinner
      htmx.trigger(document.body, `refresh-${chartId}`);
      this.logger.info(`StatsPageChartsManager: Triggered HTMX refresh for ${chartId}`);
    } else {
      this.logger.warn(`Chart wrapper not found for ${chartId}`);
    }
  }

  /**
   * Refresh modal chart data
   * @param {string} chartId - Chart identifier
   */
  refreshModalChart(chartId) {
    const refreshButton = document.querySelector('#modalChartContainer .refresh-button');
    if (refreshButton) {
      window.ChartButtonIcons.addLoadingState(refreshButton);
    }
    
    // Refresh the modal chart by recreating it
    setTimeout(() => {
      const modalChartContainer = document.getElementById('modalChartContainer');
      if (modalChartContainer) {
        // Get the original chart instance
        const originalChart = this[chartId.toLowerCase()];
        if (originalChart && originalChart.chart) {
          // Clear the modal content
          modalChartContainer.innerHTML = '';
          
          // Recreate the modal structure
          this.createModalChartStructure(modalChartContainer, chartId);
          
          // Recreate the chart in the modal
          setTimeout(() => {
            const chartCanvasContainer = modalChartContainer.querySelector('.chart-canvas-container');
            const legendContainer = modalChartContainer.querySelector('.chart-legend');
            
            if (chartCanvasContainer && legendContainer) {
              // Create new canvas
              const newCanvas = document.createElement('canvas');
              newCanvas.id = `${chartId}Modal`;
              chartCanvasContainer.appendChild(newCanvas);
              
              // Create new chart instance with fresh data
              const newChartInstance = new Chart(newCanvas, originalChart.chart.config);
              newChartInstance.resize();
              
              // Recreate legend
              this.recreateModalLegend(legendContainer, chartId);
            }
          }, 100);
        }
      }
      
      // Remove loading state
      if (refreshButton) {
        window.ChartButtonIcons.removeLoadingState(refreshButton);
      }
    }, 500); // Small delay to show loading animation
  }

  /**
   * Recreate modal legend
   * @param {HTMLElement} legendContainer - Legend container element
   * @param {string} chartId - Chart identifier
   */
  recreateModalLegend(legendContainer, chartId) {
    const chartData = this[chartId.toLowerCase()]?.chartData;
    if (chartData && chartData.labels && chartData.colors) {
      // Clear existing legend content
      legendContainer.innerHTML = '';
      
      // Recreate legend with tooltip functionality
      chartData.labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '6px';
        legendItem.style.margin = '2px';
        legendItem.style.padding = '4px 8px';
        legendItem.style.borderRadius = '4px';
        legendItem.style.cursor = 'pointer';
        
        // Color indicator
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'legend-color';
        colorIndicator.style.backgroundColor = chartData.colors[index];
        colorIndicator.style.width = '12px';
        colorIndicator.style.height = '12px';
        colorIndicator.style.borderRadius = '2px';
        colorIndicator.style.border = 'none';
        
        // Label text
        const labelText = document.createElement('span');
        labelText.className = 'legend-label';
        labelText.textContent = label;
        labelText.style.fontSize = '0.8rem';
        labelText.style.fontWeight = 'bold';
        labelText.style.textTransform = 'uppercase';
        
        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(labelText);
        legendContainer.appendChild(legendItem);
      });
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
  toggleExpand(chartId) {
    const modal = document.getElementById('chartModal');
    const modalChartContainer = document.getElementById('modalChartContainer');
    
    if (!modal || !modalChartContainer) {
      this.logger.warn('Chart modal elements not found');
      return;
    }

    // Get the original chart container
    let originalContainer;
    let chartInstance;
    
    if (chartId === 'pieChart' && this.pieChart) {
      originalContainer = document.getElementById('pieChart');
      chartInstance = this.pieChart.chartInstance;
    } else if (chartId === 'barChart' && this.barChart) {
      originalContainer = document.getElementById('barChart');
      chartInstance = this.barChart.chartInstance;
    } else if (chartId === 'scatterChart' && this.scatterChart) {
      originalContainer = document.getElementById('scatterChart');
      chartInstance = this.scatterChart.chartInstance;
    }

    if (!originalContainer || !chartInstance) {
      this.logger.warn(`Chart ${chartId} not found or not initialized`);
      return;
    }

    // Create proper modal structure
    modalChartContainer.innerHTML = '';
    
    // Create modal header (at the top with close button)
    const modalHeader = document.createElement('div');
    modalHeader.className = 'chart-modal-header';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = this.getChartTitle(chartId);
    modalHeader.appendChild(title);
    
    // Add chart controls using reusable button system
    const chartControls = document.createElement('div');
    chartControls.className = 'chart-controls';
    
    // Create buttons using the reusable system
    const isScatter = chartId === 'scatterChart';
    const buttons = this.createModalChartControls(chartId, isScatter);
    
    // Add buttons to controls container
    window.ChartButtonIcons.addButtonsToContainer(chartControls, buttons);
    modalHeader.appendChild(chartControls);
    
    // Create chart wrapper
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    
    // Create chart canvas container
    const chartCanvasContainer = document.createElement('div');
    chartCanvasContainer.className = 'chart-canvas-container';
    chartCanvasContainer.style.width = '100%';
    chartCanvasContainer.style.height = '400px';
    
    // Create legend container
    const legendContainer = document.createElement('div');
    legendContainer.className = 'chart-legend';
    legendContainer.id = `${chartId}LegendModal`;
    
    // Assemble the modal structure
    chartWrapper.appendChild(chartCanvasContainer);
    chartWrapper.appendChild(legendContainer);
    
    modalChartContainer.appendChild(modalHeader);
    modalChartContainer.appendChild(chartWrapper);

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Create a new chart instance in the modal
    setTimeout(() => {
      if (chartInstance) {
        // Create new canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.id = `${chartId}Modal`;
        chartCanvasContainer.appendChild(newCanvas);
        
        // Create new chart instance with modified config for modal
        const modalConfig = { ...chartInstance.config };
        
        // Enable legend for modal charts
        if (modalConfig.options && modalConfig.options.plugins) {
          modalConfig.options.plugins.legend = {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: "'Blacklisted', 'Arial Black', Arial, Helvetica, sans-serif"
              }
            }
          };
        }
        
        const newChartInstance = new Chart(newCanvas, modalConfig);
        newChartInstance.resize();
        
        // Recreate legend if it exists
        if (legendContainer && this[chartId.toLowerCase()]) {
          const chartData = this[chartId.toLowerCase()].chartData;
          if (chartData && chartData.labels && chartData.colors) {
            // Clear existing legend content
            legendContainer.innerHTML = '';
            
            // Recreate legend with tooltip functionality
            chartData.labels.forEach((label, index) => {
              const legendItem = document.createElement('div');
              legendItem.className = 'legend-item';
              legendItem.style.display = 'flex';
              legendItem.style.alignItems = 'center';
              legendItem.style.gap = '6px';
              legendItem.style.margin = '2px';
              legendItem.style.padding = '4px 8px';
              legendItem.style.borderRadius = '4px';
              legendItem.style.cursor = 'pointer';
              legendItem.style.transition = 'background-color 0.2s';
              legendItem.style.whiteSpace = 'nowrap';
              legendItem.style.flexShrink = '0';
              
              // Add color indicator
              const colorIndicator = document.createElement('div');
              colorIndicator.className = 'legend-color';
              colorIndicator.style.width = '12px';
              colorIndicator.style.height = '12px';
              colorIndicator.style.backgroundColor = chartData.colors[index];
              colorIndicator.style.borderRadius = '2px';
              colorIndicator.style.border = 'none';
              colorIndicator.style.flexShrink = '0';
              
              // Add label
              const labelSpan = document.createElement('span');
              labelSpan.className = 'legend-label';
              labelSpan.textContent = label;
              labelSpan.style.fontSize = '0.8rem';
              labelSpan.style.fontWeight = 'bold';
              labelSpan.style.textTransform = 'uppercase';
              labelSpan.style.flexShrink = '0';
              
              // Add value if available
              if (chartData.counts && chartData.counts[index] !== undefined) {
                const valueSpan = document.createElement('span');
                valueSpan.className = 'legend-value';
                valueSpan.textContent = chartData.counts[index];
                valueSpan.style.fontSize = '0.75rem';
                valueSpan.style.color = '#666';
                valueSpan.style.flexShrink = '0';
                legendItem.appendChild(valueSpan);
              }
              
              legendItem.appendChild(colorIndicator);
              legendItem.appendChild(labelSpan);
              legendContainer.appendChild(legendItem);
            });
            
            this.logger.info(`Legend recreated for ${chartId} in modal`);
          }
        }
        
        this.logger.info(`Chart ${chartId} created in modal with full functionality`);
      }
    }, 100);

    this.logger.info(`Chart ${chartId} opened in modal`);
  }

  /**
   * Ensure modal chart structure includes all necessary elements
   */
  ensureModalChartStructure(container, chartId) {
    // Ensure modal header exists
    let modalHeader = container.querySelector('.chart-modal-header');
    if (!modalHeader) {
      modalHeader = document.createElement('div');
      modalHeader.className = 'chart-modal-header';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = this.getChartTitle(chartId);
      modalHeader.appendChild(title);
      
      // Add chart controls using reusable button system
      const chartControls = document.createElement('div');
      chartControls.className = 'chart-controls';
      
      // Create buttons using the reusable system
      const isScatter = chartId === 'scatterChart';
      const buttons = this.createModalChartControls(chartId, isScatter);
      
      // Add buttons to controls container
      window.ChartButtonIcons.addButtonsToContainer(chartControls, buttons);
      modalHeader.appendChild(chartControls);
      
      // Insert header at the beginning
      container.insertBefore(modalHeader, container.firstChild);
    }
    
    // Ensure chart wrapper exists
    let chartWrapper = container.querySelector('.chart-wrapper');
    if (!chartWrapper) {
      chartWrapper = document.createElement('div');
      chartWrapper.className = 'chart-wrapper';
      
      // Create chart canvas container
      const chartCanvasContainer = document.createElement('div');
      chartCanvasContainer.className = 'chart-canvas-container';
      chartCanvasContainer.style.width = '100%';
      chartCanvasContainer.style.height = '400px';
      
      // Create legend container
      const legendContainer = document.createElement('div');
      legendContainer.className = 'chart-legend';
      legendContainer.id = `${chartId}LegendModal`;
      
      chartWrapper.appendChild(chartCanvasContainer);
      chartWrapper.appendChild(legendContainer);
      
      container.appendChild(chartWrapper);
    }
  }

  /**
   * Get chart title based on chart ID
   */
  getChartTitle(chartId) {
    const titles = {
      'pieChart': 'Category Distribution',
      'barChart': 'Status Distribution',
      'scatterChart': 'V1 vs V2 Analysis'
    };
    return titles[chartId] || 'Chart';
  }

  /**
   * Add scatter chart specific controls
   */
  addScatterChartControls(container) {
    const chartControls = container.querySelector('.chart-controls');
    if (!chartControls) return;
    
    // Check if controls already exist
    if (chartControls.querySelector('.zoom-in') || chartControls.querySelector('.refresh-button')) return;
    
    // Add zoom controls
    const zoomIn = document.createElement('button');
    zoomIn.className = 'zoom-in';
    zoomIn.title = 'Zoom In';
    zoomIn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;
    
    const zoomOut = document.createElement('button');
    zoomOut.className = 'zoom-out';
    zoomOut.title = 'Zoom Out';
    zoomOut.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;
    
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-button';
    refreshButton.title = 'Refresh Chart';
    refreshButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>
    `;
    
    chartControls.appendChild(zoomIn);
    chartControls.appendChild(zoomOut);
    chartControls.appendChild(refreshButton);
  }

  /**
   * Setup modal buttons functionality
   */
  setupModalButtons(container, chartId) {
    // Legend toggle buttons
    const legendToggleButtons = container.querySelectorAll('.legend-toggle');
    legendToggleButtons.forEach(button => {
      button.onclick = () => {
        const legendId = `${chartId}Legend`;
        this.toggleLegend(legendId);
      };
    });
    
    // Expand toggle buttons (should close modal)
    const expandToggleButtons = container.querySelectorAll('.expand-toggle');
    expandToggleButtons.forEach(button => {
      button.onclick = () => {
        this.closeModal();
      };
    });
    
    // Scatter chart specific buttons
    if (chartId === 'scatterChart') {
      const zoomInButton = container.querySelector('.zoom-in');
      if (zoomInButton) {
        zoomInButton.onclick = () => this.zoomInScatter();
      }
      
      const zoomOutButton = container.querySelector('.zoom-out');
      if (zoomOutButton) {
        zoomOutButton.onclick = () => this.zoomOutScatter();
      }
      
      const refreshButton = container.querySelector('.refresh-button');
      if (refreshButton) {
        refreshButton.onclick = () => this.refreshScatterChart();
      }
    }
    
    // Pie chart specific buttons
    if (chartId === 'pieChart') {
      const refreshButton = container.querySelector('.refresh-button');
      if (refreshButton) {
        refreshButton.onclick = () => this.refreshPieChart();
      }
    }
    
    // Bar chart specific buttons
    if (chartId === 'barChart') {
      const refreshButton = container.querySelector('.refresh-button');
      if (refreshButton) {
        refreshButton.onclick = () => this.refreshBarChart();
      }
    }
    
    this.logger.info(`Modal buttons setup complete for ${chartId}`);
  }

  /**
   * Refresh scatter chart
   */
  refreshScatterChart() {
    this.logger.info('StatsPageChartsManager: Refreshing scatter chart');
    
    // Reset filter dropdowns to default values
    const dataFilter = document.getElementById('dataFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (dataFilter) {
      dataFilter.value = 'all';
      if (this.scatterChart) {
        this.scatterChart.dataFilter = 'all';
      }
    }
    
    if (statusFilter) {
      statusFilter.value = 'all';
      if (this.scatterChart) {
        this.scatterChart.statusFilter = 'all';
      }
    }
    
    // Reset any toggled legends to show all data
    this.resetScatterLegendToggles();
    
    // Reset zoom to default view
    this.resetScatterZoom();
    
    // Trigger HTMX refresh to show spinner and reload data
    this.refreshChart('scatterChart');
  }

  /**
   * Refresh pie chart
   */
  refreshPieChart() {
    this.logger.info('StatsPageChartsManager: Refreshing pie chart');
    this.refreshChart('pieChart');
  }

  /**
   * Refresh bar chart
   */
  refreshBarChart() {
    this.logger.info('StatsPageChartsManager: Refreshing bar chart');
    this.refreshChart('barChart');
  }

  /**
   * Reset scatter chart legend toggles to show all data
   */
  resetScatterLegendToggles() {
    if (this.scatterChart && this.scatterChart.chartInstance) {
      try {
        // Reset all dataset visibility
        const chart = this.scatterChart.chartInstance;
        chart.data.datasets.forEach((dataset, index) => {
          const meta = chart.getDatasetMeta(index);
          meta.hidden = false;
        });
        
        // Update legend appearance
        const legendItems = document.querySelectorAll('.scatter-legend-item');
        legendItems.forEach(item => {
          item.style.opacity = '1';
          item.style.textDecoration = 'none';
        });
        
        // Update the chart with error handling
        chart.update('none'); // Use 'none' animation to prevent event binding issues
        
        this.logger.info('StatsPageChartsManager: Reset scatter chart legend toggles');
      } catch (error) {
        this.logger.warn('StatsPageChartsManager: Error resetting scatter legend toggles:', error.message);
      }
    }
  }

  /**
   * Reset scatter chart zoom
   */
  resetScatterZoom() {
    if (this.scatterChart && this.scatterChart.chartInstance) {
      try {
      this.scatterChart.resetZoom();
      } catch (error) {
        this.logger.warn('StatsPageChartsManager: Error resetting scatter chart zoom:', error);
      }
    }
  }

  /**
   * Zoom in scatter chart
   */
  zoomInScatter() {
    if (!this.scatterChart) {
      this.logger.warn('StatsPageChartsManager: Scatter chart not available for zoom in');
      return;
    }

    if (!this.scatterChart.chartInstance) {
      this.logger.warn('StatsPageChartsManager: Scatter chart instance not available for zoom in');
      return;
    }

    try {
      this.scatterChart.zoomIn();
    } catch (error) {
      this.logger.warn('StatsPageChartsManager: Error zooming in scatter chart:', error);
    }
  }

  /**
   * Zoom out scatter chart
   */
  zoomOutScatter() {
    if (!this.scatterChart) {
      this.logger.warn('StatsPageChartsManager: Scatter chart not available for zoom out');
      return;
    }

    if (!this.scatterChart.chartInstance) {
      this.logger.warn('StatsPageChartsManager: Scatter chart instance not available for zoom out');
      return;
    }

    try {
      this.scatterChart.zoomOut();
    } catch (error) {
      this.logger.warn('StatsPageChartsManager: Error zooming out scatter chart:', error);
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
  
  // Create global instance for stats page
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.statsPageCharts) {
      window.statsPageCharts = new StatsPageChartsManager();
    } else {
      console.log('StatsPageChartsManager: Instance already exists, skipping initialization');
    }
  });
}

