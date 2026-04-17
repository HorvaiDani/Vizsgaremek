import React, { useState, useEffect } from 'react';
import './Admin.css';
import {
  getAdminOverview,
  getAdminDatabaseSummary,
  getAdminTablePreview,
  deleteAdminUser,
  deleteAdminSearchLog,
  deleteAdminOpenedLog,
} from '../services/adminApi';
import { deleteComment } from '../services/commentsApi';

const formatDate = (raw) => {
  if (!raw) return '–';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatBytes = (value) => {
  const size = Number(value) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPreviewValue = (columnName, value) => {
  if (value == null) return '–';

  const text = String(value);
  if (columnName === 'avatar_url' && text.length > 80) {
    return `${text.slice(0, 36)} ... ${text.slice(-18)}`;
  }

  return text;
};

const TABS = ['Felhasználók', 'Keresési logok', 'Játék megnyitások', 'Kommentek', 'Achievement statisztika', 'Adatbázis'];

const Admin = ({ user }) => {
  const [data, setData] = useState(null);
  const [database, setDatabase] = useState(null);
  const [tablePreview, setTablePreview] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  const refreshOverview = async () => {
    const overview = await getAdminOverview(user.name);
    setData(overview);
  };

  useEffect(() => {
    if (!user?.name) return;
    setLoading(true);
    Promise.all([getAdminOverview(user.name), getAdminDatabaseSummary(user.name)])
      .then(([overview, dbSummary]) => {
        setData(overview);
        setDatabase(dbSummary);
        const firstTable = dbSummary.tables?.[0]?.name || '';
        setSelectedTable(firstTable);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.name]);

  useEffect(() => {
    if (!user?.name || !selectedTable) return;
    setTableLoading(true);
    setTableError(null);
    getAdminTablePreview(user.name, selectedTable)
      .then(setTablePreview)
      .catch((err) => setTableError(err.message))
      .finally(() => setTableLoading(false));
  }, [user?.name, selectedTable]);

  const handleDeleteComment = async (commentId) => {
    const ok = window.confirm('Biztosan törlöd ezt a kommentet?');
    if (!ok) return;
    try {
      await deleteComment(commentId, user.name);
      await refreshOverview();
    } catch (err) {
      window.alert(err.message || 'Nem sikerült törölni a kommentet.');
    }
  };

  const handleDeleteSearchLog = async (logId) => {
    const ok = window.confirm('Biztosan törlöd ezt a keresési előzményt?');
    if (!ok) return;
    try {
      await deleteAdminSearchLog(user.name, logId);
      await refreshOverview();
    } catch (err) {
      window.alert(err.message || 'Nem sikerült törölni a keresési előzményt.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const ok = window.confirm(
      `Biztosan törlöd ezt a fiókot?\n\nFelhasználó: ${targetUser.name}\nID: ${targetUser.id}\n\nA felhasználó összes adata is törlődik.`
    );
    if (!ok) return;
    try {
      await deleteAdminUser(user.name, targetUser.id);
      await refreshOverview();
    } catch (err) {
      window.alert(err.message || 'Nem sikerült törölni a felhasználót.');
    }
  };

  const handleDeleteOpenedLog = async (logId) => {
    const ok = window.confirm('Biztosan törlöd ezt a játék megnyitási bejegyzést?');
    if (!ok) return;
    try {
      await deleteAdminOpenedLog(user.name, logId);
      await refreshOverview();
    } catch (err) {
      window.alert(err.message || 'Nem sikerült törölni a megnyitási logot.');
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

  const filteredTables = (database?.tables || []).filter((table) =>
    !q || table.name.toLowerCase().includes(q)
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
          {database && <span className="admin-stat-chip">🗄️ {database.tableCount} tábla</span>}
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
                  <th></th>
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
                    <td>
                      {u.name !== 'admin' && (
                        <button
                          className="admin-delete-btn"
                          title="Felhasználó törlése"
                          onClick={() => handleDeleteUser(u)}
                        >×</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={11} className="admin-empty">Nincs találat.</td></tr>
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
                <tr><th>#</th><th>Felhasználó</th><th>Keresés</th><th>Időpont</th><th></th></tr>
              </thead>
              <tbody>
                {filteredSearchLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{l.userName}</td>
                    <td>„{l.query}"</td>
                    <td>{formatDate(l.mikor)}</td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        title="Keresési előzmény törlése"
                        onClick={() => handleDeleteSearchLog(l.id)}
                      >×</button>
                    </td>
                  </tr>
                ))}
                {filteredSearchLogs.length === 0 && (
                  <tr><td colSpan={5} className="admin-empty">Nincs találat.</td></tr>
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
                <tr><th>#</th><th>Felhasználó</th><th>Játék</th><th>Műfaj</th><th>Steam ID</th><th>Időpont</th><th></th></tr>
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
                    <td>
                      <button
                        className="admin-delete-btn"
                        title="Megnyitási log törlése"
                        onClick={() => handleDeleteOpenedLog(l.id)}
                      >×</button>
                    </td>
                  </tr>
                ))}
                {filteredOpenLogs.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">Nincs találat.</td></tr>
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

        {activeTab === 5 && database && (
          <div className="admin-db-layout">
            <div className="admin-db-summary">
              <div className="admin-db-card">
                <span className="admin-db-label">Kapcsolat</span>
                <strong className="admin-db-value admin-db-ok">{database.status === 'connected' ? 'Rendben' : 'Hiba'}</strong>
                <span className="admin-db-meta">Ellenőrizve: {formatDate(database.checkedAt)}</span>
              </div>
              <div className="admin-db-card">
                <span className="admin-db-label">Adatbázis</span>
                <strong className="admin-db-value">{database.dbName}</strong>
                <span className="admin-db-meta">Host: {database.dbHost}</span>
              </div>
              <div className="admin-db-card">
                <span className="admin-db-label">Motor</span>
                <strong className="admin-db-value">MySQL / MariaDB</strong>
                <span className="admin-db-meta">Verzió: {database.dbVersion}</span>
              </div>
              <div className="admin-db-card">
                <span className="admin-db-label">Összes adat</span>
                <strong className="admin-db-value">{database.totalRows} sor</strong>
                <span className="admin-db-meta">{database.tableCount} táblában</span>
              </div>
            </div>

            <div className="admin-db-browser">
              <aside className="admin-db-sidebar">
                <h3 className="admin-db-title">Táblák</h3>
                <div className="admin-db-table-list">
                  {filteredTables.map((table) => (
                    <button
                      key={table.name}
                      type="button"
                      className={`admin-db-table-btn${selectedTable === table.name ? ' active' : ''}`}
                      onClick={() => setSelectedTable(table.name)}
                    >
                      <span className="admin-db-table-name">{table.name}</span>
                      <span className="admin-db-table-meta">{table.rowCount} sor • {table.columnCount} oszlop</span>
                    </button>
                  ))}
                  {filteredTables.length === 0 && (
                    <p className="admin-db-empty">Nincs ilyen nevű tábla.</p>
                  )}
                </div>
              </aside>

              <div className="admin-db-content">
                {selectedTable && tablePreview && !tableLoading && !tableError && (
                  <>
                    <div className="admin-db-table-header">
                      <div>
                        <h3 className="admin-db-title">{tablePreview.tableName}</h3>
                        <p className="admin-db-subtitle">Első {tablePreview.rows.length} sor előnézet, összesen {tablePreview.totalRows} sor.</p>
                      </div>
                      <div className="admin-db-pills">
                        <span className="admin-ach-count">{tablePreview.columns.length} oszlop</span>
                        {database.tables.filter((t) => t.name === tablePreview.tableName).map((table) => (
                          <span key={table.name} className="admin-ach-count">{formatBytes(table.sizeBytes)}</span>
                        ))}
                      </div>
                    </div>

                    <div className="admin-table-wrap admin-db-columns-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Oszlop</th><th>Típus</th><th>NULL</th><th>Kulcs</th><th>Alapérték</th><th>Extra</th></tr>
                        </thead>
                        <tbody>
                          {tablePreview.columns.map((column) => (
                            <tr key={column.name}>
                              <td><strong>{column.name}</strong></td>
                              <td>{column.type}</td>
                              <td>{column.isNullable}</td>
                              <td>{column.columnKey || '–'}</td>
                              <td>{column.defaultValue ?? '–'}</td>
                              <td>{column.extra || '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table admin-db-preview-table">
                        <thead>
                          <tr>
                            {tablePreview.columns.map((column) => (
                              <th key={column.name}>{column.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tablePreview.rows.map((row, index) => (
                            <tr key={index}>
                              {tablePreview.columns.map((column) => (
                                <td
                                  key={column.name}
                                  className="admin-db-cell"
                                  title={row[column.name] == null ? '' : String(row[column.name])}
                                >
                                  {formatPreviewValue(column.name, row[column.name])}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {tablePreview.rows.length === 0 && (
                            <tr><td colSpan={tablePreview.columns.length || 1} className="admin-empty">A tábla üres.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tableLoading && <p className="admin-loading">Tábla betöltése...</p>}
                {tableError && <p className="admin-error">{tableError}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Admin;
