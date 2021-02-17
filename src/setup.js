import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import faker from 'faker';
import { query } from './db.js';

dotenv.config();

const { DATABASE_URL: connectionString } = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const readFileAsync = util.promisify(fs.readFile);

async function insert(data) {
  const q = `
INSERT INTO signatures
(name, nationalId, comment, anonymous, signed)
VALUES
($1, $2, $3, $4, $5)`;
  const values = [data.name, data.nationalId, data.comment, data.anonymous, data.signed];

  return query(q, values);
}

/**
 * Framkvæmir 600 gervi insert aðgerðir
 */
function insertDummies() {
  console.info('Útbúa gerviskráningar ... ');
  const date = new Date();
  const hi = date.getTime();
  const lo = hi - 1209600000;
  for (let i = 0; i < 600; i += 1) {
    date.setTime(Math.floor(Math.random() * (hi - lo + 1) + lo));
    const data = {
      name: faker.name.findName(),
      nationalId: Math.random().toString().slice(2, 12),
      comment: (Math.random() >= 0.5) ? faker.lorem.sentence() : '',
      anonymous: (Math.random() >= 0.5),
      signed: date.toLocaleString(),
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

  await query('DROP TABLE IF EXISTS users');
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
