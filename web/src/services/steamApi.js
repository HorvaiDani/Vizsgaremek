// Steam API szolgáltatás – Steam Store és Web API kommunikáció
// Keresés: Steam Store API (nyilvános), játékos adatok: Steam Web API (kulcs szükséges)

const STEAM_API_KEY = '6FE4A795528F99F7FAF71C95849EB2A6';
// Dev: Vite proxy (/steam-api → store.steampowered.com/api). Production: CORS proxy, mert a Steam nem engedélyez CORS-t.
const STORE_ORIGIN = 'https://store.steampowered.com/api';
const WEB_API_BASE = 'https://api.steampowered.com';
const LANG = 'hungarian';

// Production-ben a CORS proxy miatt a path-et az origin után kell fűzni
function storeUrl(path) {
  if (import.meta.env.DEV) return `/steam-api${path}`;
  return 'https://corsproxy.io/?' + encodeURIComponent(STORE_ORIGIN + path);
}

// Népszerű játékok Steam App ID-i (fix lista a főoldalhoz)
const POPULAR_GAME_IDS = [
  730,      // Counter-Strike 2
  570,      // Dota 2
  1091500,  // Cyberpunk 2077
  1245620,  // ELDEN RING
  271590,   // Grand Theft Auto V
  578080,   // PUBG
  1172470,  // Apex Legends
  292030,   // The Witcher 3
  393080,   // Sid Meier's Civilization VI
  489830,   // The Elder Scrolls V: Skyrim
  1085660,  // Destiny 2
  381210,   // Dead by Daylight
];

// Egy vagy több játék részleteinek lekérése (Store API – appdetails)
export const getGameDetails = async (appIds) => {
  const ids = Array.isArray(appIds) ? appIds.join(',') : String(appIds);
  try {
    const url = storeUrl(`/appdetails?appids=${ids}&l=${LANG}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text || text.trim() === '') throw new Error('Üres válasz a Steam API-tól');
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('Hiba a játék részletek lekérésekor:', error);
    throw error;
  }
};

// Játékok keresése név alapján (Steam Store Search – nem hivatalos, de működik)
export const searchGames = async (query) => {
  try {
    const url = storeUrl(`/storesearch/?term=${encodeURIComponent(query)}&l=${LANG}&cc=HU`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.items || data.items.length === 0) return [];
    // Csak játékok (type === 'game' vagy 'app')
    const games = data.items.filter(
      (item) => item.type === 'game' || item.type === 'app' || !item.type
    );
    if (games.length === 0) return [];
    const appIds = games.slice(0, 12).map((g) => g.id);
    // Egyenkénti kérések – a Steam 400-at ad több appid esetén
    const results = await Promise.allSettled(appIds.map((id) => getGameDetails(id)));
    const transformed = [];
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const id = appIds[index];
      const details = result.value;
      const raw = details?.[id];
      if (raw?.success && raw?.data) {
        const game = transformStoreData(raw.data, id);
        if (game.poster) transformed.push(game);
      }
    });
    return transformed;
  } catch (error) {
    console.error('Hiba a játékok keresésekor:', error);
    throw error;
  }
};

// Store API „data” objektum átalakítása egységes formátumra
export const transformStoreData = (data, appId) => {
  const genre = data.genres?.[0]?.description || data.genres?.[0] || 'Játék';
  const releaseDate = data.release_date?.date || '';
  const year = releaseDate.match(/\d{4}/)?.[0] || '';
  const rating = data.metacritic?.score
    ? Number(data.metacritic.score) / 10
    : 0;
  return {
    id: String(appId),
    appId: Number(appId),
    title: data.name || 'Ismeretlen',
    year,
    rating,
    genre,
    poster: data.header_image || data.small_image || null,
    plot: data.short_description || '',
    genres: data.genres?.map((g) => g.description) || [],
    release_date: releaseDate,
    steamUrl: `https://store.steampowered.com/app/${appId}`,
  };
};

// Egy játék teljes adatai a részletoldalhoz (leírás, képek, értékelés)
export const getGameDetail = async (appId) => {
  const id = Number(appId) || String(appId);
  const details = await getGameDetails(id);
  const raw = details?.[id];
  if (!raw?.success || !raw?.data) return null;
  const data = raw.data;
  const base = transformStoreData(data, id);
  const screenshots = (data.screenshots || []).map((s) => ({
    thumb: s.path_thumbnail || s.path_full,
    full: s.path_full,
  })).filter((s) => s.full);
  return {
    ...base,
    description: data.detailed_description || data.short_description || base.plot,
    background: data.background || base.poster,
    screenshots,
    metacriticUrl: data.metacritic?.url || null,
  };
};

// Keresési találat (storesearch item) átalakítása, ha nincs appdetails hívás
export const transformSearchItem = (item) => {
  return {
    id: String(item.id),
    appId: item.id,
    title: item.name || 'Ismeretlen',
    year: '',
    rating: 0,
    genre: 'Játék',
    poster: item.small_image || item.tiny_image || null,
    plot: '',
    steamUrl: item.store_url || `https://store.steampowered.com/app/${item.id}`,
  };
};

// Népszerű játékok lekérése – egyenkénti kérések (a Steam 400-at ad több appid esetén)
export const getPopularGames = async () => {
  try {
    const ids = POPULAR_GAME_IDS.slice(0, 12);
    const results = await Promise.allSettled(ids.map((id) => getGameDetails(id)));
    const games = [];
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const id = ids[index];
      const details = result.value;
      const raw = details?.[id];
      if (raw?.success && raw?.data) {
        const game = transformStoreData(raw.data, id);
        if (game.poster) games.push(game);
      }
    });
    if (games.length === 0) {
      throw new Error('Egyetlen játék sem érkezett a Steam API-tól. Próbáld később.');
    }
    return games;
  } catch (error) {
    console.error('Hiba a népszerű játékok lekérésekor:', error);
    throw error;
  }
};

// Opcionális: Steam Web API – játékos összefoglaló (a kulcsot itt használjuk)
export const getPlayerSummaries = async (steamIds) => {
  const ids = Array.isArray(steamIds) ? steamIds.join(',') : String(steamIds);
  try {
    const response = await fetch(
      `${WEB_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${ids}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.response?.players || [];
  } catch (error) {
    console.error('Hiba a játékos adatok lekérésekor:', error);
    throw error;
  }
};
