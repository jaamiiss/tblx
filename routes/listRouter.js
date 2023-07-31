const express = require('express')
const router = express.Router()

require('dotenv').config();

const collectionName = process.env.COLLECTION_NAME;

var admin = require("firebase-admin");

if (!admin.apps.length) {
    console.log('Firebase Admin SDK initialization failed.');
} else {
    console.log('Firebase Admin SDK initialized successfully.');
}

const db = admin.firestore();
router.get('/list-data', (req, res) => {
    db.collection(collectionName)
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

module.exports = router