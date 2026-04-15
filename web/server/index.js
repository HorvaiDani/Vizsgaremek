/* eslint-env node */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
// Ha nincs megadva .env-ben, akkor a schema.sql szerinti "gamehub"-ot használjuk.
const DB_NAME = process.env.DB_NAME || 'gamehub';

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function findUserByName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  const [rows] = await pool.query(
    'SELECT id, name, email, avatar_url AS avatarUrl FROM users WHERE name = ? LIMIT 1',
    [trimmed],
  );
  return rows.length > 0 ? rows[0] : null;
}

async function createUser({ name, email, avatarUrl, password }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim() || null;
  const trimmedAvatar = String(avatarUrl || '').trim() || null;
  const rawPassword = String(password || '');
  if (!trimmedName) throw new Error('NAME_REQUIRED');
  if (!rawPassword) throw new Error('PASSWORD_REQUIRED');

  // Check name uniqueness
  const [existingName] = await pool.query(
    'SELECT id FROM users WHERE name = ? LIMIT 1',
    [trimmedName],
  );
  if (existingName.length > 0) throw new Error('NAME_TAKEN');

  // Check email uniqueness (only if provided)
  if (trimmedEmail) {
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail],
    );
    if (existingEmail.length > 0) throw new Error('EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const [result] = await pool.query(
    'INSERT INTO users (name, email, avatar_url, password_hash) VALUES (?, ?, ?, ?)',
    [trimmedName, trimmedEmail, trimmedAvatar, passwordHash],
  );

  await pool.query(
    'INSERT IGNORE INTO user_stats (user_id) VALUES (?)',
    [result.insertId],
  );

  return {
    user: {
      id: result.insertId,
      name: trimmedName,
      email: trimmedEmail,
      avatarUrl: trimmedAvatar,
    },
    created: true,
  };
}

function getUserName(req) {
  const raw = req.header('x-user');
  if (!raw) return null;
  const name = String(raw).trim();
  return name.length > 0 ? name : null;
}

function requireUser(req, res, next) {
  const userName = getUserName(req);
  if (!userName) {
    return res.status(401).json({ hiba: 'Bejelentkezés szükséges.' });
  }
  req.userName = userName;
  next();
}

function requireAdmin(req, res, next) {
  if (req.userName !== 'admin') {
    return res.status(403).json({ hiba: 'Hozzáférés megtagadva.' });
  }
  next();
}

function isSafeTableName(value) {
  return /^[a-zA-Z0-9_]+$/.test(String(value || ''));
}

// Regisztráció: felhasználó létrehozása az adatbázisban
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, avatarUrl, password } = req.body || {};
    const result = await createUser({ name, email, avatarUrl, password });
    res.status(201).json({ ok: true, user: result.user });
  } catch (err) {
    if (err.message === 'NAME_REQUIRED') {
      return res.status(400).json({ hiba: 'A név megadása kötelező.' });
    }
    if (err.message === 'PASSWORD_REQUIRED') {
      return res.status(400).json({ hiba: 'A jelszó megadása kötelező.' });
    }
    if (err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ hiba: 'Ez az e-mail cím már regisztrálva van.' });
    }
    if (err.message === 'NAME_TAKEN') {
      const trimmed = String(req.body?.name || '').trim();
      const candidates = [
        trimmed + '1',
        trimmed + '2',
        trimmed + '_pro',
        trimmed + '_gamer',
        'x_' + trimmed,
        trimmed + Math.floor(Math.random() * 900 + 100),
      ];
      const placeholders = candidates.map(() => '?').join(', ');
      const [takenCands] = await pool.query(
        `SELECT name FROM users WHERE name IN (${placeholders})`,
        candidates,
      );
      const takenSet = new Set(takenCands.map((r) => r.name.toLowerCase()));
      const suggestions = candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 4);
      return res.status(409).json({ hiba: 'Ez a felhasználónév már foglalt.', suggestions });
    }
    console.error('POST /api/register hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a regisztráció során.' });
  }
});

// Összes kedvenc listázása – adatbázisból
app.get('/api/kedvencek', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) {
      return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });
    }

    const [rows] = await pool.query(
      `SELECT id,
              steam_app_id AS steam_id,
              title        AS cim,
              created_at   AS mikor
       FROM favorites
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id],
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/kedvencek hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a kedvencek lekérésekor.' });
  }
});

// Új kedvenc hozzáadása – adatbázis
app.post('/api/kedvencek', requireUser, async (req, res) => {
  try {
    const { steam_id, cim } = req.body;
    if (!steam_id || !cim) {
      return res.status(400).json({ hiba: 'Kell steam_id és cim.' });
    }

    const user = await findUserByName(req.userName);
    if (!user) {
      return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });
    }

    const sid = String(steam_id);
    const title = String(cim);

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND steam_app_id = ? LIMIT 1',
      [user.id, sid],
    );
    if (existing.length > 0) {
      return res.status(409).json({ hiba: 'Ez a játék már a kedvenceid között van.' });
    }

    const [result] = await pool.query(
      'INSERT INTO favorites (user_id, steam_app_id, title) VALUES (?, ?, ?)',
      [user.id, sid, title],
    );

    const [rows] = await pool.query(
      `SELECT id,
              steam_app_id AS steam_id,
              title        AS cim,
              created_at   AS mikor
       FROM favorites
       WHERE id = ?`,
      [result.insertId],
    );

    const adat = rows[0] || {
      id: result.insertId,
      steam_id: sid,
      cim: title,
      mikor: new Date().toISOString(),
    };

    // Ensure stats row exists and increment favorite_count
    await pool.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);
    await pool.query('UPDATE user_stats SET favorite_count = favorite_count + 1 WHERE user_id = ?', [user.id]);

    res.status(201).json({ ok: true, uzenet: 'Kedvenc mentve.', adat });
  } catch (err) {
    console.error('POST /api/kedvencek hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a kedvenc mentésekor.' });
  }
});

// Kedvenc törlése id alapján – adatbázis
app.delete('/api/kedvencek/:id', requireUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ hiba: 'Kell egy id.' });
    }

    const user = await findUserByName(req.userName);
    if (!user) {
      return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });
    }

    const [rows] = await pool.query(
      'SELECT user_id FROM favorites WHERE id = ? LIMIT 1',
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ hiba: 'Nincs ilyen kedvenc.' });
    }
    if (rows[0].user_id !== user.id) {
      return res.status(403).json({ hiba: 'Ehhez a kedvenchez nincs jogosultságod.' });
    }

    await pool.query('DELETE FROM favorites WHERE id = ?', [id]);
    // Decrement favorite_count (safety: not below 0)
    await pool.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);
    await pool.query('UPDATE user_stats SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE user_id = ?', [user.id]);
    res.json({ ok: true, uzenet: 'Törölve.' });
  } catch (err) {
    console.error('DELETE /api/kedvencek/:id hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a kedvenc törlésekor.' });
  }
});

// Kommentek listázása játékhoz (nyilvános) – adatbázis
app.get('/api/comments/:steam_id', async (req, res) => {
  try {
    const steam_id = String(req.params.steam_id || '').trim();
    if (!steam_id) {
      return res.status(400).json({ hiba: 'Kell egy steam_id.' });
    }

    const [rows] = await pool.query(
      `SELECT c.id,
              c.steam_app_id AS steam_id,
              u.name         AS user,
              c.text,
              c.created_at   AS mikor
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.steam_app_id = ?
       ORDER BY c.created_at DESC`,
      [steam_id],
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/comments/:steam_id hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a kommentek lekérésekor.' });
  }
});

// Új komment írása (csak bejelentkezéssel) – adatbázis
app.post('/api/comments', requireUser, async (req, res) => {
  try {
    const { steam_id, text } = req.body;
    const sid = String(steam_id || '').trim();
    const t = String(text || '').trim();
    if (!sid || !t) {
      return res.status(400).json({ hiba: 'Kell steam_id és text.' });
    }
    if (t.length > 500) {
      return res.status(400).json({ hiba: 'A komment maximum 500 karakter lehet.' });
    }

    const user = await findUserByName(req.userName);
    if (!user) {
      return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (steam_app_id, user_id, text) VALUES (?, ?, ?)',
      [sid, user.id, t],
    );

    const [rows] = await pool.query(
      `SELECT c.id,
              c.steam_app_id AS steam_id,
              u.name         AS user,
              c.text,
              c.created_at   AS mikor
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId],
    );

    const adat = rows[0] || {
      id: result.insertId,
      steam_id: sid,
      user: user.name,
      text: t,
      mikor: new Date().toISOString(),
    };

    // Ensure stats row exists and increment comment_count
    await pool.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);
    await pool.query('UPDATE user_stats SET comment_count = comment_count + 1 WHERE user_id = ?', [user.id]);

    res.status(201).json({ ok: true, uzenet: 'Komment mentve.', adat });
  } catch (err) {
    console.error('POST /api/comments hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a komment mentésekor.' });
  }
});

// Komment törlése – admin bármelyiket, saját user csak a sajátját
app.delete('/api/comments/:id', requireUser, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (!commentId) return res.status(400).json({ hiba: 'Érvénytelen komment ID.' });

    const [rows] = await pool.query(
      'SELECT c.id, c.user_id, u.name AS userName FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [commentId],
    );
    if (rows.length === 0) return res.status(404).json({ hiba: 'A komment nem található.' });

    const comment = rows[0];
    if (req.userName !== 'admin' && comment.userName !== req.userName) {
      return res.status(403).json({ hiba: 'Nincs jogosultságod törölni ezt a kommentet.' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);

    // Decrement comment_count for the comment owner (but not below 0)
    await pool.query(
      'UPDATE user_stats SET comment_count = GREATEST(comment_count - 1, 0) WHERE user_id = ?',
      [comment.user_id],
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/comments/:id hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a komment törlésekor.' });
  }
});

// Egyszerű bejelentkezés: csak lekérdezi a felhasználót név alapján (nem hoz létre új felhasználót)
app.post('/api/login', async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const trimmedName = String(name || '').trim();
    if (!trimmedName || !password) {
      return res.status(400).json({ hiba: 'Név és jelszó szükséges.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, avatar_url AS avatarUrl, password_hash FROM users WHERE name = ? LIMIT 1',
      [trimmedName],
    );
    if (rows.length === 0) {
      return res.status(404).json({ hiba: 'Nincs ilyen felhasználó. Kérlek regisztrálj.' });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(String(password), userRow.password_hash || '');
    if (!match) {
      return res.status(401).json({ hiba: 'Hibás név vagy jelszó.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      avatarUrl: userRow.avatarUrl,
    };

    // last_login_at frissítése
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userRow.id]).catch(() => {});

    res.json({ ok: true, user });
  } catch (err) {
    console.error('POST /api/login hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a bejelentkezés során.' });
  }
});

// Felhasználóhoz tartozó achievementek lekérése
app.get('/api/achievements', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });

    const [rows] = await pool.query(
      `SELECT ua.achievement_id AS id,
              ac.title,
              ac.description,
              ac.points,
              ua.unlocked_at AS unlockedAt
       FROM user_achievements ua
       JOIN achievement_catalog ac ON ua.achievement_id = ac.id
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`,
      [user.id],
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/achievements hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba az achievementek lekérésekor.' });
  }
});

// Felhasználó statisztikák lekérése
app.get('/api/user_stats', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });

    const [rows] = await pool.query('SELECT * FROM user_stats WHERE user_id = ? LIMIT 1', [user.id]);
    if (rows.length === 0) {
      // ha nincs sor, küldjük a default értékeket
      return res.json({ user_id: user.id, search_count: 0, opened_count: 0, favorite_count: 0, comment_count: 0, xp: 0 });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/user_stats hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a statisztikák lekérésekor.' });
  }
});

// Achievement mentése (unlocked)
app.post('/api/achievements', requireUser, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { achievementId } = req.body || {};
    if (!achievementId) return res.status(400).json({ hiba: 'Kell achievementId.' });

    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó. Kérlek regisztrálj.' });

    await conn.beginTransaction();

    // Ellenőrizzük az achievement létezését és pontértékét
    const [acRows] = await conn.query('SELECT id, points FROM achievement_catalog WHERE id = ? LIMIT 1', [achievementId]);
    if (acRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ hiba: 'Nincs ilyen achievement.' });
    }
    const points = Number(acRows[0].points) || 0;

    // Ellenőrizzük, hogy már megvan-e a user_achievement
    const [already] = await conn.query('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ? LIMIT 1', [user.id, achievementId]);
    const alreadyUnlocked = Array.isArray(already) && already.length > 0;

    if (!alreadyUnlocked) {
      // Beszúrjuk a megszerzett achievement-et
      await conn.query('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [user.id, achievementId]);

      // Győződjünk meg róla, hogy van user_stats sor
      await conn.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);

      // Növeljük az xp-t csak egyszer
      if (points > 0) {
        await conn.query('UPDATE user_stats SET xp = xp + ? WHERE user_id = ?', [points, user.id]);
      }
    }

    await conn.commit();

    const [statsRows] = await pool.query('SELECT * FROM user_stats WHERE user_id = ? LIMIT 1', [user.id]);
    const stats = statsRows[0] || { user_id: user.id, search_count: 0, opened_count: 0, favorite_count: 0, comment_count: 0, xp: 0 };

    res.json({ ok: true, achievementId, stats });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('POST /api/achievements hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba az achievement mentésekor.' });
  } finally {
    conn.release();
  }
});

// Keresési előzmény mentése + műfaj preferencia növelése (ha műfajként adják meg)
app.post('/api/track_search', requireUser, async (req, res) => {
  try {
    const { query } = req.body || {};
    const q = String(query || '').trim();
    if (!q) return res.status(400).json({ hiba: 'Kell egy keresési kifejezés.' });

    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    // Mentjük a keresési előzményt
    await pool.query('INSERT INTO search_history (user_id, query) VALUES (?, ?)', [user.id, q.toLowerCase()]);

    // Ha a query egy műfaj (egyszerű heuristika: egy szó), növeljük a genre_preferences-t
    const maybeGenre = q.toLowerCase();
    if (maybeGenre.length > 1 && !maybeGenre.includes(' ')) {
      await pool.query(
        `INSERT INTO genre_preferences (user_id, genre, score) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE score = score + 1`,
        [user.id, maybeGenre],
      );
    }
    // Ensure stats row exists and increment search_count
    await pool.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);
    await pool.query('UPDATE user_stats SET search_count = search_count + 1 WHERE user_id = ?', [user.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/track_search hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a keresés mentésekor.' });
  }
});

// Megnyitott játék mentése + műfaj preferencia növelése
app.post('/api/track_opened', requireUser, async (req, res) => {
  try {
    const { steam_id, title, genre } = req.body || {};
    const sid = String(steam_id || '').trim();
    if (!sid) return res.status(400).json({ hiba: 'Kell egy steam_id.' });

    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    await pool.query('INSERT INTO opened_games (user_id, steam_app_id, title, genre) VALUES (?, ?, ?, ?)', [user.id, sid, String(title || null), String(genre || null)]);

    if (genre) {
      const g = String(genre).trim().toLowerCase();
      if (g) {
        await pool.query(
          `INSERT INTO genre_preferences (user_id, genre, score) VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE score = score + 1`,
          [user.id, g],
        );
      }

      // Ensure stats row exists and increment opened_count
      await pool.query('INSERT IGNORE INTO user_stats (user_id) VALUES (?)', [user.id]);
      await pool.query('UPDATE user_stats SET opened_count = opened_count + 1 WHERE user_id = ?', [user.id]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/track_opened hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a megnyitás mentésekor.' });
  }
});

// Top műfajok lekérése ajánláshoz
app.get('/api/recommendation_genres', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const [rows] = await pool.query(
      'SELECT genre, score FROM genre_preferences WHERE user_id = ? ORDER BY score DESC LIMIT 5',
      [user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/recommendation_genres hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba az ajánlások lekérésekor.' });
  }
});

// Keresési előzmény törlése (csak saját)
app.delete('/api/search_history/:id', requireUser, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (!itemId) return res.status(400).json({ hiba: 'Érvénytelen ID.' });

    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const [rows] = await pool.query('SELECT id FROM search_history WHERE id = ? AND user_id = ?', [itemId, user.id]);
    if (rows.length === 0) return res.status(404).json({ hiba: 'Nem található vagy nem a tiéd.' });

    await pool.query('DELETE FROM search_history WHERE id = ?', [itemId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/search_history/:id hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba.' });
  }
});

// Keresési előzmények lekérése (legutóbbi 30)
app.get('/api/search_history', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const [rows] = await pool.query(
      `SELECT id, query, created_at AS mikor
       FROM search_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/search_history hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba.' });
  }
});

// Megtekintett játékok lekérése (legutóbbi 30)
app.get('/api/opened_games', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const [rows] = await pool.query(
      `SELECT id, steam_app_id AS steam_id, title, genre, created_at AS mikor
       FROM opened_games
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/opened_games hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba.' });
  }
});

// Profil frissítése (avatár URL és/vagy név)
// Ha a névváltoztatás foglalt, suggestions tömböt ad vissza
app.put('/api/profile', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const { newName, avatarUrl } = req.body || {};
    const updates = {};

    // Névváltoztatás
    if (newName !== undefined) {
      const trimmed = String(newName || '').trim();
      if (!trimmed) return res.status(400).json({ hiba: 'A név nem lehet üres.' });
      if (trimmed.length > 50) return res.status(400).json({ hiba: 'A név maximum 50 karakter lehet.' });

      if (trimmed !== user.name) {
        // Ellenőrizzük, hogy szabad-e a név (saját user-t kizárjuk, így case-változtatás engedélyezett)
        const [taken] = await pool.query(
          'SELECT id FROM users WHERE name = ? AND id != ? LIMIT 1',
          [trimmed, user.id],
        );
        if (taken.length > 0) {
          // Generálunk szabad variációkat
          const candidates = [
            trimmed + '1',
            trimmed + '2',
            trimmed + '_pro',
            trimmed + '_gamer',
            'x_' + trimmed,
            trimmed + Math.floor(Math.random() * 900 + 100),
          ];
          const placeholders = candidates.map(() => '?').join(', ');
          const [takenCands] = await pool.query(
            `SELECT name FROM users WHERE name IN (${placeholders})`,
            candidates,
          );
          const takenSet = new Set(takenCands.map((r) => r.name.toLowerCase()));
          const suggestions = candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 4);
          return res.status(409).json({
            hiba: 'Ez a felhasználónév már foglalt.',
            suggestions,
          });
        }
        updates.name = trimmed;
      }
    }

    // Avatár URL
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl ? String(avatarUrl) : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
    }

    const setClauses = Object.keys(updates).map((k) => `\`${k}\` = ?`).join(', ');
    const values = [...Object.values(updates), user.id];
    await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);

    const updatedName = updates.name || user.name;
    const updatedAvatar = 'avatar_url' in updates ? updates.avatar_url : user.avatarUrl;

    res.json({
      ok: true,
      user: { id: user.id, name: updatedName, email: user.email, avatarUrl: updatedAvatar },
    });
  } catch (err) {
    console.error('PUT /api/profile hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a profil frissítésekor.' });
  }
});

// Admin overview – csak az 'admin' felhasználónak
app.get('/api/admin/overview', requireUser, requireAdmin, async (req, res) => {
  try {
    // Összes felhasználó + statisztikák + utolsó bejelentkezés
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at AS regDate, u.last_login_at AS lastLogin,
              COALESCE(s.search_count, 0) AS searches,
              COALESCE(s.opened_count, 0) AS opened,
              COALESCE(s.favorite_count, 0) AS favorites,
              COALESCE(s.comment_count, 0) AS comments,
              COALESCE(s.xp, 0) AS xp
       FROM users u
       LEFT JOIN user_stats s ON s.user_id = u.id
       ORDER BY u.id ASC`,
    );

    // Legutóbbi 100 keresési log (összes user)
    const [searchLogs] = await pool.query(
      `SELECT sh.id, u.name AS userName, sh.query, sh.created_at AS mikor
       FROM search_history sh
       JOIN users u ON sh.user_id = u.id
       ORDER BY sh.created_at DESC
       LIMIT 100`,
    );

    // Legutóbbi 100 megnyitott játék log
    const [openLogs] = await pool.query(
      `SELECT og.id, u.name AS userName, og.steam_app_id AS steamId, og.title, og.genre, og.created_at AS mikor
       FROM opened_games og
       JOIN users u ON og.user_id = u.id
       ORDER BY og.created_at DESC
       LIMIT 100`,
    );

    // Legutóbbi 100 komment
    const [commentLogs] = await pool.query(
      `SELECT c.id, u.name AS userName, c.steam_app_id AS steamId, c.text, c.created_at AS mikor
       FROM comments c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC
       LIMIT 100`,
    );

    // Achievement statisztika: hány user szerezte meg az egyes achievementeket
    const [achStats] = await pool.query(
      `SELECT ac.id, ac.title, COUNT(ua.user_id) AS count
       FROM achievement_catalog ac
       LEFT JOIN user_achievements ua ON ua.achievement_id = ac.id
       GROUP BY ac.id, ac.title
       ORDER BY count DESC`,
    );

    res.json({ users, searchLogs, openLogs, commentLogs, achStats });
  } catch (err) {
    console.error('GET /api/admin/overview hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba.' });
  }
});

app.get('/api/admin/database', requireUser, requireAdmin, async (req, res) => {
  try {
    const [dbInfoRows] = await pool.query(
      `SELECT DATABASE() AS dbName,
              VERSION() AS dbVersion,
              NOW() AS checkedAt,
              @@hostname AS dbHost`,
    );

    const [tableRows] = await pool.query(
      `SELECT t.TABLE_NAME AS name,
              t.ENGINE AS engine,
              COALESCE(t.TABLE_ROWS, 0) AS estimatedRows,
              t.DATA_LENGTH AS dataLength,
              t.INDEX_LENGTH AS indexLength,
              t.UPDATE_TIME AS updatedAt,
              COUNT(c.COLUMN_NAME) AS columnCount
       FROM information_schema.TABLES t
       LEFT JOIN information_schema.COLUMNS c
         ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
        AND c.TABLE_NAME = t.TABLE_NAME
       WHERE t.TABLE_SCHEMA = ?
       GROUP BY t.TABLE_NAME, t.ENGINE, t.TABLE_ROWS, t.DATA_LENGTH, t.INDEX_LENGTH, t.UPDATE_TIME
       ORDER BY t.TABLE_NAME ASC`,
      [DB_NAME],
    );

    const tables = [];
    let totalEstimatedRows = 0;
    for (const table of tableRows) {
      const safeName = String(table.name);
      if (!isSafeTableName(safeName)) continue;
      const [countRows] = await pool.query(`SELECT COUNT(*) AS rowCount FROM \`${safeName}\``);
      const rowCount = Number(countRows[0]?.rowCount) || 0;
      totalEstimatedRows += rowCount;
      tables.push({
        name: safeName,
        engine: table.engine,
        rowCount,
        estimatedRows: Number(table.estimatedRows) || 0,
        columnCount: Number(table.columnCount) || 0,
        sizeBytes: Number(table.dataLength || 0) + Number(table.indexLength || 0),
        updatedAt: table.updatedAt,
      });
    }

    res.json({
      ok: true,
      status: 'connected',
      dbName: dbInfoRows[0]?.dbName || DB_NAME,
      dbVersion: dbInfoRows[0]?.dbVersion || 'ismeretlen',
      dbHost: dbInfoRows[0]?.dbHost || DB_HOST,
      checkedAt: dbInfoRows[0]?.checkedAt || new Date().toISOString(),
      tableCount: tables.length,
      totalRows: totalEstimatedRows,
      tables,
    });
  } catch (err) {
    console.error('GET /api/admin/database hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba az adatbázis állapotának lekérésekor.' });
  }
});

app.get('/api/admin/database/:tableName', requireUser, requireAdmin, async (req, res) => {
  try {
    const tableName = String(req.params.tableName || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    if (!isSafeTableName(tableName)) {
      return res.status(400).json({ hiba: 'Érvénytelen táblanév.' });
    }

    const [allowedRows] = await pool.query(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       LIMIT 1`,
      [DB_NAME, tableName],
    );
    if (allowedRows.length === 0) {
      return res.status(404).json({ hiba: 'A tábla nem található.' });
    }

    const [columnRows] = await pool.query(
      `SELECT COLUMN_NAME AS name,
              COLUMN_TYPE AS type,
              IS_NULLABLE AS isNullable,
              COLUMN_KEY AS columnKey,
              COLUMN_DEFAULT AS defaultValue,
              EXTRA AS extra
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [DB_NAME, tableName],
    );

    const [countRows] = await pool.query(`SELECT COUNT(*) AS totalRows FROM \`${tableName}\``);
    const orderColumn = columnRows.find((c) => c.columnKey === 'PRI')?.name || columnRows[0]?.name || '1';
    const [previewRows] = await pool.query(
      `SELECT * FROM \`${tableName}\` ORDER BY \`${orderColumn}\` DESC LIMIT ${limit}`,
    );

    res.json({
      ok: true,
      tableName,
      totalRows: Number(countRows[0]?.totalRows) || 0,
      columns: columnRows,
      rows: previewRows,
    });
  } catch (err) {
    console.error('GET /api/admin/database/:tableName hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba a tábla adatainak lekérésekor.' });
  }
});

// Dev endpoint: AUTO_INCREMENT visszaállítása 1-re (csak üres táblán hat)
// Hasznos teszt felhasználók törlése után. Éles környezetben tiltott.
app.post('/api/dev/reset-autoincrement', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ hiba: 'Éles szerveren ez a művelet tiltott.' });
  }
  try {
    const tables = ['users', 'comments', 'favorites', 'opened_games', 'search_history'];
    for (const t of tables) {
      await pool.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
    }
    res.json({ ok: true, uzenet: 'AUTO_INCREMENT értékek visszaállítva 1-re (hatás: MAX(id)+1 vagy 1, ha üres a tábla).' });
  } catch (err) {
    console.error('POST /api/dev/reset-autoincrement hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba.' });
  }
});

const PORT = Number(globalThis.process?.env?.PORT) || 3002;

// Induláskor: avatar_url oszlop bővítése MEDIUMTEXT-re, ha még VARCHAR
pool.query('ALTER TABLE `users` MODIFY COLUMN `avatar_url` MEDIUMTEXT DEFAULT NULL')
  .then(() => console.log('  Migráció: avatar_url → MEDIUMTEXT ✓'))
  .catch(() => { /* már MEDIUMTEXT, vagy nem változott – nem baj */ });

// Induláskor: last_login_at oszlop hozzáadása, ha még nincs
pool.query('ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `last_login_at` DATETIME DEFAULT NULL')
  .then(() => console.log('  Migráció: last_login_at oszlop ✓'))
  .catch(() => { /* már létezik */ });

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
  console.log(`  Adatbázis: mysql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log('  GET  /api/kedvencek       – kedvencek listája');
  console.log('  POST /api/kedvencek       – új kedvenc (body: { steam_id, cim })');
  console.log('  DELETE /api/kedvencek/:id – kedvenc törlése');
  console.log('  GET  /api/comments/:steam_id – kommentek listája játékhoz');
  console.log('  POST /api/comments        – új komment (body: { steam_id, text })');
});

// --- Recommendation helper constants and endpoints ---
const STORE_ORIGIN = 'https://store.steampowered.com/api';
const LANG = 'hungarian';
const ADULT_KEYWORDS = [
  'hentai','erotic','sexual','sex','nudity','nude','porn','incest','lust','goddess',
];

function normalizeText(v) {
  return String(v || '').toLowerCase();
}

function isAdultContentServer(data) {
  const name = normalizeText(data?.name);
  const shortDesc = normalizeText(data?.short_description);
  const genres = Array.isArray(data?.genres) ? data.genres.map((g) => normalizeText(g?.description || g)) : [];
  const haystack = [name, shortDesc, ...genres].join(' ');
  return ADULT_KEYWORDS.some((k) => haystack.includes(k));
}

function censorTitleServer(title) {
  const t = String(title || '');
  if (normalizeText(t).includes('lust goddess')) return 'Lust G*****';
  return t
    .split(/\s+/)
    .map((w) => {
      const letters = w.replace(/[^A-Za-zÀ-ÿ0-9]/g, '');
      if (letters.length <= 2) return w.length > 0 ? w[0] + '*' : w;
      const keep = 2;
      const masked = letters.slice(0, keep) + '*'.repeat(Math.max(letters.length - keep, 1));
      return w.replace(letters, masked);
    })
    .join(' ');
}

function transformStoreDataServer(data, appId) {
  const genre = data.genres?.[0]?.description || data.genres?.[0] || 'Játék';
  const releaseDate = data.release_date?.date || '';
  const year = (releaseDate.match(/\d{4}/) || [])[0] || '';
  const priceOverview = data.price_overview;
  const price = priceOverview ? Number(priceOverview.final) / 100 : 0;
  const isFree = Boolean(data.is_free) || price === 0;
  const base = {
    id: String(appId),
    appId: Number(appId),
    title: data.name || 'Ismeretlen',
    year,
    rating: data.metacritic?.score ? Number(data.metacritic.score) / 10 : 0,
    genre,
    price,
    isFree,
    poster: data.header_image || data.small_image || null,
    plot: data.short_description || '',
    genres: data.genres?.map((g) => g.description) || [],
    release_date: releaseDate,
    steamUrl: `https://store.steampowered.com/app/${appId}`,
  };
  if (!isAdultContentServer(data)) return base;
  return {
    ...base,
    title: censorTitleServer(base.title),
    plot: 'Cenzúrázott tartalom (18+).',
    poster: null,
    isCensored: true,
  };
}

async function fetchStoreSearch(term, count = 12) {
  const url = `${STORE_ORIGIN}/storesearch/?term=${encodeURIComponent(term)}&l=${LANG}&cc=HU&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam search HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

async function fetchAppDetails(appId) {
  const url = `${STORE_ORIGIN}/appdetails?appids=${appId}&l=${LANG}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam details HTTP ${res.status}`);
  const text = await res.text();
  if (!text) throw new Error('Empty steam details');
  const parsed = JSON.parse(text);
  return parsed?.[appId];
}

// Szerver-oldali játékajánlások a felhasználó top műfajai alapján
app.get('/api/recommendations', requireUser, async (req, res) => {
  try {
    const user = await findUserByName(req.userName);
    if (!user) return res.status(401).json({ hiba: 'Ismeretlen felhasználó.' });

    const [genresRows] = await pool.query('SELECT genre FROM genre_preferences WHERE user_id = ? ORDER BY score DESC LIMIT 3', [user.id]);
    const topGenres = Array.isArray(genresRows) ? genresRows.map((r) => r.genre) : [];
    if (topGenres.length === 0) return res.json([]);

    const collectedIds = new Set();
    const appIds = [];
    for (const g of topGenres) {
      try {
        const items = await fetchStoreSearch(g, 12);
        for (const it of items) {
          const id = String(it.id);
          if (!collectedIds.has(id)) {
            collectedIds.add(id);
            appIds.push(id);
            if (appIds.length >= 24) break;
          }
        }
        if (appIds.length >= 24) break;
      } catch (e) {
        // ignore search failure for one genre
      }
    }

    const results = [];
    for (const id of appIds) {
      try {
        const details = await fetchAppDetails(id);
        if (details?.success && details.data) {
          const game = transformStoreDataServer(details.data, id);
          if (game.poster || game.isCensored) results.push(game);
        }
      } catch {
        // ignore individual failures
      }
    }

    const unique = results.filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i).slice(0, 24);
    res.json(unique);
  } catch (err) {
    console.error('GET /api/recommendations hiba:', err);
    res.status(500).json({ hiba: 'Szerverhiba az ajánlások előállítása során.' });
  }
});
