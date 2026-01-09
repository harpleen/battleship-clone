import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { connectSocket } from '../../services/socket'; 
import Grid from "../../components/Grid/Grid";
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import GameTimer from '../../components/GameTimer/GameTimer';
import QuitButton from '../../components/QuitButton/QuitButton';
import ClusterBombs from '../../components/Powerups/ClusterBombs';
import Missiles from '../../components/Powerups/Missiles';
import Nuke from '../../components/Powerups/Nuke';
import './PvPGame.css';
import shipStrike from '../../assets/sound_effects/ship_strike.mp3';
import clusterbomb from '../../assets/sound_effects/clusterbomb.mp3';
import nukeSound from '../../assets/sound_effects/nuke.mp3';

export default function PvPGame() {
    const location = useLocation();
    const navigate = useNavigate();
    const matchData = location.state?.matchData;
    
    const [roomId, setRoomId] = useState(matchData?.roomId || '');
    const [playerIndex, setPlayerIndex] = useState(matchData?.playerIndex || 0);
    const [opponent, setOpponent] = useState(matchData?.opponent || {});
    
    const [yourBattleships, setYourBattleships] = useState(matchData?.gameState?.yourBattleships || { positions: [], ships: [] });
    const [opponentBattleships, setOpponentBattleships] = useState({ positions: [], ships: [] });
    const [yourStrikes, setYourStrikes] = useState([]);
    const [opponentStrikes, setOpponentStrikes] = useState([]);
    
    const [currentTurn, setCurrentTurn] = useState(0);
    const [isYourTurn, setIsYourTurn] = useState(matchData?.gameState?.isYourTurn || false);
    const [turnTime, setTurnTime] = useState(10);
    const [opponentTurnTime, setOpponentTurnTime] = useState(10);
    
    const [activePowerup, setActivePowerup] = useState(null);
    const [yourPowerups, setYourPowerups] = useState({ cluster: 0, missiles: 0, nuke: 0 });
    const [opponentPowerups, setOpponentPowerups] = useState({ cluster: 0, missiles: 0, nuke: 0 });
    
    const [message, setMessage] = useState(isYourTurn ? 'Your turn!' : 'Opponent\'s turn...');
    const [opponentDisconnected, setOpponentDisconnected] = useState(false);
    const [reconnectTimer, setReconnectTimer] = useState(10);
    
    const [gameOver, setGameOver] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    
    const socketRef = useRef(null);
    const turnTimerRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    useEffect(() => {
        if (!matchData) {
            navigate('/');
            return;
        }


        const socket = connectSocket();
        socketRef.current = socket;
        const token = localStorage.getItem('token');


        socket.on('connect', () => {
            console.log('✅ Socket connected in PvPGame:', socket.id);
            console.log('🎮 Room ID:', roomId);
            console.log('👤 Player Index:', playerIndex);
            console.log('🎲 Is Your Turn:', isYourTurn);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        // Listen for strike results
        socket.on('strike_result', ({ playerIndex: strikerIndex, positions, isHit, message: msg, currentTurn: newTurn, powerup }) => {
            console.log('📥 Strike result received:', { strikerIndex, positions, isHit, newTurn });
            
            if (strikerIndex === playerIndex) {
                // Your strike
                setYourStrikes(prev => [...prev, ...positions]);
                setMessage(msg);
                
                // Play sound
                if (isHit) {
                    playSound(shipStrike);
                }
                if (powerup === 'cluster') {
                    playSound(clusterbomb);
                } else if (powerup === 'nuke') {
                    playSound(nukeSound);
                }
            } else {
                // Opponent's strike
                setOpponentStrikes(prev => [...prev, ...positions]);
                setMessage(`Opponent: ${msg}`);
            }
            
            setCurrentTurn(newTurn);
            setIsYourTurn(newTurn === playerIndex);
            setTurnTime(10);
            setOpponentTurnTime(10);
            setActivePowerup(null);
        });

        // Listen for game over
        socket.on('game_over', ({ winner, loser, winnerMmrChange, loserMmrChange, reason }) => {
            const isWinner = winner === (playerIndex === 0 ? matchData.gameState.yourBattleships : opponent.username);
            
            setGameOver(true);
            setGameResult({
                isWinner,
                winner,
                loser,
                mmrChange: isWinner ? winnerMmrChange : loserMmrChange,
                reason
            });
        });

        // Listen for opponent disconnect
        socket.on('opponent_disconnected', () => {
            setOpponentDisconnected(true);
            setReconnectTimer(10);
            
            // Start reconnection countdown
            reconnectTimerRef.current = setInterval(() => {
                setReconnectTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(reconnectTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Listen for opponent reconnect
        socket.on('opponent_reconnected', () => {
            setOpponentDisconnected(false);
            if (reconnectTimerRef.current) {
                clearInterval(reconnectTimerRef.current);
            }
        });

        socket.on('error', ({ message }) => {
            console.error('Game error:', message);
            alert(message);
        });

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('strike_result');
            socket.off('game_over');
            socket.off('opponent_disconnected');
            socket.off('opponent_reconnected');
            socket.off('error');
            
            if (turnTimerRef.current) {
                clearInterval(turnTimerRef.current);
            }
            if (reconnectTimerRef.current) {
                clearInterval(reconnectTimerRef.current);
            }
        };
    }, [matchData, navigate, playerIndex, opponent, roomId, isYourTurn]);

    // Turn timer
    useEffect(() => {
        if (gameOver || opponentDisconnected) return;

        if (turnTimerRef.current) {
            clearInterval(turnTimerRef.current);
        }

        turnTimerRef.current = setInterval(() => {
            if (isYourTurn) {
                setTurnTime(prev => {
                    if (prev <= 1) {
                        // Time's up - auto miss
                        handlePlayerStrike(Math.floor(Math.random() * 100));
                        return 10;
                    }
                    return prev - 1;
                });
            } else {
                setOpponentTurnTime(prev => prev > 0 ? prev - 1 : 0);
            }
        }, 1000);

        return () => {
            if (turnTimerRef.current) {
                clearInterval(turnTimerRef.current);
            }
        };
    }, [isYourTurn, gameOver, opponentDisconnected]);

    const playSound = (soundFile, volume = 0.3) => {
        const sound = new Audio(soundFile);
        sound.volume = volume;
        sound.play().catch(error => console.log('Sound error:', error));
    };

    const handlePlayerStrike = (position) => {
        console.log('🎯 Strike attempted:', {
            position,
            isYourTurn,
            gameOver,
            opponentDisconnected,
            roomId,
            alreadyStruck: yourStrikes.includes(position)
        });
        
        if (!isYourTurn || gameOver || opponentDisconnected) {
            console.log('❌ Strike blocked');
            return;
        }

        const socket = socketRef.current;
        const token = localStorage.getItem('token');

        // Check if position already struck
        if (yourStrikes.includes(position)) {
            setMessage('Already struck this position!');
            return;
        }

        console.log('📤 Sending strike to server:', { roomId, position, powerup: activePowerup });

        // Send strike to server
        socket.emit('player_strike', {
            roomId,
            position,
            powerup: activePowerup,
            token
        });

        // Update local powerup usage
        if (activePowerup) {
            setYourPowerups(prev => ({
                ...prev,
                [activePowerup]: prev[activePowerup] + 1
            }));
        }
    };

    const handleQuit = () => {
        if (window.confirm('Are you sure you want to quit? This will count as a loss.')) {
            navigate('/');
        }
    };

    const handlePlayAgain = () => {
        navigate('/matchmaking');
    };

    const handleViewLeaderboard = () => {
        navigate('/leaderboard');
    };

    const countHits = (strikes, battleshipPositions) => {
        return strikes.filter(pos => battleshipPositions.includes(pos)).length;
    };

    if (!matchData) {
        return null;
    }

    return (
        <div className="game-page pvp-game-page">
            <div className="pvp-indicator">
                ⚔️ PvP MODE - LIVE MATCH
            </div>

            <GameHeader playerName="PvP Battle" />

            <div className="game-container">
                <div className="game-layout">
                    <PlayerCard
                        playerType="player"
                        isActive={isYourTurn}
                        turnTime={turnTime}
                        moves={yourStrikes.length}
                    />
                    
                    <div className="center-section">
                        <GameTimer gameTime={0} />
                        
                        <div className="grids-container">
                            <div className="player-grid-section">
                                <Grid 
                                    title="Your Board" 
                                    battleships={yourBattleships} 
                                    strikes={opponentStrikes}
                                    isPlayerBoard={true}
                                />
                                <div className="powerups">
                                    <ClusterBombs 
                                        onClick={() => {
                                            if (yourPowerups.cluster < 2 && isYourTurn) {
                                                setActivePowerup(activePowerup === 'cluster' ? null : 'cluster');
                                            }
                                        }}
                                        isActive={activePowerup === 'cluster'}
                                        used={yourPowerups.cluster}
                                        total={2}
                                        disabled={yourPowerups.cluster >= 2 || !isYourTurn}
                                    />
                                    <Missiles 
                                        onClick={() => {
                                            if (yourPowerups.missiles < 1 && isYourTurn) {
                                                setActivePowerup(activePowerup === 'missiles' ? null : 'missiles');
                                            }
                                        }}
                                        isActive={activePowerup === 'missiles'}
                                        used={yourPowerups.missiles}
                                        total={1}
                                        disabled={yourPowerups.missiles >= 1 || !isYourTurn}
                                    />
                                    <Nuke 
                                        onClick={() => {
                                            if (yourPowerups.nuke < 1 && isYourTurn) {
                                                setActivePowerup(activePowerup === 'nuke' ? null : 'nuke');
                                            }
                                        }}
                                        isActive={activePowerup === 'nuke'}
                                        used={yourPowerups.nuke}
                                        total={1}
                                        disabled={yourPowerups.nuke >= 1 || !isYourTurn}
                                    />
                                </div>
                            </div>
                            
                            <div className="game-status">
                                <div className="status-message">
                                    {message}
                                </div>
                                <div className="moves-display">
                                    <div className="stat-section">
                                        <p className="stat-title">VS</p>
                                        <div className="stat-values">
                                            <span className="player-moves">{opponent.username}</span>
                                        </div>
                                        <div className="stat-values">
                                            <span className="cpu-moves">MMR: {opponent.mmr}</span>
                                        </div>
                                    </div>
                                    <div className="stat-section">
                                        <p className="stat-title">Strikes Landed</p>
                                        <div className="stat-values">
                                            <span className="player-moves">You {countHits(yourStrikes, opponentBattleships.positions)}</span>
                                            <span className="separator"> | </span>
                                            <span className="cpu-moves">Them {countHits(opponentStrikes, yourBattleships.positions)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="cpu-grid-section">
                                <Grid 
                                    title="Opponent Board" 
                                    battleships={opponentBattleships} 
                                    strikes={yourStrikes}
                                    onStrike={handlePlayerStrike}
                                    isPlayerBoard={false}
                                />
                                <div className="powerups">
                                    <ClusterBombs 
                                        onClick={() => {}} 
                                        isActive={false}
                                        used={opponentPowerups.cluster}
                                        total={2}
                                        disabled={true}
                                    />
                                    <Missiles 
                                        onClick={() => {}} 
                                        isActive={false}
                                        used={opponentPowerups.missiles}
                                        total={1}
                                        disabled={true}
                                    />
                                    <Nuke 
                                        onClick={() => {}} 
                                        isActive={false}
                                        used={opponentPowerups.nuke}
                                        total={1}
                                        disabled={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <PlayerCard
                        playerType="cpu"
                        isActive={!isYourTurn}
                        turnTime={opponentTurnTime}
                        moves={opponentStrikes.length}
                    />
                </div>
            </div>

            {/* Quit Button */}
            <div className="bottom-bar">
                <QuitButton onClick={handleQuit} />
            </div>

            {/* Opponent Disconnected Overlay */}
            {opponentDisconnected && (
                <div className="opponent-disconnected-overlay">
                    <div className="opponent-disconnected-content">
                        <h2>⚠️ OPPONENT DISCONNECTED</h2>
                        <p>Waiting for opponent to reconnect...</p>
                        <div className="reconnect-timer">{reconnectTimer}</div>
                        <p>If opponent doesn't reconnect, you win!</p>
                        <div className="waiting-animation">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {gameOver && gameResult && (
                <div className="pvp-game-over-modal">
                    <div className={`pvp-game-over-content ${gameResult.isWinner ? 'victory' : 'defeat'}`}>
                        <h1 className={`pvp-game-over-title ${gameResult.isWinner ? 'victory' : 'defeat'}`}>
                            {gameResult.isWinner ? '🎉 VICTORY!' : '💀 DEFEAT'}
                        </h1>
                        
                        <div className="pvp-stats">
                            <div className="pvp-stat-row">
                                <span className="pvp-stat-label">WINNER:</span>
                                <span className={`pvp-stat-value ${gameResult.isWinner ? 'positive' : ''}`}>
                                    {gameResult.winner}
                                </span>
                            </div>
                            <div className="pvp-stat-row">
                                <span className="pvp-stat-label">LOSER:</span>
                                <span className={`pvp-stat-value ${!gameResult.isWinner ? 'negative' : ''}`}>
                                    {gameResult.loser}
                                </span>
                            </div>
                            <div className="pvp-stat-row">
                                <span className="pvp-stat-label">END REASON:</span>
                                <span className="pvp-stat-value">
                                    {gameResult.reason === 'all_ships_destroyed' ? 'All Ships Destroyed' : 
                                     gameResult.reason === 'disconnect' ? 'Opponent Disconnected' : 
                                     'Timeout'}
                                </span>
                            </div>
                        </div>
                        
                        <div className={`mmr-change ${gameResult.mmrChange > 0 ? 'gain' : 'loss'}`}>
                            MMR: {gameResult.mmrChange > 0 ? '+' : ''}{gameResult.mmrChange}
                        </div>
                        
                        <div className="pvp-buttons">
                            <button className="pvp-btn pvp-btn-primary" onClick={handlePlayAgain}>
                                PLAY AGAIN
                            </button>
                            <button className="pvp-btn pvp-btn-secondary" onClick={handleViewLeaderboard}>
                                LEADERBOARD
                            </button>
                            <button className="pvp-btn pvp-btn-secondary" onClick={() => navigate('/')}>
                                MAIN MENU
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}