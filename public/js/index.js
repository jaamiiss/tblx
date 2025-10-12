document.addEventListener("DOMContentLoaded", () => {
    htmx.on('htmx:afterRequest', (event) => {
        if (event.detail.elt.id === 'dataList') {
            const dataList = document.getElementById('dataList');
            try {
                const data = JSON.parse(event.detail.xhr.response);
                
                // Sort data by v1 number
                const sortedData = data.sort((a, b) => (a.v1 || 0) - (b.v1 || 0));
                
                // Function to get screen size and determine column distribution
                function getColumnDistribution() {
                    const width = window.innerWidth;
                    
                    if (width >= 1600) {
                        // Large desktop: 4 columns with original ranges
                        return {
                            columns: 4,
                            ranges: [
                                { min: 0, max: 50 },
                                { min: 51, max: 100 },
                                { min: 101, max: 150 },
                                { min: 151, max: Infinity }
                            ]
                        };
                    } else if (width >= 900) {
                        // Desktop/Tablet: 3 columns with adjusted ranges
                        return {
                            columns: 3,
                            ranges: [
                                { min: 0, max: 66 },
                                { min: 67, max: 133 },
                                { min: 134, max: Infinity }
                            ]
                        };
                    } else if (width >= 600) {
                        // Mobile: 2 columns with adjusted ranges
                        return {
                            columns: 2,
                            ranges: [
                                { min: 0, max: 100 },
                                { min: 101, max: Infinity }
                            ]
                        };
                    } else {
                        // Small mobile: 1 column (all items)
                        return {
                            columns: 1,
                            ranges: [
                                { min: 0, max: Infinity }
                            ]
                        };
                    }
                }
                
                const distribution = getColumnDistribution();
                const columns = Array(distribution.columns).fill().map(() => []);
                
                sortedData.forEach((item) => {
                    const v1 = item.v1 || 0;
                    for (let i = 0; i < distribution.ranges.length; i++) {
                        const range = distribution.ranges[i];
                        if (v1 >= range.min && v1 <= range.max) {
                            columns[i].push(item);
                            break;
                        }
                    }
                });
                
                // Generate HTML for each column
                const columnHTML = columns.map(columnData => {
                    const itemsHTML = columnData.map((item) => {
                        const { guide, name, status, v1 } = item;
                        const statusHTML = (status === "redacted") ? 
                            '<span class="item-redacted"></span>' : 
                            `<span><span class="name">${name}</span><span class="dash">&ndash;</span><span class="status">${status}</span></span>`;
                        return `<div class="list-item"><span class="guide">#${v1}.</span> ${statusHTML}</div>`;
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