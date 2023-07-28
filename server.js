const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

const cors = require('cors');
app.use(cors());

var admin = require("firebase-admin");
// Replace the following with your Firebase admin credentials file path
const serviceAccount = require('./the-blacklist-12fbe-firebase-adminsdk-goj3a-1f44721d17.json');

// Initialize Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a reference to the Firestore database
const db = admin.firestore();

app.get('/list', async (req, res) => {
  try {
    const snapshot = await db.collection('the-blacklist').get();
    const data = [];
    snapshot.forEach(doc => data.push(doc.data()));
    // res.json(data);

    // Convert the data to an HTML list
    const dataListHTML = data.map(item => `<li>${item.name}</li>`).join('');

    // Respond with the HTML list
    res.send(`<ul>${dataListHTML}</ul>`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// app.get('/', (req, res) => {
//   // Handle the root route and respond with appropriate content
//   res.send('Hello, this is the root route!');
// });

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


module.exports = app;