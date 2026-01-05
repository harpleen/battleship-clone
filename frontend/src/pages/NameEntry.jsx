import { useState } from "react";
import "./Home.css";

export default function NameEntry() {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    console.log("Player name:", name);
    // later → navigate to game page
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
