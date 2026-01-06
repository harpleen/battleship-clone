import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Completed.css';
import victorySound from '../../assets/sound_effects/victory.mp3';
import defeatSound from '../../assets/sound_effects/defeat.mp3';
import defeat2Sound from '../../assets/sound_effects/defeat2.mp3';
import playagain from '../../assets/sound_effects/playagain.mp3'; 

const Completed = () => {
const location = useLocation();
const audioRef = useRef(null);
const gameResult = location.state?.result;
const playerHits = location.state?.playerHits || 0;
const cpuHits = location.state?.cpuHits || 0;
const allShipsDestroyed = location.state?.allShipsDestroyed || false;
const isWin = gameResult === 'win';
const isTie = gameResult === 'tie';

useEffect(() => {
    if (audioRef.current) {
        audioRef.current.play().catch(error => console.log('Audio play error:', error));
    }
}, []);

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

// const handlePlayAgain = () => {
//     const sound = new Audio(playagain);
//     // sound.play().catch(error => console.log('Play again sound error:', error));
// };

return (
    <div className="completed-page">
        <div className="sound">
            {isWin ? <audio ref={audioRef} src={victorySound} /> : isTie ? <audio ref={audioRef} src={defeat2Sound} /> : <audio ref={audioRef} src={defeatSound} />}
        </div>

        <div className={`crt ${isWin ? 'win-mode' : isTie ? 'tie-mode' : 'lose-mode'}`}>

    <h1 className="title">
        {isWin ? 'MISSION ACCOMPLISHED' : isTie ? 'MISSION DRAW' : 'MISSION FAILED'}
    </h1>
    
    <div className="subtitle">
        {getSubtitle()}
    </div>

    <div className="menu">
        <Link to="/game" className="start-btn" >
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
    </div>
);
};

export default Completed;
