// Kedvencek oldal – a MySQL-ből betöltött kedvenc játékok listája

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getKedvencek, deleteKedvenc } from '../services/favoritesApi';
import Loading from './Loading';
import Error from './Error';
import './Kedvencek.css';

const Kedvencek = ({ user }) => {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKedvencek(user?.name);
      setLista(data);
    } catch (err) {
      setError(err.message || 'Nem sikerült betölteni a kedvenceket. Fut a szerver? (npm run server)');
    } finally {
      setLoading(false);
    }
  }, [user?.name]);

  useEffect(() => {
    if (!user?.name) {
      setLoading(false);
      return;
    }
    load();
  }, [user?.name, load]);

  const handleDelete = async (id) => {
    try {
      await deleteKedvenc(id, user?.name);
      setLista((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('hu-HU');
  };

  if (!user?.name) {
    return (
      <div className="kedvencek-page">
        <h1 className="kedvencek-title">Kedvenc játékaim</h1>
        <p className="kedvencek-info">A kedvencek megtekintéséhez bejelentkezés szükséges.</p>
        <Link to="/login" className="kedvencek-link">
          Bejelentkezés
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kedvencek-page">
        <Loading message="Kedvencek betöltése..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="kedvencek-page">
        <Error message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="kedvencek-page">
      <h1 className="kedvencek-title">Kedvenc játékaim</h1>
      <p className="kedvencek-info">Itt láthatók az adatbázisban (MySQL) tárolt kedvenceid.</p>

      {lista.length === 0 ? (
        <p className="kedvencek-empty">Még nincs kedvenced. Nyiss meg egy játékot, és kattints a „Hozzáadás a kedvencekhez” gombra.</p>
      ) : (
        <ul className="kedvencek-list">
          {lista.map((k) => (
            <li key={k.id} className="kedvencek-item">
              <Link to={`/game/${k.steam_id}`} className="kedvencek-link">
                {k.cim}
              </Link>
              <span className="kedvencek-date">{formatDate(k.mikor)}</span>
              <button
                type="button"
                className="kedvencek-delete"
                onClick={() => handleDelete(k.id)}
                title="Eltávolítás a listából"
              >
                Törlés
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Kedvencek;
