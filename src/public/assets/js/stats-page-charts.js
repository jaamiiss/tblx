class StatsPageCharts {
  constructor() {
    this.pieChartInstance = null;
    this.barChartInstance = null;
    this.scatterChartInstance = null;
    this.scatterData = null;
    this.dataFilter = 'both'; // 'both', 'v1', 'v2'
    this.statusFilter = 'all'; // 'all', 'deceased', 'active', etc.
    this.init();
  }

  init() {
    console.log('Stats Page Charts: Initializing...');
    // Wait for Chart.js to load
    if (typeof Chart !== 'undefined') {
      console.log('Stats Page Charts: Chart.js is available, loading charts...');
      this.loadCharts();
    } else {
      console.log('Stats Page Charts: Chart.js not available, waiting...');
      // Wait for Chart.js to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkChart = setInterval(() => {
        attempts++;
        if (typeof Chart !== 'undefined') {
          console.log('Stats Page Charts: Chart.js loaded after', attempts * 100, 'ms');
          clearInterval(checkChart);
          this.loadCharts();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkChart);
          console.error('Stats Page Charts: Chart.js failed to load after 5 seconds');
        }
      }, 100);
    }
  }

  setupToggleListener() {
    // Setup filter listeners
    const dataFilter = document.getElementById('dataFilter');
    if (dataFilter) {
      dataFilter.addEventListener('change', (e) => {
        this.dataFilter = e.target.value;
        this.updateScatterChart();
      });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.updateScatterChart();
      });
    }
  }

  async loadCharts() {
    try {
      console.log('Stats Page Charts: Loading charts...');
      
      // Load pie chart data
      const pieResponse = await fetch('/stats/chart/pie');
      if (pieResponse.ok) {
        const pieData = await pieResponse.json();
        this.createPieChart(pieData);
      } else {
        console.error('Stats Page Charts: Failed to load pie chart data');
        this.showChartError('pieChartContainer', 'Failed to load pie chart data');
      }

      // Load bar chart data
      const barResponse = await fetch('/stats/chart/bar');
      if (barResponse.ok) {
        const barData = await barResponse.json();
        await this.createBarChart(barData);
      } else {
        console.error('Stats Page Charts: Failed to load bar chart data');
        this.showChartError('barChartContainer', 'Failed to load bar chart data');
      }

      // Load scatter chart data
      const scatterResponse = await fetch('/stats/chart/scatter');
      if (scatterResponse.ok) {
        const scatterData = await scatterResponse.json();
        this.scatterData = scatterData; // Store data for toggle functionality
        this.createScatterChart(scatterData);
      } else {
        console.error('Stats Page Charts: Failed to load scatter chart data');
        this.showChartError('scatterChartContainer', 'Failed to load scatter chart data');
      }

      // Setup toggle listener after charts are loaded
      this.setupToggleListener();

    } catch (error) {
      console.error('Stats Page Charts: Error loading charts:', error);
      this.showChartError('pieChartContainer', 'Failed to load charts: ' + error.message);
    }
  }

  createPieChart(data) {
    console.log('Stats Page Charts: Creating pie chart with data:', data);
    
    // Clear any existing HTML content in the chart container
    const chartContainer = document.getElementById('pieChartContainer');
    if (chartContainer) {
      chartContainer.innerHTML = '<canvas id="pieChart"></canvas>';
    }

    try {
      const categories = ['Male', 'Female', 'Company', 'Group'];
      const colors = ['#2196F3', '#E91E63', '#9C27B0', '#00BCD4'];

      // Prepare data
      const chartData = [];
      const chartLabels = [];
      const chartColors = [];

      categories.forEach((category, index) => {
        const count = data[category] || 0;
        console.log(`Stats Page Charts: Category ${category}: count=${count}`);
        if (count > 0) {
          chartData.push(count);
          chartLabels.push(category);
          chartColors.push(colors[index]);
        }
      });

      if (chartData.length === 0) {
        console.warn('Stats Page Charts: No pie chart data to display');
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

      this.pieChartInstance = window.ChartUtils.createPieChart('pieChart', chartDataObj);
      console.log('Stats Page Charts: Pie chart created successfully');
      
      // Create custom legend with labels and values
      this.createCustomLegend('pieChartLegend', chartLabels, chartColors, data);
    } catch (error) {
      console.error('Stats Page Charts: Error creating pie chart:', error);
    }
  }

  async createBarChart(data) {
    console.log('Stats Page Charts: Creating bar chart with data:', data);
    
    // Clear any existing HTML content in the chart container
    const chartContainer = document.getElementById('barChartContainer');
    if (chartContainer) {
      chartContainer.innerHTML = '<canvas id="barChart"></canvas>';
    }

    try {
      // Fetch scatter data to get V1 values for grouping
      const scatterResponse = await fetch('/stats/chart/scatter');
      if (!scatterResponse.ok) {
        throw new Error('Failed to fetch scatter data');
      }
      const scatterData = await scatterResponse.json();
      console.log('Stats Page Charts: Scatter data for V1 ranges:', scatterData);

      const statuses = ['deceased', 'active', 'incarcerated', 'redacted', 'unknown', 'captured'];
      const colors = ['#f44336', '#4caf50', '#ff9800', '#9c27b0', '#607d8b', '#795548'];

      // Define V1 ranges
      const v1Ranges = [
        { label: '0-50', min: 0, max: 50 },
        { label: '51-100', min: 51, max: 100 },
        { label: '101-150', min: 101, max: 150 },
        { label: '151-200', min: 151, max: 200 },
        { label: '200+', min: 201, max: Infinity }
      ];

      // Group data by V1 ranges and count statuses in each range
      const rangeData = {};
      v1Ranges.forEach(range => {
        rangeData[range.label] = {};
        statuses.forEach(status => {
          rangeData[range.label][status] = 0;
        });
      });

      // Count items in each V1 range by status
      const items = scatterData.items || scatterData; // Handle both object and array formats
      items.forEach(item => {
        if (item.v1 !== null && item.v1 !== undefined) {
          const v1Value = item.v1;
          const status = item.status || 'unknown';
          
          // Find which range this V1 value belongs to
          const range = v1Ranges.find(r => v1Value >= r.min && v1Value <= r.max);
          if (range && rangeData[range.label] && rangeData[range.label][status] !== undefined) {
            rangeData[range.label][status]++;
          }
        }
      });

      console.log('Stats Page Charts: V1 range data:', rangeData);

      // Create datasets for each status
      const datasets = [];
      statuses.forEach((status, index) => {
        const statusData = v1Ranges.map(range => rangeData[range.label][status] || 0);
        const hasData = statusData.some(count => count > 0);
        
        if (hasData) {
          datasets.push({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            data: statusData,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
          });
        }
      });

      if (datasets.length === 0) {
        console.warn('Stats Page Charts: No bar chart data to display');
        return;
      }

      const chartLabels = v1Ranges.map(range => range.label);

      console.log('Stats Page Charts: Bar chart data prepared:', { chartLabels, datasets });

      // Use shared chart utility
      const chartDataObj = {
        labels: chartLabels,
        datasets: datasets
      };

      this.barChartInstance = window.ChartUtils.createBarChart('barChart', chartDataObj);
      console.log('Stats Page Charts: Bar chart created successfully');
    } catch (error) {
      console.error('Stats Page Charts: Error creating bar chart:', error);
    }
  }

  createScatterChart(data) {
    console.log('Stats Page Charts: Creating scatter chart with data:', data);
    
    // Clear any existing HTML content in the chart container
    const chartContainer = document.getElementById('scatterChartContainer');
    if (chartContainer) {
      chartContainer.innerHTML = '<canvas id="scatterChart"></canvas>';
    }

    try {
      // Define status colors with opacity borders and increased background opacity (matching CSS status colors)
      const statusColors = {
        deceased: {
          background: 'rgba(254, 0, 0, 0.6)',    // #FE0000 with increased opacity
          border: 'rgba(254, 0, 0, 0.8)'        // #FE0000 with opacity
        },
        active: {
          background: 'rgba(76, 175, 80, 0.6)', // #4CAF50 with increased opacity
          border: 'rgba(76, 175, 80, 0.8)'      // #4CAF50 with opacity
        },
        incarcerated: {
          background: 'rgba(255, 152, 0, 0.6)', // #FF9800 with increased opacity
          border: 'rgba(255, 152, 0, 0.8)'      // #FF9800 with opacity
        },
        redacted: {
          background: 'rgba(156, 39, 176, 0.6)', // #9C27B0 with increased opacity
          border: 'rgba(156, 39, 176, 0.8)'      // #9C27B0 with opacity
        },
        unknown: {
          background: 'rgba(96, 125, 139, 0.6)', // #607D8B with increased opacity
          border: 'rgba(96, 125, 139, 0.8)'      // #607D8B with opacity
        },
        captured: {
          background: 'rgba(255, 87, 34, 0.6)',  // #FF5722 with increased opacity
          border: 'rgba(255, 87, 34, 0.8)'       // #FF5722 with opacity
        }
      };

      // Prepare scatter data grouped by status
      const datasets = [];
      const statusGroups = {};
      
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item, index) => {
          if (item.v1 !== undefined && item.v2 !== undefined && item.status) {
            const status = item.status.toLowerCase();
            
            // Apply status filter
            if (this.statusFilter !== 'all' && status !== this.statusFilter) {
              return; // Skip this item if it doesn't match the status filter
            }
            
            // Apply data filter
            let shouldInclude = false;
            if (this.dataFilter === 'both') {
              shouldInclude = true;
            } else if (this.dataFilter === 'v1') {
              shouldInclude = item.v1 !== null && item.v1 !== undefined;
            } else if (this.dataFilter === 'v2') {
              shouldInclude = item.v2 !== null && item.v2 !== undefined;
            }
            
            if (!shouldInclude) {
              return; // Skip this item if it doesn't match the data filter
            }
            
            if (!statusGroups[status]) {
              statusGroups[status] = [];
            }
            // V1 vs V2 mapping
            statusGroups[status].push({
              x: item.v1,
              y: item.v2
            });
          }
        });
      }

      // Create datasets for each status
      Object.keys(statusGroups).forEach(status => {
        if (statusGroups[status].length > 0) {
          const colorConfig = statusColors[status] || { 
            background: 'rgba(108, 117, 125, 0.3)', 
            border: 'rgba(108, 117, 125, 0.5)' 
          };
          datasets.push({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            data: statusGroups[status],
            backgroundColor: colorConfig.background,
            borderColor: colorConfig.border,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: colorConfig.border
          });
        }
      });

      if (datasets.length === 0) {
        console.warn('Stats Page Charts: No scatter chart data to display');
        return;
      }

      // Use shared chart utility
      const chartDataObj = {
        datasets: datasets
      };

      this.scatterChartInstance = window.ChartUtils.createScatterChart('scatterChart', chartDataObj);
      console.log('Stats Page Charts: Scatter chart created successfully');
      
      // Update chart title based on current mode
      this.updateScatterChartTitle();
    } catch (error) {
      console.error('Stats Page Charts: Error creating scatter chart:', error);
    }
  }

  updateScatterChartTitle() {
    const chartTitle = document.querySelector('.chart-header h3');
    if (chartTitle) {
      let title = 'V1 vs V2 Analysis';
      
      // Add filter information to title
      if (this.dataFilter !== 'both' || this.statusFilter !== 'all') {
        title += ' (Filtered)';
      }
      
      chartTitle.textContent = title;
    }
  }

  updateScatterChart() {
    if (this.scatterData) {
      console.log('Stats Page Charts: Updating scatter chart');
      console.log('  Data Filter:', this.dataFilter);
      console.log('  Status Filter:', this.statusFilter);
      this.createScatterChart(this.scatterData);
      this.updateScatterChartTitle();
    }
  }

  createCustomLegend(legendId, labels, colors, data) {
    const legendContainer = document.getElementById(legendId);
    if (!legendContainer) {
      console.warn('Stats Page Charts: Legend container not found:', legendId);
      return;
    }

    // Clear existing legend
    legendContainer.innerHTML = '';

    // Calculate total for percentage calculation
    const total = labels.reduce((sum, label) => sum + (data[label] || 0), 0);

    // Create legend items
    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';

      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = colors[index];

      const labelSpan = document.createElement('span');
      labelSpan.className = 'legend-label';
      labelSpan.textContent = label;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'legend-value';
      const value = data[label] || 0;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
      valueSpan.textContent = `(${value} - ${percentage}%)`;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelSpan);
      legendItem.appendChild(valueSpan);

      legendContainer.appendChild(legendItem);
    });

    console.log('Stats Page Charts: Custom legend created successfully');
  }

  showChartError(containerId, message) {
    window.ChartUtils.showChartError(containerId, message);
  }

  destroy() {
    window.ChartUtils.destroyChart('pieChart');
    window.ChartUtils.destroyChart('barChart');
    window.ChartUtils.destroyChart('scatterChart');
    this.pieChartInstance = null;
    this.barChartInstance = null;
    this.scatterChartInstance = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure all elements are ready
  setTimeout(() => {
    if (typeof window.ChartUtils !== 'undefined') {
      window.statsPageCharts = new StatsPageCharts();
    } else {
      console.error('Stats Page Charts: ChartUtils not available');
    }
  }, 100);
});

