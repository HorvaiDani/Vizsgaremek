// Keresés komponens - Ez a filmek keresésére szolgáló komponens
// Tartalmaz egy beviteli mezőt és keresés gombot

import React, { useState, useEffect } from 'react';
import './Search.css';

const DEFAULT_FILTERS = {
  year: '',
  price: 'any', // 'any' | 'free' | 'paid'
  genre: '',
};

const Search = ({ onSearch, loading, filters, onFiltersChange }) => {
  const [query, setQuery] = useState('');
  const safeFilters = { ...DEFAULT_FILTERS, ...(filters || {}) };

  useEffect(() => {
    // Ha kívülről változik a filters, frissítjük a lokális állapotot
  }, [filters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
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
      <div className="search-header">
        <h2 className="search-title">Komplett kereső</h2>
        <p className="search-subtitle">Keress játékokra, majd szűrj év, ár és típus alapján.</p>
      </div>
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Játékok keresése (pl. Witcher, GTA)..."
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
          disabled={loading || !query.trim()}
        >
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

      <div className="advanced-filters">
        <div className="filter-field">
          <label htmlFor="filter-year">Év</label>
          <input
            id="filter-year"
            type="number"
            min="1980"
            max={new Date().getFullYear()}
            placeholder="pl. 2020"
            value={safeFilters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="filter-price">Ár</label>
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

        <div className="filter-field">
          <label htmlFor="filter-genre">Típus / műfaj</label>
          <input
            id="filter-genre"
            type="text"
            placeholder="pl. RPG, Akció..."
            value={safeFilters.genre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Search;