import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import { getKedvencek } from '../services/favoritesApi';
import { getUserAchievements } from '../services/achievementsApi';
import { getSearchHistory, getOpenedGames, updateProfile, deleteSearchHistoryItem } from '../services/profileApi';

const getRankFromXp = (v) => {
  const n = Number(v) || 0;
  if (n >= 200) return 'Legenda';
  if (n >= 120) return 'Veterán';
  if (n >= 60)  return 'Felfedező';
  if (n >= 20)  return 'Újonc';
  return 'Kezdő';
};

const formatDate = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
};

const Profile = ({ user, xp, achievements: initialAchievements, onUserUpdate }) => {
  const [achievements, setAchievements] = useState(initialAchievements || []);
  const [favorites, setFavorites] = useState([]);
  const [openedGames, setOpenedGames] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit state
  const [editName, setEditName] = useState(user?.name || '');
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user?.name) return;
    setLoadingData(true);
    Promise.all([
      getUserAchievements(user.name).catch(() => []),
      getKedvencek(user.name).catch(() => []),
      getOpenedGames(user.name).catch(() => []),
      getSearchHistory(user.name).catch(() => []),
    ]).then(([ach, fav, opened, history]) => {
      setAchievements(Array.isArray(ach) ? ach : []);
      setFavorites(Array.isArray(fav) ? fav : []);
      setOpenedGames(Array.isArray(opened) ? opened : []);
      setSearchHistory(Array.isArray(history) ? history : []);
    }).finally(() => setLoadingData(false));
  }, [user?.name]);

  // Keep editName in sync if user prop changes
  useEffect(() => {
    setEditName(user?.name || '');
    setAvatarPreview(user?.avatarUrl || null);
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!user?.name) return;
    try {
      setSavingAvatar(true);
      setAvatarSuccess('');
      const result = await updateProfile(user.name, { avatarUrl: avatarPreview });
      onUserUpdate?.(result.user);
      setAvatarSuccess('Profilkép mentve!');
      setTimeout(() => setAvatarSuccess(''), 3000);
    } catch {
      // ignore
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!user?.name || savingName) return;
    const trimmed = editName.trim();
    if (!trimmed || trimmed === user.name) return;
    try {
      setSavingName(true);
      setNameError('');
      setNameSuggestions([]);
      setNameSuccess('');
      const result = await updateProfile(user.name, { newName: trimmed });
      onUserUpdate?.(result.user);
      setNameSuccess('Név megváltoztatva!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      setNameError(err.message || 'Hiba a névváltoztatásnál.');
      if (err.suggestions?.length) {
        setNameSuggestions(err.suggestions);
      }
    } finally {
      setSavingName(false);
    }
  };

  const totalXp = Number(xp) || 0;
  const rank = getRankFromXp(totalXp);

  if (!user) {
    return (
      <section className="profile-page">
        <p className="profile-not-logged">A profil megtekintéséhez be kell jelentkezni.</p>
      </section>
    );
  }

  return (
    <section className="profile-page">
      {/* Profil fejléc */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-ring">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user.name} className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-placeholder">{(user.name || '?')[0].toUpperCase()}</span>
            )}
          </div>
          <button
            className="profile-avatar-change-btn"
            title="Profilkép cserélése"
            onClick={() => fileInputRef.current?.click()}
          >
            ✎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="profile-avatar-file-input"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <input
              className="profile-name-input"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setNameError(''); setNameSuggestions([]); }}
              maxLength={50}
              aria-label="Felhasználónév"
            />
            {editName.trim() !== user.name && editName.trim() && (
              <button
                className="profile-name-save-btn"
                onClick={handleSaveName}
                disabled={savingName}
              >
                {savingName ? '...' : 'Mentés'}
              </button>
            )}
          </div>

          {nameError && (
            <p className="profile-name-error">{nameError}</p>
          )}
          {nameSuggestions.length > 0 && (
            <div className="profile-suggestions">
              <span>Szabad variációk:</span>
              {nameSuggestions.map((s) => (
                <button
                  key={s}
                  className="profile-suggestion-chip"
                  onClick={() => { setEditName(s); setNameSuggestions([]); setNameError(''); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {nameSuccess && <p className="profile-name-success">{nameSuccess}</p>}

          <div className="profile-rank-row">
            <span className="profile-rank-badge">{rank}</span>
            <span className="profile-xp">{totalXp} XP</span>
          </div>
          {user.email && <p className="profile-email">{user.email}</p>}
        </div>

        {/* Avatár mentés gomb - csak ha preview != eredeti */}
        {avatarPreview !== (user?.avatarUrl || null) && (
          <button
            className="profile-avatar-save-btn"
            onClick={handleSaveAvatar}
            disabled={savingAvatar}
          >
            {savingAvatar ? 'Mentés...' : '💾 Profilkép mentése'}
          </button>
        )}
        {avatarSuccess && <p className="profile-avatar-success">{avatarSuccess}</p>}
      </div>

      {loadingData ? (
        <p className="profile-loading">Adatok betöltése...</p>
      ) : (
        <div className="profile-boxes">
          {/* Achievementek box */}
          <div className="profile-box">
            <h3 className="profile-box-title">
              <span className="profile-box-icon">🏆</span>
              Achievementek
              <span className="profile-box-count">{achievements.length}</span>
            </h3>
            {achievements.length === 0 ? (
              <p className="profile-box-empty">Még nincs megszerezve achievement.</p>
            ) : (
              <ul className="profile-achievements-list">
                {achievements.map((a) => (
                  <li key={a.id} className="profile-achievement-item">
                    <div className="profile-achievement-info">
                      <strong>{a.title}</strong>
                      {a.description && <span>{a.description}</span>}
                    </div>
                    {typeof a.points === 'number' && a.points > 0 && (
                      <span className="profile-achievement-xp">+{a.points} XP</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Kedvencek box */}
          <div className="profile-box">
            <h3 className="profile-box-title">
              <span className="profile-box-icon">❤️</span>
              Kedvenc játékok
              <span className="profile-box-count">{favorites.length}</span>
            </h3>
            {favorites.length === 0 ? (
              <p className="profile-box-empty">Még nincs kedvenc játék.</p>
            ) : (
              <ul className="profile-games-list">
                {favorites.map((f) => (
                  <li key={f.id} className="profile-game-item">
                    <span className="profile-game-title">{f.cim}</span>
                    {f.mikor && <span className="profile-game-date">{formatDate(f.mikor)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Megtekintett játékok box */}
          <div className="profile-box">
            <h3 className="profile-box-title">
              <span className="profile-box-icon">🎮</span>
              Megtekintett játékok
              <span className="profile-box-count">{openedGames.length}</span>
            </h3>
            {openedGames.length === 0 ? (
              <p className="profile-box-empty">Még nem nyitottál meg játékot.</p>
            ) : (
              <ul className="profile-games-list">
                {openedGames.map((g) => (
                  <li key={g.id} className="profile-game-item">
                    <span className="profile-game-title">{g.title || g.steam_id}</span>
                    {g.genre && <span className="profile-game-genre">{g.genre}</span>}
                    {g.mikor && <span className="profile-game-date">{formatDate(g.mikor)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Keresési előzmények box */}
          <div className="profile-box">
            <h3 className="profile-box-title">
              <span className="profile-box-icon">🔍</span>
              Keresési előzmények
              <span className="profile-box-count">{searchHistory.length}</span>
            </h3>
            {searchHistory.length === 0 ? (
              <p className="profile-box-empty">Nincs keresési előzmény.</p>
            ) : (
              <ul className="profile-search-list">
                {searchHistory.map((s) => (
                  <li key={s.id} className="profile-search-item">
                    <span className="profile-search-query">„{s.query}"</span>
                    {s.mikor && <span className="profile-game-date">{formatDate(s.mikor)}</span>}
                    <button
                      type="button"
                      className="profile-search-delete"
                      title="Törlés"
                      onClick={async () => {
                        try {
                          await deleteSearchHistoryItem(s.id, user.name);
                          setSearchHistory((prev) => prev.filter((x) => x.id !== s.id));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Profile;
