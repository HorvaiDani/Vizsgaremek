import React, { useState } from 'react';
import './Login.css';
import { registerUser } from '../services/authApi';
import { Link } from 'react-router-dom';

const Register = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      setAvatarFile(null);
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    if (!password) {
      setError('A jelszó megadása kötelező.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek.');
      return;
    }

    const userData = {
      name: name.trim(),
      email: email.trim() || null,
      avatarUrl: avatarPreview || null,
      password,
    };

    try {
      setSubmitting(true);
      setError(null);
      setNameSuggestions([]);
      await registerUser(userData);
      onLogin?.({ name: userData.name, email: userData.email, avatarUrl: userData.avatarUrl });
    } catch (err) {
      setError(err.message || 'Nem sikerült a regisztráció.');
      if (err.suggestions?.length) setNameSuggestions(err.suggestions);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="login-title">Regisztráció</h2>
        <p className="login-subtitle">
          Hozz létre fiókot, hogy az adatbázis megjegyezze a profilod.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
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

          <div className="login-field">
            <label htmlFor="reg-name">Felhasználónév</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSuggestions([]); setError(null); }}
              placeholder="pl. GamerPisti"
              required
            />
          </div>
          {nameSuggestions.length > 0 && (
            <div className="register-suggestions">
              <span>Szabad variációk:</span>
              {nameSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="register-suggestion-chip"
                  onClick={() => { setName(s); setNameSuggestions([]); setError(null); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="reg-email">E-mail (opcionális)</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pl. gamer@pelda.hu"
            />
          </div>

          <div className="login-field">
            <label htmlFor="reg-password">Jelszó</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Adj meg egy erős jelszót"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="reg-confirm">Jelszó megerősítése</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ismételd a jelszót"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={!name.trim() || submitting}>
            {submitting ? 'Folyamatban...' : 'Regisztrálás'}
          </button>

          <p className="login-toggle">
            Már van fiókod? <Link to="/login">Jelentkezz be</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Register;
