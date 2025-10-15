// Film rács komponens - Ez a filmeket rács formátumban megjelenítő komponens
// Fogadja a filmek listáját és egy címet, majd MovieCard komponensekkel jeleníti meg őket

import React from 'react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

const MovieGrid = ({ movies, title = "Legjobban értékelt filmek", onMovieClick }) => {
  return (
    <section className="movie-section">
      {/* Szakasz címe */}
      <h2 className="section-title">{title}</h2>
      
      {/* Filmek rács konténer */}
      <div className="movie-grid">
        {/* Minden filmre egy MovieCard komponens */}
        {movies.map((movie, index) => (
          <MovieCard key={`${movie.id || index}`} movie={movie} onClick={onMovieClick} />
        ))}
      </div>
    </section>
  );
};

export default MovieGrid;