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
                
                // Sort data by appropriate field
                const sortedData = data.sort((a, b) => {
                    if (isV2Page) {
                        return (a.v2 || 0) - (b.v2 || 0);
                    } else {
                        return (a.v1 || 0) - (b.v1 || 0);
                    }
                });
                
                // Function to get screen size and determine column distribution
                function getColumnDistribution() {
                    const width = window.innerWidth;
                    
                    if (width >= 1600) {
                        // Large desktop: 4 columns
                        return {
                            columns: 4,
                            itemsPerColumn: Math.ceil(sortedData.length / 4)
                        };
                    } else if (width >= 900) {
                        // Desktop/Tablet: 3 columns
                        return {
                            columns: 3,
                            itemsPerColumn: Math.ceil(sortedData.length / 3)
                        };
                    } else if (width >= 600) {
                        // Mobile: 2 columns
                        return {
                            columns: 2,
                            itemsPerColumn: Math.ceil(sortedData.length / 2)
                        };
                    } else {
                        // Small mobile: 1 column
                        return {
                            columns: 1,
                            itemsPerColumn: sortedData.length
                        };
                    }
                }
                
                const distribution = getColumnDistribution();
                const columns = Array(distribution.columns).fill().map(() => []);
                
                // Distribute items evenly across columns
                sortedData.forEach((item, index) => {
                    const columnIndex = Math.floor(index / distribution.itemsPerColumn);
                    if (columnIndex < distribution.columns) {
                        columns[columnIndex].push(item);
                    } else {
                        // Put remaining items in the last column
                        columns[distribution.columns - 1].push(item);
                    }
                });
                
                // Generate HTML for each column using unified ItemRenderer
                const columnHTML = columns.map(columnData => {
                    const itemsHTML = columnData.map((item) => {
                        return window.ItemRenderer.renderItem(item, {
                            showV1: !isV2Page,
                            showV2: isV2Page,
                            useV2ForNumber: isV2Page,
                            includeLegendWrapper: true
                        });
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
});