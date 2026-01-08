import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Start.css";

const Start = () => {
  const location = useLocation();
  const [playerName, setPlayerName] = useState("Player");
  const [lastDifficulty, setLastDifficulty] = useState("medium");

  // Load player name and last difficulty from localStorage
  useEffect(() => {
    const nameFromState = location.state?.playerName;
    const savedName = localStorage.getItem('playerName');
    const savedDifficulty = localStorage.getItem('lastDifficulty');
    
    setPlayerName(nameFromState || savedName || "Player");
    setLastDifficulty(savedDifficulty || "medium");
    
    console.log('Start page - Loaded difficulty:', savedDifficulty || "medium");
  }, [location.state]);

  return (
    <div className="start-crt">

      {/* BACK ARROW */}
      <button
        className="retro-back-btn"
        onClick={() => window.history.back()}
        aria-label="Back"
      />

      <h1 className="title">WARHEADS</h1>
      <div className="subtitle">Naval War SIMULATOR</div>

      <div className="menu">
        <Link
          to="/game"
          state={{ isRanked: false, playerName, difficulty: lastDifficulty }}
          className="start-btn"
        >
          START MISSION
        </Link>

        <Link
          to="/game-modes"
          state={{ playerName }}
          className="start-btn"
        >
          GAME MODE
        </Link>

        <Link to="/" className="start-btn btn-back">
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
};

export default Start;
