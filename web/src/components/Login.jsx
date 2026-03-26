import React, { useState } from 'react';
import './Login.css';
import { registerUser, loginUser } from '../services/authApi';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    const userData = {
      name: name.trim(),
      email: email.trim() || null,
      avatarUrl: avatarPreview || null,
      password: password || '',
    };

    try {
      setSubmitting(true);
      setError(null);
      if (mode === 'register') {
        if (!userData.password) throw new Error('A jelszó megadása kötelező.');
        if (userData.password !== confirmPassword) throw new Error('A jelszavak nem egyeznek.');
        await registerUser(userData);
        onLogin?.({ name: userData.name, email: userData.email, avatarUrl: userData.avatarUrl });
      } else {
        const res = await loginUser({ name: userData.name, password: userData.password });
        onLogin?.(res.user || userData);
      }
    } catch (err) {
      setError(err.message || 'Nem sikerült a bejelentkezés/regisztráció.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="login-title">Regisztráció / Bejelentkezés</h2>
        <p className="login-subtitle">
          {mode === 'register'
            ? 'Regisztrálj, hogy az adatbázis megjegyezze a fiókodat.'
            : 'Lépj be a felhasználóneveddel — csak lekérdezés történik.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="login-avatar-section">
              <div className="login-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar előnézet" />
                ) : (
                  <span className="avatar-placeholder">+</span>
                )}
              </div>
              <label className="avatar-upload-button">
                Avatár feltöltése
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
              <span className="avatar-hint">PNG vagy JPG kép ajánlott.</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-name">Felhasználónév</label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. GamerPisti"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="login-email">E-mail (opcionális)</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pl. gamer@pelda.hu"
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-password">Jelszó</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Adj meg egy erős jelszót' : 'Jelszó'}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="login-confirm">Jelszó megerősítése</label>
              <input
                id="login-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ismételd a jelszót"
                required
              />
            </div>
          )}

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={!name.trim() || submitting}>
            {submitting ? 'Folyamatban...' : (mode === 'register' ? 'Regisztrálás' : 'Bejelentkezés')}
          </button>

          <p className="login-toggle">
            {mode === 'register' ? (
              <>Már van fiókod? <button type="button" onClick={() => setMode('login')}>Jelentkezz be</button></>
            ) : (
              <>Még nincs fiókod? <button type="button" onClick={() => setMode('register')}>Regisztrálj itt!</button></>
            )}
          </p>
        </form>
      </div>
    </section>
  );
};

export default Login;

