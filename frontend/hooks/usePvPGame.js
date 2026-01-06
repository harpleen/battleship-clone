import { useState, useEffect } from 'react';
import { socket } from '../socket';

export const usePvPGame = (navigate, playerName, roomId, initialTurn, opponentName) => {
    const [gameTime, setGameTime] = useState(300); // 5 mins
    const [currentPlayer, setCurrentPlayer] = useState(initialTurn ? 'player' : 'cpu');
    const [message, setMessage] = useState(initialTurn ? "Your Turn!" : "Enemy Turn...");
    
    // Game State
    const [playerStrikes, setPlayerStrikes] = useState([]); // Where I shot
    const [playerHits, setPlayerHits] = useState([]);       // Where I hit
    const [cpuStrikes, setCpuStrikes] = useState([]);       // Where enemy shot me
    
    // We need to track our ships to know if enemy hit us
    const [playerBattleships, setPlayerBattleships] = useState([]); 
    // We don't know enemy ships, so we leave this empty
    const [cpuBattleships, setCpuBattleships] = useState([]); 

    const [gameStatus, setGameStatus] = useState(null); // 'win' or 'lose'
    const [score, setScore] = useState({ me: 0, opponent: 0 });

    useEffect(() => {
        // --- SOCKET LISTENERS ---

        // 1. Enemy fired at us
        socket.on("opponent_fired", ({ index }) => {
            setCpuStrikes(prev => [...prev, index]);
            
            // CHECK HIT
            // Note: In a real app, we should wait for playerBattleships to be set
            // For now, we assume ships are placed.
            // We need to access the current state of ships inside the listener
            // This requires a ref or careful effect management.
            // SIMPLIFICATION: We assume client authority for their own board.
            
            // We need to send result back.
            // This is tricky without access to 'playerBattleships' state immediately.
            // We will handle this in a separate effect that watches 'cpuStrikes'.
        });

        // 2. Result of OUR shot
        socket.on("shot_result", ({ hit, index }) => {
            if (hit) {
                setPlayerHits(prev => [...prev, index]);
                setMessage("TARGET HIT! 💥");
            } else {
                setMessage("MISSED! 💨");
            }
            setCurrentPlayer('cpu'); // End our turn
        });

        socket.on("opponent_left", () => {
            setGameStatus('win');
            alert("Opponent Disconnected. You Win!");
            socket.emit("game_over", { roomId, winner: true });
        });

        return () => {
            socket.off("opponent_fired");
            socket.off("shot_result");
            socket.off("opponent_left");
        };
    }, [roomId]);

    // --- LOGIC TO HANDLE INCOMING FIRE ---
    useEffect(() => {
        // When cpuStrikes updates (enemy shot us), check if it was a hit
        if (cpuStrikes.length === 0) return;
        
        const lastShot = cpuStrikes[cpuStrikes.length - 1];
        
        // Is it a hit? (Check if lastShot is in our ships)
        // Note: playerBattleships is usually an object { positions: [1,2,3] }
        const positions = playerBattleships.positions || [];
        const isHit = positions.includes(lastShot);

        // Tell server the result
        socket.emit("shot_feedback", { roomId, hit: isHit, index: lastShot });

        if (isHit) {
            setMessage("WE ARE HIT! 🚨");
            // Check Loss Condition
            const allHits = cpuStrikes.filter(s => positions.includes(s));
            if (allHits.length >= positions.length && positions.length > 0) {
                setGameStatus('lose');
                socket.emit("game_over", { roomId, winner: false });
            }
        } else {
            setMessage("Enemy Missed!");
            setCurrentPlayer('player'); // It's our turn now
        }

    }, [cpuStrikes]);


    const handlePlayerStrike = (index) => {
        if (currentPlayer !== 'player' || gameStatus) return;
        if (playerStrikes.includes(index)) return;

        // Optimistic update
        setPlayerStrikes(prev => [...prev, index]);
        
        // Send to server
        socket.emit("fire_shot", { roomId, index });
    };

    const handleExit = () => {
        socket.disconnect();
        navigate('/');
    };

    return {
        gameType: 'PVP',
        currentPlayer,
        playerTurnTime: 30,
        cpuTurnTime: 30,
        playerBattleships, // Pass setter to Game.jsx so it can populate ships
        setPlayerBattleships, // CRITICAL: Game.jsx needs to set this on ship placement
        cpuBattleships,
        playerStrikes,
        playerHits,
        cpuStrikes,
        message,
        handlePlayerStrike,
        opponentName: opponentName || "Enemy",
        gameStatus,
        score,
        handleExit,
        // Stubs for compatibility with Game.jsx
        rematchStatus: 'idle',
        handleRematch: () => {},
        opponentRematch: false
    };
};