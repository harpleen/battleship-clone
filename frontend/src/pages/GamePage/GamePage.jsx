import React, { useState, useEffect, useRef } from 'react';
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import GameTimer from '../../components/GameTimer/GameTimer';
import QuitButton from '../../components/QuitButton/QuitButton';
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

// Refs for timers
const playerTimerRef = useRef(null);
const gameTimerRef = useRef(null);
const cpuTimeoutRef = useRef(null);

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

// CPU turn
useEffect(() => {
if (currentPlayer === 'cpu') {
    setCpuTurnTime(10); // Reset display to 10
    
    // Clear any existing CPU timeout
    if (cpuTimeoutRef.current) {
    clearTimeout(cpuTimeoutRef.current);
    }
    
    // CPU "thinks" for 2 seconds, then makes a move
    cpuTimeoutRef.current = setTimeout(() => {
    // Add 1 move for CPU
    setCpuMoves(prev => prev + 1);
    setGameMessage('CPU made a move. Player\'s turn!');
    
    // Switch back to player
    setCurrentPlayer('player');
    }, 2000);
}

return () => {
    if (cpuTimeoutRef.current) {
    clearTimeout(cpuTimeoutRef.current);
    }
};
}, [currentPlayer]);

const handleEndTurn = () => {
if (currentPlayer === 'player') {
    // Clear player timer
    if (playerTimerRef.current) {
    clearInterval(playerTimerRef.current);
    playerTimerRef.current = null;
    }
    
    // Add 1 move for player
    setPlayerMoves(prev => prev + 1);
    setGameMessage('Player made a move. CPU\'s turn...');
    
    // Switch to CPU
    setCurrentPlayer('cpu');
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
setGameMessage('Game reset. Ready to start!');

// Restart timers after reset
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
        <div className="vs-text">VS</div>
        <div className="game-status">
            <div className="status-message">
            {gameMessage}
            </div>
            <div className="moves-display">
            Moves: <span className="player-moves">{playerMoves}</span> - <span className="cpu-moves">{cpuMoves}</span>
            </div>
            <div className="game-controls">
            <button 
                className="end-turn-btn"
                onClick={handleEndTurn}
                disabled={currentPlayer !== 'player'}
            >
                End Turn
            </button>
            <button 
                className="reset-btn"
                onClick={resetGame}
            >
                Reset Game
            </button>
            </div>
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