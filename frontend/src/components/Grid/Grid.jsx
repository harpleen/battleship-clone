import './Grid.css';
import Battleship from '../Battleship/Battleship';
import { useState, useEffect } from 'react';

export default function Grid({ title, battleships = { positions: [], ships: [] }, strikes = [], onStrike, isPlayerBoard }) {
const [hitFlames, setHitFlames] = useState([]);

// Track flame positions on all hit ship segments
useEffect(() => {
    const flames = [];
    battleships.ships.forEach(ship => {
        const isDestroyed = ship.positions.every(pos => strikes.includes(pos));
        
        ship.positions.forEach(pos => {
            if (strikes.includes(pos)) {
                const row = Math.floor(pos / 10);
                const col = pos % 10;
                const isEnd = pos === ship.positions[0] || pos === ship.positions[ship.positions.length - 1];
                
                flames.push({
                    id: pos,
                    gridIndex: pos,
                    row,
                    col,
                    shipId: ship.id || ship.positions[0],
                    orientation: ship.orientation,
                    isEnd,
                    isDestroyed,
                    positionInShip: ship.positions.indexOf(pos)
                });
            }
        });
    });
    setHitFlames(flames);
}, [strikes, battleships.ships]);

const handleClick = (idx) => {
    if (onStrike && !isPlayerBoard) {
        onStrike(idx);
    }
};

const getSquareClass = (idx) => {
    let className = 'squares';
    
    if (strikes.includes(idx)) {
        if (battleships.positions.includes(idx)) {
            className += ' hit';
        } else {
            className += ' miss';
        }
    }
    
    return className;
};

// Calculate position for flame
const getFlamePosition = (flame) => {
    const squareSize = 50;
    const x = flame.col * squareSize + squareSize / 2;
    const y = flame.row * squareSize + squareSize / 2;
    return { x, y };
};

const squares = Array(100).fill(null);

return (
    <div className="board-container">
        <h3>{title}</h3>
        <div className="board-grid-wrapper">
            <div className="board-grid">
                {squares.map((_, idx) => (
                    <div 
                        key={idx}
                        className={getSquareClass(idx)}
                        onClick={() => handleClick(idx)}
                    >
                        {/* Only show miss markers (circles) */}
                        {strikes.includes(idx) && !battleships.positions.includes(idx) && (
                            <div className="miss-marker">○</div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Render ships */}
            {battleships.ships.map((ship, shipIdx) => {
                const startPos = ship.positions[0];
                const row = Math.floor(startPos / 10);
                const col = startPos % 10;
                const isDestroyed = ship.positions.every(pos => strikes.includes(pos));
                
                // Show ship if: player board and not destroyed, OR CPU board and fully destroyed
                const shouldShow = isPlayerBoard ? !isDestroyed : isDestroyed;
                
                return shouldShow && (
                    <div key={`ship-${shipIdx}`}>
                        <Battleship 
                            shipLength={ship.length}
                            orientation={ship.orientation}
                            gridRow={row}
                            gridCol={col}
                        />
                    </div>
                );
            })}
            
            {/* Render realistic flames on all hit ship segments */}
            {hitFlames.map(flame => {
                const position = getFlamePosition(flame);
                const flameClass = `ship-flame ${flame.isDestroyed ? 'large-flame' : ''}`;
                
                return (
                    <div
                        key={`flame-${flame.id}`}
                        className={flameClass}
                        style={{
                            position: 'absolute',
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 25
                        }}
                    >
                        {/* Heat wave effect for intense fires */}
                        {flame.isDestroyed && <div className="heat-wave"></div>}
                        
                        {/* Flame glow */}
                        <div className="flame-glow"></div>
                        
                        {/* Realistic flame with multiple layers */}
                        <div className="real-flame">
                            <div className="flame-layer-1"></div>
                            <div className="flame-layer-2"></div>
                            <div className="flame-layer-3"></div>
                            
                            {/* Flying embers */}
                            <div className="ember"></div>
                            <div className="ember"></div>
                            <div className="ember"></div>
                        </div>
                        
                        {/* Smoke wisp */}
                        <div className="smoke-wisp"></div>
                    </div>
                );
            })}
        </div>
    </div>
);
}