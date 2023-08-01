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
app.use("/list", listRouter)
app.get('/list', (req, res) => {
  res.render('list/index');
});

app.get('/list/v2', (req, res) => {
  res.render('list/v2/index');
});

app.get('/list/version1/:status', (req, res) => {
  res.render('list/status');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;