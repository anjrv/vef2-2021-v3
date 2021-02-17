import express from 'express';

import { count, select, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

const router = express.Router();

/**
 * Route handler fyrir form undirskrifts
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir undirskrift
 */
async function admin(req, res) {
  const list = await select();
  const quant = await count();
  const user = req.user.username;

  const data = {
    title: 'Undirskriftarlisti',
    list,
    quant,
    user,
  };
  return res.render('admin', data);
}

/**
 * Route til að eyða umsókn, tekur við `id` í `body` og eyðir.
 * Aðeins aðgengilegt fyrir admin.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function deleteApplication(req, res) {
  const { id } = req.body;

  await deleteRow([id]);

  return res.redirect('/admin');
}

router.get('/', ensureLoggedIn, catchErrors(admin));
router.post('/delete', ensureLoggedIn, catchErrors(deleteApplication));

export { router };
