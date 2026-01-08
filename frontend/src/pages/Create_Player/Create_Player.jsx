import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Create_Player.css";

export default function CreatePlayer() {
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  // Load saved player name on mount
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  return (
    <div className="create-player-container">

      {/* BACK ARROW */}
      <button
        className="retro-back-btn"
        onClick={() => navigate("/")}
        aria-label="Back"
      />

      <div className="create-player-content">
        <h1 className="create-player-header">Create your Player</h1>

        <input
          type="text"
          placeholder="Enter player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button
          onClick={() => {
            if (playerName) {
              localStorage.setItem('playerName', playerName);
              navigate("/start", { state: { playerName } });
            }
          }}
          disabled={!playerName}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
