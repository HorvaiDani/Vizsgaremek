/**
 * GameHUB – egyszerű szerver a kedvencek tárolásához (MySQL)
 * Indítás: npm run server  (a projekt gyökeréből)
 */

import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// MySQL kapcsolat – ugyanazok a adatok, mint a schema.sql-nél (root/jelszó nélkül lokálban)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gamehub',
});

// ----- Egyszerű végpontok -----

// Összes kedvenc listázása
app.get('/api/kedvencek', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, steam_id, cim, mikor FROM kedvencek ORDER BY mikor DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ hiba: 'Nem sikerült betölteni a kedvenceket.' });
  }
});

// Új kedvenc hozzáadása
app.post('/api/kedvencek', async (req, res) => {
  const { steam_id, cim } = req.body;
  if (!steam_id || !cim) {
    return res.status(400).json({ hiba: 'Kell steam_id és cim.' });
  }
  try {
    await db.query('INSERT INTO kedvencek (steam_id, cim) VALUES (?, ?)', [String(steam_id), String(cim)]);
    res.status(201).json({ ok: true, uzenet: 'Kedvenc mentve.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ hiba: 'Nem sikerült menteni.' });
  }
});

// Kedvenc törlése id alapján
app.delete('/api/kedvencek/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ hiba: 'Kell egy id.' });
  try {
    const [result] = await db.query('DELETE FROM kedvencek WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ hiba: 'Nincs ilyen kedvenc.' });
    }
    res.json({ ok: true, uzenet: 'Törölve.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ hiba: 'Nem sikerült törölni.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
  console.log('  GET  /api/kedvencek     – kedvencek listája');
  console.log('  POST /api/kedvencek     – új kedvenc (body: { steam_id, cim })');
  console.log('  DELETE /api/kedvencek/:id – kedvenc törlése');
});
