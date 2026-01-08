import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./GameModes.css";

const GameModes = () => {
  const location = useLocation();
  const [playerName, setPlayerName] = useState("Player");
  const [lastDifficulty, setLastDifficulty] = useState(null);

  // Load player name and last difficulty on mount
  useEffect(() => {
    const nameFromState = location.state?.playerName;
    const savedName = localStorage.getItem('playerName');
    const savedDifficulty = localStorage.getItem('lastDifficulty');
    
    setPlayerName(nameFromState || savedName || "Player");
    setLastDifficulty(savedDifficulty);
  }, [location.state]);

  // Save difficulty when clicking a mode
  const handleDifficultySelect = (difficulty) => {
    localStorage.setItem('lastDifficulty', difficulty);
  };

  return (
    <div className="start-crt">

      {/* BACK ARROW */}
      <button
        className="retro-back-btn"
        onClick={() => window.history.back()}
        aria-label="Back"
      />

      <h1 className="title">SELECT YOUR COMBAT LEVEL</h1>
      <div className="subtitle">BATTLE ORDERS</div>

      <div className="menu">
        {/* EASY MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "easy" }}
          className={`start-btn ${lastDifficulty === 'easy' ? 'last-played' : ''}`}
          onClick={() => handleDifficultySelect("easy")}
        >
          EASY {lastDifficulty === 'easy' && '★'}
        </Link>

        {/* MEDIUM MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "medium" }}
          className={`start-btn ${lastDifficulty === 'medium' ? 'last-played' : ''}`}
          onClick={() => handleDifficultySelect("medium")}
        >
          MEDIUM {lastDifficulty === 'medium' && '★'}
        </Link>

        {/* HARD MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "hard" }}
          className={`start-btn ${lastDifficulty === 'hard' ? 'last-played' : ''}`}
          onClick={() => handleDifficultySelect("hard")}
        >
          HARD {lastDifficulty === 'hard' && '★'}
        </Link>

        {/* GOD MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "god" }}
          className={`start-btn god-mode-btn ${lastDifficulty === 'god' ? 'last-played' : ''}`}
          onClick={() => handleDifficultySelect("god")}
        >
          GOD MODE {lastDifficulty === 'god' && '★'}
        </Link>

        {/* BACK BUTTON */}
        <Link
          to="/start"
          state={{ playerName }}
          className="start-btn btn-back"
        >
          BACK
        </Link>
      </div>
    </div>
  );
};

export default GameModes;
