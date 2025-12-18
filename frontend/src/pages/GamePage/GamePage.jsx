import React, { useState, useEffect, useRef } from 'react';
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import GameTimer from '../../components/GameTimer/GameTimer';
import QuitButton from '../../components/QuitButton/QuitButton';
import Grid from '../../components/Grid/Grid';
import { handleStrike, cpuStrike, checkGameOver } from '../../utils/Strikes/strikeLogic';
import './GamePage.css';

const GamePage = () => {
// Game state
const [gameTime, setGameTime] = useState(180); // 3 minutes
const [currentPlayer, setCurrentPlayer] = useState('player');
const [playerTurnTime, setPlayerTurnTime] = useState(10);
const [cpuTurnTime, setCpuTurnTime] = useState(10);
const [playerMoves, setPlayerMoves] = useState(0);
const [cpuMoves, setCpuMoves] = useState(0);
const [gameMessage, setGameMessage] = useState('Game started! Player\'s turn.');
const [showQuitConfirm, setShowQuitConfirm] = useState(false);

// Battleship game state
const [playerBattleships, setPlayerBattleships] = useState([]);
const [cpuBattleships, setCpuBattleships] = useState([]);
const [playerStrikes, setPlayerStrikes] = useState([]);
const [cpuStrikes, setCpuStrikes] = useState([]);
const [gameStatus, setGameStatus] = useState(null);

// Refs for timers
const playerTimerRef = useRef(null);
const gameTimerRef = useRef(null);
const cpuTimeoutRef = useRef(null);
const isInitialized = useRef(false);

// Cleanup all timers
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
        
        for (let i = 0; i < length; i++) {
            let pos;
            if (isHorizontal) {
                if (col + i >= 10) return false;
                pos = startPos + i;
            } else {
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
gameTimerRef.current = setInterval(() => {
    setGameTime(prev => {
    if (prev <= 0) {
        cleanupTimers();
        setGameMessage('Game Over! Time has run out.');
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
}, []);

// Player turn timer (10 seconds)
useEffect(() => {
// Clear any existing player timer
if (playerTimerRef.current) {
    clearInterval(playerTimerRef.current);
    playerTimerRef.current = null;
}

// Only set up timer if it's player's turn
if (currentPlayer === 'player') {
    setPlayerTurnTime(10); // Reset to 10 at start of turn
    
    playerTimerRef.current = setInterval(() => {
    setPlayerTurnTime(prev => {
        if (prev <= 1) {
        // Time's up! No move added for player
        clearInterval(playerTimerRef.current);
        playerTimerRef.current = null;
        
        setGameMessage('⏰ Time\'s up! No move added. CPU\'s turn...');
        
        // Switch to CPU after a brief delay
        setTimeout(() => {
            setCurrentPlayer('cpu');
        }, 100);
        
        return 0;
        }
        
        // Low time warning
        if (prev <= 3) {
        setGameMessage(`Hurry! ${prev - 1} seconds left!`);
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
}, [currentPlayer]);

// CPU turn - actual battleship attack
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
    setPlayerMoves(prev => prev + 1);
    setGameMessage(result.message);

    // Clear player timer
    if (playerTimerRef.current) {
        clearInterval(playerTimerRef.current);
        playerTimerRef.current = null;
    }

    if (checkGameOver(newStrikes, cpuBattleships)) {
        setGameMessage('🎉 YOU WIN! All enemy ships destroyed!');
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
    setCpuMoves(prev => prev + 1);
    setGameMessage(result.message);

    if (checkGameOver(newStrikes, playerBattleships)) {
        setGameMessage('💀 CPU WINS! All your ships destroyed!');
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
cleanupTimers();
setGameTime(180);
setCurrentPlayer('player');
setPlayerTurnTime(10);
setCpuTurnTime(10);
setPlayerMoves(0);
setCpuMoves(0);
setPlayerStrikes([]);
setCpuStrikes([]);
setGameStatus(null);
setPlayerBattleships(generateRandomPositions());
setCpuBattleships(generateRandomPositions());
setGameMessage('Game reset. Ready to start!');

setTimeout(() => {
    setGameMessage('Game started! Player\'s turn.');
}, 100);
};

return (
<div className="game-page">
    {/* Top Bar with Game Timer */}
    <div className="top-bar">
    <div className="top-bar-left">
        <GameTimer gameTime={gameTime} />
    </div>
    <div className="top-bar-center">
        <GameHeader />
    </div>
    </div>

    {/* Main Content */}
    <div className="game-content">
    <div className="players-container">
        <PlayerCard
        playerType="player"
        isActive={currentPlayer === 'player'}
        turnTime={playerTurnTime}
        moves={playerMoves}
        />
        
        <div className="vs-section">
        <div className="game-grids-container">
            <Grid 
                title="Player Board" 
                battleships={playerBattleships} 
                strikes={cpuStrikes}
                isPlayerBoard={true}
            />
            <div className="center-info">
                <div className="vs-text">VS</div>
                <div className="game-status">
                    <div className="status-message">
                        {gameMessage}
                    </div>
                    <div className="moves-display">
                        Strikes: <span className="player-moves">{playerMoves}</span> - <span className="cpu-moves">{cpuMoves}</span>
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
        moves={cpuMoves}
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
);
};

export default GamePage;