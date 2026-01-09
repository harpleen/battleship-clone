import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket"; 
import "../GameModes/GameModes.css"; // Keep for buttons/layout
import "./Lobby.css"; // NEW: Import the specific CSS

const Lobby = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Idle");
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first!");
        navigate("/login");
        return;
    }

    // 1. Connect Socket
    socket.auth = { token };
    socket.connect();

    socket.on("match_found", (data) => {
      console.log("Match found!", data);
      navigate("/game", { state: { mode: "pvp", ...data } });
    });

    // 2. Fetch Leaderboard
    const fetchLeaderboard = async () => {
        try {
            // NOTE: Ensure this matches your VITE_API_URL or localhost
            const response = await fetch("http://localhost:3000/users/leaderboard", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data);
            }
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        }
    };
    fetchLeaderboard();

    return () => {
      socket.off("match_found");
    };
  }, [navigate]);

  const joinQueue = () => {
    setStatus("Searching for Opponent...");
    socket.emit("join_queue");
  };

  return (
    <div className="start-crt">
      <h1 className="title">RANKED LOBBY</h1>
      
      {/* --- LEADERBOARD SECTION --- */}
      <div className="leaderboard-box">
        <h2 className="leaderboard-header">TOP COMMANDERS</h2>
        
        <div className="table-wrapper">
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>RANK</th>
                        <th>COMMANDER</th>
                        <th>MMR</th>
                        <th>WINS</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.length > 0 ? (
                        leaderboard.map((player, index) => (
                            <tr key={player._id || index}>
                                <td className="rank-cell">#{index + 1}</td>
                                <td>{player.username}</td>
                                <td className="mmr-cell">{player.rankedPoints}</td>
                                <td>{player.pvpStats?.wins || 0}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="loading-text">LOADING DATA...</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <p className="subtitle" style={{marginTop: '20px'}}>STATUS: {status}</p>
      
      <div className="menu">
        {status === "Idle" ? (
          <button onClick={joinQueue} className="start-btn">DEPLOY TO QUEUE</button>
        ) : (
          <div className="loading-spinner">SCANNING...</div>
        )}
        <button onClick={() => navigate("/")} className="retro-back-btn">CANCEL</button>
      </div>
    </div>
  );
};

export default Lobby;