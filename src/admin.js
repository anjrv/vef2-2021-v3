import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import { count, select, deleteRow } from './db.js';
import { catchErrors, ensureLoggedIn } from './utils.js';

const router = express.Router();

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

//const path = dirname(fileURLToPath(import.meta.url));
//router.use(express.static(join(path, '../public')));

/**
 * Route handler fyrir form undirskrifts
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir undirskrift
 */
async function admin(req, res) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const rows = await select(offset, limit);
  const quant = await count();
  const user = req.user.username;

  const list = {
    links: {
      self: {
        href: `http://localhost:${port}/admin/?offset=${offset}&limit=${limit}`,
      },
    },
    items: rows,
  };

  if (offset > 0) {
    list.links.prev = {
      href: `http://localhost:${port}/admin/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  if (rows.length <= limit) {
    list.links.next = {
      href: `http://localhost:${port}/admin/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  const data = {
    title: 'Undirskriftarlisti',
    list,
    quant,
    offset,
    limit,
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
