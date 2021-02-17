import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import { router as admin } from './admin.js';
import { router as registration } from './registration.js';
import { userStrategy, serializeUser, deserializeUser } from './users.js';

dotenv.config();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
} = process.env;

if (!sessionSecret) {
  console.error('Add SESSION_SECRET to .env');
  process.exit(1);
}

const app = express();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 30 * 24 * 60 * 1000,
}));

passport.use(new Strategy(userStrategy));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));
app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

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

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }

  next();
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { page: 'login', title: 'Innskráning', message });
});

app.post(
  '/login',

  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  (req, res) => {
    res.redirect('/admin');
  },
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use('/', registration);
app.use('/admin', admin);

/**
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware sem nota á
 */
function notFoundHandler(_req, res, _next) {
  res.status(404).render('error', { title: '404', error: '404 Fannst ekki' });
}

/**
 * @param {object} err Villa sem kom upp í vinnslu
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {object} next næsta middleware sem nota á
 */
function errorHandler(error, _req, res, _next) {
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
