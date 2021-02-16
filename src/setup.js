import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import pg from 'pg';
import faker from 'faker';
import { insert } from './db.js';

dotenv.config();

const { DATABASE_URL: connectionString } = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

const readFileAsync = util.promisify(fs.readFile);

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 */
async function query(q) {
  const client = await pool.connect();

  try {
    const result = await client.query(q);
    const { rows } = result;
    return rows;
  } catch (e) {
    console.error('Error selecting', e);
    throw e;
  } finally {
    await client.end();
  }
}

/**
 * Framkvæmir 500 gervi insert aðgerðir
 */
function insertDummies() {
  console.info('Útbúa gerviskráningar ... ');
  for (let i = 0; i < 500; i += 1) {
    const data = {
      name: faker.name.findName(),
      nationalId: Math.random().toString().slice(2, 12),
      comment: (Math.random() >= 0.5) ? faker.lorem.sentence() : '',
      anonymous: (Math.random() >= 0.5),
    };
    insert(data);
  }
}

/**
 * Fall til að setja upp gagnagrunn
 */
async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS signatures');
  console.info('Töflu eytt');

  // búa til töflu út frá skema
  try {
    const createTable = await readFileAsync('./schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
    insertDummies();
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
