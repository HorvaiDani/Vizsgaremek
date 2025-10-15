// Keresés komponens - Ez a filmek keresésére szolgáló komponens
// Tartalmaz egy beviteli mezőt és keresés gombot

import React, { useState } from 'react';
import './Search.css';

const Search = ({ onSearch, loading }) => {
  // Keresési kifejezés állapota
  const [query, setQuery] = useState('');

  // Keresés elküldése
  const handleSubmit = (e) => {
    e.preventDefault(); // Alapértelmezett form elküldés megakadályozása
    if (query.trim()) { // Csak ha van valós tartalom
      onSearch(query.trim()); // Szülő komponens keresés függvényének hívása
    }
  };

  // Keresés törlése és visszatérés a népszerű filmekhez
  const handleClear = () => {
    setQuery(''); // Input mező törlése
    onSearch(''); // Üres keresés küldése (népszerű filmek betöltése)
  };

  return (
    <div className="search-container">
      {/* Keresési form */}
      <form className="search-form" onSubmit={handleSubmit}>
        {/* Keresési input konténer */}
        <div className="search-input-container">
          {/* Keresési beviteli mező */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)} // Input érték frissítése
            placeholder="Filmek keresése..."
            className="search-input"
            disabled={loading} // Letiltás betöltés közben
          />
          
          {/* Törlés gomb */}
          <button
            type="button"
            onClick={handleClear}
            className="clear-button"
            disabled={loading || !query} // Letiltás ha betöltés van vagy üres az input
            aria-label="Clear search"
          >
            {/* X ikon SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Keresés gomb */}
        <button
          type="submit"
          className="search-button"
          disabled={loading || !query.trim()} // Letiltás ha betöltés van vagy üres az input
        >
          {/* Betöltés közben spinner, különben keresés ikon */}
          {loading ? (
            <div className="button-spinner"></div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default Search;