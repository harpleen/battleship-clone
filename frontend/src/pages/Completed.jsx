import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Completed.css';

const Completed = () => {
const [searchParams] = useSearchParams();
const result = searchParams.get('result'); 
const isWin = result === 'win';

return (
    <div className={`crt ${isWin ? 'win-mode' : 'lose-mode'}`}>

    <h1 className="title">
        {isWin ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
    </h1>
    
    <div className="subtitle">
        {isWin ? 'ENEMY FLEET DESTROYED' : 'YOUR FLEET HAS BEEN SUNK'}
    </div>


    <div className="menu">
        
        <Link to="/game" className="start-btn">
        PLAY AGAIN
        </Link>

        <Link to="/home" className="start-btn btn-back">
        END GAME
        </Link>
    </div>

    
    <div className="footer">
        <span>{isWin ? 'VICTORY' : 'GAME OVER'}</span>
    </div>
    </div>
);
};

export default Completed;
