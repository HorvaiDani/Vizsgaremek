/**
 * GameHUB – extra egyszerű szerver kedvencekhez
 * Itt most NINCS igazi MySQL kapcsolat, mindent memóriában tárolunk,
 * hogy biztosan működjön akkor is, ha az adatbázis nincs jól beállítva.
 */
/* eslint-env node */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

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

// Nagyon kezdő megoldás: "ál-adatbázis" a memóriában
let kedvencek = [];
let kovetkezoId = 1;

// Összes kedvenc listázása
app.get('/api/kedvencek', requireUser, (req, res) => {
  res.json(kedvencek.filter((k) => k.user === req.userName));
});

// Új kedvenc hozzáadása
app.post('/api/kedvencek', requireUser, (req, res) => {
  const { steam_id, cim } = req.body;
  if (!steam_id || !cim) {
    return res.status(400).json({ hiba: 'Kell steam_id és cim.' });
  }

  const uj = {
    id: kovetkezoId++,
    steam_id: String(steam_id),
    cim: String(cim),
    user: req.userName,
    mikor: new Date().toISOString(),
  };

  const already = kedvencek.some(
    (k) => k.user === req.userName && k.steam_id === uj.steam_id
  );
  if (already) {
    return res.status(409).json({ hiba: 'Ez a játék már a kedvenceid között van.' });
  }

  kedvencek.push(uj);
  res.status(201).json({ ok: true, uzenet: 'Kedvenc mentve.', adat: uj });
});

// Kedvenc törlése id alapján
app.delete('/api/kedvencek/:id', requireUser, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ hiba: 'Kell egy id.' });
  }

  const index = kedvencek.findIndex((k) => k.id === id);
  if (index === -1) {
    return res.status(404).json({ hiba: 'Nincs ilyen kedvenc.' });
  }

  if (kedvencek[index].user !== req.userName) {
    return res.status(403).json({ hiba: 'Ehhez a kedvenchez nincs jogosultságod.' });
  }

  kedvencek.splice(index, 1);
  res.json({ ok: true, uzenet: 'Törölve.' });
});

// Kommentek – szintén memóriában
let kommentek = [];
let kovetkezoKommentId = 1;

// Kommentek listázása játékhoz (nyilvános)
app.get('/api/comments/:steam_id', (req, res) => {
  const steam_id = String(req.params.steam_id || '').trim();
  if (!steam_id) return res.status(400).json({ hiba: 'Kell egy steam_id.' });
  res.json(kommentek.filter((k) => k.steam_id === steam_id));
});

// Új komment írása (csak bejelentkezéssel)
app.post('/api/comments', requireUser, (req, res) => {
  const { steam_id, text } = req.body;
  const sid = String(steam_id || '').trim();
  const t = String(text || '').trim();
  if (!sid || !t) return res.status(400).json({ hiba: 'Kell steam_id és text.' });
  if (t.length > 500) return res.status(400).json({ hiba: 'A komment maximum 500 karakter lehet.' });

  const uj = {
    id: kovetkezoKommentId++,
    steam_id: sid,
    user: req.userName,
    text: t,
    mikor: new Date().toISOString(),
  };
  kommentek.unshift(uj);
  res.status(201).json({ ok: true, uzenet: 'Komment mentve.', adat: uj });
});

const PORT = Number(globalThis.process?.env?.PORT) || 3002;
app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
  console.log('  GET  /api/kedvencek     – kedvencek listája');
  console.log('  POST /api/kedvencek     – új kedvenc (body: { steam_id, cim })');
  console.log('  DELETE /api/kedvencek/:id – kedvenc törlése');
  console.log('  GET  /api/comments/:steam_id – kommentek listája játékhoz');
  console.log('  POST /api/comments      – új komment (body: { steam_id, text })');
});
