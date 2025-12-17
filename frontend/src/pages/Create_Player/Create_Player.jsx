import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx'
import './Create_Player.css';
import Game from '../Game/Game.jsx';

export default function CreatePlayer() {
    const [inputs, setInputs] = useState("");

    const handleUsername = (e) => { 
        const value = e.target.value;
        setInputs(value);
        <Game playername={value} />

    // console.log(e.target.value)
    }
    
    return (        
        <div className="create-player-container">
            <Navbar />
            <div className="create-player-content">
                <h1 className='create-player-header'>Create your Player</h1>
                <input type="text" placeholder="Enter player name" onChange={handleUsername}/>
                {/* <a href='/start'>Continue</a> */}
                <a href='/game'>Continue</a>
            </div>
        </div>
    )
}