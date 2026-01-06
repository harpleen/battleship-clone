import './Grid.css';
import Battleship from '../Battleship/Battleship';

export default function Grid({ title, battleships = { positions: [], ships: [] }, strikes = [], onStrike, isPlayerBoard }) {

    const handleClick = (idx) => {
        if (onStrike && !isPlayerBoard) {
            onStrike(idx);
        }
    }

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
    }

    const isShipFullyDestroyed = (ship) => {
        return ship.positions.every(pos => strikes.includes(pos));
    }

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
                            {strikes.includes(idx) && (
                                <div className="strike-marker">
                                    {battleships.positions.includes(idx) ? '✕' : '○'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {battleships.ships.map((ship, shipIdx) => {
                    const startPos = ship.positions[0];
                    const row = Math.floor(startPos / 10);
                    const col = startPos % 10;
                    const isDestroyed = isShipFullyDestroyed(ship);
                    
                    // Show ship if: player board and not destroyed, OR CPU board and fully destroyed
                    const shouldShow = isPlayerBoard ? !isDestroyed : isDestroyed;
                    
                    return shouldShow && (
                        <Battleship 
                            key={shipIdx}
                            shipLength={ship.length}
                            orientation={ship.orientation}
                            gridRow={row}
                            gridCol={col}
                        />
                    );
                })}
            </div>
        </div>
    )
}