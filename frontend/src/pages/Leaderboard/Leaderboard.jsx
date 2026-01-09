import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Leaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [yourRank, setYourRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchLeaderboard();
        if (token) {
            fetchYourRank();
        }
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(`${API_URL}/api/leaderboard/top?limit=100`);
            const data = await response.json();
            
            if (response.ok) {
                setLeaderboard(data.leaderboard);
            } else {
                setError('Failed to load leaderboard');
            }
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

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
            }
        } catch (err) {
            console.error('Rank fetch error:', err);
        }
    };

    const getWinRateClass = (winRate) => {
        if (winRate >= 60) return 'high';
        if (winRate >= 45) return 'medium';
        return 'low';
    };

    const getRankClass = (rank) => {
        if (rank === 1) return 'top-1';
        if (rank === 2) return 'top-2';
        if (rank === 3) return 'top-3';
        return '';
    };

    if (loading) {
        return (
            <div className="leaderboard-container">
                <div className="loading-message">Loading leaderboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h1 className="leaderboard-title">LEADERBOARD</h1>
                </div>
                <div className="error-message">{error}</div>
                <div className="back-button-container">
                    <button className="back-to-menu-btn" onClick={() => {
                        const token = localStorage.getItem('token');
                        if (token) {
                            navigate('/ranked-lobby');
                        } else {
                            navigate('/');
                        }
                    }}>
                        {localStorage.getItem('token') ? 'BACK TO LOBBY' : 'BACK TO MENU'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h1 className="leaderboard-title">🏆 LEADERBOARD</h1>
                <p className="leaderboard-subtitle">Top Commanders</p>
            </div>

            <div className="leaderboard-content">
                {/* Your Rank Card (if logged in) */}
                {yourRank && (
                    <div className="your-rank-card">
                        <h2 className="your-rank-title">Your Stats</h2>
                        <div className="your-rank-stats">
                            <div className="rank-stat">
                                <div className="rank-stat-label">Rank</div>
                                <div className="rank-stat-value large">#{yourRank.rank}</div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-label">MMR</div>
                                <div className="rank-stat-value large">{yourRank.mmr}</div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-label">Wins</div>
                                <div className="rank-stat-value">{yourRank.wins}</div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-label">Losses</div>
                                <div className="rank-stat-value">{yourRank.losses}</div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-label">Win Rate</div>
                                <div className="rank-stat-value">{yourRank.winRate}%</div>
                            </div>
                            <div className="rank-stat">
                                <div className="rank-stat-label">Win Streak</div>
                                <div className="rank-stat-value">{yourRank.currentStreak}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard Table */}
                <div className="leaderboard-table-container">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>MMR</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>Total</th>
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
                                    <td>{player.wins}</td>
                                    <td>{player.losses}</td>
                                    <td>{player.totalGames}</td>
                                    <td>
                                        <span className={`win-rate ${getWinRateClass(player.winRate)}`}>
                                            {player.winRate}%
                                        </span>
                                    </td>
                                    <td>{player.currentStreak}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="back-button-container">
                    <button className="back-to-menu-btn" onClick={() => navigate('/')}>
                        BACK TO MENU
                    </button>
                </div>
            </div>
        </div>
    );
}