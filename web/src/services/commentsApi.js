const API = '/api';

export const getComments = async (steamId) => {
  const sid = String(steamId || '').trim();
  if (!sid) return [];
  const res = await fetch(`${API}/comments/${encodeURIComponent(sid)}`);
  if (!res.ok) throw new Error('Nem sikerült betölteni a kommenteket.');
  return res.json();
};

export const addComment = async ({ steamId, text, userName }) => {
  const sid = String(steamId || '').trim();
  const t = String(text || '').trim();
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  if (!sid || !t) throw new Error('Hiányzó adatok.');

  const res = await fetch(`${API}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user': u,
    },
    body: JSON.stringify({ steam_id: sid, text: t }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült menteni a kommentet.');
  }
  return res.json();
};

