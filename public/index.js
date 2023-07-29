document.addEventListener("DOMContentLoaded", () => {
      // Fetch and display the Firestore data using JavaScript
    const dataList = document.getElementById("dataList");

    fetch('/list-data')
    .then((response) => response.json())
    .then((data) => {
        const dataListHTML = data.map((item) => {
            if (item.status === "redacted") {
                // Hide the content for items with "redacted" status
                return `<div class="list-item"><span class="guide">#${item.guide}.</span> <span class="item-redacted"></span></div>`;
              } else {
                return `<div class="list-item"><span class="guide">#${item.guide}.</span> <span><span class="name">${item.name}</span><span class="dash">&ndash;</span><span class="status">${item.status}</span></span></div>`;
              }}).join('');
        dataList.innerHTML = dataListHTML;
    })
    .catch((error) => {
        console.error(error);
        dataList.innerHTML = `<div class='list-item'>Error fetching data</div>`;
    });
});
    