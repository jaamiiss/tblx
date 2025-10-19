class AdminDashboardCharts {
  constructor() {
    this.statusChartInstance = null;
    this.categoryChartInstance = null;
    this.init();
  }

  init() {
    console.log('Admin Dashboard Charts: Initializing...');
    // Wait for Chart.js to load
    if (typeof Chart !== 'undefined') {
      console.log('Admin Dashboard Charts: Chart.js is available, loading charts...');
      this.loadCharts();
    } else {
      console.log('Admin Dashboard Charts: Chart.js not available, waiting...');
      // Wait for Chart.js to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkChart = setInterval(() => {
        attempts++;
        if (typeof Chart !== 'undefined') {
          console.log('Admin Dashboard Charts: Chart.js loaded after', attempts * 100, 'ms');
          clearInterval(checkChart);
          this.loadCharts();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkChart);
          console.error('Admin Dashboard Charts: Chart.js failed to load after 5 seconds');
        }
      }, 100);
    }
  }

  async loadCharts() {
    try {
      console.log('Admin Dashboard Charts: Loading charts...');
      console.log('Admin Dashboard Charts: About to fetch /admin/api/stats');
      const response = await fetch('/admin/api/stats');
      console.log('Admin Dashboard Charts: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Admin Dashboard Charts: Received data:', data);
      
      // Check if data has the expected structure (direct response or wrapped in success/data)
      if (data && (data.byStatus || data.data?.byStatus)) {
        const chartData = data.data || data; // Use data.data if wrapped, otherwise use data directly
        console.log('Admin Dashboard Charts: Processing chart data:', chartData);
        console.log('Admin Dashboard Charts: About to create status chart');
        
        // Check if Chart.js is available
        console.log('Admin Dashboard Charts: Chart.js available:', typeof Chart !== 'undefined');
        console.log('Admin Dashboard Charts: ChartUtils available:', !!window.ChartUtils);
        
        this.createStatusChart(chartData);
        console.log('Admin Dashboard Charts: About to create category chart');
        this.createCategoryChart(chartData);
        console.log('Admin Dashboard Charts: Both charts created successfully');
      } else {
        console.error('Admin Dashboard Charts: Invalid data structure:', data);
        this.showChartError('status-chart', 'Failed to load chart data - invalid structure');
        this.showChartError('category-chart', 'Failed to load chart data - invalid structure');
      }
    } catch (error) {
      console.error('Admin Dashboard Charts: Error loading charts:', error);
      this.showChartError('status-chart', 'Failed to load charts: ' + error.message);
      this.showChartError('category-chart', 'Failed to load charts: ' + error.message);
    }
  }

  createStatusChart(data) {
    console.log('Admin Dashboard Charts: Creating status chart with data:', data);
    
    // Clear any existing HTML content in the chart container
    const chartContainer = document.getElementById('status-chart');
    if (chartContainer) {
      chartContainer.innerHTML = '<canvas id="statusPieChart" width="400" height="400"></canvas>';
      console.log('Admin Dashboard Charts: Status chart container cleared and canvas created');
    }

    // Get the canvas after clearing
    const canvas = document.getElementById('statusPieChart');
    if (!canvas) {
      console.error('Admin Dashboard Charts: Status chart canvas not found');
      return;
    }

    try {
      const statuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
      const colors = ['#f44336', '#4caf50', '#ff9800', '#9c27b0', '#607d8b', '#795548'];

      // Prepare data
      const chartData = [];
      const chartLabels = [];
      const chartColors = [];

      statuses.forEach((status, index) => {
        const count = data.byStatus[status] || 0;
        console.log(`Admin Dashboard Charts: Status ${status}: count=${count}`);
        if (count > 0) {
          chartData.push(count);
          chartLabels.push(status.charAt(0).toUpperCase() + status.slice(1));
          chartColors.push(colors[index]);
        }
      });

      console.log('Admin Dashboard Charts: Status chart data prepared:', {
        chartData,
        chartLabels,
        chartColors
      });

      if (chartData.length === 0) {
        console.warn('Admin Dashboard Charts: No status data to display');
        return;
      }

      // Use shared chart utility
      const chartDataObj = {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderColor: chartColors,
          borderWidth: 2
        }]
      };

      console.log('Admin Dashboard Charts: About to call ChartUtils.createPieChart for status chart');
      console.log('Admin Dashboard Charts: ChartUtils available:', !!window.ChartUtils);
      console.log('Admin Dashboard Charts: Canvas element:', document.getElementById('statusPieChart'));
      
      this.statusChartInstance = window.ChartUtils.createPieChart('statusPieChart', chartDataObj);
      console.log('Admin Dashboard Charts: Status chart created successfully');
      console.log('Admin Dashboard Charts: Status chart instance:', this.statusChartInstance);
      
      // Try creating a simple chart directly if ChartUtils fails
      if (!this.statusChartInstance) {
        console.log('Admin Dashboard Charts: ChartUtils failed, trying direct Chart.js creation');
        const canvas = document.getElementById('statusPieChart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          this.statusChartInstance = new Chart(ctx, {
            type: 'pie',
            data: chartDataObj,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              }
            }
          });
          console.log('Admin Dashboard Charts: Direct Chart.js creation result:', this.statusChartInstance);
        }
      }
      
      // Force chart update
      if (this.statusChartInstance) {
        this.statusChartInstance.update();
        console.log('Admin Dashboard Charts: Status chart updated');
        
        // Debug canvas visibility
        const canvas = document.getElementById('statusPieChart');
        if (canvas) {
          console.log('Admin Dashboard Charts: Status canvas found:', canvas);
          console.log('Admin Dashboard Charts: Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('Admin Dashboard Charts: Canvas style:', canvas.style.cssText);
          console.log('Admin Dashboard Charts: Canvas computed style:', window.getComputedStyle(canvas).display);
        }
      }
      
      // Create custom legend with proper data mapping
      const statusDataForLegend = {};
      chartLabels.forEach(label => {
        const lowercaseKey = label.toLowerCase();
        statusDataForLegend[label] = data.byStatus[lowercaseKey] || 0;
      });
      
      this.createCustomLegend('status-chart', chartLabels, chartColors, statusDataForLegend);
    } catch (error) {
      console.error('Admin Dashboard Charts: Error creating status chart:', error);
    }
  }

  createCategoryChart(data) {
    console.log('Admin Dashboard Charts: Creating category chart with data:', data);
    console.log('Admin Dashboard Charts: Document ready state:', document.readyState);
    
    // Clear any existing HTML content in the chart container
    const chartContainer = document.getElementById('category-chart');
    if (!chartContainer) {
      console.error('Admin Dashboard Charts: Category chart container not found');
      console.log('Admin Dashboard Charts: Available elements with "category" in ID:', 
        Array.from(document.querySelectorAll('[id*="category"]')).map(el => el.id));
      return;
    }
    
    console.log('Admin Dashboard Charts: Category chart container found:', chartContainer);
    console.log('Admin Dashboard Charts: Container innerHTML before:', chartContainer.innerHTML);
    chartContainer.innerHTML = '<canvas id="categoryPieChart" width="400" height="400"></canvas>';
    console.log('Admin Dashboard Charts: Container innerHTML after:', chartContainer.innerHTML);

    // Get the canvas after clearing
    const canvas = document.getElementById('categoryPieChart');
    if (!canvas) {
      console.error('Admin Dashboard Charts: Category chart canvas not found');
      return;
    }

    try {
      const categories = ['Male', 'Female', 'Company', 'Group', 'Unknown'];
      const colors = ['#2196F3', '#E91E63', '#9C27B0', '#00BCD4', '#607d8b'];

      // Prepare data
      const chartData = [];
      const chartLabels = [];
      const chartColors = [];

      categories.forEach((category, index) => {
        const count = data.byCategory[category] || 0;
        console.log(`Admin Dashboard Charts: Category ${category}: count=${count}`);
        if (count > 0) {
          chartData.push(count);
          chartLabels.push(category);
          chartColors.push(colors[index]);
        }
      });

      console.log('Admin Dashboard Charts: Category chart data prepared:', {
        chartData,
        chartLabels,
        chartColors,
        originalData: data.byCategory,
        dataLength: chartData.length
      });

      if (chartData.length === 0) {
        console.warn('Admin Dashboard Charts: No category data to display');
        chartContainer.innerHTML = '<div class="no-data">No category data available</div>';
        return;
      }

      console.log('Admin Dashboard Charts: Creating category chart with valid data');

      // Use shared chart utility
      const chartDataObj = {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderColor: chartColors,
          borderWidth: 2
        }]
      };

      console.log('Admin Dashboard Charts: Chart data object:', chartDataObj);
      console.log('Admin Dashboard Charts: About to call ChartUtils.createPieChart');
      
      this.categoryChartInstance = window.ChartUtils.createPieChart('categoryPieChart', chartDataObj);
      console.log('Admin Dashboard Charts: Category chart created successfully');
      console.log('Admin Dashboard Charts: Category chart instance:', this.categoryChartInstance);
      console.log('Admin Dashboard Charts: Chart data:', this.categoryChartInstance?.data);
      console.log('Admin Dashboard Charts: Chart options:', this.categoryChartInstance?.options);
      
      // Force chart update
      if (this.categoryChartInstance) {
        this.categoryChartInstance.update();
        console.log('Admin Dashboard Charts: Category chart updated');
        
        // Debug canvas visibility
        const canvas = document.getElementById('categoryPieChart');
        if (canvas) {
          console.log('Admin Dashboard Charts: Category canvas found:', canvas);
          console.log('Admin Dashboard Charts: Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('Admin Dashboard Charts: Canvas style:', canvas.style.cssText);
          console.log('Admin Dashboard Charts: Canvas computed style:', window.getComputedStyle(canvas).display);
        }
      }
      
      // Create custom legend
      this.createCustomLegend('category-chart', chartLabels, chartColors, data.byCategory);
      console.log('Admin Dashboard Charts: Category legend created successfully');
    } catch (error) {
      console.error('Admin Dashboard Charts: Error creating category chart:', error);
    }
  }

  showChartError(containerId, message) {
    window.ChartUtils.showChartError(containerId, message);
  }

  createCustomLegend(containerId, labels, colors, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove existing legend
    const existingLegend = container.querySelector('.chart-legend');
    if (existingLegend) {
      existingLegend.remove();
    }

    // Create legend container
    const legendContainer = document.createElement('div');
    legendContainer.className = 'chart-legend';

    labels.forEach((label, index) => {
      const count = data[label] || 0;
      const total = Object.values(data).reduce((sum, val) => sum + val, 0);
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-color" style="background-color: ${colors[index]}"></div>
        <span class="legend-label">${label}: ${count} (${percentage}%)</span>
      `;
      
      legendContainer.appendChild(legendItem);
    });

    container.appendChild(legendContainer);
  }

  destroy() {
    window.ChartUtils.destroyChart('statusPieChart');
    window.ChartUtils.destroyChart('categoryPieChart');
    this.statusChartInstance = null;
    this.categoryChartInstance = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only run on dashboard page
  if (window.location.pathname === '/admin') {
    console.log('Admin Dashboard Charts: On admin dashboard page, initializing...');
  } else {
    console.log('Admin Dashboard Charts: Not on dashboard page, skipping initialization');
    return;
  }
  
  // Wait for ChartUtils to be available
  function waitForChartUtils() {
    if (typeof window.ChartUtils !== 'undefined') {
      console.log('Admin Dashboard Charts: ChartUtils available, initializing...');
      window.adminDashboardCharts = new AdminDashboardCharts();
    } else {
      console.log('Admin Dashboard Charts: Waiting for ChartUtils...');
      setTimeout(waitForChartUtils, 100);
    }
  }
  
  // Start waiting for ChartUtils
  waitForChartUtils();
});