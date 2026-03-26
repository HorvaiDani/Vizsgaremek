// Játék részletoldal – Steam stílusú: leírás, képek, értékelések

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameDetail } from '../services/steamApi';
import { addKedvenc } from '../services/favoritesApi';
import { getComments, addComment } from '../services/commentsApi';
import Loading from './Loading';
import Error from './Error';
import './GameDetail.css';

const DESCRIPTION_PREVIEW_LENGTH = 400;

const GameDetail = ({ user, onFavoriteAdded, onCommentAdded }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [kedvencStatus, setKedvencStatus] = useState(null); // null | 'loading' | 'ok' | 'hiba'
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentStatus, setCommentStatus] = useState(null); // null | 'loading' | 'ok' | 'hiba'

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

  useEffect(() => {
    let cancelled = false;
    const loadComments = async () => {
      if (!id) return;
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const data = await getComments(id);
        if (cancelled) return;
        setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setCommentsError(e?.message || 'Nem sikerült betölteni a kommenteket.');
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    };
    loadComments();
    return () => { cancelled = true; };
  }, [id]);

  const formatRating = (r) => {
    if (!r || r === 0) return '–';
    return Number(r).toLocaleString('hu-HU', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDateTime = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleString('hu-HU');
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
          {typeof game.price === 'number' && (
            <div className="game-detail-price">
              Ár:{' '}
              {game.isFree
                ? 'Ingyenes'
                : `${game.price.toLocaleString('hu-HU')} €`}
            </div>
          )}
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
            <a
              href={`https://www.g2a.com/search?query=${encodeURIComponent(game.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="game-detail-g2a-btn"
            >
              Keresés G2A-n
            </a>
            <button
              type="button"
              className="game-detail-favorite-btn"
              disabled={!user?.name || kedvencStatus === 'loading' || kedvencStatus === 'ok'}
              onClick={async () => {
                if (!user?.name) {
                  setKedvencStatus('hiba');
                  return;
                }
                setKedvencStatus('loading');
                try {
                  await addKedvenc(game.id, game.title, user?.name);
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
            {!user?.name && (
              <div className="game-detail-hint">
                A kedvencekhez adáshoz bejelentkezés szükséges.
              </div>
            )}
          </div>
        </section>

        <section className="game-detail-section game-detail-comments">
          <h2>Kommentek</h2>

          {commentsLoading ? (
            <p className="game-detail-muted">Kommentek betöltése…</p>
          ) : commentsError ? (
            <p className="game-detail-muted">{commentsError}</p>
          ) : comments.length === 0 ? (
            <p className="game-detail-muted">Még nincs komment. Te lehetsz az első!</p>
          ) : (
            <ul className="comments-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-head">
                    <strong className="comment-user">{c.user}</strong>
                    <span className="comment-date">{formatDateTime(c.mikor)}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                </li>
              ))}
            </ul>
          )}

          {user?.name ? (
            <form
              className="comment-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                setCommentStatus('loading');
                try {
                  await addComment({ steamId: id, text: commentText, userName: user.name });
                  setCommentText('');
                  setCommentStatus('ok');
                  const data = await getComments(id);
                  setComments(Array.isArray(data) ? data : []);
                  onCommentAdded?.();
                } catch (err) {
                  console.error(err);
                  setCommentStatus('hiba');
                }
              }}
            >
              <textarea
                className="comment-textarea"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Írj egy kommentet…"
                maxLength={500}
                rows={3}
                disabled={commentStatus === 'loading'}
              />
              <div className="comment-actions">
                <span className="comment-counter">{commentText.trim().length}/500</span>
                <button
                  type="submit"
                  className="comment-submit"
                  disabled={commentStatus === 'loading' || !commentText.trim()}
                >
                  {commentStatus === 'loading' ? 'Küldés…' : 'Komment küldése'}
                </button>
              </div>
              {commentStatus === 'hiba' && (
                <p className="game-detail-muted">Nem sikerült elküldeni. Próbáld újra.</p>
              )}
            </form>
          ) : (
            <p className="game-detail-muted">
              Komment írásához bejelentkezés szükséges.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default GameDetail;
