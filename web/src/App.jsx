// Fő alkalmazás – Steam stílusú játékos oldal
// Steam API: népszerű játékok, keresés, ajánlások

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import GameDetail from './components/GameDetail';
import Kedvencek from './components/Kedvencek';
import Search from './components/Search';
import Recommendations from './components/Recommendations';
import Landing from './components/Landing';
import ClickSpark from './components/ClickSpark';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CookieConsent from './components/CookieConsent';
import Loading from './components/Loading';
import Error from './components/Error';
import { getPopularGames, searchGames, getGameDetails, transformStoreData } from './services/steamApi';
import { userBehavior } from './services/cookieService';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Achievements from './components/Achievements';
import Admin from './components/Admin';
import { getUserAchievements, addUserAchievement, getUserStats } from './services/achievementsApi';
import { trackSearch, trackOpened } from './services/trackingApi';
import './App.css';

const GENRE_TERMS = [
  'akcio',
  'action',
  'adventure',
  'anime',
  'arcade',
  'battle royale',
  'casual',
  'co-op',
  'coop',
  'horror',
  'indie',
  'multiplayer',
  'open world',
  'platformer',
  'puzzle',
  'racing',
  'rpg',
  'shooter',
  'simulation',
  'sports',
  'strategy',
  'survival',
];

const FILTER_ONLY_SEARCH_SEEDS = [
  'game',
  'action',
  'adventure',
  'indie',
  'simulation',
  'strategy',
  'racing',
  'sports',
  'arcade',
  'multiplayer',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ACHIEVEMENT_CATALOG = [
  {
    id: 'login_1',
    title: 'Üdv a GameHUB-ban!',
    description: 'Bejelentkeztél és létrehoztad a profilod.',
    points: 10,
    reward: 'Profil-keret: Kezdő',
    metric: 'login',
    target: 1,
  },
  {
    id: 'search_1',
    title: 'Első keresés',
    description: 'Elindítottad az első játékkeresésed a GameHUB-ban.',
    points: 5,
    reward: 'Kereső jelvény',
    metric: 'search',
    target: 1,
  },
  {
    id: 'search_5',
    title: 'Kezdő kereső',
    description: '5 játékra rákerestél a GameHUB-ban.',
    points: 15,
    reward: '„Kíváncsi” rangcím',
    metric: 'search',
    target: 5,
  },
  {
    id: 'search_10',
    title: 'Profi kereső',
    description: '10 keresést végrehajtottál a GameHUB-ban.',
    points: 30,
    reward: 'Profil-keret: Bronz',
    metric: 'search',
    target: 10,
  },
  {
    id: 'search_20',
    title: 'Kereső legenda',
    description: '20 keresést végrehajtottál.',
    points: 50,
    reward: 'Profil-keret: Arany',
    metric: 'search',
    target: 20,
  },
  {
    id: 'open_1',
    title: 'Első játék megnyitása',
    description: 'Megnyitottál egy játék részletes adatlapot.',
    points: 5,
    reward: 'Felfedező jelvény',
    metric: 'open',
    target: 1,
  },
  {
    id: 'open_5',
    title: 'Kattintgató',
    description: 'Megnyitottál 5 játék adatlapot.',
    points: 20,
    reward: '„Felfedező” rangcím',
    metric: 'open',
    target: 5,
  },
  {
    id: 'open_10',
    title: 'Böngésző mester',
    description: 'Megnyitottál 10 játék adatlapot.',
    points: 40,
    reward: 'Profil-keret: Ezüst',
    metric: 'open',
    target: 10,
  },
  {
    id: 'open_20',
    title: 'Mindenevő böngésző',
    description: 'Megnyitottál 20 játék adatlapot.',
    points: 60,
    reward: 'Háttér téma: Neon',
    metric: 'open',
    target: 20,
  },
  {
    id: 'fav_1',
    title: 'Első kedvenc',
    description: 'Hozzáadtál egy játékot a kedvenceidhez.',
    points: 10,
    reward: '„Gyűjtögető” jelvény',
    metric: 'favorite',
    target: 1,
  },
  {
    id: 'fav_5',
    title: 'Kedvenc gyűjtögető',
    description: 'Legalább 5 kedvenc játékot gyűjtöttél össze.',
    points: 25,
    reward: 'Profil-keret: Bronz',
    metric: 'favorite',
    target: 5,
  },
  {
    id: 'fav_10',
    title: 'Kedvenc kurátor',
    description: '10 kedvenc játékot összegyűjtöttél.',
    points: 50,
    reward: 'Profil-keret: Arany',
    metric: 'favorite',
    target: 10,
  },
  {
    id: 'fav_20',
    title: 'Gyűjteményőr',
    description: '20 kedvenc játékot gyűjtöttél össze.',
    points: 75,
    reward: 'Profil-keret: Platin',
    metric: 'favorite',
    target: 20,
  },
  {
    id: 'comment_1',
    title: 'Első komment',
    description: 'Írtál egy kommentet egy játékhoz.',
    points: 10,
    reward: '„Véleményvezér” jelvény',
    metric: 'comment',
    target: 1,
  },
  {
    id: 'comment_5',
    title: 'Aktív kommentelő',
    description: 'Írtál 5 kommentet különböző játékokhoz.',
    points: 35,
    reward: 'Profil-keret: Ezüst',
    metric: 'comment',
    target: 5,
  },
  {
    id: 'comment_10',
    title: 'Közösségi arc',
    description: 'Írtál 10 kommentet játékokhoz.',
    points: 60,
    reward: 'Rangcím: „Kritikus”',
    metric: 'comment',
    target: 10,
  },
  {
    id: 'all_5',
    title: 'Mindenből egy kicsit',
    description: 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.',
    points: 80,
    reward: 'Profil-keret: Gyémánt',
    metric: 'all',
    target: 5,
  },
  {
    id: 'xp_60',
    title: 'Szintlépés',
    description: 'Érd el a 60 össz XP-t.',
    points: 0,
    reward: 'Rang: Felfedező',
    metric: 'xp',
    target: 60,
  },
  {
    id: 'xp_200',
    title: 'Legendás státusz',
    description: 'Érd el a 200 össz XP-t.',
    points: 0,
    reward: 'Rang: Legenda',
    metric: 'xp',
    target: 200,
  },
];

function App() {
  const PAGE_SIZE = 12;
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('gamehub_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [searchCount, setSearchCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [openedCount, setOpenedCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [lastUnlocked, setLastUnlocked] = useState(null);
  const [xp, setXp] = useState(0);
  const [filters, setFilters] = useState({
    year: '',
    price: 'any', // 'any' | 'free' | 'paid'
    genre: '',
  });
  const [hasMoreGames, setHasMoreGames] = useState(false);
  const [resultOffset, setResultOffset] = useState(0);
  const [hasCookieConsent, setHasCookieConsent] = useState(false);
  const navigate = useNavigate();

  // Sync global fallback for recommendation service after localStorage restore
  useEffect(() => {
    if (user?.name) window.__CURRENT_USER_NAME__ = user.name;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRankFromXp = (value) => {
    const v = Number(value) || 0;
    if (v >= 200) return 'Legenda';
    if (v >= 120) return 'Veterán';
    if (v >= 60) return 'Felfedező';
    if (v >= 20) return 'Újonc';
    return 'Kezdő';
  };

  const rank = getRankFromXp(xp);

  const unlockAchievement = (candidate) => {
    if (!candidate?.id) return;
    // If already unlocked locally, do nothing
    if (achievements.some((a) => a.id === candidate.id)) return;

    // Add locally, show toast and optimistically add XP; server will reconcile
    setAchievements((prev) => [...prev, candidate]);
    setLastUnlocked(candidate);
    if (typeof candidate.points === 'number') {
      setXp((prev) => prev + candidate.points);
    }

    // Persist unlocked achievement on the server (best-effort)
    if (user?.name) {
      addUserAchievement(candidate.id, user.name).then((res) => {
        if (res && res.stats && typeof res.stats.xp === 'number') {
          setXp(Number(res.stats.xp) || 0);
        }
      }).catch(() => {
        // ignore failures for now
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    if (xp >= 60) {
      unlockAchievement(ACHIEVEMENT_CATALOG.find((a) => a.id === 'xp_60'));
    }
    if (xp >= 200) {
      unlockAchievement(ACHIEVEMENT_CATALOG.find((a) => a.id === 'xp_200'));
    }
  }, [xp, user]);

  // Clear the lastUnlocked toast after shown once (6s)
  useEffect(() => {
    if (!lastUnlocked) return;
    const timer = setTimeout(() => setLastUnlocked(null), 6000);
    return () => clearTimeout(timer);
  }, [lastUnlocked]);

  useEffect(() => {
    const consent = userBehavior.hasCookieConsent();
    setHasCookieConsent(consent);
    fetchPopularGames();
  }, []);

  const handleCookieConsentChange = (consent) => {
    setHasCookieConsent(consent);
  };

  const parseSearchInput = (query) => {
    const raw = String(query || '').trim();
    if (!raw) {
      return { text: '', derivedFilters: {} };
    }

    let working = ` ${raw.toLowerCase()} `;
    const derivedFilters = {};

    const yearMatch = working.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      derivedFilters.year = yearMatch[1];
      working = working.replace(yearMatch[0], ' ');
    }

    if (/\b(ingyenes|free[- ]?to[- ]?play|free to play|free)\b/.test(working)) {
      derivedFilters.price = 'free';
      working = working.replace(/\b(ingyenes|free[- ]?to[- ]?play|free to play|free)\b/g, ' ');
    } else if (/\b(fizetos|fizetos|paid)\b/.test(working)) {
      derivedFilters.price = 'paid';
      working = working.replace(/\b(fizetos|fizetos|paid)\b/g, ' ');
    }

    const matchedGenre = GENRE_TERMS
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((genre) => working.includes(` ${genre} `));

    if (matchedGenre) {
      derivedFilters.genre = matchedGenre;
      working = working.replace(new RegExp(`\\b${matchedGenre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
    }

    const text = working.replace(/\s+/g, ' ').trim();
    return { text, derivedFilters };
  };

  const mergeFilters = (baseFilters, derivedFilters) => ({
    year: baseFilters.year || derivedFilters.year || '',
    price: baseFilters.price !== 'any' ? baseFilters.price : (derivedFilters.price || 'any'),
    genre: baseFilters.genre || derivedFilters.genre || '',
  });

  const dedupeGames = (items) => {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter((game) => {
      const id = String(game?.id || '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const applyClientFilters = (items, activeFilters) => {
    let processedResults = Array.isArray(items) ? items : [];

    if (activeFilters.year) {
      processedResults = processedResults.filter((game) => String(game.year) === String(activeFilters.year));
    }

    if (activeFilters.price && activeFilters.price !== 'any') {
      processedResults = processedResults.filter((game) =>
        activeFilters.price === 'free' ? game.isFree : !game.isFree
      );
    }

    if (activeFilters.genre) {
      const term = activeFilters.genre.toLowerCase();
      processedResults = processedResults.filter((game) => {
        const mainGenre = game.genre ? game.genre.toLowerCase() : '';
        const extraGenres = Array.isArray(game.genres) ? game.genres.map((g) => g.toLowerCase()) : [];
        return mainGenre.includes(term) || extraGenres.some((g) => g.includes(term));
      });
    }

    return processedResults;
  };

  const getSearchBaseTerm = (query, activeFilters) => {
    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery) return normalizedQuery;
    if (activeFilters.genre) return activeFilters.genre;
    return '';
  };

  const getSearchMode = (query, activeFilters) => {
    if (String(query || '').trim() || activeFilters.genre) return 'search';
    if (activeFilters.year || activeFilters.price !== 'any') return 'filter-only-search';
    return 'popular';
  };

  const searchByFiltersOnly = async (activeFilters, offset = 0) => {
    const seedPage = Math.floor(offset / PAGE_SIZE);
    const seeds = activeFilters.genre
      ? [activeFilters.genre, ...FILTER_ONLY_SEARCH_SEEDS.filter((seed) => seed && seed !== activeFilters.genre)]
      : FILTER_ONLY_SEARCH_SEEDS;

    const candidates = [];
    const candidateIds = new Set();
    const collected = [];
    const seen = new Set();

    for (const seed of seeds) {
      let results = [];
      try {
        results = await searchGames(seed, { start: seedPage * PAGE_SIZE, limit: PAGE_SIZE });
      } catch {
        continue;
      }
      for (const game of results) {
        const id = String(game?.id || '');
        if (!id || candidateIds.has(id)) continue;
        candidateIds.add(id);
        candidates.push(game);
      }
      if (candidates.length >= PAGE_SIZE * 10) break;
    }

    const requiresDetails = Boolean(activeFilters.year || activeFilters.genre);
    const sourceItems = requiresDetails ? candidates.slice(0, PAGE_SIZE * 5) : candidates;

    for (const game of sourceItems) {
      let candidate = game;

      if (requiresDetails) {
        try {
          const details = await getGameDetails(game.id);
          const raw = details?.[game.id];
          if (raw?.success && raw?.data) {
            candidate = transformStoreData(raw.data, game.id);
          }
          await sleep(220);
        } catch {
          // fallback to the lightweight search item if details fail
        }
      }

      const filtered = applyClientFilters([candidate], activeFilters);
      if (filtered.length === 0) continue;

      const id = String(candidate?.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      collected.push(candidate);
      if (collected.length >= PAGE_SIZE) {
        return collected;
      }
    }

    return collected;
  };

  const loadGamesBatch = async ({ query = '', activeFilters = filters, offset = 0, append = false } = {}) => {
    const rawQuery = String(query || '').trim();
    const parsed = parseSearchInput(query);
    const normalizedQuery = parsed.text;
    const effectiveFilters = mergeFilters(activeFilters, parsed.derivedFilters);
    const baseTerm = getSearchBaseTerm(normalizedQuery, effectiveFilters);
    const mode = getSearchMode(normalizedQuery, effectiveFilters);

    if (!append) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      let batch = [];

      if (mode === 'search') {
        const results = await searchGames(baseTerm, { start: offset, limit: PAGE_SIZE });
        batch = applyClientFilters(results, effectiveFilters);
      } else if (mode === 'filter-only-search') {
        batch = await searchByFiltersOnly(effectiveFilters, offset);
      } else {
        const results = await getPopularGames({ start: offset, count: PAGE_SIZE });
        batch = applyClientFilters(results, effectiveFilters);
      }

      const nextGames = append ? dedupeGames([...games, ...batch]) : dedupeGames(batch);
      setGames(nextGames);
      setResultOffset(offset + PAGE_SIZE);
      setHasMoreGames(batch.length === PAGE_SIZE);
      setSearchQuery(rawQuery);

      if (nextGames.length === 0) {
        setError('Nem található játék a megadott keresési feltételekhez. Próbálj más szűrőt vagy keresőkifejezést.');
      } else {
        setError(null);
      }

      return batch;
    } catch (err) {
      console.error('Search failed:', err);
      if (!append) {
        setError('A keresés sikertelen. Próbáld újra.');
      }
      return [];
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchPopularGames = async () => {
    await loadGamesBatch({
      query: '',
      activeFilters: { year: '', price: 'any', genre: '' },
      offset: 0,
      append: false,
    });
  };

  const handleSearch = async (query) => {
    const parsed = parseSearchInput(query);
    const normalizedQuery = parsed.text;
    const effectiveFilters = mergeFilters(filters, parsed.derivedFilters);
    const hasActiveFilters = Boolean(effectiveFilters.year || effectiveFilters.genre || effectiveFilters.price !== 'any');
    if (!normalizedQuery && !hasActiveFilters) {
      fetchPopularGames();
      return;
    }

    if (normalizedQuery && hasCookieConsent) {
      userBehavior.trackSearch(normalizedQuery);
      userBehavior.cleanSearchHistory(15);
    }

    const processedResults = await loadGamesBatch({
      query,
      activeFilters: effectiveFilters,
      offset: 0,
      append: false,
    });

    if (processedResults.length > 0 && user) {
      if (user?.name && normalizedQuery) {
        trackSearch(user.name, normalizedQuery).catch(() => {});
      }

      const next = searchCount + 1;
      setSearchCount(next);

      setLastUnlocked(null);

      if (next >= 1) {
        unlockAchievement({
          id: 'search_1',
          title: 'Első keresés',
          description: 'Elindítottad az első játékkeresésed a GameHUB-ban.',
          points: 5,
          reward: 'Kereső jelvény',
        });
      }

      if (next >= 5) {
        unlockAchievement({
          id: 'search_5',
          title: 'Kezdő kereső',
          description: '5 játékra rákerestél a GameHUB-ban.',
          points: 15,
          reward: '„Kíváncsi” rangcím',
        });
      }

      if (next >= 10) {
        unlockAchievement({
          id: 'search_10',
          title: 'Profi kereső',
          description: '10 keresést végrehajtottál a GameHUB-ban.',
          points: 30,
          reward: 'Profil-keret: Bronz',
        });
      }

      if (next >= 20) {
        unlockAchievement({
          id: 'search_20',
          title: 'Kereső legenda',
          description: '20 keresést végrehajtottál.',
          points: 50,
          reward: 'Profil-keret: Arany',
        });
      }

      if (next >= 5 && openedCount >= 5 && favoriteCount >= 5 && commentCount >= 5) {
        unlockAchievement({
          id: 'all_5',
          title: 'Mindenből egy kicsit',
          description: 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.',
          points: 80,
          reward: 'Profil-keret: Gyémánt',
        });
      }
    }
  };

  const handleRetry = () => {
    if (searchQuery || filters.year || filters.genre || filters.price !== 'any') handleSearch(searchQuery);
    else fetchPopularGames();
  };

  const handleLoadMore = async () => {
    await loadGamesBatch({
      query: searchQuery,
      activeFilters: filters,
      offset: resultOffset,
      append: true,
    });
  };

  const handleGameClick = (game) => {
    if (hasCookieConsent) {
      userBehavior.trackMovieView(game.id, game.title, game.genre);
      userBehavior.trackGenrePreference(game.genre);
    }

    if (user) {
      // persist opened game and genre preference server-side
      trackOpened(user.name, { steam_id: game.id, title: game.title, genre: game.genre }).catch(() => {});

      const nextOpened = openedCount + 1;
      setOpenedCount(nextOpened);

      setLastUnlocked(null);

      if (nextOpened >= 1) {
        unlockAchievement({
          id: 'open_1',
          title: 'Első játék megnyitása',
          description: 'Megnyitottál egy játék részletes adatlapot.',
          points: 5,
          reward: 'Felfedező jelvény',
        });
      }

      if (nextOpened >= 5) {
        unlockAchievement({
          id: 'open_5',
          title: 'Kattintgató',
          description: 'Megnyitottál 5 játék adatlapot.',
          points: 20,
          reward: '„Felfedező” rangcím',
        });
      }

      if (nextOpened >= 10) {
        unlockAchievement({
          id: 'open_10',
          title: 'Böngésző mester',
          description: 'Megnyitottál 10 játék adatlapot.',
          points: 40,
          reward: 'Profil-keret: Ezüst',
        });
      }

      if (nextOpened >= 20) {
        unlockAchievement({
          id: 'open_20',
          title: 'Mindenevő böngésző',
          description: 'Megnyitottál 20 játék adatlapot.',
          points: 60,
          reward: 'Háttér téma: Neon',
        });
      }

      if (searchCount >= 5 && nextOpened >= 5 && favoriteCount >= 5 && commentCount >= 5) {
        unlockAchievement({
          id: 'all_5',
          title: 'Mindenből egy kicsit',
          description: 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.',
          points: 80,
          reward: 'Profil-keret: Gyémánt',
        });
      }
    }

    navigate(`/game/${game.id}`);
  };

  const getSectionTitle = () => {
    if (searchQuery) return `Keresési eredmények: "${searchQuery}"`;
    if (filters.year || filters.genre || filters.price !== 'any') return 'Szurt jatekok';
    return 'Népszerű játékok';
  };

  const handleFiltersChange = (updatedFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
    }));
  };

  const handleLogin = (userData) => {
    setUser(userData);
    try { localStorage.setItem('gamehub_user', JSON.stringify(userData)); } catch {}
    setSearchCount(0);
    setFavoriteCount(0);
    setOpenedCount(0);
    setCommentCount(0);
    setAchievements([]);
    setLastUnlocked(null);
    setXp(0);
    navigate('/games');

    (async () => {
      try {
        const stats = await getUserStats(userData.name).catch(() => null);
        if (stats) {
          setSearchCount(Number(stats.search_count) || 0);
          setOpenedCount(Number(stats.opened_count) || 0);
          setFavoriteCount(Number(stats.favorite_count) || 0);
          setCommentCount(Number(stats.comment_count) || 0);
          setXp(Number(stats.xp) || 0);
        }

        const list = await getUserAchievements(userData.name).catch(() => []);
        setAchievements(Array.isArray(list) ? list.map((a) => ({ id: a.id, title: a.title, description: a.description, points: a.points })) : []);

        // Ensure login achievement is stored
        try {
          const saved = await addUserAchievement('login_1', userData.name).catch(() => null);
          if (saved && saved.stats && typeof saved.stats.xp === 'number') {
            setXp(Number(saved.stats.xp) || 0);
          }
          // refresh achievements
          const refreshed = await getUserAchievements(userData.name).catch(() => []);
          setAchievements(Array.isArray(refreshed) ? refreshed.map((a) => ({ id: a.id, title: a.title, description: a.description, points: a.points })) : []);
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // ignore errors
      }
    })();
    // expose current user for recommendation service fallback
    window.__CURRENT_USER_NAME__ = userData.name;
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    try { localStorage.setItem('gamehub_user', JSON.stringify(updatedUser)); } catch {}
    window.__CURRENT_USER_NAME__ = updatedUser?.name || '';
  };

  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem('gamehub_user'); } catch {}
    setSearchCount(0);
    setFavoriteCount(0);
    setOpenedCount(0);
    setCommentCount(0);
    setAchievements([]);
    setLastUnlocked(null);
    setXp(0);
    window.__CURRENT_USER_NAME__ = '';
  };

  const handleFavoriteAdded = () => {
    if (!user) return;

    const nextFav = favoriteCount + 1;
    setFavoriteCount(nextFav);

    setLastUnlocked(null);

    if (nextFav >= 1) {
      unlockAchievement({
        id: 'fav_1',
        title: 'Első kedvenc',
        description: 'Hozzáadtál egy játékot a kedvenceidhez.',
        points: 10,
        reward: '„Gyűjtögető” jelvény',
      });
    }

    if (nextFav >= 5) {
      unlockAchievement({
        id: 'fav_5',
        title: 'Kedvenc gyűjtögető',
        description: 'Legalább 5 kedvenc játékot gyűjtöttél össze.',
        points: 25,
        reward: 'Profil-keret: Bronz',
      });
    }

    if (nextFav >= 10) {
      unlockAchievement({
        id: 'fav_10',
        title: 'Kedvenc kurátor',
        description: '10 kedvenc játékot összegyűjtöttél.',
        points: 50,
        reward: 'Profil-keret: Arany',
      });
    }

    if (nextFav >= 20) {
      unlockAchievement({
        id: 'fav_20',
        title: 'Gyűjteményőr',
        description: '20 kedvenc játékot gyűjtöttél össze.',
        points: 75,
        reward: 'Profil-keret: Platin',
      });
    }

    if (searchCount >= 5 && openedCount >= 5 && nextFav >= 5 && commentCount >= 5) {
      unlockAchievement({
        id: 'all_5',
        title: 'Mindenből egy kicsit',
        description: 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.',
        points: 80,
        reward: 'Profil-keret: Gyémánt',
      });
    }
  };

  const handleCommentAdded = () => {
    if (!user) return;
    const next = commentCount + 1;
    setCommentCount(next);
    setLastUnlocked(null);

    if (next >= 1) {
      unlockAchievement({
        id: 'comment_1',
        title: 'Első komment',
        description: 'Írtál egy kommentet egy játékhoz.',
        points: 10,
        reward: '„Véleményvezér” jelvény',
      });
    }

    if (next >= 5) {
      unlockAchievement({
        id: 'comment_5',
        title: 'Aktív kommentelő',
        description: 'Írtál 5 kommentet különböző játékokhoz.',
        points: 35,
        reward: 'Profil-keret: Ezüst',
      });
    }

    if (next >= 10) {
      unlockAchievement({
        id: 'comment_10',
        title: 'Közösségi arc',
        description: 'Írtál 10 kommentet játékokhoz.',
        points: 60,
        reward: 'Rangcím: „Kritikus”',
      });
    }

    if (searchCount >= 5 && openedCount >= 5 && favoriteCount >= 5 && next >= 5) {
      unlockAchievement({
        id: 'all_5',
        title: 'Mindenből egy kicsit',
        description: 'Legyen meg 5 keresés, 5 megnyitás, 5 kedvenc és 5 komment.',
        points: 80,
        reward: 'Profil-keret: Gyémánt',
      });
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Header user={user} onLogout={handleLogout} onHome={() => { fetchPopularGames(); navigate('/games'); }} />
        <main className="main-content">
          <Search
            onSearch={handleSearch}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
          />
          <Loading message={searchQuery ? 'Játékok keresése...' : 'Népszerű játékok betöltése...'} />
        </main>
        <CookieConsent onConsentChange={handleCookieConsentChange} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header user={user} onLogout={handleLogout} onHome={() => { fetchPopularGames(); navigate('/games'); }} />
        <main className="main-content">
          <Search
            onSearch={handleSearch}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
          />
          <Error message={error} onRetry={handleRetry} />
        </main>
        <CookieConsent onConsentChange={handleCookieConsentChange} />
      </div>
    );
  }

  return (
    <div className="app">
      <ClickSpark />
      <Header user={user} onLogout={handleLogout} onHome={() => { fetchPopularGames(); navigate('/games'); }} />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Landing onCTAClick={() => navigate('/games')} />
                <section className="home-info-section">
                  <h2 className="home-info-title">Miről szól a GameHUB?</h2>
                  <p className="home-info-description">
                    A GameHUB egy Steam stílusú játékos kereső és ajánló. Kereshetsz kedvenc játékaidra,
                    megtekintheted a népszerű címeket, és személyre szabott ajánlásokat kapsz
                    a kereséseid és műfajpreferenciáid alapján.
                  </p>
                </section>
              </>
            }
          />
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={<Register onLogin={handleLogin} />}
          />
          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                xp={xp}
                achievements={achievements}
                onUserUpdate={handleUserUpdate}
              />
            }
          />
          <Route
            path="/admin"
            element={<Admin user={user} />}
          />
          <Route
            path="/games"
            element={
              <>
                <Search
                  onSearch={handleSearch}
                  loading={loading}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  searchQuery={searchQuery}
                />
                {user && lastUnlocked && (
                  <div className="achievement-inline-toast">
                    <div className="achievement-toast">
                      <span className="achievement-toast-label">Új achievement!</span>
                      <strong>{lastUnlocked.title}</strong>
                      <span className="achievement-toast-desc">{lastUnlocked.description}</span>
                      {(typeof lastUnlocked.points === 'number' || lastUnlocked.reward) && (
                        <span className="achievement-toast-reward">
                          {typeof lastUnlocked.points === 'number' ? `+${lastUnlocked.points} XP` : null}
                          {typeof lastUnlocked.points === 'number' && lastUnlocked.reward ? ' • ' : null}
                          {lastUnlocked.reward || null}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <GameGrid
                  games={games}
                  title={getSectionTitle()}
                  onGameClick={handleGameClick}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMoreGames}
                  loadingMore={loadingMore}
                />
                {hasCookieConsent && (
                  <Recommendations
                    key={searchQuery || 'default'}
                    searchQuery={searchQuery}
                    onGameClick={handleGameClick}
                  />
                )}
              </>
            }
          />
          <Route
            path="/game/:id"
            element={<GameDetail user={user} onFavoriteAdded={handleFavoriteAdded} onCommentAdded={handleCommentAdded} onBackToGames={() => navigate('/games')} />}
          />
          <Route path="/kedvencek" element={<Kedvencek user={user} />} />
          <Route
            path="/achievements"
            element={
              <Achievements
                catalog={ACHIEVEMENT_CATALOG}
                achievements={achievements}
                searchCount={searchCount}
                favoriteCount={favoriteCount}
                openedCount={openedCount}
                commentCount={commentCount}
                xp={xp}
                rank={rank}
                isLoggedIn={!!user}
                lastUnlocked={lastUnlocked}
              />
            }
          />
        </Routes>
      </main>
      <CookieConsent onConsentChange={handleCookieConsentChange} />
    </div>
  );
}

export default App;
