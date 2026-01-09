import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RankedLobby.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RankedLobby() {
    const navigate = useNavigate();
    const [yourRank, setYourRank] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        
        fetchYourRank();
        fetchLeaderboard();
    }, [token]);

    const fetchYourRank = async () => {
        try {
            const response = await fetch(`${API_URL}/api/leaderboard/rank`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setYourRank(data);
            } else {
                setError('Failed to load your stats');
            }
        } catch (err) {
            console.error('Rank fetch error:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${API_URL}/api/leaderboard/top?limit=10`);
            const data = await response.json();
            
            if (response.ok) {
                setLeaderboard(data.leaderboard);
            }
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
        }
    };

    const handleFindMatch = () => {
        setIsSearching(true);
        // Wait for animation then navigate
        setTimeout(() => {
            navigate('/matchmaking');
        }, 1500);
    };

    const handleViewFullLeaderboard = () => {
        navigate('/leaderboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const getRankClass = (rank) => {
        if (rank === 1) return 'top-1';
        if (rank === 2) return 'top-2';
        if (rank === 3) return 'top-3';
        return '';
    };

    if (loading) {
        return (
            <div className="ranked-lobby-container">
                <div className="loading-message">Loading your stats...</div>
            </div>
        );
    }

    if (error || !yourRank) {
        return (
            <div className="ranked-lobby-container">
                <div className="ranked-lobby-header">
                    <h1 className="ranked-lobby-title">RANKED LOBBY</h1>
                </div>
                <div className="error-message">{error || 'Failed to load stats'}</div>
                <div className="lobby-actions">
                    <button className="lobby-btn" onClick={() => navigate('/')}>
                        BACK TO MENU
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ranked-lobby-container">
            {/* Searching Animation Overlay */}
            {isSearching && (
                <div className="searching-overlay">
                    <div className="searching-content">
                        <h2 className="searching-title">INITIATING MATCHMAKING</h2>
                        <div className="searching-spinner"></div>
                        <p className="searching-text">Preparing for combat...</p>
                    </div>
                </div>
            )}

            <div className="ranked-lobby-header">
                <h1 className="ranked-lobby-title">⚔️ RANKED LOBBY</h1>
                <p className="ranked-lobby-subtitle">Competitive Matchmaking</p>
            </div>

            <div className="ranked-lobby-content">
                {/* Your Stats */}
                <div className="your-stats-card">
                    <h2 className="your-stats-title">Your Combat Record</h2>
                    
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-label">Global Rank</div>
                            <div className="stat-value mega">#{yourRank.rank}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">MMR Rating</div>
                            <div className="stat-value mega">{yourRank.mmr}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Wins</div>
                            <div className="stat-value">{yourRank.wins}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Losses</div>
                            <div className="stat-value">{yourRank.losses}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Total Matches</div>
                            <div className="stat-value">{yourRank.totalGames}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Win Rate</div>
                            <div className="stat-value">{yourRank.winRate}%</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Current Streak</div>
                            <div className="stat-value">{yourRank.currentStreak}</div>
                        </div>
                        
                        <div className="stat-box">
                            <div className="stat-label">Best Streak</div>
                            <div className="stat-value">{yourRank.longestStreak}</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lobby-actions">
                        <button className="lobby-btn primary" onClick={handleFindMatch}>
                            🎯 FIND MATCH
                        </button>
                        <button className="lobby-btn" onClick={handleViewFullLeaderboard}>
                            🏆 VIEW FULL LEADERBOARD
                        </button>
                        <button className="lobby-btn" onClick={handleLogout}>
                            🚪 LOGOUT
                        </button>
                    </div>
                </div>

                {/* Top 10 Leaderboard Preview */}
                {leaderboard.length > 0 && (
                    <div className="leaderboard-section">
                        <h2 className="leaderboard-section-title">🏆 Top 10 Commanders</h2>
                        
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>MMR</th>
                                    <th>W/L</th>
                                    <th>Win Rate</th>
                                    <th>Streak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player) => (
                                    <tr 
                                        key={player.rank}
                                        className={yourRank && player.rank === yourRank.rank ? 'your-rank' : ''}
                                    >
                                        <td>
                                            <span className={`rank-number ${getRankClass(player.rank)}`}>
                                                {player.rank === 1 && '🥇 '}
                                                {player.rank === 2 && '🥈 '}
                                                {player.rank === 3 && '🥉 '}
                                                #{player.rank}
                                            </span>
                                        </td>
                                        <td className="username">{player.username}</td>
                                        <td>
                                            <span className="mmr-value">{player.mmr}</span>
                                        </td>
                                        <td>{player.wins}/{player.losses}</td>
                                        <td>{player.winRate}%</td>
                                        <td>{player.currentStreak}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}