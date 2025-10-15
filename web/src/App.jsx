// Fő alkalmazás komponens - Ez a React alkalmazás központi komponense
// Ez kezeli az állapotokat, API hívásokat, felhasználói interakciókat és személyre szabást

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MovieGrid from './components/MovieGrid';
import Search from './components/Search';
import Recommendations from './components/Recommendations';
import Landing from './components/Landing';
import ClickSpark from './components/ClickSpark';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CookieConsent from './components/CookieConsent';
import Loading from './components/Loading';
import Error from './components/Error';
import { getPopularMovies, searchMovies, transformMovieData } from './services/omdbApi';
import { userBehavior } from './services/cookieService';
import './App.css';

function App() {
  // Állapot változók - ezek tárolják az alkalmazás adatait
  const [movies, setMovies] = useState([]); // A filmek listája
  const [loading, setLoading] = useState(true); // Betöltés állapota
  const [error, setError] = useState(null); // Hibaüzenetek
  const [searchQuery, setSearchQuery] = useState(''); // Aktuális keresési kifejezés
  const [hasCookieConsent, setHasCookieConsent] = useState(false); // Cookie hozzájárulás állapota
  const [showRecommendations, setShowRecommendations] = useState(false); // Ajánlások megjelenítése
  const navigate = useNavigate();

  // useEffect hook - az oldal betöltésekor fut le
  useEffect(() => {
    // Cookie hozzájárulás ellenőrzése
    const consent = userBehavior.hasCookieConsent();
    setHasCookieConsent(consent);
    
    // Népszerű filmek betöltése
    fetchPopularMovies();
  }, []);

  // Cookie hozzájárulás változásának kezelése
  const handleCookieConsentChange = (consent) => {
    setHasCookieConsent(consent);
    if (consent) {
      // Ha elfogadta a cookie-kat, betöltjük az ajánlásokat
      setShowRecommendations(true);
    } else {
      // Ha elutasította, elrejtjük az ajánlásokat
      setShowRecommendations(false);
    }
  };

  // Népszerű filmek lekérése az API-ból
  const fetchPopularMovies = async () => {
    try {
      setLoading(true); // Betöltés indítása
      setError(null); // Hibaüzenetek törlése
      setSearchQuery(''); // Keresési kifejezés törlése
      const movieData = await getPopularMovies(); // API hívás
      setMovies(movieData); // Filmek beállítása
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      setError('Nem sikerült betölteni a filmeket. Kérjük, ellenőrizze az internetkapcsolatát és próbálja újra.');
    } finally {
      setLoading(false); // Betöltés befejezése
    }
  };

  // Filmek keresése a felhasználó által megadott kifejezés alapján
  const handleSearch = async (query) => {
    // Ha üres a keresési kifejezés, visszatérünk a népszerű filmekhez
    if (!query.trim()) {
      fetchPopularMovies();
      setShowRecommendations(false); // Ajánlások elrejtése
      return;
    }

    try {
      setLoading(true); // Betöltés indítása
      setError(null); // Hibaüzenetek törlése
      setSearchQuery(query); // Keresési kifejezés mentése
      // Don't hide recommendations immediately - let the component handle the update
      
      // Felhasználói keresés követése (ha van hozzájárulás)
      if (hasCookieConsent) {
        userBehavior.trackSearch(query);
        // Keresési előzmények tisztítása - csak az utolsó 15 keresést tartjuk meg
        userBehavior.cleanSearchHistory(15);
      }
      
      const searchData = await searchMovies(query); // API keresés
      
      // Ha találatokat kaptunk
      if (searchData.Search && searchData.Search.length > 0) {
        // Keresési eredmények átalakítása az alkalmazásunk formátumára
        const transformedMovies = searchData.Search
          .map(movie => transformMovieData(movie))
          .filter(movie => movie.poster !== null); // Csak azok a filmek, amelyeknek van plakátja
        
        setMovies(transformedMovies); // Filmek beállítása
        
        // Ajánlások már láthatók lesznek, a komponens kezeli a frissítést
      } else {
        setMovies([]); // Üres lista
        setError('Nem található film a kereséshez. Próbáljon más keresési kifejezést.');
        setShowRecommendations(false); // Ajánlások elrejtése ha nincs találat
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('A keresés sikertelen. Kérjük, próbálja újra.');
      setShowRecommendations(false); // Ajánlások elrejtése hiba esetén
    } finally {
      setLoading(false); // Betöltés befejezése
    }
  };

  // Újrapróbálkozás funkció hiba esetén
  const handleRetry = () => {
    if (searchQuery) {
      handleSearch(searchQuery); // Ha keresés volt, újra keresünk
    } else {
      fetchPopularMovies(); // Különben népszerű filmeket töltünk
    }
  };

  // Film kattintás kezelése
  const handleMovieClick = (movie) => {
    // Film nézettség követése (ha van hozzájárulás)
    if (hasCookieConsent) {
      userBehavior.trackMovieView(movie.id, movie.title, movie.genre);
      userBehavior.trackGenrePreference(movie.genre);
    }
  };

  // Szakasz címének meghatározása
  const getSectionTitle = () => {
    if (searchQuery) {
      return `Keresési eredmények: "${searchQuery}"`; // Keresési eredmények címe
    }
    return "Legjobban értékelt filmek"; // Alapértelmezett cím
  };

  // Betöltés állapot megjelenítése
  if (loading) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <Search onSearch={handleSearch} loading={loading} />
          <Loading message={searchQuery ? "Filmek keresése..." : "Népszerű filmek betöltése..."} />
        </main>
        <CookieConsent onConsentChange={handleCookieConsentChange} />
      </div>
    );
  }

  // Hiba állapot megjelenítése
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

  // Fő layout, útvonalakkal
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
                <Landing onCTAClick={() => navigate('/movies')} />
                {/* Home info szekció magyar leírással */}
                <section className="home-info-section">
                  <h2 className="home-info-title">Miről szól a PopcornHUB?</h2>
                  <p className="home-info-description">
                    A PopcornHUB egy modern filmes kereső és ajánló alkalmazás. Kereshetsz kedvenc filmjeidre,
                    megtekintheted a legjobban értékelt alkotásokat, és személyre szabott ajánlásokat kapsz
                    a kereséseid és műfajpreferenciáid alapján.
                  </p>
                </section>
              </>
            }
          />
          <Route
            path="/movies"
            element={
              <>
                <Search onSearch={handleSearch} loading={loading} />
                <MovieGrid movies={movies} title={getSectionTitle()} onMovieClick={handleMovieClick} />
                {hasCookieConsent && (
                  <Recommendations 
                    key={searchQuery || 'default'} // Force re-render when search changes
                    searchQuery={searchQuery} 
                    onMovieClick={handleMovieClick}
                  />
                )}
              </>
            }
          />
        </Routes>
      </main>
      <CookieConsent onConsentChange={handleCookieConsentChange} />
    </div>
  );
}

export default App;