    import React from 'react';
    import { Link, useLocation } from 'react-router-dom';
    import './Completed.css';

    const Completed = () => {
    const location = useLocation();
    const gameResult = location.state?.result;
    const playerHits = location.state?.playerHits || 0;
    const cpuHits = location.state?.cpuHits || 0;
    const allShipsDestroyed = location.state?.allShipsDestroyed || false;
    const isWin = gameResult === 'win';
    const isTie = gameResult === 'tie';

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
            
               
        <Link to="/game-modes" className="start-btn">
        PLAY AGAIN
        </Link>

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
