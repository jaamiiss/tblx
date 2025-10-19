/**
 * Global Chart Configuration System
 * Centralized configuration for chart labels, text, and fonts
 */

window.ChartConfig = {
  // Global chart text labels
  labels: {
    barChart: {
      xAxis: 'Ranges',
      yAxis: 'Count',
      tooltipTitle: 'Rows',
      fallbackXAxis: 'Ranges',
      fallbackYAxis: 'Count'
    },
    scatterChart: {
      xAxis: 'V1 Values',
      yAxis: 'V2 Values'
    },
    pieChart: {
      title: 'Category Distribution'
    },
    // Common text labels
    common: {
      errorIcon: '⚠️',
      errorMessage: 'Failed to load chart',
      similarityTitle: 'V1 & V2 Similarity',
      similarValues: 'Similar Values',
      similarity: 'Similarity',
      // Legend tooltip labels
      legendTooltip: {
        statusLabel: 'Status',
        statusLabelColor: '#FE0000',  // Red for "Status" text
        statusValueColor: '#000000'   // Black for status value
      },
      // Common text labels
      fallbackText: 'Data available',
      fallbackName: 'Unknown',
      fallbackStatus: 'unknown'
    }
  },

  // Global chart fonts
  fonts: {
    primary: "'TBL-2', monospace",
    secondary: "'TBL', 'TBL-Fallback', Arial, Helvetica, sans-serif",
    // Chart-specific font configurations
    chart: {
      title: {
        family: "'TBL-2', monospace",
        size: 12,
        weight: 'bold'
      },
      ticks: {
        family: "'TBL-2', monospace",
        size: 11
      },
      tooltip: {
        title: {
          family: "'TBL-2', monospace",
          size: 14,
          weight: 'bold'
        },
        body: {
          family: "'TBL-2', monospace",
          size: 13
        }
      }
    }
  },

  // Chart-specific configurations
  charts: {
    barChart: {
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#FE0000',
          borderWidth: 1,
          padding: 15,  // Increased from 5
          titleSpacing: 6,  // Increased from 4
          bodySpacing: 5,  // Increased from 3
          cornerRadius: 6,
          displayColors: true
        },
      // Chart-specific overrides
      overrides: {
        tooltip: {
          // Bar chart can have different tooltip styling
          backgroundColor: '#ffffff',
          borderColor: '#FE0000',
          titleColor: '#000000',  // Black title text
          bodyColor: '#000000',   // Black body text
          padding: 25,  // Increased padding for bar chart
          cornerRadius: 8  // Different corner radius
        },
        // Legend tooltip overrides for bar chart
        legendTooltip: {
          enabled: true,  // Enable chart-specific legend tooltip overrides
          statusLabel: 'Status',
          statusLabelColor: '#FE0000',  // Red for "Status" text
          statusValueColor: '#000000'   // Black for status value
        }
      }
    },
    scatterChart: {
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#FE0000',
        borderWidth: 1
      },
      // Chart-specific overrides
      overrides: {
        tooltip: {
          // Scatter chart tooltip styling
          backgroundColor: '#ffffff',  // White background
          titleColor: '#000000',      // Black title text
          bodyColor: '#000000',       // Black body text
          borderColor: '#FE0000',     // Red border
          padding: 18,                // Increased padding
          cornerRadius: 8,            // Rounded corners
          displayColors: true,        // Show color indicators
          titleFont: {
            size: 14,
            weight: 'bold',
            family: "'TBL-2', monospace"
          },
          bodyFont: {
            size: 12,
            family: "'TBL-2', monospace"
          },
          callbacks: {
            title: function(context) {
              // Clear previous multiple labels when starting new tooltip
              window.scatterChartMultipleLabels = null;
              
              // Store multiple points info for label callback
              window.scatterChartMultiplePoints = context.length > 1;
              window.scatterChartAllPoints = context;
              
              // Handle multiple points
              if (context.length > 1) {
                const count = context.length;
                return `${count} Data Points`;
              } else {
                const point = context[0].raw;
                const name = point.name || window.ChartConfig?.getCommonLabels()?.fallbackName || 'Unknown';
                return name;
              }
            },
            label: function(context) {
              // Check if we have multiple points from title callback
              if (window.scatterChartMultiplePoints && window.scatterChartAllPoints) {
                // Get the current point data
                const point = context.raw;
                const capitalizedStatus = point.status ? point.status.charAt(0).toUpperCase() + point.status.slice(1) : 'Unknown';
                const name = point.name || 'Unknown';
                
                // Format for multiple points - include name as header
                const labels = [
                  ` ${name}`,
                  ` (${point.x}, ${point.y})`
                ];
                
                return labels;
              } else {
                // Single point - compact format
                const point = context.raw;
                const capitalizedStatus = point.status ? point.status.charAt(0).toUpperCase() + point.status.slice(1) : 'Unknown';
                const labels = [];
                
                // Add category first if it exists
                if (point.category && point.category !== 'undefined') {
                  labels.push(` ${point.category}`);
                }
                
                // Add status
                labels.push(` ${capitalizedStatus}`);
                
                // Add coordinates
                labels.push(` (${point.x}, ${point.y})`);
                
                return labels;
              }
            },
            labelColor: function(context) {
              return {
                borderColor: context.dataset.borderColor || context.dataset.backgroundColor,
                backgroundColor: context.dataset.backgroundColor,
                borderWidth: 0,
                borderRadius: 6, // Half of width/height for perfect circle
                width: 12,
                height: 12
              };
            }
          }
        },
        // Legend tooltip overrides for scatter chart
        legendTooltip: {
          enabled: false,  // Use global legend tooltip settings
          statusLabel: 'Status',
          statusLabelColor: '#007bff',  // Blue for "Status" text
          statusValueColor: '#333333'   // Dark gray for status value
        }
      }
    },
    pieChart: {
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        bodyColor: '#000000',
        borderColor: '#FE0000',
        borderWidth: 1
      },
      // Chart-specific overrides
      overrides: {
        tooltip: {
          // Pie chart can have different tooltip styling
          backgroundColor: '#fff3cd',  // Light yellow background
          borderColor: '#ffc107',      // Yellow border
          padding: 20,  // Increased padding
          cornerRadius: 10
        },
        // Legend tooltip overrides for pie chart
        legendTooltip: {
          enabled: true,  // Enable chart-specific legend tooltip overrides
          statusLabel: 'Category',  // Different label for pie chart
          statusLabelColor: '#FE0000',  // Yellow for "Category" text
          statusValueColor: '#000000'   // Black for category value
        }
      }
    }
  },

  // Common chart settings
  common: {
    expandBackground: '#ffffff',
    visibilityStyles: {
      hiddenOpacity: '0.5',
      hiddenTextDecoration: 'line-through',
      visibleOpacity: '1',
      visibleTextDecoration: 'none'
    }
  },

  /**
   * Get chart labels for specific chart type
   */
  getChartLabels(chartType) {
    return this.labels[chartType] || {};
  },

  /**
   * Get tooltip title text for specific chart type
   */
  getTooltipTitleText(chartType) {
    const labels = this.getChartLabels(chartType);
    return labels.tooltipTitle || 'Data';
  },

  /**
   * Get fallback axis labels for specific chart type
   */
  getFallbackAxisLabels(chartType) {
    const labels = this.getChartLabels(chartType);
    return {
      xAxis: labels.fallbackXAxis || labels.xAxis || 'X Axis',
      yAxis: labels.fallbackYAxis || labels.yAxis || 'Y Axis'
    };
  },

  /**
   * Get common text labels
   */
  getCommonLabels() {
    return this.labels.common || {};
  },

  /**
   * Get common chart settings
   */
  getCommonSettings() {
    return this.common || {};
  },

  /**
   * Get chart fonts configuration
   */
  getChartFonts() {
    return this.fonts.chart;
  },

  /**
   * Get primary font family
   */
  getPrimaryFont() {
    return this.fonts.primary;
  },

  /**
   * Get secondary font family
   */
  getSecondaryFont() {
    return this.fonts.secondary;
  },

  /**
   * Get chart-specific configuration
   */
  getChartConfig(chartType) {
    return this.charts[chartType] || {};
  },

  /**
   * Get tooltip configuration for specific chart type
   */
  getTooltipConfig(chartType) {
    const chartConfig = this.getChartConfig(chartType);
    const fonts = this.getChartFonts();
    
    return {
      ...chartConfig.tooltip,
      titleFont: fonts.tooltip.title,
      bodyFont: fonts.tooltip.body
    };
  },

  /**
   * Get chart-specific overrides for specific chart type
   */
  getChartOverrides(chartType) {
    const chartConfig = this.getChartConfig(chartType);
    return chartConfig.overrides || {};
  },

  /**
   * Get tooltip configuration with chart-specific overrides
   */
  getTooltipConfigWithOverrides(chartType) {
    const baseConfig = this.getTooltipConfig(chartType);
    const overrides = this.getChartOverrides(chartType);
    
    const finalConfig = {
      ...baseConfig,
      ...(overrides.tooltip || {}),
      callbacks: {
        ...(baseConfig.callbacks || {}),
        ...(overrides.tooltip?.callbacks || {})
      }
    };
    
    // Debug: Log tooltip configuration for scatter chart
    if (chartType === 'scatterChart') {
      console.log('Chart Config - Scatter Chart Tooltip Base Config:', JSON.stringify(baseConfig, null, 2));
      console.log('Chart Config - Scatter Chart Tooltip Overrides (Raw):', overrides.tooltip);
      console.log('Chart Config - Scatter Chart Tooltip Overrides (Stringified):', JSON.stringify(overrides.tooltip, null, 2));
      console.log('Chart Config - Scatter Chart Tooltip Final Config:', JSON.stringify(finalConfig, null, 2));
      console.log('Chart Config - Scatter Chart Callbacks Check:', {
        hasOverridesCallbacks: !!overrides.tooltip?.callbacks,
        overridesCallbacksKeys: overrides.tooltip?.callbacks ? Object.keys(overrides.tooltip.callbacks) : [],
        finalCallbacksKeys: finalConfig.callbacks ? Object.keys(finalConfig.callbacks) : []
      });
    }
    
    return finalConfig;
  },

  /**
   * Get legend tooltip configuration with chart-specific overrides
   */
  getLegendTooltipConfigWithOverrides(chartType) {
    const commonLabels = this.getCommonLabels();
    const overrides = this.getChartOverrides(chartType);
    
    // Check if chart-specific overrides are enabled
    if (overrides.legendTooltip?.enabled) {
      return {
        ...commonLabels.legendTooltip,
        ...overrides.legendTooltip
      };
    }
    
    // Use global legend tooltip settings
    return commonLabels.legendTooltip || {};
  },

  /**
   * Get axis configuration for specific chart type
   */
  getAxisConfig(chartType) {
    const labels = this.getChartLabels(chartType);
    const fonts = this.getChartFonts();
    
    const baseConfig = {
      x: {
        display: true,
        title: {
          display: true,
          text: labels.xAxis,
          font: fonts.title
        },
        ticks: {
          font: fonts.ticks
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: labels.yAxis,
          font: fonts.title
        },
        ticks: {
          font: fonts.ticks
        },
        beginAtZero: true
      }
    };

    // Add chart-specific properties
    if (chartType === 'scatterChart') {
      baseConfig.x.min = 0;
      baseConfig.x.max = 222;
      baseConfig.x.title.display = true;   // Show x-axis title for scatter chart
      baseConfig.y.min = 0;
      baseConfig.y.max = 222;
      baseConfig.y.title.display = true;   // Show y-axis title for scatter chart
      
      // Debug: Log the scatter chart axis config
      console.log('Chart Config - Scatter Chart Axis Config:', JSON.stringify(baseConfig, null, 2));
    }

    return baseConfig;
  }
};

// Make it globally available
if (typeof window !== 'undefined') {
  window.ChartConfig = window.ChartConfig;
}
