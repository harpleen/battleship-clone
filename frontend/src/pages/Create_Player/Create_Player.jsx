import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Create_Player.css";

export default function CreatePlayer() {
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

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
          onClick={() => playerName && navigate("/start", { state: { playerName } })}
          disabled={!playerName}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
