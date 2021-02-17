import bcrypt from 'bcrypt';
import { query } from './db.js';

async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  const result = await query(q, [id]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

async function userStrategy(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (passwordsMatch) {
      return done(null, user);
    }
  } catch (err) {
    console.error(err);
    return done(err);
  }

  return done(null, false);
}

function serializeUser(user, done) {
  done(null, user.id);
}

async function deserializeUser(id, done) {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
}

async function users() {
  const q = 'SELECT * FROM users;';

  const result = await query(q);

  return result.rows;
}

export {
  findByUsername,
  findById,
  userStrategy,
  serializeUser,
  deserializeUser,
  users,
};
