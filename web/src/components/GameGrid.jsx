// Játék rács komponens – játékok megjelenítése rácsban
// Fogadja a játékok listáját, címet és kattintás kezelőt

import React from 'react';
import GameCard from './GameCard';
import './GameGrid.css';

const GameGrid = ({ games, title = "Népszerű játékok", onGameClick }) => {
  return (
    <section className="game-section">
      <h2 className="section-title">{title}</h2>
      <div className="game-grid">
        {games.map((game, index) => (
          <GameCard
            key={game.id || index}
            game={game}
            onClick={onGameClick}
          />
        ))}
      </div>
    </section>
  );
};

export default GameGrid;
