document.getElementById('addForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const guide = document.getElementById('guide').value;
    const name = document.getElementById('name').value;
    const status = document.getElementById('status').value;
    const order = parseInt(document.getElementById('order').value);

    fetch('/admin/add-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guide, name, order, status })
    })
    .then(response => {
        if (response.ok) {
            console.log('Name added successfully to the list');
            // You can perform any additional actions here after successful addition of data
        } else {
            console.error('Failed to add name on the list');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});