import { useState, useEffect } from 'react';
import Grid from "../../components/Grid/Grid";
import { handleStrike, cpuStrike, checkGameOver } from '../../utils/Strikes/strikeLogic';
import './Game.css';

export default function Game() {
    const [playerBattleships, setPlayerBattleships] = useState([]);
    const [cpuBattleships, setCpuBattleships] = useState([]);
    const [playerStrikes, setPlayerStrikes] = useState([]);
    const [cpuStrikes, setCpuStrikes] = useState([]);
    const [gameStatus, setGameStatus] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const generateRandomPositions = () => {
            const positions = new Set();
            
            const canPlaceShip = (startPos, length, isHorizontal) => {
                const row = Math.floor(startPos / 10);
                const col = startPos % 10;
                
                // Check ship positions and surrounding area
                for (let i = 0; i < length; i++) {
                    let pos;
                    if (isHorizontal) {
                        // Check if ship goes off right edge
                        if (col + i >= 10) return false;
                        pos = startPos + i;
                    } else {
                        // Check if ship goes off bottom edge
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
            
            // Place ships of different lengths (2-5)
            const shipLengths = [5, 4, 3, 2];
            shipLengths.forEach(length => placeShip(length));
            
            return Array.from(positions);
        };

        setPlayerBattleships(generateRandomPositions());
        setCpuBattleships(generateRandomPositions());
    }, []);

    const handlePlayerStrike = (idx) => {
        const result = handleStrike(idx, playerStrikes, cpuBattleships);
        
        if (!result.success) {
            console.log(result.message);
            return;
        }

        const newStrikes = [...playerStrikes, idx];
        setPlayerStrikes(newStrikes);
        console.log(result.message);
        setMessage(result.message);


        // Check if player won
        if (checkGameOver(newStrikes, cpuBattleships)) {
            console.log('🎉 YOU WIN! All enemy ships destroyed!');
            setGameStatus('player');
            return;
        }

        // CPU's turn - random attack
        setTimeout(() => {
            cpuAttack();
        }, 1000);
    };

    const cpuAttack = () => {
        const result = cpuStrike(cpuStrikes, playerBattleships);
        
        if (!result) return;

        const newStrikes = [...cpuStrikes, result.position];
        setCpuStrikes(newStrikes);
        console.log(result.message);
        setMessage(result.message);

        // Check if CPU won
        if (checkGameOver(newStrikes, playerBattleships)) {
            console.log('💀 CPU WINS! All your ships destroyed!');
            setGameStatus('cpu');
        }
    };

    return (
        <div>
            <h1>Game</h1>
            <h3>{message}</h3>            
            {gameStatus && (
                <div style={{ 
                    padding: '20px', 
                    margin: '20px', 
                    backgroundColor: gameStatus === 'player' ? '#00FF9C' : '#FF0000',
                    color: 'white',
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h2>
                        {gameStatus === 'player' 
                            ? '🎉 YOU WIN! All enemy ships destroyed!' 
                            : '💀 CPU WINS! All your ships destroyed!'}
                    </h2>
                </div>
            )}
            
            <div style={{ display: 'flex', gap: '50px' }}>
                <Grid 
                    title="Player Board" 
                    battleships={playerBattleships} 
                    strikes={cpuStrikes}
                    isPlayerBoard={true}
                />
                <Grid 
                    title="CPU Board" 
                    battleships={cpuBattleships} 
                    strikes={playerStrikes}
                    onStrike={handlePlayerStrike}
                    isPlayerBoard={false}
                />
            </div>
            <div>
                <p>Player Strikes: {playerStrikes.length}</p>
                <p>CPU Strikes: {cpuStrikes.length}</p>
            </div>
        </div>
    )
}