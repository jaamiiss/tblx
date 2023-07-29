const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

app.get('/list', (req, res) => {
    res.sendFile('list.html', { root: path.join(__dirname, 'public') });
});

const cors = require('cors');
app.use(cors());

var admin = require("firebase-admin");
// Replace the following with your Firebase admin credentials file path
const serviceAccount = require('./key/the-blacklist-12fbe-firebase-adminsdk-goj3a-1f44721d17.json');

// Initialize Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a reference to the Firestore database
const db = admin.firestore();

// w/o Cache
// New route to fetch data as JSON
app.get('/list-data', (req, res) => {
  db.collection('the-blacklist')
    .get()
    .then((snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push(doc.data()));

      res.json(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
