import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const userData = {
      name: name.trim(),
      email: email.trim() || null,
      avatarUrl: avatarPreview || null,
    };

    onLogin?.(userData);
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="login-title">Bejelentkezés</h2>
        <p className="login-subtitle">
          Hozz létre egy egyszerű GameHUB profilt, tölts fel avatárt, és gyűjts achievementeket a kereséseiddel.
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

          <button type="submit" className="login-submit" disabled={!name.trim()}>
            Belépés a GameHUB-ba
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;

