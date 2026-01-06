import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Grid from "../../components/Grid/Grid";
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import GameTimer from '../../components/GameTimer/GameTimer';
import QuitButton from '../../components/QuitButton/QuitButton';
import { handleStrike, cpuStrike, checkGameOver } from '../../utils/Strikes/strikeLogic';
import { clusterBombs, missiles, nuke, applyPowerup } from '../../utils/Strikes/powerupLogic';
import ClusterBombs from '../../components/Powerups/Clusterbombs';
import Missiles from '../../components/Powerups/Missiles';
import Nuke from '../../components/Powerups/Nuke';
import './Game.css';

export default function Game() {
    const location = useLocation();
    const navigate = useNavigate();
    const playerName = location.state?.playerName || 'Player';
    const difficulty = location.state?.difficulty || 'easy';
    console.log('Selected difficulty:', difficulty);
    
    // Timer state
    const [gameTime, setGameTime] = useState(60);
    const [currentPlayer, setCurrentPlayer] = useState('player');
    const [playerTurnTime, setPlayerTurnTime] = useState(10);
    const [cpuTurnTime, setCpuTurnTime] = useState(10);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [playerBattleships, setPlayerBattleships] = useState({ positions: [], ships: [] });
    const [cpuBattleships, setCpuBattleships] = useState({ positions: [], ships: [] });
    const [playerStrikes, setPlayerStrikes] = useState([]);
    const [cpuStrikes, setCpuStrikes] = useState([]);
    const [activePowerup, setActivePowerup] = useState(null);
    const [powerupUsage, setPowerupUsage] = useState({
        cluster: 0,
        missiles: 0,
        nuke: 0
    }); 
    
    // Update refs when strikes change
    useEffect(() => {
        playerStrikesRef.current = playerStrikes;
    }, [playerStrikes]);
    
    useEffect(() => {
        cpuStrikesRef.current = cpuStrikes;
    }, [cpuStrikes]);
    
    // Update refs when battleships change
    useEffect(() => {
        playerBattleshipsRef.current = playerBattleships;
    }, [playerBattleships]);
    
    useEffect(() => {
        cpuBattleshipsRef.current = cpuBattleships;
    }, [cpuBattleships]);
    const [gameStatus, setGameStatus] = useState(null);
    const [message, setMessage] = useState('Game started! It\'s your turn.');
    
    // Refs
    const playerTimerRef = useRef(null);
    const gameTimerRef = useRef(null);
    const cpuTimeoutRef = useRef(null);
    const isInitialized = useRef(false);
    const pausedPlayerTime = useRef(null);
    const playerStrikesRef = useRef([]);
    const cpuStrikesRef = useRef([]);
    const playerBattleshipsRef = useRef({ positions: [], ships: [] });
    const cpuBattleshipsRef = useRef({ positions: [], ships: [] });
    
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
        const ships = [];
        
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
                    const shipPositions = [];
                    for (let i = 0; i < length; i++) {
                        const pos = isHorizontal ? startPos + i : startPos + (i * 10);
                        positions.add(pos);
                        shipPositions.push(pos);
                    }
                    ships.push({
                        length,
                        positions: shipPositions,
                        orientation: isHorizontal ? 'horizontal' : 'vertical'
                    });
                    return true;
                }
                attempts++;
            }
            return false;
        };
        
        const shipLengths = [5, 4, 3, 2];
        shipLengths.forEach(length => placeShip(length));
        
        return { positions: Array.from(positions), ships };
    };
    
    // Initialize battleship positions
    useEffect(() => {
        if (!isInitialized.current) {
            setPlayerBattleships(generateRandomPositions());
            setCpuBattleships(generateRandomPositions());
            isInitialized.current = true;
        }
    }, []);
    
    // Helper function to count ship hits
    const countHits = (strikes, battleships) => {
        return strikes.filter(pos => battleships.includes(pos)).length;
    };
    
    // Game timer
    useEffect(() => {
        // Clear any existing timer first
        if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
        }
        
        // Don't start timer if game is over or paused
        if (gameStatus === 'paused' || gameStatus === 'player' || gameStatus === 'cpu' || gameStatus === 'timeout' || gameStatus === 'tie') {
            return;
        }
        
        // Start new game timer
        gameTimerRef.current = setInterval(() => {
            setGameTime(prev => {
                if (prev <= 0) {
                    cleanupTimers();
                    // Compare hit counts to determine winner
                    const playerHits = countHits(playerStrikesRef.current, cpuBattleshipsRef.current.positions);
                    const cpuHits = countHits(cpuStrikesRef.current, playerBattleshipsRef.current.positions);
                    
                    if (playerHits > cpuHits) {
                        setMessage(`⏰ Time's up! YOU WIN with ${playerHits} hits vs ${cpuHits}!`);
                        setGameStatus('player');
                        setTimeout(() => {
                            navigate('/completed', { state: { result: 'win', playerHits, cpuHits } });
                        }, 2000);
                    } else if (cpuHits > playerHits) {
                        setMessage(`⏰ Time's up! CPU WINS with ${cpuHits} hits vs ${playerHits}!`);
                        setGameStatus('cpu');
                        setTimeout(() => {
                            navigate('/completed', { state: { result: 'lose', playerHits, cpuHits } });
                        }, 2000);
                    } else {
                        setMessage(`⏰ Time's up! It's a TIE with ${playerHits} hits each!`);
                        setGameStatus('tie');
                        setTimeout(() => {
                            navigate('/completed', { state: { result: 'tie', playerHits, cpuHits } });
                        }, 2000);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => {
            if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
                gameTimerRef.current = null;
            }
        };
    }, [gameStatus]); // Restart timer when game status changes (including reset)
    
    // Player turn timer
    useEffect(() => {
        // Clear any existing player timer
        if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
        }

        // Start player turn timer if it's player's turn and game is not paused/over
        if (currentPlayer === 'player' && !gameStatus) {
            // Use paused time if available, otherwise reset to 10
            if (pausedPlayerTime.current !== null) {
                setPlayerTurnTime(pausedPlayerTime.current);
                pausedPlayerTime.current = null;
            } else {
                setPlayerTurnTime(10);
            }
            
            // Start the player turn timer
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
                playerTimerRef.current = null;
            }
        };
    }, [currentPlayer, gameStatus]); // Runs when currentPlayer or gameStatus changes
    
    // CPU turn timer and attack
    useEffect(() => {
        if (currentPlayer === 'cpu' && !gameStatus) {
            setCpuTurnTime(10);
            
            // Clear any existing CPU timeout
            if (cpuTimeoutRef.current) {
                clearTimeout(cpuTimeoutRef.current);
            }
            
            // Set CPU turn timer to count down
            const cpuTimerInterval = setInterval(() => {
                setCpuTurnTime(prev => {
                    if (prev <= 1) {
                        clearInterval(cpuTimerInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            // CPU attacks after 1.5 seconds
            cpuTimeoutRef.current = setTimeout(() => {
                clearInterval(cpuTimerInterval);
                cpuAttack();
            }, 1500);

            // Cleanup for CPU timer
            return () => {
                clearInterval(cpuTimerInterval);
                if (cpuTimeoutRef.current) {
                    clearTimeout(cpuTimeoutRef.current);
                }
            };
        }
    }, [currentPlayer, gameStatus]);

    const handlePlayerStrike = (idx) => {
        if (currentPlayer !== 'player' || gameStatus) return;
        
        // Check if a powerup is active
        if (activePowerup) {
            handlePowerupStrike(idx);
            return;
        }
        
        const result = handleStrike(idx, playerStrikes, cpuBattleships.positions);
        
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

        // Check if all enemy ships are destroyed
        if (checkGameOver(newStrikes, cpuBattleships.positions)) {
            cleanupTimers();
            const playerHits = countHits(newStrikes, cpuBattleships.positions);
            const cpuHits = countHits(cpuStrikes, playerBattleships.positions);
            setMessage('🎉 YOU WIN! All enemy ships destroyed!');
            setGameStatus('player');
            setTimeout(() => {
                navigate('/completed', { state: { result: 'win', playerHits, cpuHits, allShipsDestroyed: true } });
            }, 2000);
            return;
        }

        if (!result.isHit) {
            setCurrentPlayer('cpu');
        }
    };

    const handlePowerupStrike = (idx) => {
        let powerupStrikes = [];
        
        // Get the positions to strike based on powerup type
        switch (activePowerup) {
            case 'cluster':
                powerupStrikes = clusterBombs(idx);
                break;
            case 'missiles':
                powerupStrikes = missiles(idx, playerStrikes);
                break;
            case 'nuke':
                powerupStrikes = nuke(idx);
                break;
            default:
                return;
        }
        
        // Apply the powerup
        const result = applyPowerup(powerupStrikes, playerStrikes, cpuBattleships.positions);
        setPlayerStrikes(result.newStrikes);
        setMessage(result.message);
        
        // Clear player timer
        if (playerTimerRef.current) {
            clearInterval(playerTimerRef.current);
            playerTimerRef.current = null;
        }
        
        // Increment powerup usage
        setPowerupUsage(prev => ({
            ...prev,
            [activePowerup]: prev[activePowerup] + 1
        }));
        
        // Deactivate powerup after use
        setActivePowerup(null);
        
        // Check if all enemy ships are destroyed
        if (checkGameOver(result.newStrikes, cpuBattleships.positions)) {
            cleanupTimers();
            const playerHits = countHits(result.newStrikes, cpuBattleships.positions);
            const cpuHits = countHits(cpuStrikes, playerBattleships.positions);
            setMessage('🎉 YOU WIN! All enemy ships destroyed!');
            setGameStatus('player');
            setTimeout(() => {
                navigate('/completed', { state: { result: 'win', playerHits, cpuHits, allShipsDestroyed: true } });
            }, 2000);
            return;
        }
        
        // Switch to CPU turn
        setCurrentPlayer('cpu');
    };

    const cpuAttack = (currentStrikes = cpuStrikes) => {
        if (gameStatus) return;
        
        const result = cpuStrike(currentStrikes, playerBattleships.positions, difficulty);
        
        if (!result) return;

        const newStrikes = [...currentStrikes, result.position];
        setCpuStrikes(newStrikes);
        setMessage(result.message);

        // Check if all player ships are destroyed
        if (checkGameOver(newStrikes, playerBattleships.positions)) {
            cleanupTimers();
            const playerHits = countHits(playerStrikes, cpuBattleships.positions);
            const cpuHits = countHits(newStrikes, playerBattleships.positions);
            setMessage('💀 CPU WINS! All your ships destroyed!');
            setGameStatus('cpu');
            setTimeout(() => {
                navigate('/completed', { state: { result: 'lose', playerHits, cpuHits, allShipsDestroyed: true } });
            }, 2000);
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
        // Clean up all timers
        cleanupTimers();
        
        // Reset all state variables
        setGameTime(180);
        setCurrentPlayer('player');
        setPlayerTurnTime(10);
        setCpuTurnTime(10);
        setPlayerStrikes([]);
        setCpuStrikes([]);
        setGameStatus(null);
        
        // Reset powerup usage
        setPowerupUsage({
            cluster: 0,
            missiles: 0,
            nuke: 0
        });
        setActivePowerup(null);
        
        // Generate new ship positions
        setPlayerBattleships(generateRandomPositions());
        setCpuBattleships(generateRandomPositions());
        
        // Reset message
        setMessage('Game started! It\'s your turn.');
        
        // Reset the initialization flag if needed
        isInitialized.current = false;
        
        // Clear any paused time
        pausedPlayerTime.current = null;
        
        // Clear any pending timeouts
        if (cpuTimeoutRef.current) {
            clearTimeout(cpuTimeoutRef.current);
            cpuTimeoutRef.current = null;
        }
        
        // Force restart of game timer
        setTimeout(() => {
            if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
                gameTimerRef.current = null;
            }
            
            gameTimerRef.current = setInterval(() => {
                setGameTime(prev => {
                    if (prev <= 1) {
                        clearInterval(gameTimerRef.current);
                        gameTimerRef.current = null;
                        setMessage('Game Over! Time has run out.');
                        setGameStatus('timeout');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 50);
        
        // Force restart of player turn timer by toggling currentPlayer
        // This ensures the player turn timer useEffect runs
        setTimeout(() => {
            // Temporarily set to cpu then back to player to trigger useEffect
            setCurrentPlayer('cpu');
            setTimeout(() => {
                setCurrentPlayer('player');
            }, 100);
        }, 100);
    };

    const pauseGame = () => {
        if (gameStatus) return;
        
        // Save current player turn time before pausing
        if (currentPlayer === 'player') {
            pausedPlayerTime.current = playerTurnTime;
        }
        
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
        
        setGameStatus('paused');
        setMessage('Game paused. Click "Resume" to continue.');
    };

    const resumeGame = () => {
        if (gameStatus !== 'paused') return;
        
        // Clear any existing timers
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
        
        // Set game back to active
        setGameStatus(null);
        setMessage('Game resumed. It\'s your turn.');
        
        // Restart the game timer
        setTimeout(() => {
            if (gameTimerRef.current) {
                clearInterval(gameTimerRef.current);
                gameTimerRef.current = null;
            }
            
            gameTimerRef.current = setInterval(() => {
                setGameTime(prev => {
                    if (prev <= 1) {
                        clearInterval(gameTimerRef.current);
                        gameTimerRef.current = null;
                        setMessage('Game Over! Time has run out.');
                        setGameStatus('timeout');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, 50);
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
                            <div className="player-grid-section">
                                <Grid 
                                    title={`${playerName}\'s Board`}
                                    battleships={playerBattleships} 
                                    strikes={cpuStrikes}
                                    isPlayerBoard={true}
                                />
                                <div className="powerups">
                                    <ClusterBombs 
                                        onClick={() => {
                                            if (powerupUsage.cluster < 2) {
                                                setActivePowerup(activePowerup === 'cluster' ? null : 'cluster');
                                            }
                                        }}
                                        isActive={activePowerup === 'cluster'}
                                        used={powerupUsage.cluster}
                                        total={2}
                                        disabled={powerupUsage.cluster >= 2}
                                    />
                                    <Missiles 
                                        onClick={() => {
                                            if (powerupUsage.missiles < 1) {
                                                setActivePowerup(activePowerup === 'missiles' ? null : 'missiles');
                                            }
                                        }}
                                        isActive={activePowerup === 'missiles'}
                                        used={powerupUsage.missiles}
                                        total={1}
                                        disabled={powerupUsage.missiles >= 1}
                                    />
                                    <Nuke 
                                        onClick={() => {
                                            if (powerupUsage.nuke < 1) {
                                                setActivePowerup(activePowerup === 'nuke' ? null : 'nuke');
                                            }
                                        }}
                                        isActive={activePowerup === 'nuke'}
                                        used={powerupUsage.nuke}
                                        total={1}
                                        disabled={powerupUsage.nuke >= 1}
                                    />
                                </div>
                            </div>
                            <div className="game-status">
                                <div className="status-message">
                                    {message}
                                </div>
                                <div className="moves-display">
                                    <div className="stat-section">
                                        <p className="stat-title">Strikes Landed</p>
                                        <div className="stat-values">
                                            <span className="player-moves">You {countHits(playerStrikes, cpuBattleships.positions)}</span>
                                            <span className="separator"> | </span>
                                            <span className="cpu-moves">CPU {countHits(cpuStrikes, playerBattleships.positions)}</span>
                                        </div>
                                    </div>
                                    <div className="stat-section">
                                        <p className="stat-title">Accuracy</p>
                                        <div className="stat-values">
                                            <span className="player-moves">
                                                {playerStrikes.length > 0 ? Math.round((countHits(playerStrikes, cpuBattleships.positions) / playerStrikes.length) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="game-controls">
                                    <button 
                                        className="reset-btn"
                                        onClick={resetGame}
                                    >
                                        Reset Game
                                    </button>
                                    {gameStatus !== 'paused' ? <button 
                                        className="pause-btn"
                                        onClick={pauseGame}
                                    >
                                        Pause Game
                                    </button> : <button className="resume-btn" onClick={resumeGame}>Resume Game</button>}                                
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