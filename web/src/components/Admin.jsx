import React, { useState, useEffect } from 'react';
import './Admin.css';
import { getAdminOverview } from '../services/adminApi';
import { deleteComment } from '../services/commentsApi';

const formatDate = (raw) => {
  if (!raw) return '–';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const TABS = ['Felhasználók', 'Keresési logok', 'Játék megnyitások', 'Kommentek', 'Achievement statisztika'];

const Admin = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.name) return;
    setLoading(true);
    getAdminOverview(user.name)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.name]);

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, user.name);
      setData((prev) => ({
        ...prev,
        commentLogs: prev.commentLogs.filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.name !== 'admin') {
    return (
      <section className="admin-page">
        <div className="admin-access-denied">
          <span>⛔</span>
          <h2>Hozzáférés megtagadva</h2>
          <p>Ez az oldal csak az admin felhasználónak érhető el.</p>
        </div>
      </section>
    );
  }

  if (loading) return <section className="admin-page"><p className="admin-loading">Adatok betöltése...</p></section>;
  if (error) return <section className="admin-page"><p className="admin-error">{error}</p></section>;
  if (!data) return null;

  const q = search.toLowerCase();

  const filteredUsers = data.users.filter(u =>
    !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  );

  const filteredSearchLogs = data.searchLogs.filter(l =>
    !q || l.userName.toLowerCase().includes(q) || l.query.toLowerCase().includes(q)
  );

  const filteredOpenLogs = data.openLogs.filter(l =>
    !q || l.userName.toLowerCase().includes(q) || (l.title || '').toLowerCase().includes(q)
  );

  const filteredComments = data.commentLogs.filter(l =>
    !q || l.userName.toLowerCase().includes(q) || l.text.toLowerCase().includes(q)
  );

  return (
    <section className="admin-page">
      <div className="admin-header">
        <h2 className="admin-title">⚙️ Admin panel</h2>
        <div className="admin-stats-row">
          <span className="admin-stat-chip">👤 {data.users.length} felhasználó</span>
          <span className="admin-stat-chip">🔍 {data.searchLogs.length} keresés</span>
          <span className="admin-stat-chip">🎮 {data.openLogs.length} megnyitás</span>
          <span className="admin-stat-chip">💬 {data.commentLogs.length} komment</span>
        </div>
      </div>

      {/* Szűrő */}
      <input
        className="admin-search-input"
        type="text"
        placeholder="Szűrés névre, keresésre, szövegre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Fülek */}
      <div className="admin-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`admin-tab${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-tab-content">
        {/* Felhasználók */}
        {activeTab === 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Név</th>
                  <th>E-mail</th>
                  <th>Regisztrált</th>
                  <th>Utolsó belépés</th>
                  <th>XP</th>
                  <th>Keresés</th>
                  <th>Megnyitás</th>
                  <th>Kedvenc</th>
                  <th>Komment</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={u.name === 'admin' ? 'admin-row-admin' : ''}>
                    <td>{u.id}</td>
                    <td><strong>{u.name}</strong>{u.name === 'admin' && <span className="admin-badge">admin</span>}</td>
                    <td>{u.email || '–'}</td>
                    <td>{formatDate(u.regDate)}</td>
                    <td>{formatDate(u.lastLogin)}</td>
                    <td className="admin-xp">{u.xp}</td>
                    <td>{u.searches}</td>
                    <td>{u.opened}</td>
                    <td>{u.favorites}</td>
                    <td>{u.comments}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={10} className="admin-empty">Nincs találat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Keresési logok */}
        {activeTab === 1 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Felhasználó</th><th>Keresés</th><th>Időpont</th></tr>
              </thead>
              <tbody>
                {filteredSearchLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.userName}</td>
                    <td>„{l.query}"</td>
                    <td>{formatDate(l.mikor)}</td>
                  </tr>
                ))}
                {filteredSearchLogs.length === 0 && (
                  <tr><td colSpan={4} className="admin-empty">Nincs találat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Játék megnyitások */}
        {activeTab === 2 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Felhasználó</th><th>Játék</th><th>Műfaj</th><th>Steam ID</th><th>Időpont</th></tr>
              </thead>
              <tbody>
                {filteredOpenLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.userName}</td>
                    <td>{l.title || '–'}</td>
                    <td>{l.genre || '–'}</td>
                    <td>{l.steamId}</td>
                    <td>{formatDate(l.mikor)}</td>
                  </tr>
                ))}
                {filteredOpenLogs.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">Nincs találat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Kommentek */}
        {activeTab === 3 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Felhasználó</th><th>Steam ID</th><th>Szöveg</th><th>Időpont</th><th></th></tr>
              </thead>
              <tbody>
                {filteredComments.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.userName}</td>
                    <td>{l.steamId}</td>
                    <td className="admin-comment-text">{l.text}</td>
                    <td>{formatDate(l.mikor)}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        title="Törlés"
                        onClick={() => handleDeleteComment(l.id)}
                      >×</button>
                    </td>
                  </tr>
                ))}
                {filteredComments.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">Nincs találat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Achievement statisztika */}
        {activeTab === 4 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Achievement</th><th>ID</th><th>Megszerezte</th></tr>
              </thead>
              <tbody>
                {data.achStats.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.id}</td>
                    <td>
                      <span className="admin-ach-count">{a.count} felhasználó</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default Admin;
