const express = require('express')
const router = express.Router()

require('dotenv').config();

const collectionName = process.env.COLLECTION_NAME;

const admin = require("firebase-admin");

if (!admin.apps.length) {
    console.log('Firebase Admin SDK initialization failed.');
} else {
    console.log('Firebase Admin SDK initialized successfully.');
}

const db = admin.firestore();
router.get('/version1', (req, res) => {
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

router.get('/version2', (req, res) => {
  db.collection(collectionName)
    .where('v2', '>=', 0)
    .where('v2', '<=', 200)
    .orderBy('v2')
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

router.get('/version1/:status', async (req, res) => {
  try {
    const status = req.params.status.toLowerCase(); // Get the status from the URL and convert to lowercase

    // Query Firestore to get the user data with the specified status
    const snapshot = await db.collection(collectionName)
      .where('v1', '>=', 0)
      .where('v1', '<=', 200)
      .where('status', '==', status)
      .limit(5)
      .orderBy('v1')
      .get();

    const data = [];
    snapshot.forEach((doc) => {
      const docData = doc.data();
      console.log(data);

      data.push({
        id: doc.id,
        ...docData
      });
    });

    // Send the user data as a JSON response
    res.json(data);
    console.log(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
module.exports = router