const API = '/api';

export const getAdminOverview = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  const res = await fetch(`${API}/admin/overview`, { headers: { 'x-user': u } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.hiba || 'Nem sikerült betölteni az admin adatokat.');
  return data;
};

export const getAdminDatabaseSummary = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  const res = await fetch(`${API}/admin/database`, { headers: { 'x-user': u } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.hiba || 'Nem sikerült betölteni az adatbázis állapotát.');
  return data;
};

export const getAdminTablePreview = async (userName, tableName, limit = 20) => {
  const u = String(userName || '').trim();
  const table = String(tableName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  if (!table) throw new Error('Hiányzó táblanév.');
  const res = await fetch(`${API}/admin/database/${encodeURIComponent(table)}?limit=${limit}`, {
    headers: { 'x-user': u },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.hiba || 'Nem sikerült betölteni a tábla adatait.');
  return data;
};
