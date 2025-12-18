import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Start.css';

const Start = () => {
  const location = useLocation();
  const playerName = location.state?.playerName || 'Player';

  return (
    <div className="start-crt">
      
      {/* title */}
      <h1 className="title">WARHEADS</h1>
      <div className="subtitle">COMBAT SIMULATOR</div>

      {/* menu */}
      <div className="menu">
        <Link to="/game" state={{ playerName }} className="start-btn">
          START GAME
        </Link>

        <Link to="/game-modes" state={{ playerName }} className="start-btn">
          GAME MODE
        </Link>

        <Link to="/" className="start-btn btn-back">
          BACK TO MENU
        </Link>
      </div>
    </div>
  );
};

export default Start;
