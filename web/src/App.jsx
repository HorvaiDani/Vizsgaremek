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
import './App.css';

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

      if (Array.isArray(results) && results.length > 0) {
        setGames(results);
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
    navigate(`/game/${game.id}`);
  };

  const getSectionTitle = () => {
    if (searchQuery) return `Keresési eredmények: "${searchQuery}"`;
    return 'Népszerű játékok';
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <Search onSearch={handleSearch} loading={loading} />
          <Loading message={searchQuery ? 'Játékok keresése...' : 'Népszerű játékok betöltése...'} />
        </main>
        <CookieConsent onConsentChange={handleCookieConsentChange} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <Search onSearch={handleSearch} loading={loading} />
          <Error message={error} onRetry={handleRetry} />
        </main>
        <CookieConsent onConsentChange={handleCookieConsentChange} />
      </div>
    );
  }

  return (
    <div className="app">
      <ClickSpark />
      <Header />
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
            path="/games"
            element={
              <>
                <Search onSearch={handleSearch} loading={loading} />
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
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/kedvencek" element={<Kedvencek />} />
        </Routes>
      </main>
      <CookieConsent onConsentChange={handleCookieConsentChange} />
    </div>
  );
}

export default App;
