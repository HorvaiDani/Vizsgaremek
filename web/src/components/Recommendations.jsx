// Ajánlások komponens - Személyre szabott filmajánlások megjelenítése
// Ez a komponens jeleníti meg a felhasználói viselkedés alapján generált ajánlásokat

import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';
import Loading from './Loading';
import Error from './Error';
import { recommendationService } from '../services/recommendationService';
import { userBehavior } from '../services/cookieService';
import './Recommendations.css';

const Recommendations = ({ searchQuery, onGameClick }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    const run = async () => await loadRecommendations();
    run();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setRecommendations([]);
      setShowRecommendations(false);
      return;
    }
    setRecommendations([]);
    setShowRecommendations(false);
    loadSimilarRecommendations(searchQuery);
  }, [searchQuery]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]);
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

  const loadSimilarRecommendations = async (query) => {
    try {
      setLoading(true);
      setError(null);
      if (!userBehavior.hasCookieConsent()) {
        setShowRecommendations(false);
        return;
      }
      const similar = await recommendationService.getSimilarMoviesFromSearch(query);
      setRecommendations(similar);
      setShowRecommendations(similar.length > 0);
    } catch (err) {
      console.error('Error loading similar recommendations:', err);
      setError('Nem sikerült betölteni a hasonló játékokat.');
      setShowRecommendations(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (searchQuery) loadSimilarRecommendations(searchQuery);
    else loadRecommendations();
  };

  const handleGameClick = (game) => {
    if (userBehavior.hasCookieConsent()) {
      userBehavior.trackMovieView(game.id, game.title, game.genre);
      userBehavior.trackGenrePreference(game.genre);
    }
    onGameClick?.(game);
  };

  if (!showRecommendations && !loading && !searchQuery) return null;

  if (loading) {
    return (
      <section className="recommendations-section">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló játékok "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <Loading message="Ajánlások betöltése..." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="recommendations-section">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló játékok "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <Error message={error} onRetry={handleRetry} />
      </section>
    );
  }

  return (
    <section className="recommendations-section">
      <div className="recommendations-header">
        <h2 className="recommendations-title">
          {searchQuery ? `Hasonló játékok "${searchQuery}" kereséshez` : 'Személyre szabott ajánlások'}
        </h2>
        <p className="recommendations-subtitle">
          {searchQuery
            ? 'A keresési előzményeid alapján ajánlott játékok'
            : 'A keresési előzményeid és műfaj preferenciáid alapján'
          }
        </p>
      </div>
      <div className="recommendations-grid">
        {recommendations.map((game) => (
          <div
            key={game.id}
            className="recommendation-card-wrapper"
            onClick={() => handleGameClick(game)}
          >
            <GameCard game={game} />
          </div>
        ))}
      </div>
      {recommendations.length === 0 && (
        <div className="recommendations-empty">
          <p>Még nincsenek elég adatok személyre szabott ajánlásokhoz.</p>
          <p>Keresd meg kedvenc játékaidat, hogy jobb ajánlásokat kapj!</p>
        </div>
      )}
    </section>
  );
};

export default Recommendations;
