// Film kártya komponens - Ez egy egyedi film megjelenítésére szolgáló komponens
// Megjeleníti a film plakátját, címét, évét, értékelését és egyéb információkat

import React, { useState } from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, onClick }) => {
  // Állapot a kép betöltési hibájának kezelésére
  const [imageError, setImageError] = useState(false);
  
  // Film adatok kinyerése a props-ból
  const { title, year, rating, poster, genre, runtime, plot } = movie;

  // Kép betöltési hiba kezelése
  const handleImageError = () => {
    setImageError(true); // Ha a kép nem töltődik be, placeholder-t mutatunk
  };

  // Értékelés formázása - tizedesjegyekkel
  const formatRating = (rating) => {
    if (!rating || rating === 0) return 'N/A'; // Ha nincs értékelés
    return rating.toFixed(1); // Egy tizedesjegyre kerekítés
  };

  // Futamidő formázása - rövidebb formátumra
  const formatRuntime = (runtime) => {
    if (!runtime || runtime === 'N/A') return ''; // Ha nincs futamidő
    return runtime.replace(' min', 'm'); // "142 min" -> "142m"
  };

  // Film kattintás kezelése
  const handleClick = () => {
    if (onClick) {
      onClick(movie); // Szülő komponens értesítése a kattintásról
    }
  };

  return (
    <div className="movie-card" onClick={handleClick}>
      {/* Film plakát konténer */}
      <div className="movie-poster">
        {/* Ha van plakát és nincs hiba, megjelenítjük */}
        {!imageError && poster ? (
          <img 
            src={poster} 
            alt={`${title} poster`}
            loading="lazy" // Lazy loading a teljesítmény javítása érdekében
            onError={handleImageError} // Hiba esetén placeholder-t mutatunk
          />
        ) : (
          /* Placeholder ha nincs kép vagy hiba történt */
          <div className="poster-placeholder">
            <div className="placeholder-icon">🎬</div>
            <div className="placeholder-text">{title}</div>
          </div>
        )}
        
        {/* Hover overlay - amikor a felhasználó ráviszi az egeret */}
        <div className="movie-overlay">
          {/* Értékelés jelvény */}
          <div className="rating-badge">
            <span className="rating-star">⭐</span>
            <span className="rating-value">{formatRating(rating)}</span>
          </div>
          {/* Lejátszás gomb */}
          <div className="play-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Film információk */}
      <div className="movie-info">
        {/* Film címe */}
        <h3 className="movie-title">{title}</h3>
        
        {/* Film részletek - év, futamidő, műfaj */}
        <div className="movie-details">
          <span className="movie-year">{year}</span>
          {/* Futamidő megjelenítése ha van */}
          {runtime && (
            <>
              <span className="movie-separator">•</span>
              <span className="movie-runtime">{formatRuntime(runtime)}</span>
            </>
          )}
          {/* Műfaj megjelenítése ha van */}
          {genre && (
            <>
              <span className="movie-separator">•</span>
              <span className="movie-genre">{genre}</span>
            </>
          )}
        </div>
        
        {/* Film összefoglaló megjelenítése ha van */}
        {plot && (
          <p className="movie-plot">{plot}</p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;