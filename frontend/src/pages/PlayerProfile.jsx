import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getLeaderboardData } from '../services/authService';
import './PlayerProfile.css';

const PlayerProfile = () => {
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
          try {
              const [profileData, leaderboardData] = await Promise.all([
                  getUserProfile(),
                  getLeaderboardData()
              ]);

              setUserStats(profileData);
              setLeaderboard(leaderboardData);
              setLoading(false);
          } catch (err) {
              console.error("Failed to load data:", err);
              navigate('/login');
          }
      };

      fetchData();
  }, [navigate]);

  if (loading) return <div className="crt profile-container">LOADING SATELLITE DATA...</div>;

  return (
    <div className="crt profile-container">
    <h1 className="profile-title">COMMAND CENTER</h1>

    <div className="dashboard-grid">
        
        {/* --- LEFT: YOUR STATS --- */}
        <div className="profile-block">
            <h2 className="block-title">OPERATIVE: {userStats.username}</h2>
            
            <div className="stat-row major">
                <span>RANK RATING:</span>
                <span style={{color: '#ff00ff'}}>{userStats.rankedPoints}</span>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-label">WINS:</span>
                    <span className="stat-value">{userStats.wins}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">LOSSES:</span>
                    <span className="stat-value">{userStats.losses}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">GAMES PLAYED:</span>
                    <span className="stat-value">{userStats.gamesPlayed}</span>
                </div>
            </div>
        </div>

        {/* --- CENTER: DEPLOY BUTTONS --- */}
        <div className="action-column">
            <button 
                className="start-btn deploy-btn" 
                onClick={() => navigate('/lobby')}
            >
                DEPLOY TO RANKED LOBBY
            </button>

            <button 
                className="start-btn secondary-btn" 
                onClick={() => navigate('/game-modes')}
            >
                PRACTICE (CPU)
            </button>
            
            <button 
                className="start-btn logout-btn" 
                onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/');
                }}
            >
                LOGOUT
            </button>
        </div>

        {/* --- RIGHT: LEADERBOARD --- */}
        <div className="profile-block">
            <h2 className="block-title">GLOBAL RANKINGS</h2>
            <div className="leaderboard-list">
                <div className="leaderboard-header">
                    <span>#</span>
                    <span>OPERATIVE</span>
                    <span>RATING</span>
                </div>
                
                {leaderboard.map((player, index) => (
                    <div 
                        key={player._id || index} 
                        className={`leaderboard-row ${player.username === userStats.username ? 'highlight' : ''}`}
                    >
                        <span>{index + 1}</span>
                        <span>{player.username}</span>
                        <span>{player.rankedPoints}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
    </div>
  );
};

export default PlayerProfile;