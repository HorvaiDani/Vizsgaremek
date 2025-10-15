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
        <h1 ref={titleRef} className="landing-title">PopcornHUB</h1>
        <p ref={subtitleRef} className="landing-subtitle">Okos ajánlások, gyönyörű felület, személyre szabott élmény</p>
        <div className="landing-actions">
          <a href="#search" className="landing-cta" onClick={onCTAClick}>Kezdj keresni</a>
          <a href="#recommendations" className="landing-secondary">Ajánlások megtekintése</a>
        </div>
        <div className="landing-gradient-orb" />
      </div>
    </section>
  );
};

export default Landing;


