import './Grid.css';
import Battleship from '../Battleship/Battleship';
import { useState, useEffect, useRef } from 'react';

export default function Grid({ title, battleships = { positions: [], ships: [] }, strikes = [], onStrike, isPlayerBoard }) {
const [hitFlames, setHitFlames] = useState([]);
const [activeSplashes, setActiveSplashes] = useState([]);
const prevStrikesRef = useRef([]);

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

// Track misses for water splash animation
useEffect(() => {
    // Find new misses (strikes that are new and not hits)
    const newMisses = strikes.filter(strike => {
        const isNew = !prevStrikesRef.current.includes(strike);
        const isMiss = !battleships.positions.includes(strike);
        return isNew && isMiss;
    });

    if (newMisses.length > 0) {
        // Add water splashes for new misses
        const newSplashes = newMisses.map(miss => ({
            id: Date.now() + Math.random(), // Unique ID for each splash
            gridIndex: miss,
            row: Math.floor(miss / 10),
            col: miss % 10
        }));

        setActiveSplashes(prev => [...prev, ...newSplashes]);

        // Remove splashes after animation completes (1.5 seconds)
        newSplashes.forEach(splash => {
            setTimeout(() => {
                setActiveSplashes(prev => prev.filter(s => s.id !== splash.id));
            }, 1500);
        });
    }

    // Update previous strikes reference
    prevStrikesRef.current = [...strikes];
}, [strikes, battleships.positions]);

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

// Calculate position for water splash
const getSplashPosition = (splash) => {
    const squareSize = 50;
    const x = splash.col * squareSize + squareSize / 2;
    const y = splash.row * squareSize + squareSize / 2;
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
                        {/* Show miss marker (circle) for misses */}
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
                        
                        {/* Enhanced smoke effects */}
                        <div className="smoke-container">
                            <div className="smoke-particle smoke-1"></div>
                            <div className="smoke-particle smoke-2"></div>
                            <div className="smoke-particle smoke-3"></div>
                            <div className="smoke-particle smoke-4"></div>
                        </div>
                    </div>
                );
            })}
            
            {/* Render water splashes for misses */}
            {activeSplashes.map(splash => {
                const position = getSplashPosition(splash);
                
                return (
                    <div
                        key={`splash-${splash.id}`}
                        className="water-splash"
                        style={{
                            position: 'absolute',
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 20
                        }}
                    >
                        {/* Water splash animation */}
                        <div className="splash-animation">
                            {/* Splash rings */}
                            <div className="splash-ring ring-1"></div>
                            <div className="splash-ring ring-2"></div>
                            <div className="splash-ring ring-3"></div>
                            
                            {/* Water droplets */}
                            <div className="droplet droplet-1"></div>
                            <div className="droplet droplet-2"></div>
                            <div className="droplet droplet-3"></div>
                            <div className="droplet droplet-4"></div>
                            
                            {/* Center bubble */}
                            <div className="splash-bubble"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
}