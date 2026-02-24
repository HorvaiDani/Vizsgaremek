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

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [openedCount, setOpenedCount] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [lastUnlocked, setLastUnlocked] = useState(null);
  const [filters, setFilters] = useState({
    year: '',
    price: 'any', // 'any' | 'free' | 'paid'
    genre: '',
  });
  const [hasCookieConsent, setHasCookieConsent] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = userBehavior.hasCookieConsent();
    setHasCookieConsent(consent);
    fetchPopularGames();
  }, []);

  const handleCookieConsentChange = (consent) => {
    setHasCookieConsent(consent);
    setShowRecommendations(!!consent);
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
      setShowRecommendations(false);
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

          let newAchievements = achievements;
          let unlocked = null;

          if (next >= 1 && !newAchievements.some((a) => a.id === 'search_1')) {
            unlocked = {
              id: 'search_1',
              title: 'Első keresés',
              description: 'Elindítottad az első játékkeresésed a GameHUB-ban.',
            };
            newAchievements = [...newAchievements, unlocked];
          }

          if (next >= 5 && !newAchievements.some((a) => a.id === 'search_5')) {
            unlocked = {
              id: 'search_5',
              title: 'Kezdő kereső',
              description: '5 játékra rákerestél a GameHUB-ban.',
            };
            newAchievements = [...newAchievements, unlocked];
          }

          if (newAchievements !== achievements) {
            setAchievements(newAchievements);
            setLastUnlocked(unlocked);
          } else {
            setLastUnlocked(null);
          }
        }
      } else {
        setGames([]);
        setError('Nem található játék a kereséshez. Próbálj más kifejezést.');
        setShowRecommendations(false);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('A keresés sikertelen. Próbáld újra.');
      setShowRecommendations(false);
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

      let newAchievements = achievements;
      let unlocked = null;

      if (nextOpened >= 1 && !newAchievements.some((a) => a.id === 'open_1')) {
        unlocked = {
          id: 'open_1',
          title: 'Első játék megnyitása',
          description: 'Megnyitottál egy játék részletes adatlapot.',
        };
        newAchievements = [...newAchievements, unlocked];
      }

      if (newAchievements !== achievements) {
        setAchievements(newAchievements);
        setLastUnlocked(unlocked);
      } else {
        setLastUnlocked(null);
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
    setAchievements([]);
    setLastUnlocked(null);
    navigate('/games');
  };

  const handleLogout = () => {
    setUser(null);
    setSearchCount(0);
    setFavoriteCount(0);
    setOpenedCount(0);
    setAchievements([]);
    setLastUnlocked(null);
  };

  const handleFavoriteAdded = () => {
    if (!user) return;

    const nextFav = favoriteCount + 1;
    setFavoriteCount(nextFav);

    let newAchievements = achievements;
    let unlocked = null;

    if (nextFav >= 1 && !newAchievements.some((a) => a.id === 'fav_1')) {
      unlocked = {
        id: 'fav_1',
        title: 'Első kedvenc',
        description: 'Hozzáadtál egy játékot a kedvenceidhez.',
      };
      newAchievements = [...newAchievements, unlocked];
    }

    if (nextFav >= 5 && !newAchievements.some((a) => a.id === 'fav_5')) {
      unlocked = {
        id: 'fav_5',
        title: 'Kedvenc gyűjtögető',
        description: 'Legalább 5 kedvenc játékot gyűjtöttél össze.',
      };
      newAchievements = [...newAchievements, unlocked];
    }

    if (newAchievements !== achievements) {
      setAchievements(newAchievements);
      setLastUnlocked(unlocked);
    } else {
      setLastUnlocked(null);
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
                    achievements={achievements}
                    searchCount={searchCount}
                    favoriteCount={favoriteCount}
                    openedCount={openedCount}
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
          <Route path="/game/:id" element={<GameDetail onFavoriteAdded={handleFavoriteAdded} />} />
          <Route path="/kedvencek" element={<Kedvencek />} />
          <Route
            path="/achievements"
            element={
              <Achievements
                achievements={achievements}
                searchCount={searchCount}
                favoriteCount={favoriteCount}
                openedCount={openedCount}
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
