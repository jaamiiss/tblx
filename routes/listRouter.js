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
router.get('/v1', (req, res) => {
    db.collection(collectionName)
      .where('v1', '>=', 0)
      .where('v1', '<=', 200)
      .orderBy('v1')
      .get()
      .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            ...docData
          });
        });
        res.json(data);
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    });
});

module.exports = router