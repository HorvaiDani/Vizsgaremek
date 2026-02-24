// Fejléc komponens - Ez az oldal tetején megjelenő navigációs sáv
// Tartalmazza a logót, menü és bejelentkezés gombokat

import React, { useEffect, useState } from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
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
          <Link to="/" style={{ color: 'inherit' }}>🎮 GameHUB</Link>
        </h1>
        
        {/* Jobb oldali gombok */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/kedvencek" className="login-button" aria-label="Kedvencek" title="Kedvencek">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>
          <Link to="/games" className="login-button" aria-label="Játékok" title="Játékok">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="14" rx="2"/>
              <path d="M7 20h10" />
            </svg>
          </Link>
          <Link to="/achievements" className="login-button" aria-label="Achievementek" title="Achievementek">
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
          </Link>
          {/* Téma váltó */}
          <button className="login-button" aria-label="Téma váltása" onClick={toggleTheme} title="Téma váltása">
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
          {/* Felhasználó / bejelentkezés */}
          {user ? (
            <>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Felhasználó'}
                  className="header-avatar"
                />
              )}
              <button
                className="login-button"
                aria-label="Kijelentkezés"
                title="Kijelentkezés"
                onClick={onLogout}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="login-button" aria-label="Bejelentkezés" title="Bejelentkezés">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;