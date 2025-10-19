/**
 * Chart Button Icons System
 * Centralized system for creating reusable chart control buttons
 */

window.ChartButtonIcons = {
  // SVG icon definitions
  icons: {
    legend: `
      <svg class="legend-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    `,
    refresh: `
      <svg class="refresh-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
        <path d="M21 3v5h-5"></path>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
        <path d="M3 21v-5h5"></path>
      </svg>
    `,
    expand: `
      <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
    `,
    close: `
      <svg class="close-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"></path>
      </svg>
    `,
    zoomIn: `
      <svg class="zoom-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `,
    zoomOut: `
      <svg class="zoom-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `
  },

  // Button configurations
  buttonConfigs: {
    legendToggle: {
      className: 'legend-toggle',
      title: 'Toggle Legend',
      icon: 'legend',
      onClick: null // Will be set dynamically
    },
    refresh: {
      className: 'refresh-button',
      title: 'Refresh Chart',
      icon: 'refresh',
      onClick: null // Will be set dynamically
    },
    expand: {
      className: 'expand-toggle',
      title: 'Expand Chart',
      icon: 'expand',
      onClick: null // Will be set dynamically
    },
    close: {
      className: 'close-button',
      title: 'Close Chart',
      icon: 'close',
      onClick: null // Will be set dynamically
    },
    zoomIn: {
      className: 'zoom-in',
      title: 'Zoom In',
      icon: 'zoomIn',
      onClick: null // Will be set dynamically
    },
    zoomOut: {
      className: 'zoom-out',
      title: 'Zoom Out',
      icon: 'zoomOut',
      onClick: null // Will be set dynamically
    }
  },

  /**
   * Create a button element with the specified configuration
   * @param {string} configKey - Key from buttonConfigs
   * @param {Function} onClick - Click handler function
   * @param {Object} options - Additional options (classes, attributes, etc.)
   * @returns {HTMLElement} Button element
   */
  createButton(configKey, onClick, options = {}) {
    const config = this.buttonConfigs[configKey];
    if (!config) {
      console.error(`Button config not found: ${configKey}`);
      return null;
    }

    const button = document.createElement('button');
    button.className = config.className + (options.className ? ` ${options.className}` : '');
    button.title = options.title || config.title;
    button.innerHTML = this.icons[config.icon];
    
    if (onClick) {
      button.onclick = onClick;
    }

    // Add any additional attributes
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        button.setAttribute(key, value);
      });
    }

    return button;
  },

  /**
   * Create multiple buttons for chart controls
   * @param {Array} buttonKeys - Array of button config keys
   * @param {Object} clickHandlers - Object mapping button keys to click handlers
   * @param {Object} options - Additional options for all buttons
   * @returns {Array} Array of button elements
   */
  createButtons(buttonKeys, clickHandlers = {}, options = {}) {
    return buttonKeys.map(key => {
      const onClick = clickHandlers[key] || null;
      return this.createButton(key, onClick, options);
    }).filter(button => button !== null);
  },

  /**
   * Create standard chart controls (legend, refresh, expand)
   * @param {Object} clickHandlers - Object mapping button keys to click handlers
   * @param {Object} options - Additional options
   * @returns {Array} Array of button elements
   */
  createStandardControls(clickHandlers = {}, options = {}) {
    return this.createButtons(['legendToggle', 'refresh', 'expand'], clickHandlers, options);
  },

  /**
   * Create scatter chart controls (zoom in, zoom out, legend, refresh, expand)
   * @param {Object} clickHandlers - Object mapping button keys to click handlers
   * @param {Object} options - Additional options
   * @returns {Array} Array of button elements
   */
  createScatterControls(clickHandlers = {}, options = {}) {
    return this.createButtons(['zoomIn', 'zoomOut', 'legendToggle', 'refresh', 'expand'], clickHandlers, options);
  },

  /**
   * Create modal controls (legend, refresh, close)
   * @param {Object} clickHandlers - Object mapping button keys to click handlers
   * @param {Object} options - Additional options
   * @returns {Array} Array of button elements
   */
  createModalControls(clickHandlers = {}, options = {}) {
    return this.createButtons(['legendToggle', 'refresh', 'close'], clickHandlers, options);
  },

  /**
   * Create modal scatter controls (zoom in, zoom out, legend, refresh, close)
   * @param {Object} clickHandlers - Object mapping button keys to click handlers
   * @param {Object} options - Additional options
   * @returns {Array} Array of button elements
   */
  createModalScatterControls(clickHandlers = {}, options = {}) {
    return this.createButtons(['zoomIn', 'zoomOut', 'legendToggle', 'refresh', 'close'], clickHandlers, options);
  },

  /**
   * Add buttons to a container element
   * @param {HTMLElement} container - Container element to add buttons to
   * @param {Array} buttons - Array of button elements
   */
  addButtonsToContainer(container, buttons) {
    buttons.forEach(button => {
      if (button) {
        container.appendChild(button);
      }
    });
  },

  /**
   * Update button icon (useful for state changes)
   * @param {HTMLElement} button - Button element
   * @param {string} iconKey - Icon key from icons object
   */
  updateButtonIcon(button, iconKey) {
    if (button && this.icons[iconKey]) {
      button.innerHTML = this.icons[iconKey];
    }
  },

  /**
   * Add loading state to refresh button
   * @param {HTMLElement} button - Refresh button element
   */
  addLoadingState(button) {
    if (button && button.classList.contains('refresh-button')) {
      button.classList.add('loading');
    }
  },

  /**
   * Remove loading state from refresh button
   * @param {HTMLElement} button - Refresh button element
   */
  removeLoadingState(button) {
    if (button && button.classList.contains('refresh-button')) {
      button.classList.remove('loading');
    }
  }
};
