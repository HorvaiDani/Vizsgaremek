import React from 'react';
import './Achievements.css';

const Achievements = ({
  catalog,
  achievements,
  searchCount,
  favoriteCount,
  openedCount,
  commentCount,
  xp,
  rank,
  isLoggedIn,
  lastUnlocked,
}) => {
  const unlockedIds = new Set((achievements || []).map((a) => a.id));
  const list = Array.isArray(catalog) && catalog.length > 0 ? catalog : achievements || [];

  const currentForMetric = (metric) => {
    switch (metric) {
      case 'login':
        return isLoggedIn ? 1 : 0;
      case 'search':
        return Number(searchCount) || 0;
      case 'favorite':
        return Number(favoriteCount) || 0;
      case 'open':
        return Number(openedCount) || 0;
      case 'comment':
        return Number(commentCount) || 0;
      case 'xp':
        return Number(xp) || 0;
      case 'all': {
        const t = 5;
        const s = Number(searchCount) || 0;
        const o = Number(openedCount) || 0;
        const f = Number(favoriteCount) || 0;
        const c = Number(commentCount) || 0;
        return Math.min(s, o, f, c, t);
      }
      default:
        return 0;
    }
  };

  const renderAchievementRow = (a) => {
    const unlocked = unlockedIds.has(a.id);
    const target = typeof a.target === 'number' ? a.target : null;
    const hasMetric = typeof a.metric === 'string' && a.metric.length > 0;
    const current = hasMetric ? currentForMetric(a.metric) : 0;
    const progress = target ? `${Math.min(current, target)}/${target}` : null;

    return (
      <li key={a.id} className={`achievement-item ${unlocked ? '' : 'locked'}`}>
        <div className="achievement-icon">{unlocked ? '🏆' : '🔒'}</div>
        <div className="achievement-text">
          <div className="achievement-title-row">
            <div className="achievement-title">{a.title}</div>
            {progress && <span className="achievement-progress-pill">{progress}</span>}
          </div>
          <div className="achievement-desc">{a.description}</div>
          {(typeof a.points === 'number' || a.reward) && (
            <div className="achievement-reward">
              {typeof a.points === 'number' ? `+${a.points} XP` : null}
              {typeof a.points === 'number' && a.reward ? ' • ' : null}
              {a.reward || null}
            </div>
          )}
        </div>
      </li>
    );
  };

  const sorted = [...list].sort((a, b) => {
    const au = unlockedIds.has(a.id) ? 0 : 1;
    const bu = unlockedIds.has(b.id) ? 0 : 1;
    if (au !== bu) return au - bu;
    return String(a.title || '').localeCompare(String(b.title || ''), 'hu');
  });

  return (
    <section className="achievements">
      {lastUnlocked && (
        <div className="achievement-toast">
          <span className="achievement-toast-label">Új achievement!</span>
          <strong>{lastUnlocked.title}</strong>
          <span className="achievement-toast-desc">{lastUnlocked.description}</span>
          {(typeof lastUnlocked.points === 'number' || lastUnlocked.reward) && (
            <span className="achievement-toast-reward">
              {typeof lastUnlocked.points === 'number' ? `+${lastUnlocked.points} XP` : null}
              {typeof lastUnlocked.points === 'number' && lastUnlocked.reward ? ' • ' : null}
              {lastUnlocked.reward || null}
            </span>
          )}
        </div>
      )}

      <div className="achievements-card">
        <h3>Achievementek</h3>
        <p className="achievements-meta">
          Rang: <strong>{rank || '–'}</strong> • Össz XP: <strong>{typeof xp === 'number' ? xp : 0}</strong>
        </p>
        <p className="achievements-meta">
          Megszerzett: <strong>{unlockedIds.size}</strong> / <strong>{list.length}</strong>
        </p>
        <p className="achievements-progress">
          Keresések: <strong>{searchCount}</strong> • Kedvencek: <strong>{favoriteCount}</strong> • Megnyitott játékok:{' '}
          <strong>{openedCount}</strong> • Kommentek: <strong>{commentCount || 0}</strong>
        </p>
        <ul className="achievements-list">
          {sorted.map(renderAchievementRow)}
        </ul>
      </div>
    </section>
  );
};

export default Achievements;

