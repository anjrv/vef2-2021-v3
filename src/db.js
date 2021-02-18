import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;
const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function query(q, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    console.error('Error selecting', e);
    throw (e);
  } finally {
    client.release();
  }
}

/**
 * Bætir við undirskrift.
 *
 * @param {array} data Fylki af gögnum fyrir undirskrift
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function insert(data) {
  const q = `
INSERT INTO signatures
(name, nationalId, comment, anonymous)
VALUES
($1, $2, $3, $4)`;
  const values = [data.name, data.nationalId, data.comment, data.anonymous];

  return query(q, values);
}

/**
 * Sækir 50 undirskriftir miðað við offset og limit.
 *
 * @param {*} offset Byrjunarstað
 * @param {*} limit Fjöldi
 */
async function select(offset = 0, limit = 50) {
  const result = await query('SELECT * FROM signatures ORDER BY signed DESC OFFSET $1 LIMIT $2', [offset, limit]);

  return result.rows;
}

/**
 * Sækir heildarfjölda undirskrifta
 */
async function count() {
  const result = await query('SELECT COUNT(*) AS count FROM signatures');

  return result.rows[0].count;
}

/**
 * Eyðir undirskrift frá gagnagrunni.
 *
 * @param {*} id id færslu sem eyða á
 */
async function deleteRow(id) {
  const q = 'DELETE FROM signatures WHERE id = $1';

  return query(q, id);
}

export {
  query,
  insert,
  select,
  count,
  deleteRow,
};
