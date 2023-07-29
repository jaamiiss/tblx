document.addEventListener("DOMContentLoaded", () => {
    // Use HTMX to update the data after a successful request
    htmx.on('htmx:afterRequest', (event) => {
      if (event.detail.elt.id === 'dataList') {
        const dataList = document.getElementById('dataList');
        const data = JSON.parse(event.detail.xhr.response);
        const dataListHTML = data.map((item) => {
          if (item.status === "redacted") {
            return `<div class="list-item"><span class="guide">#${item.guide}.</span> <span class="item-redacted"></span></div>`;
          } else {
            return `<div class="list-item"><span class="guide">#${item.guide}.</span> <span><span class="name">${item.name}</span><span class="dash">&ndash;</span><span class="status">${item.status}</span></span></div>`;
          }
        }).join('');
        dataList.innerHTML = dataListHTML;
      }
    });
  });