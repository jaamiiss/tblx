/**
 * Global Chart Colors System
 * Centralized color management for all charts
 */

window.ChartColors = {
  // Brand Colors - Primary brand red integration
  brand: {
    primary: 'rgba(254, 0, 0, 0.9)',      // Brand red - #FE0000
    primarySoft: 'rgba(254, 0, 0, 0.6)',  // Softer brand red
    secondary: 'rgba(0, 0, 0, 0.8)',      // Brand black
    accent: 'rgba(255, 255, 255, 0.9)'    // Brand white
  },

  // Status colors (for bar and scatter charts) - Brand-aligned palette
  status: {
    active: 'rgba(34, 197, 94, 0.8)',      // Green - keeps current
    deceased: 'rgba(254, 0, 0, 0.8)',      // Brand red instead of generic red
    incarcerated: 'rgba(59, 130, 246, 0.8)', // Blue - keeps current
    redacted: 'rgba(168, 85, 247, 0.8)',   // Purple - keeps current
    unknown: 'rgba(156, 163, 175, 0.8)',   // Gray - keeps current
    captured: 'rgba(245, 158, 11, 0.8)'    // Amber - keeps current
  },

  // Category colors (for pie charts) - Light warm colors distinct from status charts
  category: {
    Male: 'rgba(255, 193, 7, 0.9)',       // Light amber/yellow
    Female: 'rgba(255, 87, 34, 0.9)',     // Light orange
    Company: 'rgba(255, 152, 0, 0.9)',    // Light orange-yellow
    Organization: 'rgba(255, 112, 67, 0.9)', // Light coral
    Group: 'rgba(255, 183, 77, 0.9)',     // Light peach
    Unknown: 'rgba(255, 138, 101, 0.9)',  // Light salmon
    // Handle case variations and common aliases
    male: 'rgba(255, 193, 7, 0.9)',
    female: 'rgba(255, 87, 34, 0.9)',
    company: 'rgba(255, 152, 0, 0.9)',
    organization: 'rgba(255, 112, 67, 0.9)',
    group: 'rgba(255, 183, 77, 0.9)',
    unknown: 'rgba(255, 138, 101, 0.9)'
  },

  // Default colors fallback
  default: [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(168, 85, 247, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)'    // Pink
  ],

  // Global tooltip colors and styling
  tooltip: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#FE0000',
    borderWidth: 1,
    borderRadius: 6,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    padding: '8px 12px',
    fontSize: '12px',
    fontFamily: "'TBL-2', monospace",
    zIndex: 99999,
    // Chart.js specific tooltip colors
    chartJs: {
      backgroundColor: '#ffffff',
      titleColor: '#000000',
      bodyColor: '#000000',
      borderColor: '#FE0000',
      borderWidth: 2,
      cornerRadius: 8,
      padding: 16,
      titleSpacing: 8,
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
    }
  },

  // Border colors (full opacity versions)
  borders: {
    default: 'rgba(254, 0, 0, 1)',  // Red for default/status label
    active: 'rgba(34, 197, 94, 1)',
    deceased: 'rgba(239, 68, 68, 1)',
    incarcerated: 'rgba(59, 130, 246, 1)',
    redacted: 'rgba(168, 85, 247, 1)',
    unknown: 'rgba(156, 163, 175, 1)',
    captured: 'rgba(245, 158, 11, 1)',
    Male: 'rgba(255, 193, 7, 1)',       // Light amber/yellow border
    Female: 'rgba(255, 87, 34, 1)',     // Light orange border
    Company: 'rgba(255, 152, 0, 1)',    // Light orange-yellow border
    Organization: 'rgba(255, 112, 67, 1)', // Light coral border
    Group: 'rgba(255, 183, 77, 1)',     // Light peach border
    Unknown: 'rgba(255, 138, 101, 1)',  // Light salmon border
    // Handle case variations
    male: 'rgba(255, 193, 7, 1)',
    female: 'rgba(255, 87, 34, 1)',
    company: 'rgba(255, 152, 0, 1)',
    organization: 'rgba(255, 112, 67, 1)',
    group: 'rgba(255, 183, 77, 1)',
    unknown: 'rgba(255, 138, 101, 1)'
  },

  /**
   * Get color for status
   */
  getStatusColor(status) {
    return this.status[status] || this.default[0];
  },

  /**
   * Get border color for status
   */
  getStatusBorderColor(status) {
    return this.borders[status] || this.borders.active;
  },

  /**
   * Get brand color
   */
  getBrandColor(type = 'primary') {
    return this.brand[type] || this.brand.primary;
  },

  /**
   * Check if color is brand-aligned
   */
  isBrandAligned(color) {
    const brandRed = 'rgba(254, 0, 0,';
    return color.includes(brandRed);
  },

  /**
   * Get color for category
   */
  getCategoryColor(category) {
    return this.category[category] || 'rgba(255, 193, 7, 0.9)'; // Light amber fallback
  },

  /**
   * Get border color for category
   */
  getCategoryBorderColor(category) {
    return this.borders[category] || this.borders.Male;
  },

  /**
   * Get default color by index
   */
  getDefaultColor(index) {
    return this.default[index % this.default.length];
  },

  /**
   * Get all status colors as array
   */
  getStatusColors() {
    return Object.values(this.status);
  },

  /**
   * Get all category colors as array
   */
  getCategoryColors() {
    return Object.values(this.category);
  },

  /**
   * Get tooltip configuration for Chart.js
   */
  getTooltipConfig() {
    return this.tooltip.chartJs;
  },

  /**
   * Get tooltip colors for custom tooltips
   */
  getTooltipColors() {
    return {
      backgroundColor: this.tooltip.backgroundColor,
      textColor: this.tooltip.textColor,
      borderColor: this.tooltip.borderColor,
      borderWidth: this.tooltip.borderWidth,
      borderRadius: this.tooltip.borderRadius,
      boxShadow: this.tooltip.boxShadow,
      padding: this.tooltip.padding,
      fontSize: this.tooltip.fontSize,
      fontFamily: this.tooltip.fontFamily,
      zIndex: this.tooltip.zIndex
    };
  },

  /**
   * Apply tooltip styles to an element
   */
  applyTooltipStyles(element) {
    const colors = this.getTooltipColors();
    Object.assign(element.style, {
      backgroundColor: colors.backgroundColor,
      color: colors.textColor,
      border: `${colors.borderWidth}px solid ${colors.borderColor}`,
      borderRadius: colors.borderRadius,
      boxShadow: colors.boxShadow,
      padding: colors.padding,
      fontSize: colors.fontSize,
      fontFamily: colors.fontFamily,
      zIndex: colors.zIndex
    });
  },

  /**
   * Update CSS custom properties for tooltips
   */
  updateTooltipCSSVariables() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const tooltip = this.tooltip;
      
      root.style.setProperty('--tooltip-background', tooltip.backgroundColor);
      root.style.setProperty('--tooltip-text-color', tooltip.textColor);
      root.style.setProperty('--tooltip-border-color', tooltip.borderColor);
      root.style.setProperty('--tooltip-border-width', tooltip.borderWidth);
      root.style.setProperty('--tooltip-border-radius', tooltip.borderRadius);
      root.style.setProperty('--tooltip-box-shadow', tooltip.boxShadow);
      root.style.setProperty('--tooltip-padding', tooltip.padding);
      root.style.setProperty('--tooltip-font-size', tooltip.fontSize);
      root.style.setProperty('--tooltip-font-family', tooltip.fontFamily);
      root.style.setProperty('--tooltip-z-index', tooltip.zIndex);
    }
  }
};

// Make it globally available
if (typeof window !== 'undefined') {
  window.ChartColors = window.ChartColors;
  
  // Initialize CSS variables when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ChartColors.updateTooltipCSSVariables();
    });
  } else {
    window.ChartColors.updateTooltipCSSVariables();
  }
}
