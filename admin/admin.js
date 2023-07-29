const express = require('express');
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const path = require('path');

// Serve static files from the "admin" directory
router.use(express.static('admin'));

router.get('/', (req, res) => {
  //res.sendFile('index.html', { root: 'admin' });
  res.sendFile('index.html', {root: path.join(__dirname, 'admin')});
});

router.post('/add-data', (req, res) => {
    const { guide, name, status } = req.body;

    db.collection('the-blacklist')
    .add({
      guide: guide,
      name: name,
      status: status
    })
    .then((docRef) => {
      console.log('Document written with ID:', docRef.id);
      res.status(201).json({ message: 'Name added successfully to the list' });
    })
    .catch((error) => {
      console.error('Error adding name on the list:', error);
      res.status(500).json({ error: 'Failed to add name on the list' });
    });
});

router.put('/update-data/:id', (req, res) => {
});

module.exports = router;
