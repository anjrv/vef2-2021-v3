import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { router as registration } from './registration.js';

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

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

/**
 * Hjálparfall sem skilar dagsetningu á lesanlegu formi.
 *
 * @param {string} sigDate dagsetning
 * @returns {string} dagsetning sem hefur verið hreinsað
 */
function formatDate(sigDate) {
  return ((sigDate.toISOString().substring(0, 10)).split('-')).reverse()
    .join('.');
}

/**
 * Hjálparfall til að birta nafn á réttu formi.
 *
 * @param {object} signature Undirskrift hlut
 * @returns {string} Strengur sem inniheldur nafn ef ekki nafnlaust, annars Nafnlaust
 */
function formatName(signature) {
  const sigName = signature.anonymous ? 'Nafnlaust' : signature.name;

  return sigName;
}

app.locals.isInvalid = isInvalid;
app.locals.formatDate = formatDate;
app.locals.formatName = formatName;

app.use('/', registration);

/**
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware sem nota á
 */
function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', error: '404 fannst ekki' });
}

/**
 * @param {object} err Villa sem kom upp í vinnslu
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {object} next næsta middleware sem nota á
 */
function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
