import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../../services/authService";
import "./SignUp.css"; 

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup(username, password, confirmPassword);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">

      {/* BACK ARROW */}
      <button
        className="retro-back-btn"
        onClick={() => navigate("/login")}
        aria-label="Back to login"
      />

      <h1 className="signup-title">RECRUITMENT</h1>
      <div className="signup-subtitle">CREATE NEW PROFILE</div>

      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          placeholder="CHOOSE USERNAME"
          className="signup-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="CHOOSE PASSWORD"
          className="signup-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="CONFIRM PASSWORD"
          className="signup-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <div className="error-msg">{error}</div>}

        <button type="submit" className="signup-btn">
          REGISTER
        </button>

        <Link to="/login" className="signup-btn signup-btn-back">
          ALREADY REGISTERED? LOGIN
        </Link>
      </form>
    </div>
  );
};

export default SignUpPage;
