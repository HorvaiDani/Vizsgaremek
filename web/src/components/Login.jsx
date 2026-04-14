import React, { useState } from 'react';
import './Login.css';
import { loginUser } from '../services/authApi';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await loginUser({ name: name.trim(), password });
      onLogin?.(res.user || { name: name.trim() });
    } catch (err) {
      setError(err.message || 'Nem sikerült a bejelentkezés.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h2 className="login-title">Bejelentkezés</h2>
        <p className="login-subtitle">
          Lépj be a felhasználóneveddel és jelszavaddal.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
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
            <label htmlFor="login-password">Jelszó</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Jelszó"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={!name.trim() || submitting}>
            {submitting ? 'Folyamatban...' : 'Bejelentkezés'}
          </button>

          <p className="login-toggle">
            Még nincs fiókod? <Link to="/register">Regisztrálj itt!</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Login;

