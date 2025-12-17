import { useNavigate } from "react-router-dom";
import logo from "../assets/War-removebg-preview.png";

function Navbar() {

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <img src={logo} alt="WarHeads_Logo" style={styles.logo} />
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    width: "100%",
    // backgroundColor: "#333",
    padding: "1rem 0",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    // boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: "100px",
    // borderRadius: "5%",
    width: "auto",
    marginTop: "-10px",
    marginBottom: "-10px",
  },
};

export default Navbar;
