const API = '/api';

export const getSearchHistory = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) return [];
  const res = await fetch(`${API}/search_history`, { headers: { 'x-user': u } });
  if (!res.ok) return [];
  return res.json();
};

export const deleteSearchHistoryItem = async (id, userName) => {
  const u = String(userName || '').trim();
  const res = await fetch(`${API}/search_history/${id}`, {
    method: 'DELETE',
    headers: { 'x-user': u },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült törölni.');
  }
  return res.json();
};

export const getOpenedGames = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) return [];
  const res = await fetch(`${API}/opened_games`, { headers: { 'x-user': u } });
  if (!res.ok) return [];
  return res.json();
};

/**
 * Profil frissítése.
 * @param {string} currentUserName - jelenlegi x-user fejléc értéke (azonosítás)
 * @param {{ newName?: string, avatarUrl?: string|null }} data
 * @returns {{ ok, user } | { hiba, suggestions? }}
 */
export const updateProfile = async (currentUserName, { newName, avatarUrl } = {}) => {
  const u = String(currentUserName || '').trim();
  if (!u) throw new Error('Bejelentkezés szükséges.');

  const body = {};
  if (newName !== undefined) body.newName = newName;
  if (avatarUrl !== undefined) body.avatarUrl = avatarUrl;

  const res = await fetch(`${API}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user': u },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.hiba || 'Nem sikerült frissíteni a profilt.');
    err.suggestions = data.suggestions || null;
    throw err;
  }

  return data;
};
