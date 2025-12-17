import "./Home.css";
// import Navbar from "../components/Navbar.jsx";
import { Link } from "react-router-dom";

export default function Home() {
  return (
 <div className="crt">
  <h1 className="title">WARHEADS</h1>
  <p className="subtitle">NAVAL WAR SIMULATOR</p>

  <Link to="/create-player" className="start-btn">
    ▶ Quick Game
  </Link>

  {/* Radar pings */}
  <div className="ping" style={{ top: "30%", left: "50%" }}></div>
  <div className="ping" style={{ top: "70%", left: "60%" }}></div>
  <div className="ping" style={{ top: "45%", left: "30%" }}></div>

  <p className="footer">© Shemaiah | Hafieza | Ismail | Daniel | Nazar | Imran</p>
</div>

  );
}
