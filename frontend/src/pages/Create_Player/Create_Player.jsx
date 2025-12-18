import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx'
import './Create_Player.css';

export default function CreatePlayer() {
    const [playerName, setPlayerName] = useState("");
    const navigate = useNavigate();

    const handleUsername = (e) => { 
        const value = e.target.value;
        setPlayerName(value);
    }

    const handleContinue = () => {
        if (playerName.trim()) {
            navigate('/game', { state: { playerName } });
        }
    }
    
    return (        
        <div className="create-player-container">
            <Navbar />
            <div className="create-player-content">
                <h1 className='create-player-header'>Create your Player</h1>
                <input 
                    type="text" 
                    placeholder="Enter player name" 
                    value={playerName}
                    onChange={handleUsername}
                />
                <button onClick={handleContinue} disabled={!playerName.trim()}>
                    Continue
                </button>
            </div>
        </div>
    )
}