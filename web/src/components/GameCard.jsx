// Játék kártya komponens – egy Steam játék megjelenítése
// Plakát helyett header_image, cím, év, értékelés, műfaj, rövid leírás

import React, { useState } from 'react';
import './GameCard.css';

const GameCard = ({ game, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const { title, year, rating, poster, genre, plot, steamUrl } = game;

  const handleImageError = () => setImageError(true);

  const formatRating = (r) => {
    if (!r || r === 0) return '–';
    return (r * 10).toFixed(0);
  };

  const handleClick = () => {
    if (onClick) onClick(game);
    else if (steamUrl) window.open(steamUrl, '_blank');
  };

  return (
    <div className="game-card" onClick={handleClick}>
      <div className="game-poster">
        {!imageError && poster ? (
          <img
            src={poster}
            alt={`${title} borító`}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="poster-placeholder">
            <div className="placeholder-icon">🎮</div>
            <div className="placeholder-text">{title}</div>
          </div>
        )}
        <div className="game-overlay">
          <div className="rating-badge">
            <span className="rating-star">⭐</span>
            <span className="rating-value">{formatRating(rating)}</span>
          </div>
          <div className="play-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="game-info">
        <h3 className="game-title">{title}</h3>
        <div className="game-details">
          {year && <span className="game-year">{year}</span>}
          {genre && (
            <>
              {year && <span className="game-separator">•</span>}
              <span className="game-genre">{genre}</span>
            </>
          )}
        </div>
        {plot && <p className="game-plot">{plot}</p>}
      </div>
    </div>
  );
};

export default GameCard;
