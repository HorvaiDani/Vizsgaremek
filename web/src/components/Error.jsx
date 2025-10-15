// Hiba komponens - Ez a hibaállapot megjelenítésére szolgáló komponens
// Egy hibaüzenetet és opcionálisan egy újrapróbálkozás gombot jelenít meg

import React from 'react';
import './Error.css';

const Error = ({ message = "Valami hiba történt", onRetry }) => {
  return (
    <div className="error-container">
      {/* Hiba ikon */}
      <div className="error-icon">⚠️</div>
      
      {/* Hiba címe */}
      <h3 className="error-title">Hoppá!</h3>
      
      {/* Hibaüzenet */}
      <p className="error-message">{message}</p>
      
      {/* Újrapróbálkozás gomb - csak ha van onRetry függvény */}
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Újrapróbálkozás
        </button>
      )}
    </div>
  );
};

export default Error;