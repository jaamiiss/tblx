/**
 * Unified Item Renderer
 * Provides consistent item rendering across all layouts
 */

class ItemRenderer {
  /**
   * Render a single item with consistent structure and styling
   * @param {Object} item - The item data
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for the item
   */
  static renderItem(item, options = {}) {
    const {
      includeLegendWrapper = false
    } = options;

    // Safely extract values with fallbacks
    const name = item.name || 'Unknown';
    const status = item.status || 'unknown';
    const v1 = item.v1 !== undefined ? item.v1 : 0;

    // Generate semantic HTML structure
    const itemContent = this.generateSemanticItemHTML(name, status, v1);

    // Wrap in legend-item if requested (for consistent styling)
    if (includeLegendWrapper) {
      return `<div class="${status}" role="listitem">${itemContent}</div>`;
    }

    return itemContent;
  }

  /**
   * Generate semantic HTML structure for better SEO and accessibility
   * @param {string} name - Item name
   * @param {string} status - Item status
   * @param {number} v1 - Primary item number
   * @returns {string} Semantic HTML string
   */
  static generateSemanticItemHTML(name, status, v1) {
    const guideHTML = `<span class="guide" aria-label="Item number ${v1}">#${v1}.</span>`;

    let statusHTML;
    if (status === "redacted") {
      statusHTML = '<span class="item-redacted" aria-label="Redacted information" role="img"></span>';
    } else {
      statusHTML = `<span><span class="name" itemprop="name">${name}</span><span class="dash" aria-hidden="true">&ndash;</span><span class="status ${status}" aria-label="Status: ${status}" itemprop="description">${status}</span></span>`;
    }

    const ariaLabel = `${name}, status: ${status}`;

    return `
      <article class="list-item" 
               id="item-${v1}" 
               aria-label="${ariaLabel}" 
               tabindex="0"
               itemscope 
               itemtype="https://schema.org/Person"
               data-item-id="${v1}"
               data-item-status="${status}">
        <header class="item-header">
          ${guideHTML}
          ${statusHTML}
        </header>
        
      </article>
    `;
  }

  /**
   * Render multiple items with consistent structure
   * @param {Array} items - Array of item data
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for all items
   */
  static renderItems(items, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return '<div class="empty-state-message"><div class="empty-state-icon"></div><div class="empty-state-title">No Data Available</div><div class="empty-state-message">No items found to display</div></div>';
    }

    return items.map(item => this.renderItem(item, options)).join('');
  }

  /**
   * Validate item data structure
   * @param {Object} item - Item data to validate
   * @returns {boolean} Whether item is valid
   */
  static validateItem(item) {
    return !!(item && typeof item === 'object' && item.name && typeof item.name === 'string' && item.status);
  }

  /**
   * Filter valid items from array
   * @param {Array} items - Array of items to filter
   * @returns {Array} Array of valid items
   */
  static filterValidItems(items) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => this.validateItem(item));
  }
}

// Make ItemRenderer globally available
window.ItemRenderer = ItemRenderer;
