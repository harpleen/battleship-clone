import React from 'react';
import './GameTimer.css';

const GameTimer = ({ gameTime }) => {
const formatTime = (seconds) => {
const minutes = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

return (
<div className="game-timer-container">
    <div className="game-timer-header">
    <div className="timer-icon"></div>
    <h3>Game Timer</h3>
    </div>
    <div className="game-timer-display">
    {formatTime(gameTime)}
    </div>
    <div className="timer-label">MINUTES</div>
</div>
);
};

export default GameTimer;