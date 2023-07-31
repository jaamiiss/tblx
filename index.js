const dotenv = require('dotenv')
const express = require('express');
const app = express();
const path = require('path');
const admin = require('./config/firebase-cfg');

dotenv.config();

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
})

const listRouter = require('./routes/listRouter')
app.use("/list", listRouter)
app.get('/list', (req, res) => {
  res.render('list/index');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
