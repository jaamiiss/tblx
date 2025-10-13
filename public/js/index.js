document.addEventListener("DOMContentLoaded", () => {
    htmx.on('htmx:afterRequest', (event) => {
        if (event.detail.elt.id === 'dataList') {
            const dataList = document.getElementById('dataList');
            try {
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
                console.error("Error parsing JSON response:", error);
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