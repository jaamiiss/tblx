/**
 * Reusable Chart Utilities
 * Shared between admin and public views
 */

class ChartUtils {
  constructor() {
    this.chartInstances = new Map();
  }

  // Destroy existing chart
  destroyChart(canvasId) {
    const instance = this.chartInstances.get(canvasId);
    if (instance) {
      instance.destroy();
      this.chartInstances.delete(canvasId);
    }
  }

  // Create pie chart
  createPieChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`ChartUtils: Canvas ${canvasId} not found`);
      return null;
    }

    console.log(`ChartUtils: Creating pie chart for ${canvasId}`);
    console.log(`ChartUtils: Canvas dimensions before: ${canvas.width}x${canvas.height}`);
    console.log(`ChartUtils: Canvas container:`, canvas.parentElement);

    // Destroy existing chart
    this.destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#FE0000',
          borderWidth: 2,
          cornerRadius: 8,
          displayColors: true,
          padding: 16,
          titleSpacing: 8,
          bodySpacing: 8,
          titleFont: {
            size: 16,
            weight: 'bold',
            family: 'TBL-2, monospace'
          },
          bodyFont: {
            size: 14,
            family: 'TBL-2, monospace'
          },
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ${value} (${percentage}%)`;
            },
            labelColor: function(context) {
              return {
                borderColor: context.dataset.backgroundColor[context.dataIndex],
                backgroundColor: context.dataset.backgroundColor[context.dataIndex],
                borderWidth: 2,
                borderRadius: 4
              };
            }
          }
        }
      }
    };

    const chartOptions = { ...defaultOptions, ...options };
    const chartInstance = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: chartOptions
    });

    this.chartInstances.set(canvasId, chartInstance);
    
    console.log(`ChartUtils: Chart created for ${canvasId}:`, chartInstance);
    console.log(`ChartUtils: Canvas dimensions after: ${canvas.width}x${canvas.height}`);
    console.log(`ChartUtils: Chart data:`, chartInstance.data);
    
    return chartInstance;
  }

  // Create bar chart
  createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`ChartUtils: Canvas ${canvasId} not found`);
      return null;
    }

    // Destroy existing chart
    this.destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    const chartOptions = { ...defaultOptions, ...options };
    const chartInstance = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: chartOptions
    });

    this.chartInstances.set(canvasId, chartInstance);
    return chartInstance;
  }

  // Create scatter chart
  createScatterChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`ChartUtils: Canvas ${canvasId} not found`);
      return null;
    }

    // Destroy existing chart
    this.destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom'
        },
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false // Disable built-in legend, we'll create custom one
        }
      }
    };

    const chartOptions = { ...defaultOptions, ...options };
    const chartInstance = new Chart(ctx, {
      type: 'scatter',
      data: data,
      options: chartOptions
    });

    this.chartInstances.set(canvasId, chartInstance);
    return chartInstance;
  }

  // Update legend
  updateLegend(legendId, labels, colors, counts) {
    const legendContainer = document.getElementById(legendId);
    if (!legendContainer) return;

    legendContainer.innerHTML = '';

    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      
      const colorDot = document.createElement('div');
      colorDot.className = 'legend-color';
      colorDot.style.backgroundColor = colors[index];
      
      const labelText = document.createElement('span');
      labelText.className = 'legend-label';
      labelText.textContent = label;
      
      legendItem.appendChild(colorDot);
      legendItem.appendChild(labelText);
      
      legendContainer.appendChild(legendItem);
    });
  }

  // Show chart error
  showChartError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p>${message}</p>
        </div>
      `;
    }
  }

  // Destroy all charts
  destroyAll() {
    this.chartInstances.forEach((instance, canvasId) => {
      instance.destroy();
    });
    this.chartInstances.clear();
  }
}

// Create global instance
window.ChartUtils = new ChartUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartUtils;
}

