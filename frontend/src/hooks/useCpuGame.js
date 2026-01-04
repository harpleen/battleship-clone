import { useState, useEffect, useRef } from 'react';
import { handleStrike, cpuStrike, checkGameOver } from '../utils/Strikes/strikeLogic'; 

export const useCpuGame = (navigate) => {
    const [gameTime, setGameTime] = useState(60);
    const [currentPlayer, setCurrentPlayer] = useState('player');
    const [playerTurnTime, setPlayerTurnTime] = useState(10);
    const [cpuTurnTime, setCpuTurnTime] = useState(10);
    const [playerBattleships, setPlayerBattleships] = useState([]);
    const [cpuBattleships, setCpuBattleships] = useState([]);
    const [playerStrikes, setPlayerStrikes] = useState([]);
    const [cpuStrikes, setCpuStrikes] = useState([]);
    const [gameStatus, setGameStatus] = useState(null);
    const [message, setMessage] = useState('Game started! It\'s your turn.');
    const [score, setScore] = useState({ me: 0, opponent: 0 }); // Placeholder for consistency

    const isInitialized = useRef(false);
    const cpuTimeoutRef = useRef(null);

    // ... (Use same ship generation logic as before) ...
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
        if (!isInitialized.current) {
            setPlayerBattleships(generateRandomPositions());
            setCpuBattleships(generateRandomPositions());
            isInitialized.current = true;
        }
    }, []);

    const handlePlayerStrike = (idx) => {
        if (currentPlayer !== 'player' || gameStatus) return;
        
        const result = handleStrike(idx, playerStrikes, cpuBattleships);
        if (!result.success) return;

        const newStrikes = [...playerStrikes, idx];
        setPlayerStrikes(newStrikes);
        setMessage(result.message);
        
        if (checkGameOver(newStrikes, cpuBattleships)) {
            setGameStatus('win'); // Standardized status
            return;
        }

        if (!result.isHit) setCurrentPlayer('cpu');
    };

    useEffect(() => {
        if (currentPlayer === 'cpu' && !gameStatus) {
            cpuTimeoutRef.current = setTimeout(() => {
                const result = cpuStrike(cpuStrikes, playerBattleships);
                if(result) {
                    const newStrikes = [...cpuStrikes, result.position];
                    setCpuStrikes(newStrikes);
                    setMessage(result.message);
                    
                    if (checkGameOver(newStrikes, playerBattleships)) {
                        setGameStatus('lose'); // Standardized status
                    } else if (!result.isHit) {
                        setCurrentPlayer('player');
                    }
                }
            }, 1500);
        }
    }, [currentPlayer, gameStatus, cpuStrikes]);

    // FIX: Add handleExit so Game.jsx doesn't crash
    const handleExit = () => {
        navigate('/');
    };
    
    // Placeholder rematch
    const handleRematch = () => {
        window.location.reload(); 
    };

    return {
        gameType: 'CPU',
        gameTime,
        currentPlayer,
        playerTurnTime,
        cpuTurnTime,
        playerBattleships,
        cpuBattleships,
        playerStrikes,
        cpuStrikes,
        // Map CPU strikes to 'strikes' and player strikes to 'playerHits' for Grid compatibility if needed,
        // but the Game.jsx logic splits them. CPU game doesn't return `playerHits` usually.
        // For visual compatibility with updated Game.jsx:
        playerHits: playerStrikes.filter(idx => cpuBattleships.includes(idx)),
        
        gameStatus,
        message,
        handlePlayerStrike,
        opponentName: "CPU",
        
        // Added these to prevent crashes in Game.jsx
        rematchStatus: 'idle',
        opponentRematch: false,
        score,
        handleRematch,
        handleExit
    };
};