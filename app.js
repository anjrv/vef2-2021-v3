import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { router as sign } from './sign.js';
import { formatDate } from './src/lib/formatDate.js';
import { formatName } from './src/lib/formatName.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();
const dirname = path.resolve();

app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(dirname, 'public')));

function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

app.locals.isInvalid = isInvalid;
app.locals.formatDate = formatDate;
app.locals.formatName = formatName;

app.use('/', sign);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
