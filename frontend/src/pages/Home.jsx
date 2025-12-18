import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="crt home-radar">
      <h1 className="title">WARHEADS</h1>
      <p className="subtitle">NAVAL WAR SIMULATOR</p>

      <Link to="/create-player" className="start-btn">
        ▶ Quick Game
      </Link>

      {/* Radar pings */}
      <div className="ping ring-1"></div>
      <div className="ping ring-2"></div>
      <div className="ping ring-3"></div>

      <p className="footer">
        © Shemaiah | Hafieza | Ismail | Daniel | Nazar | Imran
      </p>
    </div>
  );
}
