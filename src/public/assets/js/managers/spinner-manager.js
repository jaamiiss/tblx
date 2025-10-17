// Reusable Spinner Manager
class SpinnerManager {
  constructor() {
    this.activeSpinners = new Map();
    
    // Create module logger
    this.logger = window.logManager ? window.logManager.createModuleLogger('SpinnerManager') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
  }

  /**
   * Create a reusable spinner element
   * @param {string} id - Unique identifier for the spinner
   * @param {Object} options - Configuration options
   * @param {string} options.text - Loading text to display
   * @param {string} options.size - Spinner size ('small', 'medium', 'large')
   * @param {string} options.color - Spinner color (default: '#FE0000')
   * @param {string} options.className - Additional CSS classes
   * @param {boolean} options.showText - Whether to show loading text
   * @param {string} options.position - Position type ('absolute', 'relative', 'fixed')
   * @returns {HTMLElement} The created spinner element
   */
  createSpinner(id, options = {}) {
    const {
      text = 'Loading...',
      size = 'medium',
      color = '#FE0000',
      className = '',
      showText = true,
      position = 'absolute'
    } = options;

    // Size configurations
    const sizeConfig = {
      small: { spinner: 16, text: 12 },
      medium: { spinner: 24, text: 14 },
      large: { spinner: 32, text: 16 }
    };

    const config = sizeConfig[size] || sizeConfig.medium;

    // Create spinner element
    const spinnerElement = document.createElement('div');
    spinnerElement.id = `spinner-${id}`;
    spinnerElement.className = `reusable-spinner ${className}`;
    spinnerElement.style.cssText = `
      position: ${position};
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: transparent;
      z-index: 1000;
      flex-direction: column;
    `;

    // Create spinner content
    const spinnerContent = document.createElement('div');
    spinnerContent.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
    `;

    // Create spinner circle
    const spinnerCircle = document.createElement('div');
    spinnerCircle.className = 'spinner-circle';
    spinnerCircle.style.cssText = `
      width: ${config.spinner}px;
      height: ${config.spinner}px;
      border: 2px solid ${color}20;
      border-top: 2px solid ${color};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // Create loading text
    if (showText) {
      const loadingText = document.createElement('div');
      loadingText.className = 'spinner-text';
      loadingText.textContent = text;
      loadingText.style.cssText = `
        color: ${color};
        font-family: 'TBL-2', Arial, Helvetica, sans-serif;
        font-size: ${config.text}px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-align: center;
      `;
      spinnerContent.appendChild(loadingText);
    }

    spinnerContent.appendChild(spinnerCircle);
    spinnerElement.appendChild(spinnerContent);

    // Store spinner reference
    this.activeSpinners.set(id, spinnerElement);

    return spinnerElement;
  }

  /**
   * Show a spinner
   * @param {string} id - Spinner identifier
   * @param {HTMLElement} container - Container to append spinner to
   */
  showSpinner(id, container) {
    let spinner = this.activeSpinners.get(id);
    
    if (!spinner) {
      this.logger.warn(`Spinner with id '${id}' not found`);
      return;
    }

    // Remove from any existing parent
    if (spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }

    // Append to container
    if (container) {
      container.appendChild(spinner);
      spinner.style.display = 'flex';
    }
  }

  /**
   * Hide a spinner
   * @param {string} id - Spinner identifier
   */
  hideSpinner(id) {
    const spinner = this.activeSpinners.get(id);
    if (spinner) {
      spinner.style.display = 'none';
    }
  }

  /**
   * Remove a spinner completely
   * @param {string} id - Spinner identifier
   */
  removeSpinner(id) {
    const spinner = this.activeSpinners.get(id);
    if (spinner) {
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
      this.activeSpinners.delete(id);
    }
  }

  /**
   * Show spinner for HTMX requests
   * @param {string} containerId - Container ID to show spinner in
   * @param {Object} options - Spinner options
   */
  showHTMXSpinner(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.logger.warn(`Container '${containerId}' not found`);
      return;
    }

    const spinnerId = `htmx-${containerId}`;
    const spinner = this.createSpinner(spinnerId, {
      text: options.text || 'Loading...',
      size: options.size || 'medium',
      color: options.color || '#FE0000',
      className: 'htmx-spinner',
      showText: options.showText !== false,
      position: options.position || 'absolute'
    });

    this.showSpinner(spinnerId, container);
  }

  /**
   * Hide HTMX spinner
   * @param {string} containerId - Container ID
   */
  hideHTMXSpinner(containerId) {
    const spinnerId = `htmx-${containerId}`;
    this.hideSpinner(spinnerId);
  }

  /**
   * Show demo data loading spinner
   * @param {string} containerId - Container ID
   * @param {Object} options - Spinner options
   */
  showDemoSpinner(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.logger.warn(`Container '${containerId}' not found`);
      return;
    }

    const spinnerId = `demo-${containerId}`;
    const spinner = this.createSpinner(spinnerId, {
      text: options.text || 'Loading demo data...',
      size: options.size || 'medium',
      color: options.color || '#FE0000',
      className: 'demo-spinner',
      showText: options.showText !== false,
      position: options.position || 'absolute'
    });

    this.showSpinner(spinnerId, container);
  }

  /**
   * Hide demo data spinner
   * @param {string} containerId - Container ID
   */
  hideDemoSpinner(containerId) {
    const spinnerId = `demo-${containerId}`;
    this.hideSpinner(spinnerId);
  }

  /**
   * Hide all spinners
   */
  hideAllSpinners() {
    this.activeSpinners.forEach((spinner, id) => {
      this.hideSpinner(id);
    });
  }

  /**
   * Remove all spinners
   */
  removeAllSpinners() {
    this.activeSpinners.forEach((spinner, id) => {
      this.removeSpinner(id);
    });
  }

  /**
   * Check if a spinner is currently visible
   * @param {string} id - Spinner identifier
   * @returns {boolean} Whether the spinner is visible
   */
  isSpinnerVisible(id) {
    const spinner = this.activeSpinners.get(id);
    return spinner && spinner.style.display !== 'none';
  }
}

// Create global instance
window.spinnerManager = new SpinnerManager();

// Add CSS animation if not already present
if (!document.querySelector('#spinner-manager-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-manager-styles';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .reusable-spinner {
      font-family: 'TBL-2', Arial, Helvetica, sans-serif;
    }
    
    .reusable-spinner.htmx-spinner {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(2px);
    }
    
    .reusable-spinner.demo-spinner {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(3px);
    }
  `;
  document.head.appendChild(style);
}

// Initialize spinner manager
if (window.logManager) {
  window.logManager.info('SpinnerManager: Initialized');
} else {
  console.log('SpinnerManager: Initialized');
}
