import React from 'react';
// import './PlayerCard.css';

const PlayerCard = ({ 
playerType, 
isActive, 
turnTime, 
moves = 0 
}) => {
const isPlayer = playerType === 'player';
const playerName = isPlayer ? 'Player' : 'CPU';
const borderColor = isActive ? '#0f0' : '#0a0';
const textColor = isActive ? '#0f0' : '#0a0';

return (
<div 
    className={`player-card ${isActive ? 'active' : ''}`}
    style={{ 
    borderColor: borderColor,
    borderStyle: isActive ? 'solid' : 'dashed',
    borderWidth: '2px'
    }}
>
    <div className="player-header">
    <div className="player-icon-container">
        <div 
        className="player-icon"
        style={{ 
            backgroundColor: textColor,
            color: '#000',
            borderColor: textColor
        }}
        >
        {isPlayer ? 'P' : 'C'}
        </div>
    </div>
    <h3 style={{ color: textColor }}>{playerName}</h3>
    </div>
    
    <div className="turn-timer-section">
    <div className="turn-timer-label" style={{ color: '#0a0' }}>TURN TIMER</div>
    <div 
        className="turn-timer"
        style={{ color: textColor }}
    >
        {turnTime.toString().padStart(2, '0')}
    </div>
    <div className="timer-unit" style={{ color: '#0a0' }}>SECONDS</div>
    </div>
    
    <div className="player-info" style={{ borderColor: '#0a0' }}>
    <div className="info-row">
        <span className="info-label" style={{ color: '#0a0' }}>MOVES:</span>
        <span className="info-value" style={{ color: textColor }}>{moves}</span>
    </div>
    <div className="info-row">
        <span className="info-label" style={{ color: '#0a0' }}>STATUS:</span>
        <span className="info-value" style={{ color: textColor }}>
        {isActive ? 'Your Turn' : 'Waiting'}
        </span>
    </div>
    </div>
</div>
);
};

export default PlayerCard;