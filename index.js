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
const serviceAccount = require('./key/the-blacklist-12fbe-firebase-adminsdk-goj3a-1f44721d17.json');

// Initialize Firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a reference to the Firestore database
const db = admin.firestore();

const cache = {};

// Caching middleware function
function cacheMiddleware(req, res, next) {
    const key = req.originalUrl || req.url;
    
    if (cache[key] && !isDataStale(cache[key])) {
      // If data is present in the cache, send it as the response      
      res.setHeader('Content-Type', 'text/html');
      res.send(cache[key].html);
    } else {
      // If data is not in the cache, proceed to fetch data from Firestore
      db.collection('the-blacklist')
        .get()
        .then((snapshot) => {
          const data = [];
          snapshot.forEach((doc) => data.push(doc.data()));

          // Convert data to HTML list
          const dataListHTML = data.map((item) => `<li>${item.name}</li>`).join('');

          // Store data in the cache with an expiration time of 10 minutes (10 * 60 * 1000 milliseconds)
          cache[key] = {
            html: `<ul>${dataListHTML}</ul>`,
            timestamp: Date.now(),
          };

          // Respond with the HTML list    
          res.setHeader('Content-Type', 'text/html');
          res.send(cache[key].html);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Something went wrong' });
        });
    }
  }

  function isDataStale(cachedData) {
    const currentTime = Date.now();
    const cachedTime = cachedData.timestamp;
    //const duration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const duration = 60 * 1000; // 1 minute in milliseconds
    return currentTime - cachedTime >= duration;
  }

app.get('/list', cacheMiddleware);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


module.exports = app;