document.addEventListener("DOMContentLoaded", () => {
    // Create logger for index.js
    const indexLogger = window.logManager ? window.logManager.createModuleLogger('Index') : {
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      verbose: console.log
    };
    
    // Suppress HTMX error events for aborted requests (expected when requests are blocked)
    htmx.on('htmx:sendAbort', (event) => {
        // Don't log aborted requests as they're expected when requests are blocked
        indexLogger.debug('Request aborted (expected when requests are blocked)');
    });
    
    // Suppress HTMX error events for network issues
    htmx.on('htmx:responseError', (event) => {
        // Only log if it's not a network error (status 0)
        if (event.detail.xhr.status !== 0) {
            indexLogger.error('Response error:', event.detail.xhr.status, event.detail.xhr.statusText);
        } else {
            indexLogger.debug('Network error (expected when requests are blocked)');
        }
    });
    
    htmx.on('htmx:afterRequest', (event) => {
        if (event.detail.elt.id === 'dataList') {
            const dataList = document.getElementById('dataList');
            try {
                // Check if response is valid and not empty
                if (!event.detail.xhr.response || event.detail.xhr.response.trim() === '') {
                    // Only log if it's not a network error (which is expected when requests are blocked)
                    if (event.detail.xhr.status !== 0) {
                        indexLogger.warn('Empty response received, skipping JSON parsing');
                    }
                    return;
                }
                
                const data = JSON.parse(event.detail.xhr.response);
                
                // Check if we're on the v2 page
                const isV2Page = window.location.pathname.includes('/v2');
                
                // Handle column-based data structure from API
                let flatData;
                if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
                    // Data is in column format [[col1], [col2], [col3], [col4]]
                    flatData = data.flat();
                } else {
                    // Data is already flat
                    flatData = data;
                }
                
                // Sort data by appropriate field
                const sortedData = flatData.sort((a, b) => {
                    if (isV2Page) {
                        return (a.v2 || 0) - (b.v2 || 0);
                    } else {
                        return (a.v1 || 0) - (b.v1 || 0);
                    }
                });
                
                // Check if ItemRenderer is available and log status
                if (window.ItemRenderer && window.ItemRenderer.renderItem) {
                    indexLogger.debug('ItemRenderer is available, using unified renderer');
                } else {
                    indexLogger.warn('ItemRenderer not available, using fallback rendering');
                }
                
                // Use the same range-based distribution as the layout
                const columnRanges = [
                    { min: 0, max: 50, label: '0-50' },
                    { min: 51, max: 100, label: '51-100' },
                    { min: 101, max: 150, label: '101-150' },
                    { min: 151, max: 200, label: '151-200' }
                ];

                const columns = columnRanges.map(range => ({
                    range: range,
                    items: []
                }));

                // Distribute items into appropriate columns based on ranges
                sortedData.forEach((item) => {
                    const value = isV2Page ? (item.v2 || 0) : (item.v1 || 0);
                    
                    for (let i = 0; i < columns.length; i++) {
                        const column = columns[i];
                        if (value >= column.range.min && value <= column.range.max) {
                            column.items.push(item);
                            break;
                        }
                    }
                });

                // Generate HTML for each column using unified ItemRenderer
                const columnHTML = columns.map(column => {
                    const itemsHTML = column.items.map((item) => {
                        // Check if ItemRenderer is available
                        if (window.ItemRenderer && window.ItemRenderer.renderItem) {
                            return window.ItemRenderer.renderItem(item, {
                                showV1: !isV2Page,
                                showV2: isV2Page,
                                useV2ForNumber: isV2Page,
                                includeLegendWrapper: true
                            });
                        } else {
                            // Fallback rendering if ItemRenderer is not available
                            const value = isV2Page ? (item.v2 || 0) : (item.v1 || 0);
                            const status = item.status || 'unknown';
                            const name = item.name || 'Unknown';
                            
                            if (status === 'redacted') {
                                return `<div class="${status}"><div class="list-item"><span class="guide">#${value}.</span><span class="item-redacted"></span></div></div>`;
                            } else {
                                return `<div class="${status}"><div class="list-item"><span class="guide">#${value}.</span><span><span class="name">${name}</span><span class="dash">&ndash;</span><span class="status ${status}">${status}</span></span></div></div>`;
                            }
                        }
                    }).join('');
                    return `<div class="column">${itemsHTML}</div>`;
                }).join('');
                
                dataList.innerHTML = columnHTML;
            } catch (error) {
                indexLogger.error("Error parsing JSON response:", error);
                indexLogger.debug("Response content:", event.detail.xhr.response);
                indexLogger.debug("Response status:", event.detail.xhr.status);
                
                // Show error message to user
                if (dataList) {
                    dataList.innerHTML = '<div class="error-message">Failed to load data. Please try again.</div>';
                }
            }
        }
    });
    
    // Handle window resize to redistribute columns
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const dataList = document.getElementById('dataList');
            if (dataList && dataList.innerHTML) {
                // Trigger a re-render by dispatching a custom event
                htmx.trigger(dataList, 'htmx:trigger');
            }
        }, 250);
    });

    // Global function for demo manager to render list data
    window.renderListData = function(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            indexLogger.error(`Container ${containerId} not found`);
            return;
        }

        try {
            // Handle column-based data structure
            let flatData;
            if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
                flatData = data.flat();
            } else {
                flatData = data;
            }

            // Sort data by appropriate field
            const isV2Page = window.location.pathname.includes('/v2');
            const sortedData = flatData.sort((a, b) => {
                if (isV2Page) {
                    return (a.v2 || 0) - (b.v2 || 0);
                } else {
                    return (a.v1 || 0) - (b.v1 || 0);
                }
            });

            // Use ItemRenderer if available
            if (window.ItemRenderer && window.ItemRenderer.renderItem) {
                indexLogger.info('Using ItemRenderer for demo data');
                const html = sortedData.map(item => window.ItemRenderer.renderItem(item)).join('');
                container.innerHTML = html;
            } else {
                indexLogger.warn('ItemRenderer not available, using basic rendering');
                const html = sortedData.map(item => 
                    `<div class="list-item ${item.status || 'unknown'}">
                        <div class="item-header">
                            <span class="item-name">${item.name || 'Unknown'}</span>
                            <span class="item-dash">-</span>
                            <span class="item-status">#${isV2Page ? (item.v2 || 0) : (item.v1 || 0)}</span>
                        </div>
                    </div>`
                ).join('');
                container.innerHTML = html;
            }

            indexLogger.info(`Rendered ${sortedData.length} demo items for ${containerId}`);
        } catch (error) {
            indexLogger.error('Error rendering demo list data:', error);
            container.innerHTML = '<div class="error-message">Error loading demo data</div>';
        }
    };
});