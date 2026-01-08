import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./GameModes.css";

const GameModes = () => {
  const location = useLocation();
  const playerName = location.state?.playerName || "Player";

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
          className="start-btn easy-btn"
        >
          EASY
        </Link>

        {/* MEDIUM MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "medium" }}
          className="start-btn medium-btn"
        >
          MEDIUM
        </Link>

        {/* HARD MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "hard" }}
          className="start-btn hard-btn"
        >
          HARD
        </Link>

        {/* GOD MODE */}
        <Link
          to="/game"
          state={{ playerName, difficulty: "god" }}
          className="start-btn god-mode-btn"
        >
          GOD MODE
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
