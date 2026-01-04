import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { checkGameOver } from '../utils/Strikes/strikeLogic'; 

export const usePvPGame = (navigate, playerName, roomId, initialTurn, initialOpponent) => {
    const [gameTime, setGameTime] = useState(180);
    const [playerTurnTime, setPlayerTurnTime] = useState(30); 
    const [cpuTurnTime, setCpuTurnTime] = useState(30);

    const [currentPlayer, setCurrentPlayer] = useState(initialTurn ? 'player' : 'cpu');
    const [message, setMessage] = useState(
        initialTurn 
        ? "MATCH FOUND! You fire first!" 
        : `MATCH FOUND! ${initialOpponent?.name || 'Opponent'} is firing...`
    );

    const [playerBattleships, setPlayerBattleships] = useState([]);
    const [myStrikes, setMyStrikes] = useState([]);
    const [myHits, setMyHits] = useState([]); 
    const [opponentStrikes, setOpponentStrikes] = useState([]);
    
    const [gameStatus, setGameStatus] = useState(null); 
    const [rematchStatus, setRematchStatus] = useState('idle'); 
    const [opponentRematch, setOpponentRematch] = useState(false);
    const [score, setScore] = useState({ me: 0, opponent: 0 });

    // --- SHIP GENERATION ---
    const generateRandomPositions = () => {
        const positions = new Set();
        const canPlaceShip = (startPos, length, isHorizontal) => {
            const row = Math.floor(startPos / 10);
            const col = startPos % 10;
            for (let i = 0; i < length; i++) {
                let pos;
                if (isHorizontal) {
                    if (col + i >= 10) return false;
                    pos = startPos + i;
                } else {
                    if (row + i >= 10) return false;
                    pos = startPos + (i * 10);
                }
                if (positions.has(pos)) return false;
                const currentRow = Math.floor(pos / 10);
                const currentCol = pos % 10;
                const adjacentOffsets = [-11, -10, -9, -1, 1, 9, 10, 11];
                for (let offset of adjacentOffsets) {
                    const adjacentPos = pos + offset;
                    const adjacentRow = Math.floor(adjacentPos / 10);
                    const adjacentCol = adjacentPos % 10;
                    if (adjacentPos >= 0 && adjacentPos < 100) {
                        if (Math.abs(adjacentRow - currentRow) <= 1 && 
                            Math.abs(adjacentCol - currentCol) <= 1) {
                            if (positions.has(adjacentPos)) return false;
                        }
                    }
                }
            }
            return true;
        };
        const placeShip = (length) => {
            let attempts = 0;
            while (attempts < 100) {
                const startPos = Math.floor(Math.random() * 100);
                const isHorizontal = Math.random() < 0.5;
                if (canPlaceShip(startPos, length, isHorizontal)) {
                    for (let i = 0; i < length; i++) {
                        const pos = isHorizontal ? startPos + i : startPos + (i * 10);
                        positions.add(pos);
                    }
                    return true;
                }
                attempts++;
            }
            return false;
        };
        [5, 4, 3, 2].forEach(length => placeShip(length));
        return Array.from(positions);
    };

    useEffect(() => {
        if (gameStatus) return; 
        const timerId = setInterval(() => {
            setGameTime(prev => {
                if (prev <= 0) {
                    clearInterval(timerId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [gameStatus]);

    useEffect(() => {
        setPlayerBattleships(generateRandomPositions());
    }, []);

    useEffect(() => {
        if (playerBattleships.length === 0) return;

        socket.on("opponent_fired", ({ index }) => {
            if (gameStatus) return;
            const isHit = playerBattleships.includes(index);
            const newOpponentStrikes = [...opponentStrikes, index];
            setOpponentStrikes(prev => [...prev, index]);
            const isLoss = checkGameOver(newOpponentStrikes, playerBattleships);
            
            socket.emit("shot_result", { roomId, index, isHit, isSunk: false, isGameOver: isLoss });

            if (isLoss) {
                setGameStatus('lose');
                setScore(s => ({ ...s, opponent: s.opponent + 1 })); 
                setMessage("MAYDAY! FLEET DESTROYED! YOU LOSE.");
            } else if (!isHit) {
                setCurrentPlayer('player');
                setMessage("They missed! YOUR TURN 💨");
                setPlayerTurnTime(30);
            } else {
                setMessage("You were HIT! 💥");
            }
        });

        socket.on("shot_feedback", ({ index, isHit, isGameOver }) => {
            setMyStrikes(prev => [...prev, index]);
            if (isGameOver) {
                setMyHits(prev => [...prev, index]);
                setGameStatus('win');
                setScore(s => ({ ...s, me: s.me + 1 })); 
                setMessage("ENEMY FLEET ELIMINATED! VICTORY!");
                return;
            }
            if(isHit) {
                setMyHits(prev => [...prev, index]); 
                setMessage("HIT! 💥 Fire again!");   
                setPlayerTurnTime(30);
            } else {
                setCurrentPlayer('cpu');
                setMessage("MISS! 💨 Opponent's turn.");
            }
        });

        socket.on("opponent_rematch_request", () => {
            setOpponentRematch(true);
            setMessage("Opponent wants a rematch...");
        });

        socket.on("rematch_start", ({ isTurn }) => {
            setGameStatus(null);
            setRematchStatus('idle');
            setOpponentRematch(false);
            setMyStrikes([]);
            setMyHits([]);
            setOpponentStrikes([]);
            setPlayerBattleships(generateRandomPositions()); 
            setGameTime(180);
            setCurrentPlayer(isTurn ? 'player' : 'cpu');
            setMessage(isTurn ? "REMATCH! You fire first!" : "REMATCH! Opponent fires first!");
        });

        socket.on("opponent_left", () => {
            // FIX: Navigate to Profile when opponent leaves
            navigate('/profile'); 
        });

        return () => {
            socket.off("opponent_fired");
            socket.off("shot_feedback");
            socket.off("opponent_rematch_request");
            socket.off("rematch_start");
            socket.off("opponent_left");
        };
    }, [playerBattleships, opponentStrikes, gameStatus]); 

    const handlePlayerStrike = (index) => {
        if(currentPlayer !== 'player' || gameStatus) return;
        if(myStrikes.includes(index)) return;
        socket.emit("fire_shot", { roomId, index });
    };

    const handleRematch = () => {
        setRematchStatus('requested');
        socket.emit("request_rematch", { roomId });
    };

    const handleExit = () => {
        socket.emit("leave_game", { roomId });
        // FIX: Navigate to Profile on exit
        navigate('/profile'); 
    };

    return {
        gameType: 'PVP',
        gameTime,
        currentPlayer,
        playerTurnTime,
        cpuTurnTime,
        playerBattleships,
        cpuBattleships: [],
        playerStrikes: myStrikes,
        playerHits: myHits, 
        cpuStrikes: opponentStrikes,
        message,
        handlePlayerStrike,
        opponentName: initialOpponent?.name || "Opponent",
        gameStatus,
        rematchStatus,
        opponentRematch,
        score,
        handleRematch,
        handleExit
    };
};