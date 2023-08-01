document.addEventListener("DOMContentLoaded", () => {
    htmx.on('htmx:afterRequest', (event) => {
        if (event.detail.elt.id === 'dataList') {
            const dataList = document.getElementById('dataList');
            try {
                const data = JSON.parse(event.detail.xhr.response);
                const dataListHTML = data.map((item) => {
                const { guide, name, status, v1 } = item;
                const statusHTML = (status === "redacted") ? '<span class="item-redacted"></span>' : `<span><span class="name">${name}</span><span class="dash">&ndash;</span><span class="status">${status}</span></span>`;
                return `<div class="list-item"><span class="guide">#${v1}.</span> ${statusHTML}</div>`;
                }).join('');
                dataList.innerHTML = dataListHTML;
            } catch (error) {
                console.error("Error parsing JSON response:", error);
            }
        }
    });
});