/**
 * Kedvencek API – a szerver (MySQL) felé kommunikál
 * A szervernek futnia kell: npm run server
 */

const API = '/api';

const requireUserName = (userName) => {
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  return u;
};

export const getKedvencek = async (userName) => {
  const u = requireUserName(userName);
  const res = await fetch(`${API}/kedvencek`, {
    headers: { 'x-user': u },
  });
  if (!res.ok) throw new Error('Nem sikerült betölteni a kedvenceket.');
  return res.json();
};

export const addKedvenc = async (steam_id, cim, userName) => {
  const u = requireUserName(userName);
  const res = await fetch(`${API}/kedvencek`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user': u },
    body: JSON.stringify({ steam_id: String(steam_id), cim: String(cim) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült menteni.');
  }
  return res.json();
};

export const deleteKedvenc = async (id, userName) => {
  const u = requireUserName(userName);
  const res = await fetch(`${API}/kedvencek/${id}`, {
    method: 'DELETE',
    headers: { 'x-user': u },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült törölni.');
  }
  return res.json();
};
