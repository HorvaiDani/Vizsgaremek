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
import { getPopularGames, searchGames } from './services/steamApi';
import { userBehavior } from './services/cookieService';
import Login from './components/Login';
import Achievements from './components/Achievements';
import './App.css';

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
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
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
  const [hasCookieConsent, setHasCookieConsent] = useState(false);
  const navigate = useNavigate();

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
    setAchievements((prev) => {
      if (prev.some((a) => a.id === candidate.id)) return prev;
      return [...prev, candidate];
    });
    setLastUnlocked(candidate);
    if (typeof candidate.points === 'number') {
      setXp((prev) => prev + candidate.points);
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

  useEffect(() => {
    const consent = userBehavior.hasCookieConsent();
    setHasCookieConsent(consent);
    fetchPopularGames();
  }, []);

  const handleCookieConsentChange = (consent) => {
    setHasCookieConsent(consent);
  };

  const fetchPopularGames = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery('');
      const data = await getPopularGames();
      setGames(data);
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError('Nem sikerült betölteni a játékokat. Ellenőrizd az internetkapcsolatot és próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      fetchPopularGames();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchQuery(query);
      if (hasCookieConsent) {
        userBehavior.trackSearch(query);
        userBehavior.cleanSearchHistory(15);
      }

      const results = await searchGames(query);
      let processedResults = Array.isArray(results) ? results : [];

      // Kliens oldali szűrés év, ár és típus alapján
      if (filters.year) {
        processedResults = processedResults.filter((game) => String(game.year) === String(filters.year));
      }

      if (filters.price && filters.price !== 'any') {
        processedResults = processedResults.filter((game) =>
          filters.price === 'free' ? game.isFree : !game.isFree
        );
      }

      if (filters.genre) {
        const term = filters.genre.toLowerCase();
        processedResults = processedResults.filter((game) => {
          const mainGenre = game.genre ? game.genre.toLowerCase() : '';
          const extraGenres = Array.isArray(game.genres) ? game.genres.map((g) => g.toLowerCase()) : [];
          return mainGenre.includes(term) || extraGenres.some((g) => g.includes(term));
        });
      }

      if (processedResults.length > 0) {
        setGames(processedResults);

        // Achievement számláló csak bejelentkezett felhasználónál
        if (user) {
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
      } else {
        setGames([]);
        setError('Nem található játék a kereséshez. Próbálj más kifejezést.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('A keresés sikertelen. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (searchQuery) handleSearch(searchQuery);
    else fetchPopularGames();
  };

  const handleGameClick = (game) => {
    if (hasCookieConsent) {
      userBehavior.trackMovieView(game.id, game.title, game.genre);
      userBehavior.trackGenrePreference(game.genre);
    }

    if (user) {
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
    setSearchCount(0);
    setFavoriteCount(0);
    setOpenedCount(0);
    setCommentCount(0);
    setAchievements([]);
    setLastUnlocked(null);
    setXp(0);
    unlockAchievement({
      id: 'login_1',
      title: 'Üdv a GameHUB-ban!',
      description: 'Bejelentkeztél és létrehoztad a profilod.',
      points: 10,
      reward: 'Profil-keret: Kezdő',
    });
    navigate('/games');
  };

  const handleLogout = () => {
    setUser(null);
    setSearchCount(0);
    setFavoriteCount(0);
    setOpenedCount(0);
    setCommentCount(0);
    setAchievements([]);
    setLastUnlocked(null);
    setXp(0);
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
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Search
            onSearch={handleSearch}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
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
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Search
            onSearch={handleSearch}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
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
      <Header user={user} onLogout={handleLogout} />
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
            path="/games"
            element={
              <>
                <Search
                  onSearch={handleSearch}
                  loading={loading}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
                {user && (
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
                )}
                <GameGrid games={games} title={getSectionTitle()} onGameClick={handleGameClick} />
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
            element={<GameDetail user={user} onFavoriteAdded={handleFavoriteAdded} onCommentAdded={handleCommentAdded} />}
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
