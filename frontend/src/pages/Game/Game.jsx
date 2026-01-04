import { useLocation, useNavigate } from 'react-router-dom';
import Grid from "../../components/Grid/Grid";
import GameHeader from '../../components/GameHeader/GameHeader';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import { useCpuGame } from '../../hooks/useCpuGame';
import { usePvPGame } from '../../hooks/usePvPGame';
import './Game.css';

export default function Game() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { isRanked, roomId, playerName, isTurn, opponent } = location.state || {};
    const displayPlayerName = playerName || 'Player';

    const gameLogic = isRanked 
        ? usePvPGame(navigate, displayPlayerName, roomId, isTurn, opponent)
        : useCpuGame(navigate);

    const { 
        currentPlayer, 
        playerTurnTime, 
        cpuTurnTime, 
        playerBattleships, 
        cpuBattleships, 
        playerStrikes, 
        playerHits,
        cpuStrikes, 
        message, 
        handlePlayerStrike,
        opponentName,
        gameStatus,
        rematchStatus,
        opponentRematch,
        score,
        handleRematch,
        handleExit
    } = gameLogic;

    const scoreText = isRanked && score 
        ? `[ ${score.me} - ${score.opponent} ]` 
        : "";

    return (
        <div className="game-page">
            <div className="top-bar">
                <div className="top-bar-center">
                    <GameHeader 
                        playerName={displayPlayerName} 
                        opponentName={opponentName} 
                    />
                    {isRanked && (
                        <div style={{ color: '#0f0', fontSize: '1.5rem', marginTop: '10px', fontWeight: 'bold' }}>
                            {scoreText}
                        </div>
                    )}
                </div>
            </div>

            <div className="game-content">
                <div className="players-container">
                    <PlayerCard 
                        playerType="player" 
                        isActive={currentPlayer === 'player'} 
                        turnTime={playerTurnTime} 
                        moves={playerStrikes.length}
                    />
                    
                    <div className="vs-section">
                        <div className="center-info">
                            <div className="vs-text">VS</div>
                        </div>
                        
                        <div className="game-grids-container">
                            <Grid 
                                title="YOUR FLEET"
                                battleships={playerBattleships} 
                                strikes={cpuStrikes} 
                                isPlayerBoard={true}
                            />

                            <div className="game-status">
                                <div className="status-message">{message}</div>
                            </div>

                            <Grid 
                                title={`${opponentName} SECTOR`} 
                                battleships={cpuBattleships} 
                                strikes={playerStrikes}
                                hits={playerHits} 
                                onStrike={handlePlayerStrike}
                                isPlayerBoard={false}
                            />
                        </div>
                    </div>
                    
                    <PlayerCard 
                        playerType="cpu" 
                        isActive={currentPlayer === 'cpu'} 
                        turnTime={cpuTurnTime} 
                        moves={cpuStrikes.length}
                    />
                </div>
            </div>

            {gameStatus && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ borderColor: gameStatus === 'win' ? '#0f0' : '#f00' }}>
                        <h3 style={{ color: gameStatus === 'win' ? '#0f0' : '#f00' }}>
                            {gameStatus === 'win' ? 'VICTORY ACQUIRED' : 'MISSION FAILED'}
                        </h3>
                        
                        <p>{gameStatus === 'win' ? 'Enemy fleet neutralized.' : 'Your fleet has been destroyed.'}</p>
                        
                        {isRanked && (
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>SESSION SCORE: {score.me} - {score.opponent}</p>
                        )}
                        
                        {opponentRematch && <p style={{color: '#0f0', animation: 'blink 1s infinite'}}>⚠ OPPONENT REQUESTED REMATCH ⚠</p>}
                        {rematchStatus === 'requested' && <p>Waiting for opponent...</p>}

                        <div className="modal-buttons">
                            <button 
                                className="modal-btn confirm-btn"
                                onClick={handleRematch}
                                disabled={rematchStatus === 'requested'}
                                style={{ 
                                    borderColor: '#0f0', 
                                    color: '#0f0',
                                    opacity: rematchStatus === 'requested' ? 0.5 : 1 
                                }}
                            >
                                {opponentRematch ? 'ACCEPT REMATCH' : 'REQUEST REMATCH'}
                            </button>

                            <button 
                                className="modal-btn cancel-btn" 
                                onClick={handleExit}
                                style={{ borderColor: '#f00', color: '#f00' }}
                            >
                                RETURN TO BASE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}