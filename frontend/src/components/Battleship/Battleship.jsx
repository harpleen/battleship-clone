import './Battleship.css';
import ship2 from '../../assets/battleships/2length.png';
import ship3 from '../../assets/battleships/3length.png';
import ship4 from '../../assets/battleships/4length.png';
import ship5 from '../../assets/battleships/5length.png';

export default function Battleship({ shipLength = 2, orientation = 'horizontal', gridRow = 0, gridCol = 0 }) {
    const getShipImage = () => {
        switch(shipLength) {
            case 2:
                return ship2;
            case 3: 
                return ship3;
            case 4:
                return ship4;
            case 5:
                return ship5;
            default:
                return null;
        }
    };

    const shipImage = getShipImage();
    const squareSize = 50;
    const heightMultiplier = 2.5; // Increase height to prevent compression
    
    // For vertical ships, we need to rotate around the center
    // So we position as if horizontal, then rotate
    const width = shipLength * squareSize;
    const height = squareSize * heightMultiplier;
    
    let style = {
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        zIndex: 5
    };
    
    if (orientation === 'vertical') {
        // Position at the center of where the vertical ship should be
        // Then rotate 90 degrees clockwise
        const centerX = gridCol * squareSize + squareSize / 2;
        const centerY = gridRow * squareSize + (shipLength * squareSize) / 2;
        
        style = {
            ...style,
            left: `${centerX}px`,
            top: `${centerY}px`,
            transform: 'translate(-50%, -50%) rotate(90deg)',
            transformOrigin: 'center center'
        };
    } else {
        // Center vertically to account for increased height
        const verticalOffset = (height - squareSize) / 2;
        
        style = {
            ...style,
            left: `${gridCol * squareSize}px`,
            top: `${gridRow * squareSize - verticalOffset}px`
        };
    }

    return (
        <div className={`battleship battleship-${orientation} battleship-length-${shipLength}`} style={style}>
            {shipImage ? (
                <img 
                    src={shipImage} 
                    alt={`Battleship length ${shipLength}`}
                    className="battleship-image"
                />
            ) : (
                <div className="battleship-placeholder"></div>
            )}
        </div>
    )
}