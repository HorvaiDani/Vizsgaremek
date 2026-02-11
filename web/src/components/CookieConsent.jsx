// Cookie hozzájárulás banner komponens - GDPR megfelelőség és felhasználói beleegyezés
// Ez a komponens kezeli a cookie-k használatához szükséges felhasználói beleegyezést

import React, { useState, useEffect } from 'react';
import { userBehavior } from '../services/cookieService';
import './CookieConsent.css';

const CookieConsent = ({ onConsentChange }) => {
  // Állapot a banner megjelenítéséhez
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Komponens betöltésekor ellenőrizzük a hozzájárulást
  useEffect(() => {
    const hasConsent = userBehavior.hasCookieConsent();
    if (!hasConsent) {
      setShowBanner(true);
      // Kis késleltetés a banner animációhoz
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  // Cookie-k elfogadása
  const handleAccept = () => {
    userBehavior.setCookieConsent(true);
    setShowBanner(false);
    setIsVisible(false);
    onConsentChange?.(true);
  };

  // Cookie-k elutasítása
  const handleDecline = () => {
    userBehavior.setCookieConsent(false);
    userBehavior.clearUserData(); // Felhasználói adatok törlése
    setShowBanner(false);
    setIsVisible(false);
    onConsentChange?.(false);
  };

  // Banner bezárása (csak elutasítás nélkül)
  const handleClose = () => {
    setShowBanner(false);
    setIsVisible(false);
  };

  // Ha nincs hozzájárulás, ne jelenítse meg a bannert
  if (!showBanner) {
    return null;
  }

  return (
    <div className={`cookie-consent-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="cookie-consent-banner">
        {/* Bezárás gomb */}
        <button 
          className="cookie-consent-close" 
          onClick={handleClose}
          aria-label="Bezárás"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Banner tartalom */}
        <div className="cookie-consent-content">
          {/* Ikon */}
          <div className="cookie-consent-icon">
            🍪
          </div>

          {/* Szöveg */}
          <div className="cookie-consent-text">
            <h3 className="cookie-consent-title">
              Cookie-k és személyre szabás
            </h3>
            <p className="cookie-consent-description">
              A jobb felhasználói élmény érdekében cookie-kat használunk a keresési előzmények
              és játékpreferenciák tárolására. Ez lehetővé teszi a személyre szabott játékajánlásokat
              és a keresési javaslatokat.
            </p>
            <div className="cookie-consent-details">
              <p><strong>Mit tárolunk:</strong></p>
              <ul>
                <li>Keresési előzmények</li>
                <li>Megtekintett játékok</li>
                <li>Műfajpreferenciák</li>
                <li>Értékelések</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Gombok */}
        <div className="cookie-consent-actions">
          <button 
            className="cookie-consent-decline" 
            onClick={handleDecline}
          >
            Elutasítás
          </button>
          <button 
            className="cookie-consent-accept" 
            onClick={handleAccept}
          >
            Elfogadás
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
