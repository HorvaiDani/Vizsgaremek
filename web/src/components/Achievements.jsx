import React from 'react';
import './Achievements.css';

const Achievements = ({ achievements, searchCount, favoriteCount, openedCount, lastUnlocked }) => {
  const hasAny = achievements && achievements.length > 0;

  if (!hasAny) {
    return (
      <section className="achievements">
        <div className="achievements-card">
          <h3>Achievementek</h3>
          <p className="achievements-empty">
            Kezdd el használni a GameHUB-ot – keresésekkel, kedvencekkel és játék megnyitásokkal achievementeket szerezhetsz.
          </p>
          <p className="achievements-progress">
            Keresések: <strong>{searchCount}</strong> / 5 • Kedvencek: <strong>{favoriteCount}</strong> / 5
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="achievements">
      {lastUnlocked && (
        <div className="achievement-toast">
          <span className="achievement-toast-label">Új achievement!</span>
          <strong>{lastUnlocked.title}</strong>
          <span className="achievement-toast-desc">{lastUnlocked.description}</span>
        </div>
      )}

      <div className="achievements-card">
        <h3>Achievementek</h3>
        <p className="achievements-progress">
          Keresések: <strong>{searchCount}</strong> • Kedvencek: <strong>{favoriteCount}</strong> • Megnyitott játékok: <strong>{openedCount}</strong>
        </p>
        <ul className="achievements-list">
          {achievements.map((a) => (
            <li key={a.id} className="achievement-item">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-text">
                <div className="achievement-title">{a.title}</div>
                <div className="achievement-desc">{a.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Achievements;

