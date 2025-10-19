/**
 * Base Chart Class
 * Shared functionality for all chart types
 */
class BaseChart {
  constructor(chartType, options = {}) {
    this.chartType = chartType;
    this.containerId = options.containerId || this.getDefaultContainerId();
    this.chartInstance = null;
    this.data = null;
    
    // Configuration options
    this.enableLegendToggle = options.enableLegendToggle !== false; // Default to true
    this.enableTooltips = options.enableTooltips !== false; // Default to true
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger(`Chart-${chartType}`) : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    this.logger.info(`${chartType} Chart: Initialized with container '${this.containerId}'`);
  }

  /**
   * Get default container ID based on chart type
   */
  getDefaultContainerId() {
    const chartTypeLower = this.chartType.toLowerCase();
    switch (chartTypeLower) {
      case 'pie':
        return 'pieChart';
      case 'bar':
        return 'barChart';
      case 'scatter':
        return 'scatterChart';
      default:
        return `${chartTypeLower}Chart`;
    }
  }

  /**
   * Show chart spinner using SpinnerManager
   */
  showSpinner() {
    this.logger.info(`${this.chartType} Chart: Showing spinner for container '${this.containerId}'`);
    
    // HTMX handles spinner display, so we just log this
    this.logger.debug(`${this.chartType} Chart: HTMX spinner will be shown automatically`);
  }

  /**
   * Hide chart spinner using SpinnerManager
   */
  hideSpinner() {
    this.logger.info(`${this.chartType} Chart: Hiding spinner for container '${this.containerId}'`);
    
    // HTMX handles spinner hiding, so we just log this
    this.logger.debug(`${this.chartType} Chart: HTMX spinner will be hidden automatically`);
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
      const commonLabels = window.ChartConfig ? window.ChartConfig.getCommonLabels() : {
        errorIcon: '⚠️',
        errorMessage: 'Failed to load chart'
      };
      
      container.innerHTML = `
        <div class="chart-error">
          <div class="error-icon">${commonLabels.errorIcon}</div>
          <div class="error-message">${commonLabels.errorMessage} ${this.chartType} chart</div>
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

    // Create legend items with tooltips
    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.className = `legend-item ${this.chartType.toLowerCase()}-legend-item`;
      legendItem.style.position = 'relative';
      legendItem.style.cursor = 'pointer';
      
      const colorBox = document.createElement('div');
      colorBox.className = 'legend-color';
      colorBox.style.backgroundColor = colors[index];
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'legend-label';
      labelSpan.textContent = label;
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'legend-tooltip';
      // Apply global tooltip styles if available
      if (window.ChartColors && window.ChartColors.applyTooltipStyles) {
        window.ChartColors.applyTooltipStyles(tooltip);
        // Ensure tooltip is initially hidden
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'nowrap';
      } else {
        // Fallback styling using global colors if available
        const tooltipColors = window.ChartColors ? window.ChartColors.getTooltipColors() : {
          background: '#ffffff',
          text: '#000000',
          border: '#FE0000'
        };
        
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = tooltipColors.background;
        tooltip.style.color = tooltipColors.text;
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '11px';
        tooltip.style.fontWeight = '600';
        tooltip.style.border = `1px solid ${tooltipColors.border}`;
        tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        tooltip.style.zIndex = '99999';
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.whiteSpace = 'nowrap';
      }
      tooltip.innerHTML = this.getTooltipText(label, data, index);
      
      // Debug logging
      console.log(`Creating tooltip for ${label}:`, {
        label: label,
        data: data,
        index: index,
        tooltipText: tooltip.textContent
      });
      
      // Add click functionality to toggle data visibility (if enabled)
      if (this.enableLegendToggle) {
        legendItem.style.cursor = 'pointer';
        legendItem.addEventListener('click', () => {
          this.toggleDataVisibility(label, index);
        });
      }
      
      // Add hover effects (if tooltips are enabled)
      if (this.enableTooltips) {
        console.log(`Adding hover events for ${label} tooltip`);
        legendItem.addEventListener('mouseenter', () => {
          console.log(`Mouse enter on ${label} legend item`);
          // Hide all tooltips globally across all charts
          const allTooltips = document.querySelectorAll('.legend-tooltip');
          console.log(`Found ${allTooltips.length} tooltips to hide`);
          allTooltips.forEach(t => {
            t.style.opacity = '0';
            t.style.visibility = 'hidden';
          });
          
          // Show current tooltip
          console.log(`Showing tooltip for ${label}`);
          console.log(`Tooltip content:`, tooltip.innerHTML);
          console.log(`Tooltip text content:`, tooltip.textContent);
          
          // Ensure tooltip is attached to document body to avoid clipping
          if (!document.body.contains(tooltip)) {
            document.body.appendChild(tooltip);
            console.log(`Moved tooltip to document body`);
          }
          
          // Calculate initial tooltip position
          const rect = legendItem.getBoundingClientRect();
          let tooltipX = rect.left + rect.width / 2;
          let tooltipY = rect.top - 50;
          
          // Ensure tooltip doesn't go off screen
          const tooltipWidth = 200; // Approximate tooltip width
          const tooltipHeight = 60; // Approximate tooltip height
          
          // Adjust horizontal position if too close to edges
          if (tooltipX - tooltipWidth / 2 < 10) {
            tooltipX = tooltipWidth / 2 + 10;
          } else if (tooltipX + tooltipWidth / 2 > window.innerWidth - 10) {
            tooltipX = window.innerWidth - tooltipWidth / 2 - 10;
          }
          
          // Adjust vertical position if too close to top
          if (tooltipY < 10) {
            tooltipY = rect.bottom + 10; // Position below instead of above
          }
          
          // Ensure tooltip is not positioned too far down
          if (tooltipY > window.innerHeight - tooltipHeight) {
            tooltipY = window.innerHeight - tooltipHeight - 10;
          }
          
          tooltip.style.setProperty('opacity', '1', 'important');
          tooltip.style.setProperty('visibility', 'visible', 'important');
          tooltip.style.setProperty('display', 'block', 'important');
          tooltip.style.setProperty('position', 'fixed', 'important');
          tooltip.style.setProperty('z-index', '99999', 'important');
          
          // Use global colors for tooltip styling
          const tooltipColors = window.ChartColors ? window.ChartColors.getTooltipColors() : {
            background: '#ffffff',
            text: '#000000',
            border: '#ff0000'
          };
          
          tooltip.style.setProperty('background', tooltipColors.background, 'important');
          tooltip.style.setProperty('color', tooltipColors.text, 'important');
          tooltip.style.setProperty('border', `2px solid ${tooltipColors.border}`, 'important');
          tooltip.style.setProperty('padding', '10px', 'important');
          tooltip.style.setProperty('left', `${tooltipX}px`, 'important');
          tooltip.style.setProperty('top', `${tooltipY}px`, 'important');
          tooltip.style.setProperty('transform', 'translateX(-50%)', 'important');
          console.log(`Tooltip opacity: ${tooltip.style.opacity}, visibility: ${tooltip.style.visibility}`);
          
          // Debug tooltip position and size
          setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            console.log(`Tooltip actual position and size:`, {
              x: tooltipRect.left,
              y: tooltipRect.top,
              width: tooltipRect.width,
              height: tooltipRect.height,
              visible: tooltipRect.width > 0 && tooltipRect.height > 0,
              inViewport: tooltipRect.top >= 0 && tooltipRect.left >= 0 && 
                         tooltipRect.bottom <= window.innerHeight && 
                         tooltipRect.right <= window.innerWidth
            });
            
            // Check if tooltip is in DOM
            console.log(`Tooltip in DOM:`, document.body.contains(tooltip));
            console.log(`Tooltip class:`, tooltip.className);
            console.log(`Tooltip computed styles:`, {
              display: window.getComputedStyle(tooltip).display,
              visibility: window.getComputedStyle(tooltip).visibility,
              opacity: window.getComputedStyle(tooltip).opacity,
              position: window.getComputedStyle(tooltip).position,
              zIndex: window.getComputedStyle(tooltip).zIndex
            });
          }, 100);
        });

        legendItem.addEventListener('mouseleave', () => {
          console.log(`Mouse leave on ${label} legend item`);
          tooltip.style.setProperty('opacity', '0', 'important');
          tooltip.style.setProperty('visibility', 'hidden', 'important');
          
          // Remove tooltip from DOM after transition
          setTimeout(() => {
            if (document.body.contains(tooltip)) {
              document.body.removeChild(tooltip);
              console.log(`Removed tooltip from DOM`);
            }
          }, 300);
        });
      } else {
        console.log(`Tooltips disabled for ${this.chartType} chart`);
      }

      // Position tooltip (if tooltips are enabled)
      if (this.enableTooltips) {
        legendItem.addEventListener('mousemove', (e) => {
          const rect = legendItem.getBoundingClientRect();
          
          // Calculate optimal position for tooltip
          let tooltipX = rect.left + rect.width / 2;
          let tooltipY = rect.top - 50;
          
          // Ensure tooltip doesn't go off screen
          const tooltipWidth = 200; // Approximate tooltip width
          const tooltipHeight = 60; // Approximate tooltip height
          
          // Adjust horizontal position if too close to edges
          if (tooltipX - tooltipWidth / 2 < 10) {
            tooltipX = tooltipWidth / 2 + 10;
          } else if (tooltipX + tooltipWidth / 2 > window.innerWidth - 10) {
            tooltipX = window.innerWidth - tooltipWidth / 2 - 10;
          }
          
          // Adjust vertical position if too close to top
          if (tooltipY < 10) {
            tooltipY = rect.bottom + 10; // Position below instead of above
          }
          
          // Ensure tooltip is not positioned too far down
          if (tooltipY > window.innerHeight - tooltipHeight) {
            tooltipY = window.innerHeight - tooltipHeight - 10;
          }
          
          console.log(`Legend item rect:`, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom
          });
          
          console.log(`Window dimensions:`, {
            width: window.innerWidth,
            height: window.innerHeight
          });
          
          // Position tooltip with fixed positioning
          tooltip.style.position = 'fixed';
          tooltip.style.left = `${tooltipX}px`;
          tooltip.style.top = `${tooltipY}px`;
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.style.zIndex = '99999';
          
          console.log(`Positioned tooltip for ${label} at:`, {
            x: tooltipX,
            y: tooltipY,
            position: 'fixed',
            zIndex: '99999'
          });
        });
      }
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelSpan);
      // Don't append tooltip to legendItem to avoid clipping issues
      // tooltip will be attached to document.body when shown
      legendContainer.appendChild(legendItem);
    });

    // Add similarity stats for scatter chart
    if (similarityStats && this.chartType === 'Scatter') {
      this.addSimilarityStats(legendContainer, similarityStats);
    }

    this.logger.debug(`${this.chartType} Chart: Custom legend created`);
  }

  /**
   * Toggle data visibility for legend items
   */
  toggleDataVisibility(label, index) {
    if (!this.chartInstance) {
      this.logger.warn(`${this.chartType} Chart: Chart instance not available for toggle`);
      return;
    }

    // Toggle visibility of the dataset
    const meta = this.chartInstance.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    
    // Update the legend item appearance
    const legendItem = document.querySelector(`.${this.chartType.toLowerCase()}-legend-item:nth-child(${index + 1})`);
    if (legendItem) {
      if (meta.hidden) {
        legendItem.style.opacity = '0.5';
        legendItem.style.textDecoration = 'line-through';
      } else {
        legendItem.style.opacity = '1';
        legendItem.style.textDecoration = 'none';
      }
    }
    
    // Update the chart
    this.chartInstance.update();
    
    this.logger.info(`${this.chartType} Chart: Toggled visibility for ${label}`);
  }

  /**
   * Get tooltip text for legend items
   */
  getTooltipText(label, data, index) {
    // Default tooltip text - override in child classes
    return `${label}: Data available`;
  }

  /**
   * Add similarity stats to legend (for scatter chart)
   */
  addSimilarityStats(legendContainer, similarityStats) {
    const commonLabels = window.ChartConfig ? window.ChartConfig.getCommonLabels() : {
      similarityTitle: 'V1 & V2 Similarity',
      similarValues: 'Similar Values',
      similarity: 'Similarity'
    };
    
    const similaritySection = document.createElement('div');
    similaritySection.className = 'similarity-section'; 
    
    const similarityTitle = document.createElement('div');
    similarityTitle.className = 'similarity-title';
    similarityTitle.textContent = commonLabels.similarityTitle;
    
    const similarityContent = document.createElement('div');
    similarityContent.className = 'similarity-content';
    similarityContent.innerHTML = `
      <div><strong>${commonLabels.similarValues}:</strong> ${similarityStats.similarCount}/${similarityStats.totalCount}</div>
      <div><strong>${commonLabels.similarity}:</strong> ${similarityStats.similarityPercentage.toFixed(1)}%</div>
    `;
    
    similaritySection.appendChild(similarityTitle);
    similaritySection.appendChild(similarityContent);
    legendContainer.appendChild(similaritySection);
  }

  /**
   * Toggle legend visibility
   */
  toggleLegend(legendId, show = null) {
    console.log(`${this.chartType} Chart: toggleLegend called with legendId:`, legendId);
    const legend = document.getElementById(legendId);
    console.log(`${this.chartType} Chart: Legend element found:`, legend);
    if (!legend) {
      console.log(`${this.chartType} Chart: Legend element not found for ID:`, legendId);
      return;
    }

    if (show === null) {
      show = legend.style.display === 'none';
    }

    console.log(`${this.chartType} Chart: Current display:`, legend.style.display, 'Setting to:', show ? 'block' : 'none');
    
    // Use more specific CSS to override any conflicting rules
    if (show) {
      legend.style.setProperty('display', 'grid', 'important');
    } else {
      legend.style.setProperty('display', 'none', 'important');
    }
    
    console.log(`${this.chartType} Chart: Legend ${show ? 'shown' : 'hidden'}`);
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
      
      // Use global background color if available
      const commonSettings = window.ChartConfig ? window.ChartConfig.getCommonSettings() : { expandBackground: '#ffffff' };
      chartContainer.style.backgroundColor = commonSettings.expandBackground;
      
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

