import React from 'react';
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="crt home-radar">
      <h1 className="title">WARHEADS</h1>
      <p className="subtitle">NAVAL WAR SIMULATOR</p>

      <div className="menu">
        {/* Quick Game - Points to existing CPU setup */}
        <Link 
          to="/create-player" 
          className="start-btn"
        >
          ▶ Quick Game
        </Link>

        {/* Ranked Match - Points to Login first */}
        {/* We pass 'state' so the Login page knows where to send us next */}
        <Link 
          to="/login" 
          state={{ from: "ranked" }} 
          className="start-btn"
        >
            ▶ Ranked Match
        </Link>
      </div>

      {/* Decorative Radar Animations */}
      <div className="ping ring-1"></div>
      <div className="ping ring-2"></div>
      <div className="ping ring-3"></div>

      <p className="footer">
        © Shemaiah | Hafieza | Ismail | Daniel | Nazar | Imran
      </p>
    </div>
  );
}