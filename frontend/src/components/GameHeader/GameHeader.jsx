// src/components/GameHeader/GameHeader.jsx
import React from 'react';
import './GameHeader.css';

// Add opponentName to props
const GameHeader = ({ playerName, opponentName = "CPU" }) => {
  return (
    <header className="game-header">
        {/* Use the dynamic name */}
        <h1>{playerName} vs {opponentName}</h1>
        <p className="game-subtitle">Strategic Battle with Time Constraints</p>
    </header>
  );
};

export default GameHeader;