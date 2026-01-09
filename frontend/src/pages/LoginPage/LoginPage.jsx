import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/ranked-lobby");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">

      {/* Back Arrow */}
      <button
        className="retro-back-btn"
        onClick={() => navigate("/")}
        aria-label="Back to Home"
      />

      <h1 className="login-title">IDENTIFICATION</h1>
      <div className="login-subtitle">ENTER CREDENTIALS</div>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="USERNAME"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="PASSWORD"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" className="login-btn">
          LOGIN
        </button>

        <Link to="/signup" className="login-btn login-btn-back">
          NEW RECRUIT? ENLIST
        </Link>

        <Link to="/" className="login-btn login-btn-back">
          CANCEL
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;