import React from 'react';
import './GameHeader.css';

const GameHeader = ({ playerName, isGodMode = false }) => {
return (
<header className="game-header">
    <h1>{playerName} vs {isGodMode ? 'AI' : 'CPU'}</h1>
    <p className="game-subtitle">Strategic Battle with Time Constraints</p>
</header>
);
};

export default GameHeader;