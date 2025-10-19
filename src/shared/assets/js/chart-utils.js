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
          ...(window.ChartColors ? window.ChartColors.getTooltipConfig() : {
            backgroundColor: '#ffffff',
            titleColor: '#000000',
            bodyColor: '#000000',
            borderColor: '#FE0000',
            borderWidth: 2,
            cornerRadius: 8,
            displayColors: true,
            padding: 20,  // Increased padding
            titleSpacing: 10,  // Increased spacing
            bodySpacing: 8,
            titleFont: {
              size: 16,
              weight: 'bold',
              family: "'TBL-2', monospace"
            },
            bodyFont: {
              size: 14,
              family: "'TBL-2', monospace"
            }
          }),
          // Custom styling for Chart.js tooltip color indicators
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
              // For pie charts, use the background color from the dataset
              const backgroundColor = context.dataset.backgroundColor[context.dataIndex] || context.dataset.backgroundColor;
              return {
                borderColor: backgroundColor,
                backgroundColor: backgroundColor,
                borderWidth: 0,
                borderRadius: 6, // Half of width/height for perfect circle
                width: 12,
                height: 12
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
      plugins: {
        legend: {
          display: false // Disable built-in legend, we'll create custom one
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#FE0000',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 18,
          displayColors: true,
          titleFont: {
            size: 14,
            weight: 'bold',
            family: "'TBL-2', monospace"
          },
          bodyFont: {
            size: 12,
            family: "'TBL-2', monospace"
          }
        }
      },
      scales: {
        x: {
          title: {
            display: false  // Hide x-axis title by default
          }
        },
        y: {
          title: {
            display: false  // Hide y-axis title by default
          }
        }
      }
    };

    // Deep merge options to preserve scales configuration from custom options
    const chartOptions = {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
        tooltip: {
          ...defaultOptions.plugins.tooltip,
          ...(options.plugins?.tooltip || {}),
          callbacks: {
            ...(defaultOptions.plugins.tooltip?.callbacks || {}),
            ...(options.plugins?.tooltip?.callbacks || {})
          }
        }
      },
      scales: {
        ...defaultOptions.scales,
        ...options.scales
      }
    };
    
    // Debug: Log the final chart options
    console.log('Chart Utils - Final Chart Options:', JSON.stringify(chartOptions, null, 2));
    console.log('Chart Utils - Scales specifically:', JSON.stringify(chartOptions.scales, null, 2));
    console.log('Chart Utils - Tooltip specifically:', JSON.stringify(chartOptions.plugins.tooltip, null, 2));
    
    // Debug: Check if tooltip callbacks exist in final config
    if (chartOptions.plugins?.tooltip?.callbacks) {
      console.log('Chart Utils - Tooltip Callbacks Found:', Object.keys(chartOptions.plugins.tooltip.callbacks));
      console.log('Chart Utils - Tooltip Callbacks Content:', chartOptions.plugins.tooltip.callbacks);
      
      // Test if callbacks are actually functions
      const callbacks = chartOptions.plugins.tooltip.callbacks;
      console.log('Chart Utils - Callback Types:', {
        title: typeof callbacks.title,
        label: typeof callbacks.label,
        labelColor: typeof callbacks.labelColor
      });
    } else {
      console.log('Chart Utils - No Tooltip Callbacks Found!');
    }
    
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

