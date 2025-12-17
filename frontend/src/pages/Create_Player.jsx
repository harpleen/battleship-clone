import Navbar from '../components/Navbar.jsx'

export default function CreatePlayer() {
    return (        
        <div className="enter your player name">
            <Navbar />
            <input type="text" placeholder="Enter player name" />
            <button>Start</button>
        </div>
    )
}