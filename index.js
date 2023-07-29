const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.static('public'))
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

app.get('/admin', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'admin')});
})

const cors = require('cors');
app.use(cors());

var admin = require("firebase-admin");
// Replace the following with your Firebase admin credentials file path
const serviceAccount = require('./key/the-blacklist-12fbe-firebase-adminsdk-goj3a-1f44721d17.json');

// Initialize Firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

if (!admin.apps.length) {
    console.log('Firebase Admin SDK initialization failed.');
} else {
    console.log('Firebase Admin SDK initialized successfully.');
}
  
const adminRoutes = require('./admin/admin');
app.use('/admin', adminRoutes);

// Get a reference to the Firestore database
const db = admin.firestore();


// w/o Cache
// New route to fetch data as JSON
app.get('/list-data', (req, res) => {
  db.collection('the-blacklist')
    .orderBy('order')
    .get()
    .then((snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push(doc.data()));

      res.json(data);
      console.log(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    });
});

app.get('/list', (req, res) => {
    console.log("Accessing /list route"); // Add this line to check if the route is being accessed
    res.sendFile('list.html', { root: path.join(__dirname, 'public') });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
