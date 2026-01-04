import React, { useEffect, useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { socket } from "../../socket";
import "./Lobby.css";

const Lobby = () => {
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);
    const [status, setStatus] = useState("idle"); // idle, searching, matchFound
    const [queueTime, setQueueTime] = useState(0);
    const [playersInQueue, setPlayersInQueue] = useState(0);
    const matchFoundRef = useRef(false);

    useEffect(() => {
        // Connect to socket with auth token
        if (socket && token) {
            if (!socket.connected) {
                socket.auth = { token };
                socket.connect();
            }
        }

        // Socket event listeners
        const onMatchFound = (data) => {
            matchFoundRef.current = true;
            setStatus("matchFound");
            
            navigate("/game", { 
                state: { 
                    gameId: data.roomId, 
                    opponent: data.opponent,
                    isTurn: data.isTurn,
                    mode: 'pvp'
                } 
            });
        };

        const onQueueUpdate = (data) => {
            setPlayersInQueue(data.playersInQueue);
        };

        const onConnect = () => {
            console.log("Connected to PvP server");
            socket.emit("get_queue_status");
        };

        const onDisconnect = () => {
            setStatus("idle");
        };

        if (socket) {
            socket.on("connect", onConnect);
            socket.on("match_found", onMatchFound);
            socket.on("queue_update", onQueueUpdate);
            socket.on("disconnect", onDisconnect);
        }

        // Cleanup function
        return () => {
            if (socket) {
                socket.off("connect", onConnect);
                socket.off("match_found", onMatchFound);
                socket.off("queue_update", onQueueUpdate);
                socket.off("disconnect", onDisconnect);

                // Only disconnect if we are hitting "Back" (not going to a game)
                if (!matchFoundRef.current && socket.connected) {
                    socket.emit("leave_queue");
                    socket.disconnect();
                }
            }
        };
    }, [navigate, token]);

    // Timer for queue time
    useEffect(() => {
        let interval;
        if (status === "searching") {
            interval = setInterval(() => {
                setQueueTime(prev => prev + 1);
            }, 1000);
        } else {
            setQueueTime(0);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleJoinQueue = () => {
        if (!user || !token) {
            alert("Please log in to play PvP");
            navigate("/login");
            return;
        }
        
        if (socket) {
            setStatus("searching");
            socket.emit("join_queue");
        }
    };

    const handleLeaveQueue = () => {
        setStatus("idle");
        if (socket) {
            socket.emit("leave_queue");
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="lobby-container">
            <div className="lobby-card">
                <h2>Ranked PvP Lobby</h2>
                
                {user ? (
                    <div className="player-info">
                        <p>Logged in as: <strong>{user.username}</strong></p>
                        <p>Ranked Points: <strong>{user.rankedPoints || 0}</strong></p>
                    </div>
                ) : (
                    <div className="player-info">
                        <p>Please log in to play PvP</p>
                    </div>
                )}
                
                <div className="status-display">
                    <p className="status-text">
                        {status === "idle" && "Ready to find an opponent?"}
                        {status === "searching" && `Searching for opponent... (${playersInQueue} player${playersInQueue !== 1 ? 's' : ''} in queue)`}
                        {status === "matchFound" && "Match found! Redirecting to game..."}
                    </p>
                    
                    {status === "searching" && (
                        <div className="queue-info">
                            <p className="timer">Time in queue: {formatTime(queueTime)}</p>
                            <p>Players waiting: {playersInQueue}</p>
                            <div className="searching-animation">
                                <div className="searching-dot"></div>
                                <div className="searching-dot"></div>
                                <div className="searching-dot"></div>
                            </div>
                        </div>
                    )}
                </div>

                {status === "idle" && (
                    <button 
                        className="lobby-btn join-btn" 
                        onClick={handleJoinQueue}
                        disabled={!user}
                    >
                        {user ? 'Find PvP Match' : 'Log In to Play PvP'}
                    </button>
                )}

                {status === "searching" && (
                    <button className="lobby-btn leave-btn" onClick={handleLeaveQueue}>
                        Leave Queue
                    </button>
                )}

                <button className="lobby-btn back-btn" onClick={() => navigate("/home")}>
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default Lobby;