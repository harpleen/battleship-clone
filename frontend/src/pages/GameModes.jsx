import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./GameModes.css";

const GameModes = () => {
  const location = useLocation();
  const playerName = location.state?.playerName || "Player";

  return (
    <div className="start-crt">
      <button className="retro-back-btn" onClick={() => window.history.back()} />
      <h1 className="title">SELECT COMBAT MODE</h1>

      <div className="menu">
        {/* PvP Button */}
        <Link to="/lobby" className="start-btn" style={{borderColor: '#0f0', color: '#0f0'}}>
          ONLINE RANKED (PvP)
        </Link>

        {/* Single Player Buttons */}
        <Link to="/game" state={{ playerName, difficulty: "easy" }} className="start-btn">
          SKIRMISH (EASY)
        </Link>
        
        <Link to="/game" state={{ playerName, difficulty: "medium" }} className="start-btn">
          SKIRMISH (MEDIUM)
        </Link>
      </div>
    </div>
  );
};

export default GameModes;