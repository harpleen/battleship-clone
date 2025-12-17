import React from 'react';
import { Link } from 'react-router-dom';
import './Start.css';

const Start = () => {
return (
    <div className="crt">
    
      {/* title */}
    <h1 className="title">WARHEADS</h1>
    <div className="subtitle">COMBAT SIMULATOR</div>

      {/* menu */}
    <div className="menu">
        <Link to="/game" className="start-btn">
        PLAY WITH ROBOT
        </Link>

        <Link to="/" className="start-btn">
        GAME MODE
        </Link>

        <Link to="/" className="start-btn btn-back">
        BACK TO MENU
        </Link>
    </div>

      {/* Footer */}
    <div className="footer">
        <span>Shemaiah</span>
        <span>Hafieza</span>
        <span>Ismail</span>
        <span>Daniel</span>
        <span>Nazar</span>
        <span>Imran</span>
    </div>
    </div>
);
};

export default Start;
