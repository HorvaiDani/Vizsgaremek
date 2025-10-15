// Ajánlások komponens - Személyre szabott filmajánlások megjelenítése
// Ez a komponens jeleníti meg a felhasználói viselkedés alapján generált ajánlásokat

import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import Loading from './Loading';
import Error from './Error';
import { recommendationService } from '../services/recommendationService';
import { userBehavior } from '../services/cookieService';
import './Recommendations.css';

const Recommendations = ({ searchQuery, onMovieClick }) => {
  // Állapot változók
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Ajánlások lekérése komponens betöltésekor
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await loadRecommendations();
    };
    run();
    return () => { cancelled = true; };
  }, []);

  // Ajánlások lekérése keresési kifejezés alapján
  useEffect(() => {
    if (!searchQuery) {
      // Ha nincs keresési kifejezés, töröljük az ajánlásokat
      setRecommendations([]);
      setShowRecommendations(false);
      return;
    }
    
    // Azonnal töröljük a régi ajánlásokat
    setRecommendations([]);
    setShowRecommendations(false);
    
    // Betöltjük az új ajánlásokat
    loadSimilarRecommendations(searchQuery);
  }, [searchQuery]);

  // Általános ajánlások betöltése
  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]); // Előző ajánlások törlése
      
      // Ellenőrizzük, hogy van-e cookie hozzájárulás
      if (!userBehavior.hasCookieConsent()) {
        setShowRecommendations(false);
        return;
      }

      const recs = await recommendationService.getAllRecommendations();
      setRecommendations(recs);
      setShowRecommendations(recs.length > 0);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Nem sikerült betölteni az ajánlásokat.');
    } finally {
      setLoading(false);
    }
  };

  // Hasonló filmek betöltése keresési kifejezés alapján
  const loadSimilarRecommendations = async (query) => {
    try {
      setLoading(true);
      setError(null);
      // Előző ajánlások törlése - ez már megtörtént a useEffect-ben
      
      if (!userBehavior.hasCookieConsent()) {
        setShowRecommendations(false);
        return;
      }

      console.log('Loading similar movies for:', query); // Debug log
      const similarMovies = await recommendationService.getSimilarMoviesFromSearch(query);
      console.log('Similar movies loaded:', similarMovies); // Debug log
      
      setRecommendations(similarMovies);
      setShowRecommendations(similarMovies.length > 0);
    } catch (err) {
      console.error('Error loading similar recommendations:', err);
      setError('Nem sikerült betölteni a hasonló filmeket.');
      setShowRecommendations(false);
    } finally {
      setLoading(false);
    }
  };

  // Újrapróbálkozás
  const handleRetry = () => {
    if (searchQuery) {
      loadSimilarRecommendations(searchQuery);
    } else {
      loadRecommendations();
    }
  };

  // Film kattintás kezelése
  const handleMovieClick = (movie) => {
    // Film nézettség követése
    if (userBehavior.hasCookieConsent()) {
      userBehavior.trackMovieView(movie.id, movie.title, movie.genre);
      userBehavior.trackGenrePreference(movie.genre);
    }
    
    // Szülő komponens értesítése
    onMovieClick?.(movie);
  };

  // Ha nincs cookie hozzájárulás vagy nincsenek ajánlások és nincs keresés
  if (!showRecommendations && !loading && !searchQuery) {
    return null;
  }

  // Betöltés állapot
  if (loading) {
    return (
      <section className="recommendations-section">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló filmek "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <Loading message="Ajánlások betöltése..." />
      </section>
    );
  }

  // Hiba állapot
  if (error) {
    return (
      <section className="recommendations-section">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló filmek "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <Error message={error} onRetry={handleRetry} />
      </section>
    );
  }

  // Ajánlások megjelenítése
  return (
    <section className="recommendations-section">
      <div className="recommendations-header">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló filmek "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <p className="recommendations-subtitle">
          {searchQuery 
            ? 'A keresési előzményeid alapján ajánlott filmek'
            : 'A keresési előzményeid és műfaj preferenciáid alapján'
          }
        </p>
      </div>
      
      <div className="recommendations-grid">
        {recommendations.map((movie) => (
          <div 
            key={movie.id} 
            className="recommendation-card-wrapper"
            onClick={() => handleMovieClick(movie)}
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
      
      {recommendations.length === 0 && (
        <div className="recommendations-empty">
          <p>Még nincsenek elég adatok személyre szabott ajánlásokhoz.</p>
          <p>Keresd meg kedvenc filmjeidet, hogy jobb ajánlásokat kapj!</p>
        </div>
      )}
    </section>
  );
};

export default Recommendations;
