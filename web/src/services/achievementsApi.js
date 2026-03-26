const API = '/api';

export const getUserAchievements = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) return [];

  const res = await fetch(`${API}/achievements`, {
    headers: { 'x-user': u },
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült betölteni az achievementeket.');
  }
  return res.json();
};

export const addUserAchievement = async (achievementId, userName) => {
  const u = String(userName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');
  if (!achievementId) throw new Error('Kell egy achievement id.');

  const res = await fetch(`${API}/achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user': u },
    body: JSON.stringify({ achievementId }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült menteni az achievementet.');
  }

  return res.json();
};

export const getUserStats = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) return null;
  const res = await fetch(`${API}/user_stats`, { headers: { 'x-user': u } });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült betölteni a statisztikákat.');
  }
  return res.json();
};
