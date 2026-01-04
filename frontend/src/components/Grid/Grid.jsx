import './Grid.css';
import Battleship from '../Battleship/Battleship';

// Added 'hits' to props
export default function Grid({ title, battleships = [], strikes = [], hits = [], onStrike, isPlayerBoard }) {

    const handleClick = (idx) => {
        if (onStrike && !isPlayerBoard) {
            onStrike(idx);
        }
    }

    const getSquareClass = (idx) => {
        let className = 'squares';
        
        // Check if this square has been struck
        if (strikes.includes(idx)) {
            // It is a hit if it's in the 'hits' array OR (if it's my board) the ship exists there
            const isHit = hits.includes(idx) || (isPlayerBoard && battleships.includes(idx));
            
            if (isHit) {
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
                {squares.map((_, idx) => {
                    const isStrike = strikes.includes(idx);
                    
                    // Logic: It is a HIT if it's in the 'hits' array (for opponent board)
                    // OR if we know there is a battleship there (for my board)
                    const isHit = hits.includes(idx) || (isPlayerBoard && battleships.includes(idx));

                    return (
                        <div 
                            key={idx}
                            className={getSquareClass(idx)}
                            onClick={() => handleClick(idx)}
                        >
                            {/* Only show ships on MY board */}
                            {isPlayerBoard && battleships.includes(idx) && !isStrike && <Battleship />}
                            
                            {/* Show Markers (X or O) */}
                            {isStrike && (
                                <div className="strike-marker">
                                    {isHit ? '✕' : '○'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}