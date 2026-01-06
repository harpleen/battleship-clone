import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import './Lobby.css'; // Make sure to copy the CSS you uploaded earlier

const Lobby = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState("idle"); // idle, searching, found
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        // Connect Socket
        socket.auth = { token };
        socket.connect();

        // Listeners
        socket.on("queue_update", (data) => setQueueCount(data.playersInQueue));
        
        socket.on("match_found", (data) => {
            setStatus("found");
            // Navigate to Game with settings
            setTimeout(() => {
                navigate("/game", { 
                    state: { 
                        isRanked: true, 
                        roomId: data.roomId,
                        opponent: data.opponent,
                        isTurn: data.isTurn, // Server decides who goes first
                        playerName: "You"
                    } 
                });
            }, 1000);
        });

        return () => {
            socket.off("queue_update");
            socket.off("match_found");
        };
    }, [navigate]);

    const handleFindMatch = () => {
        setStatus("searching");
        socket.emit("join_queue");
    };

    return (
        <div className="lobby-container">
            <h1 className="title">RANKED LOBBY</h1>
            
            <div className="radar-screen">
                {status === "idle" && <p>SYSTEM READY</p>}
                {status === "searching" && <p>SCANNING FOR TARGETS... ({queueCount} in range)</p>}
                {status === "found" && <p style={{color: '#0f0'}}>TARGET ACQUIRED!</p>}
            </div>

            {status === "idle" && (
                <button className="lobby-btn join-btn" onClick={handleFindMatch}>
                    DEPLOY TO QUEUE
                </button>
            )}

            <button className="lobby-btn leave-btn" onClick={() => navigate("/profile")}>
                RETURN TO BASE
            </button>
        </div>
    );
};

export default Lobby;