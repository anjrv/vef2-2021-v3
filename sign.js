import xss from 'xss';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { insert, select } from './db.js';

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

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

const router = express.Router();

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

const sanitazions = [
  body('name').trim().escape(),
  sanitizeXss('name'),

  body('nationalId').blacklist('-'),
  sanitizeXss('nationalId'),

  body('comment').trim().escape(),
  sanitizeXss('comment'),

  body('anonymouse').trim().escape(),
  sanitizeXss('anonymous'),
];

async function form(req, res) {
  const list = await select();
  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    comment: '',
    anonymous: false,
    errors: [],
    list,
  };
  res.render('form', data);
}

async function showErrors(req, res, next) {
  const list = await select();
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

router.get('/', form);

router.post(
  '/',
  validations,
  showErrors,
  sanitazions,
  catchErrors(formPost),
);

export { router };
