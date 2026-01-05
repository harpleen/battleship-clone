import missileImage from '../../assets/powerups/missile.png';

export default function Missiles({ onClick, isActive, used, total, disabled }) {
    const remaining = total - used;
    
    return (
        <div 
            onClick={disabled ? null : onClick}
            className={`powerup-medium ${isActive ? 'powerup-active' : ''} ${disabled ? 'powerup-disabled' : ''}`}
            style={{ 
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.3 : (isActive ? 1 : 0.8),
                position: 'relative'
            }}
        >
            <div className="powerup-count-badge">{remaining}</div>
            <img src={missileImage} alt="Missiles" style={{ width: '50px', height: '50px', marginBottom: '5px' }} />
            {/* <div>Missiles</div> */}
            <div className="powerup-indicator">
                {[...Array(total)].map((_, i) => (
                    <span key={i} className={i < used ? 'used' : 'available'}>●</span>
                ))}
            </div>
        </div>
    );
}