import './Grid.css';
import Battleship from '../Battleship/Battleship';

export default function Grid({ title, battleships = [], strikes = [], onStrike, isPlayerBoard }) {

    const handleClick = (idx) => {
        if (onStrike && !isPlayerBoard) {
            onStrike(idx);
        }
    }

    const getSquareClass = (idx) => {
        let className = 'squares';
        
        if (strikes.includes(idx)) {
            if (battleships.includes(idx)) {
                className += ' hit';
            } else {
                className += ' miss';
            }
        }
        
        return className;
    }

    const squares = Array(100).fill(null);
    
    return (
        <div className="board-container">
            <h3>{title}</h3>
            <div className="board-grid">
                {squares.map((_, idx) => (
                    <div 
                        key={idx}
                        className={getSquareClass(idx)}
                        onClick={() => handleClick(idx)}
                    >
                        {isPlayerBoard && battleships.includes(idx) && !strikes.includes(idx) && <Battleship />}
                        {strikes.includes(idx) && (
                            <div className="strike-marker">
                                {battleships.includes(idx) ? '✕' : '○'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}