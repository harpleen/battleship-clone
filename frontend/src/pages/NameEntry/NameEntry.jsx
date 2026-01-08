import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NameEntry.css";

export default function NameEntry() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!name.trim()) return;
    console.log("Player name:", name);
    // Navigate to start page with player name
    navigate("/start", { state: { playerName: name.trim() } });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="crt">
      <h1 className="title">ENTER NAME</h1>
      <p className="subtitle">COMMANDER IDENTIFICATION</p>

      <input
        className="name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="CALL SIGN"
        maxLength={12}
      />

      <button className="start-btn" onClick={handleSubmit}>
        ▶ CONFIRM
      </button>

      <p className="footer">PRESS ENTER TO CONFIRM</p>
    </div>
  );
}
