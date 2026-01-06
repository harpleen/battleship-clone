import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Completed.css';

const Completed = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const gameResult = location.state?.result;
    const playerHits = location.state?.playerHits || 0;
    const cpuHits = location.state?.cpuHits || 0;
    const allShipsDestroyed = location.state?.allShipsDestroyed || false;
    const playerName = location.state?.playerName || 'Player';
    const difficulty = location.state?.difficulty || 'easy';
    const isWin = gameResult === 'win';
    const isTie = gameResult === 'tie';

    // Store game state in sessionStorage for Play Again functionality
    useEffect(() => {
        const gameState = {
            playerName,
            difficulty
        };
        console.log('Storing game state:', gameState);
        sessionStorage.setItem('lastGameState', JSON.stringify(gameState));
        
        // Verify it was stored
        const stored = sessionStorage.getItem('lastGameState');
        console.log('Stored state verification:', stored);
    }, [playerName, difficulty]);

    const handlePlayAgain = () => {
        console.log('Play Again clicked');
        const savedState = sessionStorage.getItem('lastGameState');
        console.log('Retrieved saved state:', savedState);
        
        if (savedState) {
            const gameState = JSON.parse(savedState);
            console.log('Parsed game state:', gameState);
            console.log('Navigating to /game with state:', gameState);
            navigate('/game', { state: gameState });
        } else {
            console.log('No saved state found, navigating to /game without state');
            navigate('/game');
        }
    };

// Generate subtitle based on game outcome
const getSubtitle = () => {
    if (allShipsDestroyed) {
        return isWin ? 'ALL ENEMY SHIPS DESTROYED' : 'ALL YOUR SHIPS DESTROYED';
    }
    if (isTie) {
        return `EQUAL DAMAGE: ${playerHits} STRIKES EACH`;
    }
    if (isWin) {
        return `YOU INFLICTED MORE DAMAGE: ${playerHits} vs ${cpuHits} STRIKES`;
    }
    return `ENEMY INFLICTED MORE DAMAGE: ${cpuHits} vs ${playerHits} STRIKES`;
};

return (
    <div className={`crt ${isWin ? 'win-mode' : isTie ? 'tie-mode' : 'lose-mode'}`}>

    <h1 className="title">
        {isWin ? 'MISSION ACCOMPLISHED' : isTie ? 'MISSION DRAW' : 'MISSION FAILED'}
    </h1>
    
    <div className="subtitle">
        {getSubtitle()}
    </div>

    <div className="menu">
        
        <button onClick={handlePlayAgain} className="start-btn">
        PLAY AGAIN
        </button>

        <Link to="/" className="start-btn btn-back">
        END GAME
        </Link>
    </div>

    
    <div className="footer">
        <span>{isWin ? 'VICTORY' : isTie ? 'DRAW' : 'GAME OVER'}</span>
    </div>
    </div>
);
};

export default Completed;
