/**
 * GameHUB – extra egyszerű szerver kedvencekhez
 * Itt most NINCS igazi MySQL kapcsolat, mindent memóriában tárolunk,
 * hogy biztosan működjön akkor is, ha az adatbázis nincs jól beállítva.
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Nagyon kezdő megoldás: "ál-adatbázis" a memóriában
let kedvencek = [];
let kovetkezoId = 1;

// Összes kedvenc listázása
app.get('/api/kedvencek', (req, res) => {
  res.json(kedvencek);
});

// Új kedvenc hozzáadása
app.post('/api/kedvencek', (req, res) => {
  const { steam_id, cim } = req.body;
  if (!steam_id || !cim) {
    return res.status(400).json({ hiba: 'Kell steam_id és cim.' });
  }

  const uj = {
    id: kovetkezoId++,
    steam_id: String(steam_id),
    cim: String(cim),
    mikor: new Date().toISOString(),
  };

  kedvencek.push(uj);
  res.status(201).json({ ok: true, uzenet: 'Kedvenc mentve.', adat: uj });
});

// Kedvenc törlése id alapján
app.delete('/api/kedvencek/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ hiba: 'Kell egy id.' });
  }

  const index = kedvencek.findIndex((k) => k.id === id);
  if (index === -1) {
    return res.status(404).json({ hiba: 'Nincs ilyen kedvenc.' });
  }

  kedvencek.splice(index, 1);
  res.json({ ok: true, uzenet: 'Törölve.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
  console.log('  GET  /api/kedvencek     – kedvencek listája');
  console.log('  POST /api/kedvencek     – új kedvenc (body: { steam_id, cim })');
  console.log('  DELETE /api/kedvencek/:id – kedvenc törlése');
});
