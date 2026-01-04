import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/authService'; // Import the function
import './PlayerProfile.css';

const PlayerProfile = () => {
  const navigate = useNavigate();
  
  // State to hold real data
  const [stats, setStats] = useState({
      username: "Loading...",
      wins: 0,
      losses: 0,
      gamesPlayed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      const fetchProfile = async () => {
          try {
              const data = await getUserProfile();
              
              // Calculate total games since DB sends wins/losses separately
              const totalGames = (data.wins || 0) + (data.losses || 0);

              setStats({
                  username: data.username,
                  wins: data.wins || 0,
                  losses: data.losses || 0,
                  gamesPlayed: totalGames
              });
              setLoading(false);
          } catch (err) {
              console.error("Failed to load profile:", err);
              setError("Failed to load profile. Please log in again.");
              setLoading(false);
              // Optional: Redirect to login if token is invalid
              // navigate('/login');
          }
      };

      fetchProfile();
  }, [navigate]);

  if (loading) {
      return <div className="crt profile-container">LOADING PROFILE...</div>;
  }

  if (error) {
      return (
          <div className="crt profile-container">
              <div style={{color: 'red'}}>{error}</div>
              <Link to="/login" className="back-link">GO TO LOGIN</Link>
          </div>
      );
  }

  return (
    <div className="crt profile-container">
    <h1 className="profile-title">OPERATIVE: {stats.username}</h1>

    <div className="profile-content">
        
        {/* stats */}
        <div className="profile-block stats-block">
        <h2 className="block-title">SERVICE RECORD</h2>
        <div className="stats-grid">
            <div className="stat-item">
            <span className="stat-label">GAMES PLAYED:</span>
            <span className="stat-value">{stats.gamesPlayed}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">VICTORIES:</span>
            <span className="stat-value">{stats.wins}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">DEFEATS:</span>
            <span className="stat-value">{stats.losses}</span>
            </div>
        </div>
        </div>

        {/* buttons */}
        <Link to="/lobby" state={{ playerName: stats.username }} className="start-btn profile-start-btn">
        DEPLOY TO LOBBY
        </Link>
        
        <Link to="/" className="back-link">
        LOGOUT / MENU
        </Link>
    </div>
    </div>
  );
};

export default PlayerProfile;