import React from 'react';
import { Link } from 'react-router-dom';
import './PlayerProfile.css';

const PlayerProfile = () => {
  // data before backend connected
const stats = {
    gamesPlayed: 42,
    wins: 28,
    losses: 14
};

return (
    <div className="crt profile-container">
    <h1 className="profile-title">PLAYER PROFILE</h1>

    <div className="profile-content">
        
        {/* stats */}
        <div className="profile-block stats-block">
        <h2 className="block-title">YOUR STATISTICS</h2>
        <div className="stats-grid">
            <div className="stat-item">
            <span className="stat-label">GAMES PLAYED:</span>
            <span className="stat-value">{stats.gamesPlayed}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">WON:</span>
            <span className="stat-value">{stats.wins}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">LOST:</span>
            <span className="stat-value">{stats.losses}</span>
            </div>
        </div>
        </div>

        {/* buttons */}
        <Link to="/game" className="start-btn profile-start-btn">
        START MISSION
        </Link>
        
        <Link to="/" className="back-link">
        BACK TO MENU
        </Link>
    </div>
    </div>
);
};

export default PlayerProfile;
