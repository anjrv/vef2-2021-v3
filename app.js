require('dotenv').config();

const path = require('path');
const express = require('express');

const signatures = require('./signatures');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.use('/signatures', signatures);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
