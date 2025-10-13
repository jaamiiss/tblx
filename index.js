const dotenv = require('dotenv')
const express = require('express');
const app = express();
const path = require('path');
const admin = require('./config/firebase-cfg');
const cacheDuration = 15552000;

dotenv.config();

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

const setCacheControl = (req, res, next) => {
  res.setHeader('Cache-Control', `s-maxage=${cacheDuration}`);
  next();
};
app.use(setCacheControl);

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

const listRouter = require('./routes/listRouter')

// Status page routes - must come before listRouter
app.get('/list/deceased', (req, res) => {
  res.render('list/status', { status: 'deceased' });
});

app.get('/list/active', (req, res) => {
  res.render('list/status', { status: 'active' });
});

app.get('/list/incarcerated', (req, res) => {
  res.render('list/status', { status: 'incarcerated' });
});

app.get('/list/redacted', (req, res) => {
  res.render('list/status', { status: 'redacted' });
});

app.get('/list/unknown', (req, res) => {
  res.render('list/status', { status: 'unknown' });
});

app.get('/list/captured', (req, res) => {
  res.render('list/status', { status: 'captured' });
});

app.get('/list', (req, res) => {
  res.render('list/index');
});

app.get('/list/v2', (req, res) => {
  res.render('list/v2/index');
});

app.get('/stats', (req, res) => {
  res.render('stats/index');
});

// Use listRouter for all other /list routes
app.use("/list", listRouter)

// API endpoint for getting status data - use the existing route
app.use('/api', listRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;