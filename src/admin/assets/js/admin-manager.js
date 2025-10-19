class AdminManager {
  constructor() {
    this.items = [];
    this.filteredItems = [];
    this.selectedItems = new Set();
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.currentView = 'list';
    this.gridColumns = 3; // Default grid columns
    this.pendingChanges = new Map();
    this.autoSaveTimeout = null;
    this.searchQuery = '';
    this.filters = {
      status: '',
      category: '',
      v1Range: ''
    };
    this.sortField = 'v1';
    this.sortOrder = 'asc';
    this.debugMode = false;
    this.performanceMetrics = {
      loadStart: null,
      loadEnd: null,
      renderStart: null,
      renderEnd: null,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  init() {
    console.log('Admin Manager: Initializing...');
    this.setupEventListeners();
    this.loadAllItems();
    this.updateDashboardStats(); // Load dashboard stats on init
    this.checkQuotaStatus(); // Check quota status on init
    this.startAutoSave();
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.updateSearchButtons();
        this.debounceSearch();
      });
    }

    // Filter controls
    const filterStatus = document.getElementById('filter-status');
    const filterCategory = document.getElementById('filter-category');
    const filterV1Range = document.getElementById('filter-v1-range');

    if (filterStatus) filterStatus.addEventListener('change', () => this.updateFilters());
    if (filterCategory) filterCategory.addEventListener('change', () => this.updateFilters());
    if (filterV1Range) filterV1Range.addEventListener('change', () => this.updateFilters());

    // Item editor form
    const itemEditorForm = document.getElementById('item-editor-form');
    if (itemEditorForm) {
      itemEditorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveItemChanges();
      });
    }

    // Auto-save on form changes
    const formInputs = document.querySelectorAll('#item-editor-form input, #item-editor-form select');
    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.scheduleAutoSave();
      });
    });
  }

  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchItems();
    }, 300);
  }

  updateFilters() {
    this.filters = {
      status: document.getElementById('filter-status')?.value || '',
      category: document.getElementById('filter-category')?.value || '',
      v1Range: document.getElementById('filter-v1-range')?.value || ''
    };
    this.applyFilters();
  }

  async loadAllItems() {
    try {
      console.log('Admin Manager: Loading all items...');
      const response = await fetch('/admin/api/items');
      if (response.ok) {
        this.items = await response.json();
        this.filteredItems = [...this.items];
        this.sortItems();
        this.renderItems();
        this.updateStats();
        this.updateDashboardStats();
        console.log(`Admin Manager: Loaded ${this.items.length} items`);
      } else {
        throw new Error('Failed to load items');
      }
    } catch (error) {
      console.error('Admin Manager: Error loading items:', error);
      this.showError('Failed to load items: ' + error.message);
    }
  }

  async updateDashboardStats() {
    try {
      const response = await fetch('/admin/api/stats');
      if (response.ok) {
        const stats = await response.json();
        
        // Update dashboard stats
        const totalItemsEl = document.getElementById('total-items');
        if (totalItemsEl) {
          totalItemsEl.textContent = stats.total;
        }
        
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
          const updateTime = new Date(stats.lastUpdated);
          lastUpdatedEl.textContent = updateTime.toLocaleTimeString();
        }
        
        // Update status distribution - handled by admin-dashboard-charts.js
        // this.updateStatusChart(stats.byStatus);
        
        console.log('Admin Manager: Dashboard stats updated');
      }
    } catch (error) {
      console.error('Admin Manager: Error updating dashboard stats:', error);
    }
  }

  // Status chart is now handled by admin-dashboard-charts.js
  // updateStatusChart(statusData) {
  //   const chartContainer = document.getElementById('status-chart');
  //   if (!chartContainer) return;

  //   const chartHtml = Object.entries(statusData)
  //     .map(([status, count]) => `
  //       <div class="status-item">
  //         <span class="status-badge status-${status}">${status.toUpperCase()}</span>
  //         <span class="status-count">${count}</span>
  //       </div>
  //     `).join('');

  //   chartContainer.innerHTML = chartHtml;
  // }

  async searchItems() {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => 
        item.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.status?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.id?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    this.sortItems();
    this.currentPage = 1;
    this.renderItems();
    this.updateSearchButtons();
  }

  clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
      this.searchQuery = '';
      this.searchItems();
    }
  }

  updateSearchButtons() {
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) {
      clearBtn.style.display = this.searchQuery.trim() ? 'flex' : 'none';
    }
  }

  applyFilters() {
    this.filteredItems = this.items.filter(item => {
      let matches = true;

      if (this.filters.status && item.status !== this.filters.status) {
        matches = false;
      }

      if (this.filters.category && item.category !== this.filters.category) {
        matches = false;
      }

      if (this.filters.v1Range) {
        const [min, max] = this.filters.v1Range.split('-').map(Number);
        if (item.v1 < min || item.v1 > max) {
          matches = false;
        }
      }

      return matches;
    });

    this.sortItems();
    this.currentPage = 1;
    this.renderItems();
  }

  sortItems() {
    this.filteredItems.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      // Handle numeric fields
      if (this.sortField === 'v1' || this.sortField === 'v2') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  setSort(field) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.sortItems();
    this.renderItems();
    this.updateSortIndicators();
  }

  updateSortIndicators() {
    // Remove existing sort indicators
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
      indicator.remove();
    });

    // Add sort indicator to current field
    const header = document.querySelector(`[data-sort="${this.sortField}"]`);
    if (header) {
      const indicator = document.createElement('span');
      indicator.className = 'sort-indicator';
      indicator.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
      indicator.style.marginLeft = '5px';
      indicator.style.color = '#FE0000';
      header.appendChild(indicator);
    }
  }

  setView(view) {
    this.currentView = view;
    
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Show/hide grid controls
    const gridControls = document.getElementById('grid-controls');
    if (gridControls) {
      gridControls.style.display = view === 'grid' ? 'flex' : 'none';
    }
    
    // Show/hide header row
    const headerRow = document.querySelector('.items-header-row');
    if (headerRow) {
      headerRow.style.display = view === 'list' ? 'grid' : 'none';
    }

    this.renderItems();
  }

  setGridColumns(columns) {
    this.gridColumns = parseInt(columns);
    this.renderItems();
  }

  renderItems() {
    const container = document.getElementById('items-list') || document.getElementById('batch-items-list');
    if (!container) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageItems = this.filteredItems.slice(startIndex, endIndex);

    if (pageItems.length === 0) {
      container.innerHTML = '<div class="no-items">No items found</div>';
      return;
    }

    // Update container classes based on view
    if (this.currentView === 'grid') {
      container.classList.add('grid-view');
      // Remove all existing grid column classes first
      container.classList.remove('grid-2-cols', 'grid-3-cols', 'grid-4-cols');
      // Add the current grid column class
      container.classList.add(`grid-${this.gridColumns}-cols`);
      console.log(`Admin Manager: Applied grid classes - grid-view, grid-${this.gridColumns}-cols`);
      console.log(`Admin Manager: Container classes:`, container.className);
    } else {
      container.classList.remove('grid-view');
      container.classList.remove('grid-2-cols', 'grid-3-cols', 'grid-4-cols');
    }

    let html = '';
    pageItems.forEach(item => {
      html += this.renderItem(item);
    });

    container.innerHTML = html;
    this.updatePagination();
  }

  renderItem(item) {
    const isSelected = this.selectedItems.has(item.id);
    const hasChanges = this.pendingChanges.has(item.id);

    if (this.currentView === 'grid') {
      return `
        <div class="item-row grid-item ${isSelected ? 'selected' : ''} ${hasChanges ? 'has-changes' : ''}" data-id="${item.id}">
          <div class="item-checkbox">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="window.AdminManager.toggleSelection('${item.id}')" disabled>
          </div>
          <div class="item-name">${item.name || 'Unnamed'}</div>
          <div class="item-status">
            <span class="item-row-status status-${item.status}">${item.status.toUpperCase()}</span>
          </div>
          <div class="item-actions">
            <button class="action-btn" onclick="window.AdminManager.editItem('${item.id}')">
              <i class="icon-edit"></i> Edit
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="item-row ${isSelected ? 'selected' : ''} ${hasChanges ? 'has-changes' : ''}" data-id="${item.id}">
          <div class="item-name">${item.name || 'Unnamed'}</div>
          <div class="item-status">
            <span class="item-row-status status-${item.status}">${item.status.toUpperCase()}</span>
          </div>
          <div class="item-category">${item.category || 'Unknown'}</div>
          <div class="item-v1">${item.v1 || 0}</div>
          <div class="item-v2">${item.v2 || 0}</div>
          <div class="item-actions">
            <button class="action-btn" onclick="window.AdminManager.editItem('${item.id}')">
              <i class="icon-edit"></i> Edit
            </button>
          </div>
        </div>
      `;
    }
  }

  toggleSelection(itemId) {
    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.add(itemId);
    }
    this.updateSelectionCount();
    this.renderItems();
  }

  selectAll() {
    const visibleItems = this.getVisibleItems();
    visibleItems.forEach(item => this.selectedItems.add(item.id));
    this.updateSelectionCount();
    this.renderItems();
  }

  clearSelection() {
    this.selectedItems.clear();
    this.updateSelectionCount();
    this.renderItems();
  }

  getVisibleItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  updateSelectionCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
      countElement.textContent = `${this.selectedItems.size} items selected`;
    }
  }

  editItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    // Populate form
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name || '';
    document.getElementById('edit-item-status').value = item.status || '';
    document.getElementById('edit-item-category').value = item.category || '';
    document.getElementById('edit-item-v1').value = item.v1 || '';
    document.getElementById('edit-item-v2').value = item.v2 || '';

    // Show modal
    document.getElementById('item-editor-modal').style.display = 'flex';
  }

  closeItemEditor() {
    document.getElementById('item-editor-modal').style.display = 'none';
    this.clearAutoSave();
  }

  async saveItemChanges() {
    const itemId = document.getElementById('edit-item-id').value;
    
    // Get form values and validate
    const name = document.getElementById('edit-item-name').value.trim();
    const status = document.getElementById('edit-item-status').value;
    const category = document.getElementById('edit-item-category').value;
    const v1Value = document.getElementById('edit-item-v1').value;
    const v2Value = document.getElementById('edit-item-v2').value;
    
        // Validate required fields
        if (!status) {
          this.showError('Status is required');
          return;
        }
        
        if (!category) {
          this.showError('Category is required');
          return;
        }
    
    // Parse and validate numbers
    const v1 = parseInt(v1Value);
    const v2 = parseInt(v2Value);
    
    if (isNaN(v1) || v1 < 0 || v1 > 200) {
      this.showError('V1 must be a number between 0 and 200');
      return;
    }
    
        if (isNaN(v2) || v2 < 0 || v2 > 200) {
          this.showError('V2 must be a number between 0 and 200');
          return;
        }
        
        const updateData = {
          status: status,
          category: category,
          v1: v1,
          v2: v2
        };
        
        // Only include name if it's not empty
        if (name && name.trim()) {
          updateData.name = name.trim();
        }

    try {
      const response = await fetch(`/admin/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showSuccess('Item updated successfully');
          this.closeItemEditor();
          this.loadAllItems();
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('Failed to update item');
      }
    } catch (error) {
      console.error('Admin Manager: Error saving item:', error);
      this.showError('Failed to save item: ' + error.message);
    }
  }

  scheduleAutoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.autoSave();
    }, 2000);
  }

  async autoSave() {
    const itemId = document.getElementById('edit-item-id')?.value;
    if (!itemId) return;

    // Get form values
    const name = document.getElementById('edit-item-name')?.value?.trim();
    const status = document.getElementById('edit-item-status')?.value;
    const category = document.getElementById('edit-item-category')?.value;
    const v1Value = document.getElementById('edit-item-v1')?.value;
    const v2Value = document.getElementById('edit-item-v2')?.value;
    
        // Only auto-save if we have valid data
        if (!status || !category) return;
    
    // Parse numbers safely
    const v1 = parseInt(v1Value);
    const v2 = parseInt(v2Value);
    
    if (isNaN(v1) || isNaN(v2)) return;

        const updateData = {
          status: status,
          category: category,
          v1: v1,
          v2: v2
        };
        
        // Only include name if it's not empty
        if (name && name.trim()) {
          updateData.name = name.trim();
        }

    try {
      const response = await fetch(`/admin/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        console.log('Admin Manager: Auto-saved item', itemId);
        this.pendingChanges.delete(itemId);
        this.renderItems();
      }
    } catch (error) {
      console.error('Admin Manager: Auto-save failed:', error);
    }
  }

  clearAutoSave() {
    clearTimeout(this.autoSaveTimeout);
  }

  startAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
      if (this.pendingChanges.size > 0) {
        this.savePendingChanges();
      }
    }, 30000);
  }

  async savePendingChanges() {
    if (this.pendingChanges.size === 0) return;

    const updates = Array.from(this.pendingChanges.entries()).map(([id, data]) => ({
      id,
      data
    }));

    try {
      const response = await fetch('/admin/api/items/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Admin Manager: Batch saved pending changes');
          this.pendingChanges.clear();
          this.loadAllItems();
        }
      }
    } catch (error) {
      console.error('Admin Manager: Batch save failed:', error);
    }
  }

  // Batch operations
  async batchUpdateStatus() {
    const newStatus = document.getElementById('batch-status').value;
    if (!newStatus || this.selectedItems.size === 0) return;

    await this.batchUpdate('status', newStatus);
  }

  async batchUpdateCategory() {
    const newCategory = document.getElementById('batch-category').value;
    if (!newCategory || this.selectedItems.size === 0) return;

    await this.batchUpdate('category', newCategory);
  }

  async batchUpdateV1() {
    const offset = parseInt(document.getElementById('batch-v1-offset').value);
    if (isNaN(offset) || this.selectedItems.size === 0) return;

    await this.batchUpdate('v1', offset, true);
  }

  async batchUpdateV2() {
    const offset = parseInt(document.getElementById('batch-v2-offset').value);
    if (isNaN(offset) || this.selectedItems.size === 0) return;

    await this.batchUpdate('v2', offset, true);
  }

  async batchUpdate(field, value, isOffset = false) {
    const updates = Array.from(this.selectedItems).map(itemId => {
      const item = this.items.find(i => i.id === itemId);
      if (!item) return null;

      const updateData = {};
      if (isOffset) {
        updateData[field] = (item[field] || 0) + value;
      } else {
        updateData[field] = value;
      }

      return { id: itemId, data: updateData };
    }).filter(Boolean);

    if (updates.length === 0) return;

    try {
      this.showBatchProgress(updates.length);
      
      const response = await fetch('/admin/api/items/batch', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showSuccess(`Updated ${updates.length} items successfully`);
          this.clearSelection();
          this.loadAllItems();
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('Failed to batch update items');
      }
    } catch (error) {
      console.error('Admin Manager: Batch update failed:', error);
      this.showError('Batch update failed: ' + error.message);
    } finally {
      this.hideBatchProgress();
    }
  }

  showBatchProgress(totalItems) {
    const modal = document.getElementById('batch-progress-modal');
    const progressFill = document.getElementById('batch-progress-fill');
    const progressText = document.getElementById('batch-progress-text');
    const progressDetails = document.getElementById('batch-progress-details');

    if (modal) {
      modal.style.display = 'flex';
      progressFill.style.width = '0%';
      progressText.textContent = '0% Complete';
      progressDetails.textContent = `Processing ${totalItems} items...`;
    }
  }

  hideBatchProgress() {
    const modal = document.getElementById('batch-progress-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Pagination
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderItems();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderItems();
    }
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    const pageInfo = `Page ${this.currentPage} of ${totalPages}`;
    const totalItemsInfo = `(${this.filteredItems.length} total items)`;
    
    document.querySelectorAll('#page-info, #page-info-bottom').forEach(el => {
      el.textContent = pageInfo;
    });
    
    document.querySelectorAll('#total-items-info, #total-items-info-bottom').forEach(el => {
      el.textContent = totalItemsInfo;
    });

    const prevBtns = document.querySelectorAll('#prev-btn, #prev-btn-bottom');
    const nextBtns = document.querySelectorAll('#next-btn, #next-btn-bottom');

    prevBtns.forEach(btn => {
      btn.disabled = this.currentPage <= 1;
    });

    nextBtns.forEach(btn => {
      btn.disabled = this.currentPage >= totalPages;
    });
  }

  // Utility methods
  async clearCache() {
    try {
      const response = await fetch('/admin/api/clear-cache', {
        method: 'POST'
      });

      if (response.ok) {
        this.showSuccess('Cache cleared successfully');
        this.loadAllItems();
      } else {
        throw new Error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Admin Manager: Error clearing cache:', error);
      this.showError('Failed to clear cache: ' + error.message);
    }
  }

  exportData() {
      const dataStr = JSON.stringify(this.items, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `blacklist-items-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccess('Data exported successfully');
  }

  updateStats() {
    const totalItemsEl = document.getElementById('total-items');
    if (totalItemsEl) {
      totalItemsEl.textContent = this.items.length;
    }

    const itemCountEl = document.getElementById('item-count');
    if (itemCountEl) {
      itemCountEl.textContent = `${this.items.length} items`;
    }

    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = new Date().toLocaleTimeString();
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  async warmCache() {
    try {
      const response = await fetch('/admin/api/warm-cache', {
        method: 'POST'
      });
      
      if (response.ok) {
        this.showSuccess('Cache warmed successfully');
        // Reload data after cache warm
        await this.loadAllItems();
      } else {
        throw new Error('Failed to warm cache');
      }
    } catch (error) {
      console.error('Admin Manager: Error warming cache:', error);
      this.showError('Failed to warm cache: ' + error.message);
    }

  }

  async checkQuotaStatus() {
    try {
      const response = await fetch('/admin/api/quota-status');
      if (response.ok) {
        const data = await response.json();
        if (data.quotaExceeded) {
          this.showQuotaExceededMessage();
        } else {
          this.hideQuotaExceededMessage();
          this.showSuccess('Database quota is within limits');
        }
      } else {
        throw new Error('Failed to check quota status');
      }
    } catch (error) {
      console.error('Admin Manager: Error checking quota status:', error);
      this.showError('Failed to check quota status: ' + error.message);
    }
  }

  showQuotaExceededMessage() {
    const quotaSection = document.getElementById('quota-status-section');
    const quotaCard = document.getElementById('quota-status-card');
    if (quotaSection) {
      quotaSection.style.display = 'block';
    }
    if (quotaCard) {
      quotaCard.style.display = 'block';
    }
  }

  hideQuotaExceededMessage() {
    const quotaSection = document.getElementById('quota-status-section');
    const quotaCard = document.getElementById('quota-status-card');
    if (quotaSection) {
      quotaSection.style.display = 'none';
    }
    if (quotaCard) {
      quotaCard.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    try {
      const response = await fetch('/admin/api/toggle-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ debugMode: this.debugMode })
      });
      
      const result = await response.json();
      console.log('Debug mode toggled:', result.message);
      
      // Update debug button
      const debugBtn = document.getElementById('debug-mode-btn');
      if (debugBtn) {
        debugBtn.innerHTML = this.debugMode ? 
          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
            <path d="M12 3v6"/>
            <path d="M12 15v6"/>
          </svg> Debug ON` :
          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
            <path d="M12 3v6"/>
            <path d="M12 15v6"/>
          </svg> Debug OFF`;
        debugBtn.classList.toggle('active', this.debugMode);
      }
      
      // Show/hide debug panel
      this.toggleDebugPanel();
      
    } catch (error) {
      console.error('Error toggling debug mode:', error);
    }
  }

  toggleDebugPanel() {
    let debugPanel = document.getElementById('debug-panel');
    
    if (!debugPanel) {
      debugPanel = document.createElement('div');
      debugPanel.id = 'debug-panel';
      debugPanel.className = 'debug-panel';
      debugPanel.innerHTML = `
        <div class="debug-header">
          <h3>Debug Information</h3>
          <button onclick="window.AdminManager.closeDebugPanel()" class="debug-close">×</button>
        </div>
        <div class="debug-content">
          <div class="debug-section">
            <h4>Performance Metrics</h4>
            <div id="debug-metrics"></div>
          </div>
          <div class="debug-section">
            <h4>Cache Status</h4>
            <div id="debug-cache"></div>
          </div>
          <div class="debug-section">
            <h4>System Info</h4>
            <div id="debug-system"></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugPanel);
    }
    
    debugPanel.style.display = this.debugMode ? 'block' : 'none';
    
    if (this.debugMode) {
      this.updateDebugInfo();
      // Update debug info every 5 seconds
      this.debugInterval = setInterval(() => this.updateDebugInfo(), 5000);
    } else {
      if (this.debugInterval) {
        clearInterval(this.debugInterval);
        this.debugInterval = null;
      }
    }
  }

  closeDebugPanel() {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      debugPanel.style.display = 'none';
    }
    this.debugMode = false;
    
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
      this.debugInterval = null;
    }
  }

  async updateDebugInfo() {
    try {
      const response = await fetch('/admin/api/debug-mode');
      const debugData = await response.json();
      
      // Update performance metrics
      const metricsEl = document.getElementById('debug-metrics');
      if (metricsEl) {
        metricsEl.innerHTML = `
          <div class="metric-item">
            <span class="metric-label">Load Time:</span>
            <span class="metric-value">${this.performanceMetrics.loadEnd - this.performanceMetrics.loadStart || 0}ms</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Render Time:</span>
            <span class="metric-value">${this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart || 0}ms</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">API Calls:</span>
            <span class="metric-value">${this.performanceMetrics.apiCalls}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Cache Hits:</span>
            <span class="metric-value">${this.performanceMetrics.cacheHits}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Cache Misses:</span>
            <span class="metric-value">${this.performanceMetrics.cacheMisses}</span>
          </div>
        `;
      }
      
      // Update cache status
      const cacheEl = document.getElementById('debug-cache');
      if (cacheEl) {
        cacheEl.innerHTML = `
          <div class="metric-item">
            <span class="metric-label">Master Cache:</span>
            <span class="metric-value ${debugData.metrics.cacheStats.masterCache}">${debugData.metrics.cacheStats.masterCache}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Admin Cache:</span>
            <span class="metric-value ${debugData.metrics.cacheStats.adminCache}">${debugData.metrics.cacheStats.adminCache}</span>
          </div>
        `;
      }
      
      // Update system info
      const systemEl = document.getElementById('debug-system');
      if (systemEl) {
        systemEl.innerHTML = `
          <div class="metric-item">
            <span class="metric-label">Debug Mode:</span>
            <span class="metric-value">${debugData.debugMode ? 'ON' : 'OFF'}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Log Level:</span>
            <span class="metric-value">${debugData.logLevel}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Uptime:</span>
            <span class="metric-value">${Math.round(debugData.metrics.uptime / 1000)}s</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Firebase Init:</span>
            <span class="metric-value">${debugData.metrics.firebaseInitTime || 0}ms</span>
          </div>
        `;
      }
      
    } catch (error) {
      console.error('Error updating debug info:', error);
    }
  }

  // Enhanced logging with debug mode support
  log(level, message, ...args) {
    if (this.debugMode || level === 'error' || level === 'warn') {
      const timestamp = new Date().toISOString();
      console[level](`[${timestamp}] AdminManager: ${message}`, ...args);
    }
  }
}

// Initialize global instance
window.AdminManager = new AdminManager();
