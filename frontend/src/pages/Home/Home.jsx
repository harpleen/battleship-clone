import "./Home.css";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleRankedMatch = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token = not logged in, go to login
      navigate('/login');
    } else {
      // Has token = logged in, go to ranked lobby
      navigate('/ranked-lobby');
    }
  };

  return (
    <div className="crt home-radar">
      <h1 className="title">WARHEADS</h1>
      <p className="subtitle">NAVAL WAR SIMULATOR</p>

      <div className="menu">
        <Link 
          to="/create-player" 
          className="start-btn"
        >
          ▶ Quick Game
        </Link>

        <button onClick={handleRankedMatch} className="start-btn">
          ⚔️ Ranked Match
        </button>
      </div>

      <div className="ping ring-1"></div>
      <div className="ping ring-2"></div>
      <div className="ping ring-3"></div>

      <p className="footer">
        © Shemaiah | Hafieza | Ismail | Daniel | Nazar | Imran
      </p>
    </div>
  );
}