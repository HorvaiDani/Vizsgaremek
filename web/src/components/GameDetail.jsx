// Játék részletoldal – Steam stílusú: leírás, képek, értékelések

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameDetail } from '../services/steamApi';
import { addKedvenc } from '../services/favoritesApi';
import Loading from './Loading';
import Error from './Error';
import './GameDetail.css';

const DESCRIPTION_PREVIEW_LENGTH = 400;

const GameDetail = ({ onFavoriteAdded }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [kedvencStatus, setKedvencStatus] = useState(null); // null | 'loading' | 'ok' | 'hiba'

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) {
        setError('Hiányzó játék azonosító.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getGameDetail(id);
        if (cancelled) return;
        if (!data) {
          setError('A játék nem található.');
        } else {
          setGame(data);
          setSelectedImage(0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Nem sikerült betölteni a játék adatait.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const formatRating = (r) => {
    if (!r || r === 0) return '–';
    return (r * 10).toFixed(0);
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="game-detail-page">
        <Loading message="Játék betöltése..." />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-detail-page">
        <Error
          message={error || 'A játék nem található.'}
          onRetry={() => window.location.reload()}
        />
        <button type="button" className="game-detail-back" onClick={() => navigate(-1)}>
          ← Vissza
        </button>
      </div>
    );
  }

  const images = [game.poster, ...(game.screenshots || []).map((s) => s.full)].filter(Boolean);
  const description = stripHtml(game.description || game.plot);
  const showExpandButton = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = descriptionExpanded || !showExpandButton
    ? description
    : description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + (description.length > DESCRIPTION_PREVIEW_LENGTH ? '…' : '');

  return (
    <div className="game-detail-page">
      <button type="button" className="game-detail-back" onClick={() => navigate(-1)}>
        ← Vissza
      </button>

      <header className="game-detail-header" style={{ backgroundImage: game.background ? `url(${game.background})` : undefined }}>
        <div className="game-detail-header-overlay" />
        <div className="game-detail-header-content">
          <h1 className="game-detail-title">{game.title}</h1>
          <div className="game-detail-meta">
            {game.year && <span>{game.year}</span>}
            {game.genres?.length > 0 && (
              <>
                <span className="game-detail-sep">•</span>
                <span>{game.genres.join(', ')}</span>
              </>
            )}
          </div>
          <div className="game-detail-rating-block">
            <span className="game-detail-rating-label">Értékelés</span>
            <span className="game-detail-rating-value">{formatRating(game.rating)}</span>
          </div>
        </div>
      </header>

      <div className="game-detail-body">
        {images.length > 0 && (
          <section className="game-detail-section game-detail-screenshots">
            <h2>Képek</h2>
            <div className="game-detail-hero-image">
              <img
                src={images[selectedImage]}
                alt={`${game.title} – ${selectedImage + 1}. kép`}
              />
            </div>
            {images.length > 1 && (
              <div className="game-detail-thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`game-detail-thumb ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="game-detail-section game-detail-description">
          <h2>Leírás</h2>
          <p className="game-detail-plot">{displayDescription || 'Nincs elérhető leírás.'}</p>
          {showExpandButton && (
            <button
              type="button"
              className="game-detail-expand-btn"
              onClick={() => setDescriptionExpanded((e) => !e)}
            >
              {descriptionExpanded ? 'Kevesebbet mutat' : 'Többet mutat'}
            </button>
          )}
        </section>

        <section className="game-detail-section game-detail-actions">
          <div className="game-detail-actions-buttons">
            <a
              href={game.steamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="game-detail-steam-btn"
            >
              Megnyitás a Steamen
            </a>
            <button
              type="button"
              className="game-detail-favorite-btn"
              disabled={kedvencStatus === 'loading' || kedvencStatus === 'ok'}
              onClick={async () => {
                setKedvencStatus('loading');
                try {
                  await addKedvenc(game.id, game.title);
                  setKedvencStatus('ok');
                  if (onFavoriteAdded) {
                    onFavoriteAdded();
                  }
                } catch {
                  setKedvencStatus('hiba');
                }
              }}
            >
              {kedvencStatus === 'ok' ? '✓ Kedvencekhez adva' : kedvencStatus === 'loading' ? 'Mentés…' : kedvencStatus === 'hiba' ? 'Hiba, próbáld újra' : '❤ Hozzáadás a kedvencekhez'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameDetail;
