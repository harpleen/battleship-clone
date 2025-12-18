import React from 'react';
import { Link } from 'react-router-dom';
import './Start.css';

const Start = () => {
  return (
    <div className="start-crt">
      
      <h1 className="title">WARHEADS</h1>
      <div className="subtitle">COMBAT SIMULATOR</div>

      <div className="menu">
        <Link to="/game" state={{ isRanked: false, playerName: "Guest" }} className="start-btn">
          START MISSION
        </Link>

        <Link to="/" className="start-btn btn-back">
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
};

export default Start;