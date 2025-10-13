/**
 * Global String Schema Manager
 * Centralized string management with fallbacks and attributes
 */
class StringSchema {
  constructor() {
    this.schema = {
      // Loading Messages
      loading: {
        items: "Loading items...",
        statistics: "Loading statistics...",
        charts: "Loading charts...",
        data: "Loading data...",
        demo: "Loading demo data...",
        fallback: "Loading fallback data...",
        categoryDistribution: "Loading Category Distribution...",
        statusDistribution: "Loading Status Distribution...",
        v1RangeChart: "Loading V1 Range Chart...",
        v1v2Relationship: "Loading V1 vs V2 Relationship..."
      },
      
      // Error Messages
      errors: {
        network: "Network error occurred",
        quota: "Firestore quota exceeded",
        timeout: "Request timeout",
        generic: "An error occurred",
        dataLoad: "Failed to load data",
        chartLoad: "Failed to load chart",
        statsLoad: "Failed to load statistics",
        noData: "No Data Available",
        invalidData: "Invalid Data",
        noItems: "No items found to display",
        missingProperties: "Items found but missing required properties"
      },
      
      // Status Messages
      status: {
        quotaExceeded: "Data Service Unavailable",
        quotaMessage: "Firestore quota exceeded or connection issues",
        quotaNote: "Click \"Load Demo Data\" to enable demo mode across all pages.",
        demoMode: "Demo Mode Active",
        liveData: "Live Data Active",
        cached: "Using cached data",
        offline: "Offline mode"
      },
      
      // Button Labels
      buttons: {
        loadDemo: "Load Demo Data",
        cancel: "Cancel",
        retry: "Retry",
        refresh: "Refresh",
        close: "Close",
        back: "Back",
        next: "Next",
        submit: "Submit",
        // Admin buttons
        login: "Login",
        logout: "Logout",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        update: "Update",
        import: "Import",
        export: "Export",
        bulkUpdate: "Bulk Update",
        bulkDelete: "Bulk Delete",
        reset: "Reset",
        search: "Search",
        filter: "Filter",
        clear: "Clear",
        confirm: "Confirm",
        approve: "Approve",
        reject: "Reject"
      },
      
      // Page Titles
      titles: {
        home: "The Blacklist",
        list: "The Blacklist",
        listV1: "Names on the List",
        listV2: "V2 Names on the List",
        stats: "Statistics",
        status: "Status",
        deceased: "Deceased",
        active: "Active",
        incarcerated: "Incarcerated",
        captured: "Captured",
        redacted: "Redacted",
        // Admin titles
        admin: "Admin Panel",
        adminDashboard: "Admin Dashboard",
        adminLogin: "Admin Login",
        adminRegister: "Admin Registration",
        adminData: "Data Management",
        adminUsers: "User Management",
        adminLogs: "Activity Logs",
        adminSettings: "Settings",
        adminAnalytics: "Analytics",
        adminProfile: "Profile"
      },
      
      // Chart Titles
      chartTitles: {
        categoryDistribution: "Category Distribution",
        statusDistribution: "Status Distribution",
        v1RangeChart: "Status by V1 Range",
        v1v2Relationship: "V1 vs V2 Relationship"
      },
      
      // Descriptions
      descriptions: {
        home: "Welcome to The Blacklist",
        list: "Browse the complete list",
        listV1: "Final List",
        listV2: "Modified List",
        stats: "Analytics & Charts",
        demo: "Demo mode with sample data",
        quota: "Service temporarily unavailable",
        // Admin descriptions
        adminDashboard: "Manage and monitor The Blacklist data",
        adminData: "Create, edit, and manage blacklist entries",
        adminUsers: "Manage admin users and permissions",
        adminLogs: "View system activity and audit logs",
        adminSettings: "Configure system settings and preferences",
        adminAnalytics: "View detailed analytics and reports"
      },
      
      // Attributes (for HTML elements)
      attributes: {
        loading: {
          class: "htmx-indicator loading-spinner",
          "aria-label": "Loading content",
          role: "status"
        },
        error: {
          class: "error-message",
          "aria-label": "Error message",
          role: "alert"
        },
        demo: {
          class: "demo-mode-indicator",
          "aria-label": "Demo mode active",
          role: "status"
        },
        quota: {
          class: "quota-exceeded-message",
          "aria-label": "Service unavailable",
          role: "alert"
        },
        // Admin attributes
        adminForm: {
          class: "admin-form",
          "aria-label": "Admin form",
          role: "form"
        },
        adminTable: {
          class: "admin-table",
          "aria-label": "Admin data table",
          role: "table"
        },
        adminModal: {
          class: "admin-modal",
          "aria-label": "Admin modal dialog",
          role: "dialog"
        },
        adminAlert: {
          class: "admin-alert",
          "aria-label": "Admin alert",
          role: "alert"
        }
      },
      
      // Fallbacks (when primary strings fail)
      fallbacks: {
        loading: {
          items: "Please wait...",
          statistics: "Loading...",
          charts: "Preparing charts...",
          data: "Fetching data...",
          demo: "Loading sample data...",
          fallback: "Loading backup data...",
          categoryDistribution: "Preparing category chart...",
          statusDistribution: "Preparing status chart...",
          v1RangeChart: "Preparing range chart...",
          v1v2Relationship: "Preparing relationship chart..."
        },
        errors: {
          network: "Connection failed",
          quota: "Service limit reached",
          timeout: "Request took too long",
          generic: "Something went wrong",
          dataLoad: "Could not load data",
          chartLoad: "Chart failed to load",
          statsLoad: "Statistics unavailable",
          noData: "No Data Found",
          invalidData: "Data Error",
          noItems: "No items available",
          missingProperties: "Data validation failed"
        },
        status: {
          quotaExceeded: "Service Unavailable",
          quotaMessage: "Database quota exceeded",
          quotaNote: "Use demo data instead.",
          demoMode: "Demo Active",
          liveData: "Live Data",
          cached: "Cached",
          offline: "Offline"
        },
        chartTitles: {
          categoryDistribution: "Categories",
          statusDistribution: "Status",
          v1RangeChart: "V1 Range",
          v1v2Relationship: "V1 vs V2"
        },
        // Admin fallbacks
        buttons: {
          login: "Sign In",
          logout: "Sign Out",
          save: "Store",
          delete: "Remove",
          edit: "Modify",
          create: "Add",
          update: "Change",
          import: "Upload",
          export: "Download",
          bulkUpdate: "Mass Update",
          bulkDelete: "Mass Delete",
          reset: "Clear",
          search: "Find",
          filter: "Sort",
          clear: "Reset",
          confirm: "OK",
          approve: "Accept",
          reject: "Deny"
        },
        titles: {
          home: "Home",
          list: "List",
          listV1: "V1 List",
          listV2: "V2 List",
          stats: "Stats",
          status: "Status",
          deceased: "Deceased",
          active: "Active",
          incarcerated: "Incarcerated",
          captured: "Captured",
          redacted: "Redacted",
          admin: "Control Panel",
          adminDashboard: "Dashboard",
          adminLogin: "Sign In",
          adminRegister: "Sign Up",
          adminData: "Data",
          adminUsers: "Users",
          adminLogs: "Logs",
          adminSettings: "Config",
          adminAnalytics: "Reports",
          adminProfile: "Account"
        },
        descriptions: {
          home: "Welcome",
          list: "Browse list",
          listV1: "Final",
          listV2: "Modified",
          stats: "Charts",
          demo: "Demo mode",
          quota: "Service unavailable",
          adminDashboard: "Control panel for data management",
          adminData: "Manage entries",
          adminUsers: "Manage users",
          adminLogs: "View logs",
          adminSettings: "Configure system",
          adminAnalytics: "View reports"
        },
        // List fallbacks
        list: {
          itemRendering: {
            unknown: "N/A",
            guidePrefix: "#",
            guideSeparator: "/",
            guideSuffix: ".",
            dash: "-",
            redactedPlaceholder: ""
          },
          demoMode: {
            active: "Demo Active",
            loading: "Loading...",
            enabled: "Demo on",
            disabled: "Demo off",
            indicator: "Demo Active",
            buttonLabel: "Load Demo"
          },
          errors: {
            jsonParse: "Parse error",
            quotaCheck: "Quota check failed",
            cacheSave: "Cache save failed",
            cacheLoad: "Cache load failed",
            dataLoad: "Data load failed",
            render: "Render error"
          },
          success: {
            cacheSaved: "Cache saved",
            cacheLoaded: "Cache loaded",
            dataLoaded: "Data loaded",
            spinnerHidden: "Spinner hidden",
            spinnerShown: "Spinner shown"
          },
          console: {
            demoModeEnabled: "Demo mode enabled",
            demoModeDisabled: "Demo mode disabled",
            quotaExceeded: "Quota exceeded",
            quotaAvailable: "Quota available",
            spinnerHidden: "Spinner hidden",
            spinnerShown: "Spinner shown",
            contentLoaded: "Content loaded",
            cacheSaved: "Cache saved",
            cacheLoaded: "Cache loaded",
            noCache: "No cache found",
            quotaStatus: "Checking quota...",
            quotaResponse: "Quota response:",
            showingDemoButton: "Showing demo button",
            liveDataDetected: "Live data detected"
          }
        },
        // Homepage fallbacks
        homepage: {
          content: {
            title: "The Blacklist",
            description: "HTMX, Express, Firestore",
            altText: "The Blacklist",
            posterCaption: "Poster 1",
            greeting: "Hi"
          },
          gallery: {
            baseUrl: "https://ik.imagekit.io/ivw8jbdbt/TBLX/",
            totalImages: 10,
            firstImages: 10,
            imageExtension: ".jpg",
            avifExtension: ".avif"
          },
          animation: {
            titleText: "The Blacklist",
            linkText: "The Blacklist",
            linkHref: "/list"
          },
          console: {
            galleryPopulated: "Gallery populated",
            randomIndexGenerated: "Random index generated",
            imageLoaded: "Image loaded"
          },
          errors: {
            imageLoadFailed: "Image load failed",
            galleryError: "Gallery error",
            scriptLoadFailed: "Script load failed"
          },
          success: {
            galleryReady: "Gallery ready",
            imagesLoaded: "Images loaded",
            animationReady: "Animation ready"
          }
        }
      },

      // Admin-specific strings
      admin: {
        // Form labels
        formLabels: {
          name: "Name",
          status: "Status",
          category: "Category",
          v1: "V1 Number",
          v2: "V2 Number",
          email: "Email",
          password: "Password",
          confirmPassword: "Confirm Password",
          role: "Role",
          permissions: "Permissions",
          isActive: "Active",
          createdAt: "Created At",
          updatedAt: "Updated At",
          createdBy: "Created By",
          updatedBy: "Updated By"
        },

        // Form placeholders
        placeholders: {
          name: "Enter name...",
          email: "Enter email address...",
          password: "Enter password...",
          confirmPassword: "Confirm password...",
          search: "Search...",
          filter: "Filter by...",
          selectStatus: "Select status...",
          selectCategory: "Select category...",
          selectRole: "Select role...",
          enterV1: "Enter V1 number (0-200)...",
          enterV2: "Enter V2 number..."
        },

        // Validation messages
        validation: {
          required: "This field is required",
          email: "Please enter a valid email address",
          password: "Password must be at least 8 characters",
          passwordMatch: "Passwords do not match",
          v1Range: "V1 number must be between 0 and 200",
          v2Positive: "V2 number must be positive",
          nameLength: "Name must be between 2 and 100 characters",
          invalidStatus: "Please select a valid status",
          invalidCategory: "Please select a valid category",
          invalidRole: "Please select a valid role"
        },

        // Success messages
        success: {
          login: "Login successful",
          logout: "Logout successful",
          create: "Entry created successfully",
          update: "Entry updated successfully",
          delete: "Entry deleted successfully",
          bulkUpdate: "Bulk update completed",
          bulkDelete: "Bulk delete completed",
          import: "Data imported successfully",
          export: "Data exported successfully",
          userCreate: "User created successfully",
          userUpdate: "User updated successfully",
          userDelete: "User deleted successfully",
          settingsUpdate: "Settings updated successfully"
        },

        // Error messages
        errors: {
          login: "Login failed. Please check your credentials",
          unauthorized: "You don't have permission to perform this action",
          notFound: "Entry not found",
          duplicate: "Entry already exists",
          validation: "Please fix the validation errors",
          server: "Server error occurred",
          network: "Network error occurred",
          timeout: "Request timeout",
          forbidden: "Access forbidden",
          conflict: "Resource conflict",
          tooManyRequests: "Too many requests. Please try again later"
        },

        // Table headers
        tableHeaders: {
          id: "ID",
          name: "Name",
          status: "Status",
          category: "Category",
          v1: "V1",
          v2: "V2",
          createdAt: "Created",
          updatedAt: "Updated",
          actions: "Actions",
          select: "Select",
          email: "Email",
          role: "Role",
          isActive: "Active",
          lastLogin: "Last Login"
        },

        // Navigation items
        navigation: {
          dashboard: "Dashboard",
          data: "Data Management",
          users: "User Management",
          logs: "Activity Logs",
          settings: "Settings",
          analytics: "Analytics",
          profile: "Profile",
          logout: "Logout"
        },

        // Status options
        statusOptions: {
          deceased: "Deceased",
          active: "Active",
          incarcerated: "Incarcerated",
          redacted: "Redacted",
          unknown: "Unknown",
          captured: "Captured"
        },

        // Category options
        categoryOptions: {
          Male: "Male",
          Female: "Female",
          Company: "Company",
          Group: "Group"
        },

        // Role options
        roleOptions: {
          super_admin: "Super Admin",
          admin: "Admin",
          editor: "Editor",
          viewer: "Viewer"
        },

        // Permission options
        permissionOptions: {
          read: "Read",
          create: "Create",
          update: "Update",
          delete: "Delete",
          manage_users: "Manage Users",
          view_logs: "View Logs",
          manage_settings: "Manage Settings",
          view_audit: "View Audit"
        },

        // Bulk operations
        bulkOperations: {
          update: "Bulk Update",
          delete: "Bulk Delete",
          export: "Export Selected",
          import: "Import Data"
        },

        // File operations
        fileOperations: {
          import: "Import Data",
          export: "Export Data",
          download: "Download",
          upload: "Upload",
          chooseFile: "Choose File",
          noFileSelected: "No file selected"
        },

        // Pagination
        pagination: {
          previous: "Previous",
          next: "Next",
          first: "First",
          last: "Last",
          page: "Page",
          of: "of",
          showing: "Showing",
          to: "to",
          entries: "entries",
          perPage: "per page"
        },

        // Filters
        filters: {
          all: "All",
          active: "Active",
          inactive: "Inactive",
          today: "Today",
          thisWeek: "This Week",
          thisMonth: "This Month",
          thisYear: "This Year",
          custom: "Custom Range"
        },

        // Sort options
        sortOptions: {
          name: "Name",
          status: "Status",
          category: "Category",
          v1: "V1 Number",
          v2: "V2 Number",
          createdAt: "Created Date",
          updatedAt: "Updated Date"
        },

        // Sort orders
        sortOrders: {
          asc: "Ascending",
          desc: "Descending"
        }
      },

      // List-specific strings
      list: {
        // Item rendering
        itemRendering: {
          unknown: "Unknown",
          guidePrefix: "#",
          guideSeparator: "/",
          guideSuffix: ".",
          dash: "–",
          redactedPlaceholder: ""
        },

        // Column layout
        columnLayout: {
          largeDesktop: "Large Desktop",
          desktop: "Desktop/Tablet", 
          mobile: "Mobile",
          smallMobile: "Small Mobile",
          columns: "columns",
          itemsPerColumn: "items per column"
        },

        // Screen size breakpoints
        breakpoints: {
          largeDesktop: 1600,
          desktop: 900,
          mobile: 600,
          smallMobile: 0
        },

        // Demo mode messages
        demoMode: {
          active: "Demo Mode Active",
          loading: "Loading Demo Data...",
          enabled: "Demo mode enabled",
          disabled: "Demo mode disabled",
          indicator: "Demo Mode Active",
          buttonLabel: "Load Demo Data"
        },

        // HTMX messages
        htmx: {
          disabling: "Disabling HTMX elements",
          enabling: "Re-enabling HTMX elements",
          elements: "HTMX elements",
          spinners: "HTMX spinners",
          disabled: "HTMX disabled",
          enabled: "HTMX enabled"
        },

        // Error messages
        errors: {
          jsonParse: "Error parsing JSON response",
          quotaCheck: "Failed to check quota status",
          cacheSave: "Failed to save demo data cache",
          cacheLoad: "Failed to load demo data cache",
          dataLoad: "Failed to load demo data",
          render: "Error rendering items"
        },

        // Success messages
        success: {
          cacheSaved: "Saved demo data cache to localStorage",
          cacheLoaded: "Loaded demo data cache from localStorage",
          dataLoaded: "Demo data loaded successfully",
          spinnerHidden: "Hidden spinner",
          spinnerShown: "Shown spinner"
        },

        // Console messages
        console: {
          demoModeEnabled: "Demo mode already enabled, keeping HTMX disabled",
          demoModeDisabled: "Live data detected, disabling demo mode",
          quotaExceeded: "Firestore quota exceeded, showing demo button",
          quotaAvailable: "Firestore available, disabling demo mode and enabling HTMX requests",
          spinnerHidden: "Hidden spinner for",
          spinnerShown: "Shown spinner for",
          contentLoaded: "content already loaded",
          cacheSaved: "Saved demo data cache to localStorage",
          cacheLoaded: "Loaded demo data cache from localStorage",
          noCache: "No demo data cache found in localStorage",
          quotaStatus: "Checking quota status...",
          quotaResponse: "Quota status response:",
          showingDemoButton: "Showing demo button",
          liveDataDetected: "Live data detected, disabling demo mode"
        },

        // Layout messages
        layout: {
          v1Page: "V1 page",
          v2Page: "V2 page",
          columnDistribution: "Column distribution",
          itemDistribution: "Item distribution",
          responsiveLayout: "Responsive layout"
        },

        // Validation messages
        validation: {
          invalidItem: "Invalid item data",
          missingName: "Item name is required",
          missingStatus: "Item status is required",
          invalidArray: "Items must be an array"
        },

        // Container IDs
        containers: {
          dataList: "dataList",
          statusItems: "statusItems", 
          statsCards: "statsCards",
          spinner: "spinner",
          loadingSpinner: "loading-spinner",
          statsLoadingSpinner: "stats-loading-spinner"
        },

        // Event names
        events: {
          showDemoButton: "showDemoButton",
          demoModeChanged: "demoModeChanged",
          htmxTrigger: "htmx:trigger",
          htmxAfterRequest: "htmx:afterRequest",
          htmxAfterSwap: "htmx:afterSwap"
        },

        // Storage keys
        storage: {
          demoMode: "demoMode",
          demoDataCache: "demoDataCache"
        },

        // Timing
        timing: {
          resizeDelay: 250,
          spinnerHideDelay: 50,
          cacheSaveDelay: 100
        }
      },

      // Homepage-specific strings
      homepage: {
        // Page content
        content: {
          title: "The Blacklist",
          description: "HTMX, Express, & Firestore",
          altText: "The Blacklist",
          posterCaption: "The Blacklist Poster 1",
          greeting: "Hello"
        },

        // Image gallery
        gallery: {
          baseUrl: "https://ik.imagekit.io/ivw8jbdbt/TBLX/",
          totalImages: 10,
          firstImages: 10,
          imageExtension: ".jpg",
          avifExtension: ".avif"
        },

        // GSAP animation
        animation: {
          titleText: "The Blacklist",
          linkText: "The Blacklist",
          linkHref: "/list"
        },

        // Schema.org markup
        schema: {
          imageObject: "https://schema.org/ImageObject",
          contentUrl: "contentUrl",
          url: "url",
          caption: "caption"
        },

        // Meta tags
        meta: {
          charset: "utf-8",
          viewport: "width=device-width, initial-scale=1",
          description: "HTMX, Express, & Firestore",
          title: "The Blacklist"
        },

        // CSS classes
        classes: {
          home: "home",
          wrapper: "wrapper",
          items: "items",
          item: "item",
          overlay: "overlay",
          title: "title",
          link: "link"
        },

        // Image sources
        images: {
          poster1: "/assets/images/posters/1.jpg",
          poster1Avif: "/assets/images/posters/1.avif",
          favicon: "/assets/favicon.ico"
        },

        // External resources
        external: {
          gsap: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
          scrollTrigger: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js",
          googleAnalytics: "https://www.googletagmanager.com/gtag/js?id=G-6WCN3QXN8W"
        },

        // Google Analytics
        analytics: {
          trackingId: "G-6WCN3QXN8W",
          dataLayer: "dataLayer",
          gtagFunction: "gtag"
        },

        // Scripts
        scripts: {
          gsapScript: "/js/gsap/script.js"
        },

        // Gallery functions
        galleryFunctions: {
          getRandomIndex: "getRandomIndex",
          populateGallery: "populateGallery",
          max: "max",
          imageCount: "imageCount"
        },

        // Console messages
        console: {
          galleryPopulated: "Gallery populated with images",
          randomIndexGenerated: "Random index generated",
          imageLoaded: "Image loaded successfully"
        },

        // Error messages
        errors: {
          imageLoadFailed: "Failed to load image",
          galleryError: "Gallery population error",
          scriptLoadFailed: "Script failed to load"
        },

        // Success messages
        success: {
          galleryReady: "Gallery ready",
          imagesLoaded: "Images loaded successfully",
          animationReady: "Animation ready"
        }
      }
    };
    
    this.currentLanguage = 'en';
    this.customOverrides = {};
  }

  /**
   * Get a string value with fallback support
   * @param {string} path - Dot notation path (e.g., 'loading.items')
   * @param {object} options - Options for string retrieval
   * @returns {string} The string value
   */
  get(path, options = {}) {
    const {
      fallback = true,
      attributes = false,
      custom = null,
      variables = {}
    } = options;

    // Check for custom override first
    if (custom && this.customOverrides[custom]) {
      const customValue = this.getNestedValue(this.customOverrides[custom], path);
      if (customValue) {
        return this.processString(customValue, variables);
      }
    }

    // Get primary value
    let value = this.getNestedValue(this.schema, path);
    
    // Use fallback if primary value not found or if fallback is explicitly requested
    if (!value && fallback) {
      value = this.getNestedValue(this.schema.fallbacks, path);
    }

    // If still no value, return a generic fallback
    if (!value) {
      value = this.getGenericFallback(path);
    }

    // Process the string (replace variables, etc.)
    const processedValue = this.processString(value, variables);

    // Return attributes if requested
    if (attributes) {
      return {
        text: processedValue,
        attributes: this.getAttributesForPath(path)
      };
    }

    return processedValue;
  }

  /**
   * Get nested value from object using dot notation
   * @param {object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} The nested value or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Process string with variable replacement
   * @param {string} str - String to process
   * @param {object} variables - Variables to replace
   * @returns {string} Processed string
   */
  processString(str, variables = {}) {
    if (typeof str !== 'string') return str;
    
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Get attributes for a specific path
   * @param {string} path - Dot notation path
   * @returns {object} Attributes object
   */
  getAttributesForPath(path) {
    const pathParts = path.split('.');
    const category = pathParts[0];
    
    // Map categories to attribute types
    const attributeMap = {
      'loading': 'loading',
      'errors': 'error',
      'status': 'quota',
      'buttons': 'button',
      'titles': 'title',
      'descriptions': 'description'
    };

    const attributeType = attributeMap[category] || 'default';
    return this.schema.attributes[attributeType] || {};
  }

  /**
   * Get generic fallback based on path
   * @param {string} path - Dot notation path
   * @returns {string} Generic fallback string
   */
  getGenericFallback(path) {
    const pathParts = path.split('.');
    const category = pathParts[0];
    const key = pathParts[1];

    const genericFallbacks = {
      'loading': 'Loading...',
      'errors': 'Error occurred',
      'status': 'Status unknown',
      'buttons': 'Button',
      'titles': 'Page',
      'descriptions': 'Description'
    };

    return genericFallbacks[category] || 'Unknown';
  }

  /**
   * Set custom override for a specific path
   * @param {string} path - Dot notation path
   * @param {string} value - Custom value
   * @param {string} namespace - Namespace for the override
   */
  setOverride(path, value, namespace = 'default') {
    if (!this.customOverrides[namespace]) {
      this.customOverrides[namespace] = {};
    }
    
    this.setNestedValue(this.customOverrides[namespace], path, value);
  }

  /**
   * Set nested value in object using dot notation
   * @param {object} obj - Object to modify
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get all strings for a category
   * @param {string} category - Category name
   * @returns {object} All strings in the category
   */
  getCategory(category) {
    return this.schema[category] || {};
  }

  /**
   * Update multiple strings at once
   * @param {object} updates - Object with path-value pairs
   * @param {string} namespace - Namespace for the updates
   */
  updateStrings(updates, namespace = 'default') {
    Object.entries(updates).forEach(([path, value]) => {
      this.setOverride(path, value, namespace);
    });
  }

  /**
   * Get string with HTML attributes
   * @param {string} path - Dot notation path
   * @param {object} options - Options
   * @returns {object} Object with text and attributes
   */
  getWithAttributes(path, options = {}) {
    return this.get(path, { ...options, attributes: true });
  }

  /**
   * Create HTML element with string and attributes
   * @param {string} path - Dot notation path
   * @param {string} tag - HTML tag name
   * @param {object} options - Options
   * @returns {string} HTML string
   */
  createElement(path, tag = 'span', options = {}) {
    const { text, attributes } = this.getWithAttributes(path, options);
    
    const attrs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    return `<${tag} ${attrs}>${text}</${tag}>`;
  }

  /**
   * Get loading message for specific context
   * @param {string} context - Context (items, statistics, charts, etc.)
   * @param {object} options - Options
   * @returns {string} Loading message
   */
  getLoadingMessage(context = 'items', options = {}) {
    return this.get(`loading.${context}`, options);
  }

  /**
   * Get error message for specific context
   * @param {string} context - Context (network, quota, timeout, etc.)
   * @param {object} options - Options
   * @returns {string} Error message
   */
  getErrorMessage(context = 'generic', options = {}) {
    return this.get(`errors.${context}`, options);
  }

  /**
   * Get status message for specific context
   * @param {string} context - Context (quotaExceeded, demoMode, etc.)
   * @param {object} options - Options
   * @returns {string} Status message
   */
  getStatusMessage(context = 'quotaExceeded', options = {}) {
    return this.get(`status.${context}`, options);
  }

  /**
   * Get button label for specific context
   * @param {string} context - Context (loadDemo, cancel, retry, etc.)
   * @param {object} options - Options
   * @returns {string} Button label
   */
  getButtonLabel(context = 'loadDemo', options = {}) {
    return this.get(`buttons.${context}`, options);
  }

  /**
   * Get page title for specific context
   * @param {string} context - Context (home, list, stats, etc.)
   * @param {object} options - Options
   * @returns {string} Page title
   */
  getPageTitle(context = 'home', options = {}) {
    return this.get(`titles.${context}`, options);
  }

  /**
   * Get chart title for specific context
   * @param {string} context - Context (categoryDistribution, statusDistribution, etc.)
   * @param {object} options - Options
   * @returns {string} Chart title
   */
  getChartTitle(context = 'categoryDistribution', options = {}) {
    return this.get(`chartTitles.${context}`, options);
  }

  /**
   * Get loading message for specific context
   * @param {string} context - Context (items, statistics, charts, etc.)
   * @param {object} options - Options
   * @returns {string} Loading message
   */
  getLoadingMessage(context = 'items', options = {}) {
    return this.get(`loading.${context}`, options);
  }

  /**
   * Get description for specific context
   * @param {string} context - Context (home, list, stats, etc.)
   * @param {object} options - Options
   * @returns {string} Description
   */
  getDescription(context = 'home', options = {}) {
    return this.get(`descriptions.${context}`, options);
  }

  // Admin-specific helper methods

  /**
   * Get admin form label
   * @param {string} field - Field name (name, status, category, etc.)
   * @param {object} options - Options
   * @returns {string} Form label
   */
  getAdminFormLabel(field = 'name', options = {}) {
    return this.get(`admin.formLabels.${field}`, options);
  }

  /**
   * Get admin form placeholder
   * @param {string} field - Field name (name, email, password, etc.)
   * @param {object} options - Options
   * @returns {string} Form placeholder
   */
  getAdminPlaceholder(field = 'name', options = {}) {
    return this.get(`admin.placeholders.${field}`, options);
  }

  /**
   * Get admin validation message
   * @param {string} type - Validation type (required, email, password, etc.)
   * @param {object} options - Options
   * @returns {string} Validation message
   */
  getAdminValidationMessage(type = 'required', options = {}) {
    return this.get(`admin.validation.${type}`, options);
  }

  /**
   * Get admin success message
   * @param {string} action - Action type (login, create, update, etc.)
   * @param {object} options - Options
   * @returns {string} Success message
   */
  getAdminSuccessMessage(action = 'login', options = {}) {
    return this.get(`admin.success.${action}`, options);
  }

  /**
   * Get admin error message
   * @param {string} type - Error type (login, unauthorized, notFound, etc.)
   * @param {object} options - Options
   * @returns {string} Error message
   */
  getAdminErrorMessage(type = 'login', options = {}) {
    return this.get(`admin.errors.${type}`, options);
  }

  /**
   * Get admin table header
   * @param {string} column - Column name (id, name, status, etc.)
   * @param {object} options - Options
   * @returns {string} Table header
   */
  getAdminTableHeader(column = 'id', options = {}) {
    return this.get(`admin.tableHeaders.${column}`, options);
  }

  /**
   * Get admin navigation item
   * @param {string} item - Navigation item (dashboard, data, users, etc.)
   * @param {object} options - Options
   * @returns {string} Navigation label
   */
  getAdminNavigationItem(item = 'dashboard', options = {}) {
    return this.get(`admin.navigation.${item}`, options);
  }

  /**
   * Get admin status option
   * @param {string} status - Status value (deceased, active, etc.)
   * @param {object} options - Options
   * @returns {string} Status label
   */
  getAdminStatusOption(status = 'active', options = {}) {
    return this.get(`admin.statusOptions.${status}`, options);
  }

  /**
   * Get admin category option
   * @param {string} category - Category value (Male, Female, etc.)
   * @param {object} options - Options
   * @returns {string} Category label
   */
  getAdminCategoryOption(category = 'Male', options = {}) {
    return this.get(`admin.categoryOptions.${category}`, options);
  }

  /**
   * Get admin role option
   * @param {string} role - Role value (super_admin, admin, etc.)
   * @param {object} options - Options
   * @returns {string} Role label
   */
  getAdminRoleOption(role = 'admin', options = {}) {
    return this.get(`admin.roleOptions.${role}`, options);
  }

  /**
   * Get admin permission option
   * @param {string} permission - Permission value (read, create, etc.)
   * @param {object} options - Options
   * @returns {string} Permission label
   */
  getAdminPermissionOption(permission = 'read', options = {}) {
    return this.get(`admin.permissionOptions.${permission}`, options);
  }

  /**
   * Get admin bulk operation label
   * @param {string} operation - Operation type (update, delete, etc.)
   * @param {object} options - Options
   * @returns {string} Operation label
   */
  getAdminBulkOperation(operation = 'update', options = {}) {
    return this.get(`admin.bulkOperations.${operation}`, options);
  }

  /**
   * Get admin file operation label
   * @param {string} operation - Operation type (import, export, etc.)
   * @param {object} options - Options
   * @returns {string} Operation label
   */
  getAdminFileOperation(operation = 'import', options = {}) {
    return this.get(`admin.fileOperations.${operation}`, options);
  }

  /**
   * Get admin pagination label
   * @param {string} label - Label type (previous, next, page, etc.)
   * @param {object} options - Options
   * @returns {string} Pagination label
   */
  getAdminPaginationLabel(label = 'previous', options = {}) {
    return this.get(`admin.pagination.${label}`, options);
  }

  /**
   * Get admin filter option
   * @param {string} filter - Filter type (all, active, today, etc.)
   * @param {object} options - Options
   * @returns {string} Filter label
   */
  getAdminFilterOption(filter = 'all', options = {}) {
    return this.get(`admin.filters.${filter}`, options);
  }

  /**
   * Get admin sort option
   * @param {string} field - Sort field (name, status, createdAt, etc.)
   * @param {object} options - Options
   * @returns {string} Sort option label
   */
  getAdminSortOption(field = 'name', options = {}) {
    return this.get(`admin.sortOptions.${field}`, options);
  }

  /**
   * Get admin sort order
   * @param {string} order - Sort order (asc, desc)
   * @param {object} options - Options
   * @returns {string} Sort order label
   */
  getAdminSortOrder(order = 'asc', options = {}) {
    return this.get(`admin.sortOrders.${order}`, options);
  }

  // List-specific helper methods

  /**
   * Get list item rendering string
   * @param {string} type - Type (unknown, guidePrefix, guideSeparator, etc.)
   * @param {object} options - Options
   * @returns {string} Item rendering string
   */
  getListItemRendering(type = 'unknown', options = {}) {
    return this.get(`list.itemRendering.${type}`, options);
  }

  /**
   * Get list column layout string
   * @param {string} layout - Layout type (largeDesktop, desktop, mobile, etc.)
   * @param {object} options - Options
   * @returns {string} Column layout string
   */
  getListColumnLayout(layout = 'largeDesktop', options = {}) {
    return this.get(`list.columnLayout.${layout}`, options);
  }

  /**
   * Get list breakpoint value
   * @param {string} breakpoint - Breakpoint type (largeDesktop, desktop, mobile, etc.)
   * @param {object} options - Options
   * @returns {number} Breakpoint value
   */
  getListBreakpoint(breakpoint = 'largeDesktop', options = {}) {
    return this.get(`list.breakpoints.${breakpoint}`, options);
  }

  /**
   * Get list demo mode message
   * @param {string} type - Message type (active, loading, enabled, etc.)
   * @param {object} options - Options
   * @returns {string} Demo mode message
   */
  getListDemoModeMessage(type = 'active', options = {}) {
    return this.get(`list.demoMode.${type}`, options);
  }

  /**
   * Get list HTMX message
   * @param {string} type - Message type (disabling, enabling, elements, etc.)
   * @param {object} options - Options
   * @returns {string} HTMX message
   */
  getListHtmxMessage(type = 'disabling', options = {}) {
    return this.get(`list.htmx.${type}`, options);
  }

  /**
   * Get list error message
   * @param {string} type - Error type (jsonParse, quotaCheck, cacheSave, etc.)
   * @param {object} options - Options
   * @returns {string} Error message
   */
  getListErrorMessage(type = 'jsonParse', options = {}) {
    return this.get(`list.errors.${type}`, options);
  }

  /**
   * Get list success message
   * @param {string} type - Success type (cacheSaved, cacheLoaded, dataLoaded, etc.)
   * @param {object} options - Options
   * @returns {string} Success message
   */
  getListSuccessMessage(type = 'cacheSaved', options = {}) {
    return this.get(`list.success.${type}`, options);
  }

  /**
   * Get list console message
   * @param {string} type - Console message type (demoModeEnabled, quotaExceeded, etc.)
   * @param {object} options - Options
   * @returns {string} Console message
   */
  getListConsoleMessage(type = 'demoModeEnabled', options = {}) {
    return this.get(`list.console.${type}`, options);
  }

  /**
   * Get list layout message
   * @param {string} type - Layout type (v1Page, v2Page, columnDistribution, etc.)
   * @param {object} options - Options
   * @returns {string} Layout message
   */
  getListLayoutMessage(type = 'v1Page', options = {}) {
    return this.get(`list.layout.${type}`, options);
  }

  /**
   * Get list validation message
   * @param {string} type - Validation type (invalidItem, missingName, etc.)
   * @param {object} options - Options
   * @returns {string} Validation message
   */
  getListValidationMessage(type = 'invalidItem', options = {}) {
    return this.get(`list.validation.${type}`, options);
  }

  /**
   * Get list container ID
   * @param {string} container - Container type (dataList, statusItems, etc.)
   * @param {object} options - Options
   * @returns {string} Container ID
   */
  getListContainerId(container = 'dataList', options = {}) {
    return this.get(`list.containers.${container}`, options);
  }

  /**
   * Get list event name
   * @param {string} event - Event type (showDemoButton, demoModeChanged, etc.)
   * @param {object} options - Options
   * @returns {string} Event name
   */
  getListEventName(event = 'showDemoButton', options = {}) {
    return this.get(`list.events.${event}`, options);
  }

  /**
   * Get list storage key
   * @param {string} key - Storage key type (demoMode, demoDataCache)
   * @param {object} options - Options
   * @returns {string} Storage key
   */
  getListStorageKey(key = 'demoMode', options = {}) {
    return this.get(`list.storage.${key}`, options);
  }

  /**
   * Get list timing value
   * @param {string} timing - Timing type (resizeDelay, spinnerHideDelay, etc.)
   * @param {object} options - Options
   * @returns {number} Timing value
   */
  getListTimingValue(timing = 'resizeDelay', options = {}) {
    return this.get(`list.timing.${timing}`, options);
  }

  // Homepage-specific helper methods

  /**
   * Get homepage content string
   * @param {string} type - Content type (title, description, altText, etc.)
   * @param {object} options - Options
   * @returns {string} Content string
   */
  getHomepageContent(type = 'title', options = {}) {
    return this.get(`homepage.content.${type}`, options);
  }

  /**
   * Get homepage gallery configuration
   * @param {string} config - Config type (baseUrl, totalImages, firstImages, etc.)
   * @param {object} options - Options
   * @returns {string|number} Gallery configuration
   */
  getHomepageGalleryConfig(config = 'baseUrl', options = {}) {
    return this.get(`homepage.gallery.${config}`, options);
  }

  /**
   * Get homepage animation string
   * @param {string} type - Animation type (titleText, linkText, linkHref)
   * @param {object} options - Options
   * @returns {string} Animation string
   */
  getHomepageAnimation(type = 'titleText', options = {}) {
    return this.get(`homepage.animation.${type}`, options);
  }

  /**
   * Get homepage schema string
   * @param {string} type - Schema type (imageObject, contentUrl, url, caption)
   * @param {object} options - Options
   * @returns {string} Schema string
   */
  getHomepageSchema(type = 'imageObject', options = {}) {
    return this.get(`homepage.schema.${type}`, options);
  }

  /**
   * Get homepage meta tag value
   * @param {string} meta - Meta type (charset, viewport, description, title)
   * @param {object} options - Options
   * @returns {string} Meta tag value
   */
  getHomepageMeta(meta = 'charset', options = {}) {
    return this.get(`homepage.meta.${meta}`, options);
  }

  /**
   * Get homepage CSS class
   * @param {string} className - Class type (home, wrapper, items, etc.)
   * @param {object} options - Options
   * @returns {string} CSS class name
   */
  getHomepageClass(className = 'home', options = {}) {
    return this.get(`homepage.classes.${className}`, options);
  }

  /**
   * Get homepage image source
   * @param {string} image - Image type (poster1, poster1Avif, favicon)
   * @param {object} options - Options
   * @returns {string} Image source path
   */
  getHomepageImage(image = 'poster1', options = {}) {
    return this.get(`homepage.images.${image}`, options);
  }

  /**
   * Get homepage external resource URL
   * @param {string} resource - Resource type (gsap, scrollTrigger, googleAnalytics)
   * @param {object} options - Options
   * @returns {string} External resource URL
   */
  getHomepageExternalResource(resource = 'gsap', options = {}) {
    return this.get(`homepage.external.${resource}`, options);
  }

  /**
   * Get homepage analytics configuration
   * @param {string} config - Config type (trackingId, dataLayer, gtagFunction)
   * @param {object} options - Options
   * @returns {string} Analytics configuration
   */
  getHomepageAnalytics(config = 'trackingId', options = {}) {
    return this.get(`homepage.analytics.${config}`, options);
  }

  /**
   * Get homepage script path
   * @param {string} script - Script type (gsapScript)
   * @param {object} options - Options
   * @returns {string} Script path
   */
  getHomepageScript(script = 'gsapScript', options = {}) {
    return this.get(`homepage.scripts.${script}`, options);
  }

  /**
   * Get homepage gallery function name
   * @param {string} functionName - Function type (getRandomIndex, populateGallery, etc.)
   * @param {object} options - Options
   * @returns {string} Function name
   */
  getHomepageGalleryFunction(functionName = 'getRandomIndex', options = {}) {
    return this.get(`homepage.galleryFunctions.${functionName}`, options);
  }

  /**
   * Get homepage console message
   * @param {string} message - Message type (galleryPopulated, randomIndexGenerated, etc.)
   * @param {object} options - Options
   * @returns {string} Console message
   */
  getHomepageConsoleMessage(message = 'galleryPopulated', options = {}) {
    return this.get(`homepage.console.${message}`, options);
  }

  /**
   * Get homepage error message
   * @param {string} error - Error type (imageLoadFailed, galleryError, etc.)
   * @param {object} options - Options
   * @returns {string} Error message
   */
  getHomepageErrorMessage(error = 'imageLoadFailed', options = {}) {
    return this.get(`homepage.errors.${error}`, options);
  }

  /**
   * Get homepage success message
   * @param {string} success - Success type (galleryReady, imagesLoaded, etc.)
   * @param {object} options - Options
   * @returns {string} Success message
   */
  getHomepageSuccessMessage(success = 'galleryReady', options = {}) {
    return this.get(`homepage.success.${success}`, options);
  }
}

// Create global instance
window.StringSchema = new StringSchema();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StringSchema;
}
