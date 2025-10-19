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
      showV1 = true,
      showV2 = false,
      useV2ForNumber = false,
      includeLegendWrapper = false,
      showAppearance = false,
      showBio = false,
      showImage = false,
      showLink = false
    } = options;

    // Safely extract values with fallbacks
    const name = item.name || 'Unknown';
    const status = item.status || 'unknown';
    const v1 = item.v1 !== undefined ? item.v1 : 0;
    const v2 = item.v2 !== undefined ? item.v2 : 0;
    const category = item.category || '';
    
    // Extract new fields
    const image = item.image || '';
    const link = item.link || '';
    const bio = item.bio || '';
    const appearance = item.appearance || [];

    // Determine item number based on options
    const itemNumber = useV2ForNumber ? v2 : v1;

    // Generate semantic HTML structure
    const itemContent = this.generateSemanticItemHTML(name, status, itemNumber, showV1, showV2, v1, v2, category, showAppearance, showBio, showImage, showLink, appearance, bio, image, link);

    // Wrap in legend-item if requested (for consistent styling)
    if (includeLegendWrapper) {
      return `<div class="${status}">${itemContent}</div>`;
    }

    return itemContent;
  }

  /**
   * Generate semantic HTML structure for better SEO and accessibility
   * @param {string} name - Item name
   * @param {string} status - Item status
   * @param {number} itemNumber - Primary item number
   * @param {boolean} showV1 - Whether to show V1 number
   * @param {boolean} showV2 - Whether to show V2 number
   * @param {number} v1 - V1 value
   * @param {number} v2 - V2 value
   * @param {string} category - Item category
   * @param {boolean} showAppearance - Whether to show appearance info
   * @param {boolean} showBio - Whether to show bio
   * @param {boolean} showImage - Whether to show image
   * @param {boolean} showLink - Whether to show link
   * @param {Array} appearance - Appearance data
   * @param {string} bio - Bio text
   * @param {string} image - Image URL
   * @param {string} link - Link URL
   * @returns {string} Semantic HTML string
   */
  static generateSemanticItemHTML(name, status, itemNumber, showV1, showV2, v1, v2, category, showAppearance, showBio, showImage, showLink, appearance, bio, image, link) {
    // Generate guide HTML
    const guideHTML = this.generateGuideHTML(itemNumber, showV1, showV2, v1, v2);
    
    // Generate status HTML
    const statusHTML = this.generateStatusHTML(name, status);
    
    // Generate additional info HTML if requested
    let additionalHTML = '';
    if (showAppearance && appearance.length > 0) {
      additionalHTML += this.generateAppearanceHTML(appearance);
    }
    if (showBio && bio) {
      additionalHTML += this.generateBioHTML(bio);
    }
    if (showImage && image) {
      additionalHTML += this.generateImageHTML(image);
    }
    if (showLink && link) {
      additionalHTML += this.generateLinkHTML(link);
    }

    // Create semantic structure with proper ARIA labels and roles
    const ariaLabel = `${name}, status: ${status}${category ? `, category: ${category}` : ''}`;
    const itemId = `item-${itemNumber}`;
    
    return `
      <article class="list-item" 
               id="${itemId}" 
               role="listitem" 
               aria-label="${ariaLabel}" 
               tabindex="0"
               itemscope 
               itemtype="https://schema.org/Person"
               data-item-id="${itemNumber}"
               data-item-status="${status}">
        <header class="item-header">
          ${guideHTML}
          ${statusHTML}
        </header>
        ${additionalHTML ? `<div class="item-content" role="region" aria-label="Additional information">${additionalHTML}</div>` : ''}
      </article>
    `;
  }

  /**
   * Generate status HTML with proper styling
   * @param {string} name - Item name
   * @param {string} status - Item status
   * @returns {string} HTML string for status
   */
  static generateStatusHTML(name, status) {
    if (status === "redacted") {
      return '<span class="item-redacted" aria-label="Redacted information" role="img"></span>';
    }

    return `<span><span class="name" itemprop="name">${name}</span><span class="dash" aria-hidden="true">&ndash;</span><span class="status ${status}" aria-label="Status: ${status}" itemprop="description">${status}</span></span>`;
  }

  /**
   * Generate guide HTML with item number
   * @param {number} itemNumber - Primary item number
   * @param {boolean} showV1 - Whether to show V1 number
   * @param {boolean} showV2 - Whether to show V2 number
   * @param {number} v1 - V1 value
   * @param {number} v2 - V2 value
   * @returns {string} HTML string for guide
   */
  static generateGuideHTML(itemNumber, showV1, showV2, v1, v2) {
    let guideText = `#${itemNumber}.`;
    let ariaLabel = `Item number ${itemNumber}`;

    // Add additional numbers if requested
    if (showV1 && showV2) {
      guideText = `#${v1}/${v2}.`;
      ariaLabel = `Item numbers V1: ${v1}, V2: ${v2}`;
    } else if (showV2 && !showV1) {
      guideText = `#${v2}.`;
      ariaLabel = `Item number V2: ${v2}`;
    }

    return `<span class="guide" aria-label="${ariaLabel}">${guideText}</span>`;
  }

  /**
   * Render multiple items with consistent structure
   * @param {Array} items - Array of item data
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for all items
   */
  static renderItems(items, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return '<div class="quota-exceeded-message"><div class="quota-icon">📋</div><div class="quota-title">No Data Available</div><div class="quota-message">No items found to display</div></div>';
    }

    return items.map(item => this.renderItem(item, options)).join('');
  }

  /**
   * Render items in columns (for V1/V2 layout)
   * @param {Array} items - Array of item data
   * @param {number} columns - Number of columns
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for column layout
   */
  static renderItemsInColumns(items, columns = 2, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return '<div class="quota-exceeded-message"><div class="quota-icon">📋</div><div class="quota-title">No Data Available</div><div class="quota-message">No items found to display</div></div>';
    }

    // Distribute items across columns
    const itemsPerColumn = Math.ceil(items.length / columns);
    const columnData = [];

    for (let i = 0; i < columns; i++) {
      const startIndex = i * itemsPerColumn;
      const endIndex = Math.min(startIndex + itemsPerColumn, items.length);
      columnData.push(items.slice(startIndex, endIndex));
    }

    // Generate HTML for each column
    const columnHTML = columnData.map(columnItems => {
      const itemsHTML = columnItems.map(item => this.renderItem(item, options)).join('');
      return `<div class="column">${itemsHTML}</div>`;
    }).join('');

    return columnHTML;
  }

  /**
   * Generate appearance HTML
   * @param {Array} appearance - Array of appearance objects
   * @returns {string} HTML string for appearance
   */
  static generateAppearanceHTML(appearance) {
    if (!appearance || appearance.length === 0) return '';
    
    const appearanceText = appearance
      .map(app => `S${app.season}E${app.episode}`)
      .join(', ');
    
    return `<div class="item-appearance" role="text" aria-label="Episode appearances">Appearances: ${appearanceText}</div>`;
  }

  /**
   * Generate bio HTML
   * @param {string} bio - Bio text
   * @returns {string} HTML string for bio
   */
  static generateBioHTML(bio) {
    if (!bio) return '';
    
    const truncatedBio = bio.length > 100 ? bio.substring(0, 100) + '...' : bio;
    return `<div class="item-bio" role="text" aria-label="Character biography" title="${bio}">${truncatedBio}</div>`;
  }

  /**
   * Generate image HTML
   * @param {string} imageUrl - Image URL
   * @returns {string} HTML string for image
   */
  static generateImageHTML(imageUrl) {
    if (!imageUrl) return '';
    
    return `<div class="item-image" role="img" aria-label="Character image"><img src="${imageUrl}" alt="Character image" style="width: 20px; height: 20px; border-radius: 3px;"></div>`;
  }

  /**
   * Generate link HTML
   * @param {string} linkUrl - Link URL
   * @returns {string} HTML string for link
   */
  static generateLinkHTML(linkUrl) {
    if (!linkUrl) return '';
    
    return `<div class="item-link"><a href="${linkUrl}" target="_blank" rel="noopener noreferrer" aria-label="External link to character information">🔗</a></div>`;
  }

  /**
   * Validate item data structure
   * @param {Object} item - Item data to validate
   * @returns {boolean} Whether item is valid
   */
  static validateItem(item) {
    return item && 
           typeof item === 'object' && 
           item.name && 
           typeof item.name === 'string' &&
           item.status && 
           typeof item.status === 'string';
  }

  /**
   * Filter valid items from array
   * @param {Array} items - Array of items to filter
   * @returns {Array} Array of valid items
   */
  static filterValidItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.filter(item => this.validateItem(item));
  }
}

// Make ItemRenderer globally available
window.ItemRenderer = ItemRenderer;
