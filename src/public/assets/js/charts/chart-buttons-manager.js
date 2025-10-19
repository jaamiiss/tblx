/**
 * Chart Buttons Manager
 * Handles initialization and management of chart control buttons
 */

class ChartButtonsManager {
  constructor() {
    this.initialized = false;
    this.chartControls = new Map();
  }

  /**
   * Initialize all chart buttons
   * @param {Object} statsPageCharts - The stats page charts manager instance
   */
  initializeButtons(statsPageCharts) {
    if (this.initialized) {
      console.log('Chart buttons already initialized');
      return;
    }

    console.log('Initializing chart buttons...');
    console.log('ChartButtonIcons available:', !!window.ChartButtonIcons);
    console.log('statsPageCharts available:', !!statsPageCharts);
    console.log('statsPageCharts.pieChart available:', !!(statsPageCharts && statsPageCharts.pieChart));
    console.log('statsPageCharts.barChart available:', !!(statsPageCharts && statsPageCharts.barChart));
    console.log('statsPageCharts.scatterChart available:', !!(statsPageCharts && statsPageCharts.scatterChart));

    if (!window.ChartButtonIcons || !statsPageCharts) {
      console.error('ChartButtonIcons or statsPageCharts not available');
      return;
    }

    try {
      // Initialize pie chart controls
      this.initializePieChartButtons(statsPageCharts);
      
      // Initialize bar chart controls
      this.initializeBarChartButtons(statsPageCharts);
      
      // Initialize scatter chart controls
      this.initializeScatterChartButtons(statsPageCharts);
      
      this.initialized = true;
      console.log('Chart buttons initialized successfully');
    } catch (error) {
      console.error('Error initializing chart buttons:', error);
    }
  }

  /**
   * Initialize pie chart buttons
   * @param {Object} statsPageCharts - The stats page charts manager instance
   */
  initializePieChartButtons(statsPageCharts) {
    const pieControls = document.getElementById('pieChartControls');
    console.log('Pie controls container:', pieControls);
    
    if (pieControls) {
      // Clear existing buttons to prevent duplicates
      pieControls.innerHTML = '';
      
      const pieButtons = statsPageCharts.createChartControls('pieChart', false);
      window.ChartButtonIcons.addButtonsToContainer(pieControls, pieButtons);
      this.chartControls.set('pieChart', pieControls);
      console.log('Pie chart buttons added:', pieControls.children.length);
    } else {
      console.warn('Pie chart controls container not found');
    }
  }

  /**
   * Initialize bar chart buttons
   * @param {Object} statsPageCharts - The stats page charts manager instance
   */
  initializeBarChartButtons(statsPageCharts) {
    const barControls = document.getElementById('barChartControls');
    console.log('Bar controls container:', barControls);
    
    if (barControls) {
      // Clear existing buttons to prevent duplicates
      barControls.innerHTML = '';
      
      const barButtons = statsPageCharts.createChartControls('barChart', false);
      window.ChartButtonIcons.addButtonsToContainer(barControls, barButtons);
      this.chartControls.set('barChart', barControls);
      console.log('Bar chart buttons added:', barControls.children.length);
    } else {
      console.warn('Bar chart controls container not found');
    }
  }

  /**
   * Initialize scatter chart buttons
   * @param {Object} statsPageCharts - The stats page charts manager instance
   */
  initializeScatterChartButtons(statsPageCharts) {
    const scatterControls = document.getElementById('scatterChartControls');
    console.log('Scatter controls container:', scatterControls);
    
    if (scatterControls) {
      // Clear existing buttons to prevent duplicates
      scatterControls.innerHTML = '';
      
      const scatterButtons = statsPageCharts.createChartControls('scatterChart', true);
      window.ChartButtonIcons.addButtonsToContainer(scatterControls, scatterButtons);
      this.chartControls.set('scatterChart', scatterControls);
      console.log('Scatter chart buttons added:', scatterControls.children.length);
    } else {
      console.warn('Scatter chart controls container not found');
    }
  }

  /**
   * Reinitialize buttons for a specific chart
   * @param {string} chartId - Chart identifier
   * @param {Object} statsPageCharts - The stats page charts manager instance
   */
  reinitializeChartButtons(chartId, statsPageCharts) {
    const containerId = `${chartId}Controls`;
    const controls = document.getElementById(containerId);
    
    if (controls && statsPageCharts) {
      // Clear existing buttons
      controls.innerHTML = '';
      
      // Recreate buttons
      const isScatter = chartId === 'scatterChart';
      const buttons = statsPageCharts.createChartControls(chartId, isScatter);
      window.ChartButtonIcons.addButtonsToContainer(controls, buttons);
      
      console.log(`Reinitialized ${chartId} buttons:`, controls.children.length);
    }
  }

  /**
   * Update button state (e.g., loading state for refresh buttons)
   * @param {string} chartId - Chart identifier
   * @param {string} buttonType - Type of button (e.g., 'refresh')
   * @param {string} state - State to apply ('loading', 'normal')
   */
  updateButtonState(chartId, buttonType, state) {
    const controls = this.chartControls.get(chartId);
    if (controls) {
      const button = controls.querySelector(`.${buttonType}-button`);
      if (button) {
        if (state === 'loading') {
          window.ChartButtonIcons.addLoadingState(button);
        } else if (state === 'normal') {
          window.ChartButtonIcons.removeLoadingState(button);
        }
      }
    }
  }

  /**
   * Get button element for a specific chart and button type
   * @param {string} chartId - Chart identifier
   * @param {string} buttonType - Type of button
   * @returns {HTMLElement|null} Button element or null
   */
  getButton(chartId, buttonType) {
    const controls = this.chartControls.get(chartId);
    if (controls) {
      return controls.querySelector(`.${buttonType}-button`);
    }
    return null;
  }

  /**
   * Add event listener to a specific button
   * @param {string} chartId - Chart identifier
   * @param {string} buttonType - Type of button
   * @param {Function} handler - Event handler function
   */
  addButtonListener(chartId, buttonType, handler) {
    const button = this.getButton(chartId, buttonType);
    if (button) {
      button.addEventListener('click', handler);
    }
  }

  /**
   * Remove event listener from a specific button
   * @param {string} chartId - Chart identifier
   * @param {string} buttonType - Type of button
   * @param {Function} handler - Event handler function
   */
  removeButtonListener(chartId, buttonType, handler) {
    const button = this.getButton(chartId, buttonType);
    if (button) {
      button.removeEventListener('click', handler);
    }
  }

  /**
   * Check if buttons are initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get all chart controls
   * @returns {Map} Map of chart controls
   */
  getChartControls() {
    return this.chartControls;
  }

  /**
   * Reset the manager (useful for testing or reinitialization)
   */
  reset() {
    this.initialized = false;
    this.chartControls.clear();
    console.log('Chart buttons manager reset');
  }
}

// Create global instance
window.chartButtonsManager = new ChartButtonsManager();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartButtonsManager;
}
