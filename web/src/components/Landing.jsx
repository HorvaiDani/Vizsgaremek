import React, { useEffect, useRef } from 'react';
import './Landing.css';

const Landing = ({ onCTAClick }) => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    const split = (el) => {
      if (!el) return;
      const text = el.textContent || '';
      el.textContent = '';
      const letters = text.split('');
      letters.forEach((ch, idx) => {
        const span = document.createElement('span');
        span.className = 'split-letter';
        span.style.setProperty('--i', String(idx));
        span.textContent = ch;
        el.appendChild(span);
      });
    };
    split(titleRef.current);
    split(subtitleRef.current);
  }, []);

  return (
    <section className="landing-hero">
      <div className="landing-inner">
        <h1 ref={titleRef} className="landing-title">GameHUB</h1>
        <p ref={subtitleRef} className="landing-subtitle">Steam játékok, okos ajánlások, személyre szabott élmény</p>
        <div className="landing-actions">
          <a
            href="/games"
            className="landing-cta"
            onClick={(e) => {
              e.preventDefault();
              onCTAClick?.();
            }}
          >
            Játékok böngészése
          </a>
          <a
            href="/games#recommendations"
            className="landing-secondary"
            onClick={(e) => {
              e.preventDefault();
              onCTAClick?.();
              window.setTimeout(() => {
                const el = document.querySelector('.recommendations-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 400);
            }}
          >
            Ajánlások megtekintése
          </a>
        </div>
        <div className="landing-gradient-orb" />
      </div>
    </section>
  );
};

export default Landing;


