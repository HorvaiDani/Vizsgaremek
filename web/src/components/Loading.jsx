// Betöltés komponens - Ez a betöltés állapot megjelenítésére szolgáló komponens
// Egy animált spinner-t és üzenetet jelenít meg

import React from 'react';
import './Loading.css';

const Loading = ({ message = "Betöltés..." }) => {
  return (
    <div className="loading-container">
      {/* Animált spinner */}
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      
      {/* Betöltés üzenet */}
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;