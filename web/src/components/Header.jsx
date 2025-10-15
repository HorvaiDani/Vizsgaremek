// Fejléc komponens - Ez az oldal tetején megjelenő navigációs sáv
// Tartalmazza a logót, menü és bejelentkezés gombokat

import React, { useEffect, useState } from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

const Header = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = stored || (prefersDark ? 'dark' : 'light');
      setTheme(initial);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove('theme-dark', 'theme-light');
      root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
      localStorage.setItem('theme', theme);
    } catch (_) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Menü gomb - bal oldalon */}
        <button className="menu-button" aria-label="Menu">
          {/* Hamburger menü ikon SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        {/* Főcím és logó - középen */}
        <h1 className="logo">
          <Link to="/" style={{ color: 'inherit' }}>🍿 PopcornHub</Link>
        </h1>
        
        {/* Jobb oldali gombok */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/movies" className="login-button" aria-label="Movies" title="Filmek">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 20h10" />
            </svg>
          </Link>
          {/* Téma váltó */}
          <button className="login-button" aria-label="Toggle theme" onClick={toggleTheme} title="Theme">
            {theme === 'dark' ? (
              // Nap ikon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
              </svg>
            ) : (
              // Hold ikon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          {/* Bejelentkezés gomb */}
          <button className="login-button" aria-label="Login">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;