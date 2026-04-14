const API = '/api';

export const getAdminOverview = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  const res = await fetch(`${API}/admin/overview`, { headers: { 'x-user': u } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.hiba || 'Nem sikerült betölteni az admin adatokat.');
  return data;
};
