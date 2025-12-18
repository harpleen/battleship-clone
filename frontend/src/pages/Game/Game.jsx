import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Grid from "../../components/Grid/Grid";
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import GameTimer from '../../components/GameTimer/GameTimer';
import QuitButton from '../../components/QuitButton/QuitButton';
import { handleStrike, cpuStrike, checkGameOver } from '../../utils/Strikes/strikeLogic';
import './Game.css';

export default function Game() {
    const location = useLocation();
    const playerName = location.state?.playerName || 'Player';
    
    // Timer state
    const [gameTime, setGameTime] = useState(180);
    const [currentPlayer, setCurrentPlayer] = useState('player');
    const [playerTurnTime, setPlayerTurnTime] = useState(10);
    const [cpuTurnTime, setCpuTurnTime] = useState(10);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [playerBattleships, setPlayerBattleships] = useState([]);
    const [cpuBattleships, setCpuBattleships] = useState([]);
    const [playerStrikes, setPlayerStrikes] = useState([]);
    const [cpuStrikes, setCpuStrikes] = useState([]);
    const [gameStatus, setGameStatus] = useState(null);
    const [message, setMessage] = useState('Game started! It\'s your turn.');
    
    // Refs
    const playerTimerRef = useRef(null);
    const gameTimerRef = useRef(null);
    const cpuTimeoutRef = useRef(null);
    const isInitialized = useRef(false);
    
    // Cleanup timers
    const cleanupTimers = () => {
        if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
        }
        if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
        }
        if (cpuTimeoutRef.current) {
            clearTimeout(cpuTimeoutRef.current);
            cpuTimeoutRef.current = null;
        }
    };

    // Generate random ship positions
    const generateRandomPositions = () => {
            const positions = new Set();
            
            const canPlaceShip = (startPos, length, isHorizontal) => {
                const row = Math.floor(startPos / 10);
                const col = startPos % 10;
                
                // Check ship positions and surrounding area
                for (let i = 0; i < length; i++) {
                    let pos;
                    if (isHorizontal) {
                        // Check if ship goes off right edge
                        if (col + i >= 10) return false;
                        pos = startPos + i;
                    } else {
                        // Check if ship goes off bottom edge
                        if (row + i >= 10) return false;
                        pos = startPos + (i * 10);
                    }
                    
                    if (positions.has(pos)) return false;
                    
                    const currentRow = Math.floor(pos / 10);
                    const currentCol = pos % 10;
                    const adjacentOffsets = [-11, -10, -9, -1, 1, 9, 10, 11];
                    
                    for (let offset of adjacentOffsets) {
                        const adjacentPos = pos + offset;
                        const adjacentRow = Math.floor(adjacentPos / 10);
                        const adjacentCol = adjacentPos % 10;
                        
                        if (adjacentPos >= 0 && adjacentPos < 100) {
                            if (Math.abs(adjacentRow - currentRow) <= 1 && 
                                Math.abs(adjacentCol - currentCol) <= 1) {
                                if (positions.has(adjacentPos)) return false;
                            }
                        }
                    }
                }
                return true;
            };
            
            const placeShip = (length) => {
                let attempts = 0;
                while (attempts < 100) {
                    const startPos = Math.floor(Math.random() * 100);
                    const isHorizontal = Math.random() < 0.5;
                    
                    if (canPlaceShip(startPos, length, isHorizontal)) {
                        for (let i = 0; i < length; i++) {
                            const pos = isHorizontal ? startPos + i : startPos + (i * 10);
                            positions.add(pos);
                        }
                        return true;
                    }
                    attempts++;
                }
                return false;
            };
            
            const shipLengths = [5, 4, 3, 2];
            shipLengths.forEach(length => placeShip(length));
            
            return Array.from(positions);
    };
    
    // Initialize battleship positions
    useEffect(() => {
        if (!isInitialized.current) {
            setPlayerBattleships(generateRandomPositions());
            setCpuBattleships(generateRandomPositions());
            isInitialized.current = true;
        }
    }, []);
    
    // Game timer (3 minutes)
    useEffect(() => {
        if (gameStatus) {
            if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
                gameTimerRef.current = null;
            }
            return;
        }

        gameTimerRef.current = setInterval(() => {
            setGameTime(prev => {
                if (prev <= 0) {
                    cleanupTimers();
                    setMessage('Game Over! Time has run out.');
                    setGameStatus('timeout');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
            }
        };
    }, [gameStatus]);
    
    // Player turn timer
    useEffect(() => {
        if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
        }

        if (currentPlayer === 'player' && !gameStatus) {
            setPlayerTurnTime(10);
            
            playerTimerRef.current = setInterval(() => {
                setPlayerTurnTime(prev => {
                    if (prev <= 1) {
                        clearInterval(playerTimerRef.current);
                        playerTimerRef.current = null;
                        setMessage('⏰ Time\'s up! CPU\'s turn...');
                        setTimeout(() => {
                            setCurrentPlayer('cpu');
                        }, 100);
                        return 0;
                    }
                    if (prev <= 3) {
                        setMessage(`Hurry! ${prev - 1} seconds left!`);
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (playerTimerRef.current) {
                clearInterval(playerTimerRef.current);
            }
        };
    }, [currentPlayer, gameStatus]);
    
    // CPU turn
    useEffect(() => {
        if (currentPlayer === 'cpu' && !gameStatus) {
            setCpuTurnTime(10);
            
            if (cpuTimeoutRef.current) {
                clearTimeout(cpuTimeoutRef.current);
            }
            
            cpuTimeoutRef.current = setTimeout(() => {
                cpuAttack();
            }, 1500);
        }

        return () => {
            if (cpuTimeoutRef.current) {
                clearTimeout(cpuTimeoutRef.current);
            }
        };
    }, [currentPlayer, gameStatus]);

    const handlePlayerStrike = (idx) => {
        if (currentPlayer !== 'player' || gameStatus) return;
        
        const result = handleStrike(idx, playerStrikes, cpuBattleships);
        
        if (!result.success) {
            console.log(result.message);
            return;
        }

        const newStrikes = [...playerStrikes, idx];
        setPlayerStrikes(newStrikes);
        setMessage(result.message);
        
        // Clear player timer
        if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
        }

        if (checkGameOver(newStrikes, cpuBattleships)) {
            setMessage('🎉 YOU WIN! All enemy ships destroyed!');
            setGameStatus('player');
            cleanupTimers();
            return;
        }

        if (!result.isHit) {
            setCurrentPlayer('cpu');
        }
    };

    const cpuAttack = (currentStrikes = cpuStrikes) => {
        if (gameStatus) return;
        
        const result = cpuStrike(currentStrikes, playerBattleships);
        
        if (!result) return;

        const newStrikes = [...currentStrikes, result.position];
        setCpuStrikes(newStrikes);
        setMessage(result.message);

        if (checkGameOver(newStrikes, playerBattleships)) {
            setMessage('💀 CPU WINS! All your ships destroyed!');
            setGameStatus('cpu');
            cleanupTimers();
            return;
        }

        if (result.isHit) {
            setTimeout(() => {
                cpuAttack(newStrikes);
            }, 1500);
        } else {
            setCurrentPlayer('player');
        }
    };
    
    const handleQuit = () => {
        setShowQuitConfirm(true);
    };

    const confirmQuit = () => {
        cleanupTimers();
        window.history.back();
    };

    const cancelQuit = () => {
        setShowQuitConfirm(false);
    };
    
    const resetGame = () => {
        Game();
        cleanupTimers();
        setGameTime(180);
        setCurrentPlayer('player');
        setPlayerTurnTime(10);
        setCpuTurnTime(10);
        setPlayerStrikes([]);
        setCpuStrikes([]);
        setGameStatus(null);
        setPlayerBattleships(generateRandomPositions());
        setCpuBattleships(generateRandomPositions());
        setMessage('Game reset. Ready to start!');

        setTimeout(() => {
            setMessage('Game started! It\'s your turn.');
        }, 100);
    };

    return (
        <div className="game-page">
            {/* Top Bar with Header */}
            <div className="top-bar">
                <div className="top-bar-center">
                    <GameHeader playerName={playerName}/>
                </div>
            </div>

            {/* Main Content */}
            <div className="game-content">
                <div className="players-container">
                    <PlayerCard
                        playerType="player"
                        isActive={currentPlayer === 'player'}
                        turnTime={playerTurnTime}
                        moves={playerStrikes.length}
                    />
                    
                    <div className="vs-section">
                        <div className="center-info">
                            <GameTimer gameTime={gameTime} />
                            <div className="vs-text">VS</div>
                        </div>
                        
                        <div className="game-grids-container">
                            <Grid 
                                title={`${playerName}\'s Board`}
                                battleships={playerBattleships} 
                                strikes={cpuStrikes}
                                isPlayerBoard={true}
                            />
                            <div className="game-status">
                                <div className="status-message">
                                    {message}
                                </div>
                                <div className="moves-display">
                                    Strikes: <span className="player-moves">{playerStrikes.length}</span> - <span className="cpu-moves">{cpuStrikes.length}</span>
                                </div>
                                <div className="game-controls">
                                    <button 
                                        className="reset-btn"
                                        onClick={resetGame}
                                    >
                                        Reset Game
                                    </button>
                                </div>
                            </div>
                            <Grid 
                                title="CPU Board" 
                                battleships={cpuBattleships} 
                                strikes={playerStrikes}
                                onStrike={handlePlayerStrike}
                                isPlayerBoard={false}
                            />
                        </div>
                    </div>
                    
                    <PlayerCard
                        playerType="cpu"
                        isActive={currentPlayer === 'cpu'}
                        turnTime={cpuTurnTime}
                        moves={cpuStrikes.length}
                    />
                </div>
            </div>

            {/* Quit Button at the Bottom */}
            <div className="bottom-bar">
                <QuitButton onClick={handleQuit} />
            </div>

            {/* Quit Confirmation Modal */}
            {showQuitConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Quit Game?</h3>
                        <p>Are you sure you want to quit? Your progress will be lost.</p>
                        <div className="modal-buttons">
                            <button className="modal-btn confirm-btn" onClick={confirmQuit}>
                                Yes, Quit
                            </button>
                            <button className="modal-btn cancel-btn" onClick={cancelQuit}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}