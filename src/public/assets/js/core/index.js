document.addEventListener("DOMContentLoaded", () => {
    // Basic logging fallback
    const logger = {
        error: console.error,
        warn: console.warn,
        info: console.log,
        debug: console.log
    };

    // Wait for HTMX to be available
    const waitForHTMX = () => {
        if (typeof htmx === 'undefined') {
            setTimeout(waitForHTMX, 10);
            return;
        }

        // Suppress HTMX error events for aborted requests
        htmx.on('htmx:sendAbort', (event) => {
            logger.debug('HTMX: Request aborted');
        });

        // Handle HTMX response errors
        htmx.on('htmx:responseError', (event) => {
            if (event.detail.xhr.status !== 0) {
                logger.error('HTMX: Response error:', event.detail.xhr.status, event.detail.xhr.statusText);
            }
        });

        htmx.on('htmx:afterRequest', (event) => {
            if (event.detail.elt.id === 'dataList' || event.detail.elt.id === 'infinite-scroll-trigger') {
                const dataList = document.getElementById('dataList');
                try {
                    // Check if response is valid and not empty
                    if (!event.detail.xhr.response || event.detail.xhr.response.trim() === '') {
                        // Only log if it's not a network error (which is expected when requests are blocked)
                        if (event.detail.xhr.status !== 0) {
                            logger.warn('HTMX: Empty response received, skipping JSON parsing');
                        }
                        return;
                    }

                    const response = JSON.parse(event.detail.xhr.response);
                    let itemsToRender = [];
                    let isPaginated = false;
                    let nextUrl = null;

                    // Detect if response is paginated
                    if (response.items && Array.isArray(response.items)) {
                        itemsToRender = response.items;
                        isPaginated = true;
                        nextUrl = response.next;
                    } else if (Array.isArray(response)) {
                        // Handle flat array or array of columns (legacy/desktop complete load)
                        if (response.length > 0 && Array.isArray(response[0])) {
                            itemsToRender = response.flat();
                        } else {
                            itemsToRender = response;
                        }
                    }

                    // Sort data by v1 if needed (assuming backend sorts, but safe to ensure)
                    const sortedData = itemsToRender; // .sort((a, b) => (a.v1 || 0) - (b.v1 || 0)); 

                    // Check if this is an append operation (subsequent page) or initial load
                    const searchParams = new URLSearchParams(event.detail.requestConfig.path.split('?')[1]);
                    const currentPage = parseInt(searchParams.get('page')) || 1;
                    const isAppend = currentPage > 1;

                    // Get existing columns or create new ones
                    let columnsElements = dataList.querySelectorAll('.column');
                    let columnWrappers = [];

                    if (!isAppend || columnsElements.length === 0) {
                        // Initial render: Create 4 empty columns
                        const columns = [[], [], [], []];
                        // Distribute initial data
                        const itemsPerColumn = Math.ceil(sortedData.length / 4);
                        sortedData.forEach((item, index) => {
                            const columnIndex = Math.min(Math.floor(index / itemsPerColumn), 3);
                            columns[columnIndex].push(item);
                        });

                        // Render full columns structure
                        const columnsHTML = columns.map(columnItems => {
                            const itemsHTML = renderItemsHTML(columnItems);
                            return `<div class="column">${itemsHTML}</div>`;
                        }).join('');
                        dataList.innerHTML = columnsHTML;
                    } else {
                        // Append render: Distribute new items across existing columns
                        // We distribute round-robin to keep columns balanced roughly
                        columnsElements = dataList.querySelectorAll('.column');

                        sortedData.forEach((item, index) => {
                            const columnIndex = index % 4; // Simple round-robin for append
                            const itemHTML = renderItemsHTML([item]);
                            // Append before the end of the column
                            columnsElements[columnIndex].insertAdjacentHTML('beforeend', itemHTML);
                        });
                    }

                    // Handle "Load More" / Infinite Scroll Trigger
                    // Remove existing trigger if any
                    const existingTrigger = document.getElementById('infinite-scroll-trigger');
                    if (existingTrigger) {
                        existingTrigger.remove();
                    }

                    if (isPaginated && response.hasMore && nextUrl) {
                        const triggerDiv = document.createElement('div');
                        triggerDiv.id = 'infinite-scroll-trigger';
                        triggerDiv.setAttribute('hx-get', nextUrl);
                        triggerDiv.setAttribute('hx-trigger', 'revealed');
                        triggerDiv.setAttribute('hx-swap', 'none'); // vital: handle in JS, don't swap
                        triggerDiv.style.height = '10px';
                        dataList.appendChild(triggerDiv);
                        htmx.process(triggerDiv);
                    }

                } catch (error) {
                    logger.error("HTMX: Error parsing JSON response:", error);
                    // Log the start of the response to see if it's HTML
                    if (event.detail.xhr.response && typeof event.detail.xhr.response === 'string') {
                        const preview = event.detail.xhr.response.substring(0, 500);
                        logger.error("Response preview:", preview);
                        if (preview.trim().startsWith('<')) {
                            logger.error("Received HTML instead of JSON. Check server error logs.");
                        }
                    }
                }
            }
        });

        // Helper function to render items
        function renderItemsHTML(items) {
            return items.map((item) => {
                if (window.ItemRenderer && window.ItemRenderer.renderItem) {
                    return window.ItemRenderer.renderItem(item, {
                        showV1: true,
                        includeLegendWrapper: true
                    });
                } else {
                    // ... fallback ...
                    return '';
                }
            }).join('');
        }

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
    };

    // Start waiting for HTMX
    waitForHTMX();

});