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
        <Link
          to="/game"
          state={{ playerName, difficulty: "easy" }}
          className="start-btn"
        >
          EASY
        </Link>

        <Link
          to="/game"
          state={{ playerName, difficulty: "medium" }}
          className="start-btn"
        >
          MEDIUM
        </Link>

        <Link
          to="/game"
          state={{ playerName, difficulty: "hard" }}
          className="start-btn"
        >
          HARD
        </Link>

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
