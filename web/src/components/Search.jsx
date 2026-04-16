// Keresés komponens - Ez a filmek keresésére szolgáló komponens
// Tartalmaz egy beviteli mezőt és keresés gombot

import React, { useState, useEffect } from 'react';
import './Search.css';

const DEFAULT_FILTERS = {
  year: '',
  price: 'any', // 'any' | 'free' | 'paid'
  genre: '',
};

const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1979 },
  (_, index) => String(new Date().getFullYear() - index)
);

const GENRE_OPTIONS = [
  'Akció',
  'Adventure',
  'Anime',
  'Arcade',
  'Battle Royale',
  'Casual',
  'Co-op',
  'Horror',
  'Indie',
  'Multiplayer',
  'Open World',
  'Platformer',
  'Puzzle',
  'Racing',
  'RPG',
  'Shooter',
  'Simulation',
  'Sports',
  'Strategy',
  'Survival',
];

const Search = ({ onSearch, loading, filters, onFiltersChange, searchQuery = '' }) => {
  const [query, setQuery] = useState(searchQuery);
  const safeFilters = { ...DEFAULT_FILTERS, ...(filters || {}) };
  const hasAnyCriteria = Boolean(
    query.trim() || safeFilters.year || safeFilters.genre || safeFilters.price !== 'any'
  );
  const activeFilterCount = [
    query.trim(),
    safeFilters.year,
    safeFilters.genre,
    safeFilters.price !== 'any' ? safeFilters.price : '',
  ].filter(Boolean).length;

  useEffect(() => {
    setQuery(searchQuery || '');
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasAnyCriteria) return;
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    if (onFiltersChange) {
      onFiltersChange(DEFAULT_FILTERS);
    }
  };

  const handleFilterChange = (key, value) => {
    if (!onFiltersChange) return;
    onFiltersChange({
      ...safeFilters,
      [key]: value,
    });
  };

  return (
    <div className="search-container">
      <div className="search-shell">
        <div className="search-header">
          <div>
            <span className="search-kicker">Store Search</span>
            <h2 className="search-title">Komplett kereső</h2>
            <p className="search-subtitle">Keress játékokra, majd szűrj év, ár és típus alapján.</p>
          </div>
          <div className="search-meta">
            <span className="search-chip search-chip-accent">{activeFilterCount} aktív feltétel</span>
          </div>
        </div>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-container">
            <span className="search-input-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés a katalógusban: pl. Witcher, GTA, Cyberpunk..."
              className="search-input"
              disabled={loading}
            />

            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              disabled={loading || (!query && !safeFilters.year && !safeFilters.genre && safeFilters.price === 'any')}
              aria-label="Keresés törlése"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loading || !hasAnyCriteria}
          >
            {loading ? (
              <div className="button-spinner"></div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <span>Keresés</span>
              </>
            )}
          </button>
        </form>

        <div className="advanced-filters">
          <div className="filter-field">
            <label htmlFor="filter-year">Év</label>
            <div className="filter-control">
              <select
                id="filter-year"
                value={safeFilters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                disabled={loading}
              >
                <option value="">Bármelyik év</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-field">
            <label htmlFor="filter-price">Ár</label>
            <div className="filter-control">
              <select
                id="filter-price"
                value={safeFilters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                disabled={loading}
              >
                <option value="any">Bármilyen</option>
                <option value="free">Ingyenes</option>
                <option value="paid">Fizetős</option>
              </select>
            </div>
          </div>

          <div className="filter-field">
            <label htmlFor="filter-genre">Típus / műfaj</label>
            <div className="filter-control">
              <select
                id="filter-genre"
                value={safeFilters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                disabled={loading}
              >
                <option value="">Bármilyen típus</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;