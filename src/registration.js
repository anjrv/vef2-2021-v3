import xss from 'xss';
import express from 'express';
import dotenv from 'dotenv';

import { body, validationResult } from 'express-validator';
import { insert, select, count } from './db.js';

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];
    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const router = express.Router();

// Fylki af öllum validations fyrir undirskrift
const validations = [
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má að hámarki vera 128 stafir'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(/^[0-9]{6}-?[0-9]{4}$/)
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  body('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

// Fylki af öllum hreinsunum fyrir undirskrift
const sanitazions = [
  body('name').trim().escape(),
  sanitizeXss('name'),

  body('nationalId').blacklist('-'),
  sanitizeXss('nationalId'),

  body('comment').trim().escape(),
  sanitizeXss('comment'),

  body('anonymous'),
  sanitizeXss('anonymous'),
];

/**
 * Route handler fyrir form undirskrifts
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir undirskrift
 */
async function form(req, res) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const rows = await select(offset, limit);
  const quant = await count();

  const list = {
    links: {
      self: {
        href: `http://localhost:${port}/?offset=${offset}&limit=${limit}`,
      },
    },
    items: rows,
  };

  if (offset > 0) {
    list.links.prev = {
      href: `http://localhost:${port}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (rows.length <= limit) {
    list.links.next = {
      href: `http://localhost:${port}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    comment: '',
    anonymous: false,
    errors: [],
    list,
    quant,
    offset,
    limit,
  };
  return res.render('form', data);
}

/**
 * Route handler sem athugar stöðu á undirskrift og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
async function showErrors(req, res, next) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const rows = await select(offset, limit);
  const quant = await count();

  const list = {
    links: {
      self: {
        href: `http://localhost:${port}/?offset=${offset}&limit=${limit}`,
      },
    },
    items: rows,
  };

  if (offset > 0) {
    list.links.prev = {
      href: `http://localhost:${port}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (rows.length <= limit) {
    list.links.next = {
      href: `http://localhost:${port}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
    list,
    quant,
    offset,
    limit,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.title = 'Undirskriftarlisti – vandræði';

    return res.render('form', data);
  }

  return next();
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * aftur á aðalsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
  };

  await insert(data);

  return res.redirect('/');
}

router.get('/', catchErrors(form));

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(formPost),
);

export { router };
