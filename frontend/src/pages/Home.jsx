import "./Home.css";

export default function Home() {
  const handleStart = () => {
    console.log("Start Game");
  };

  return (
    <div className="crt">
      <h1 className="title">WARHEADS</h1>
      <p className="subtitle">COMBAT SIMULATOR</p>

      <button className="start-btn" onClick={handleStart}>
        ▶ Quick Game
      </button>

      <p className="footer">
        © Shemaiah | Hafieza | Ismail | Daniel | Nazar | Imran
      </p>
    </div>
  );
}
