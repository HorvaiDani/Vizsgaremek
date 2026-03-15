/* eslint-env node */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());

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
  if (!trimmedName) {
    throw new Error('NAME_REQUIRED');
  }
  if (!rawPassword) {
    throw new Error('PASSWORD_REQUIRED');
  }

  const [existing] = await pool.query(
    'SELECT id, name, email, avatar_url AS avatarUrl FROM users WHERE name = ? LIMIT 1',
    [trimmedName],
  );
  if (existing.length > 0) {
    return { user: existing[0], created: false };
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

// Egyszerű "regisztráció": felhasználó mentése az adatbázisba
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, avatarUrl, password } = req.body || {};
    const result = await createUser({ name, email, avatarUrl, password });
    res.status(result.created ? 201 : 200).json({
      ok: true,
      created: result.created,
      user: result.user,
    });
  } catch (err) {
    if (err.message === 'NAME_REQUIRED') {
      return res.status(400).json({ hiba: 'A név megadása kötelező.' });
    }
    if (err.message === 'PASSWORD_REQUIRED') {
      return res.status(400).json({ hiba: 'A jelszó megadása kötelező.' });
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

const PORT = Number(globalThis.process?.env?.PORT) || 3002;
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
