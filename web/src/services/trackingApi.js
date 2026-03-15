const API = '/api';

export const trackSearch = async (userName, query) => {
  const u = String(userName || '').trim();
  const q = String(query || '').trim();
  if (!u || !q) return null;
  const res = await fetch(`${API}/track_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user': u },
    body: JSON.stringify({ query: q }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült menteni a keresést.');
  }
  return res.json();
};

export const trackOpened = async (userName, { steam_id, title, genre }) => {
  const u = String(userName || '').trim();
  if (!u || !steam_id) return null;
  const res = await fetch(`${API}/track_opened`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user': u },
    body: JSON.stringify({ steam_id, title, genre }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült menteni a megnyitást.');
  }
  return res.json();
};

export const getRecommendationGenres = async (userName) => {
  const u = String(userName || '').trim();
  if (!u) return [];
  const res = await fetch(`${API}/recommendation_genres`, { headers: { 'x-user': u } });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.hiba || 'Nem sikerült lekérni a ajánlási műfajokat.');
  }
  return res.json();
};
