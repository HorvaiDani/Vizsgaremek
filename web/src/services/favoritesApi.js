/**
 * Kedvencek API – a szerver (MySQL) felé kommunikál
 * A szervernek futnia kell: npm run server
 */

const API = '/api';

export const getKedvencek = async () => {
  const res = await fetch(`${API}/kedvencek`);
  if (!res.ok) throw new Error('Nem sikerült betölteni a kedvenceket.');
  return res.json();
};

export const addKedvenc = async (steam_id, cim) => {
  const res = await fetch(`${API}/kedvencek`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steam_id: String(steam_id), cim: String(cim) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült menteni.');
  }
  return res.json();
};

export const deleteKedvenc = async (id) => {
  const res = await fetch(`${API}/kedvencek/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült törölni.');
  }
  return res.json();
};
