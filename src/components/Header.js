import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuth } from "./AuthContext"; 

const Header = ({ isLoggedIn }) => {
  const { logout } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate(); // Hook for programmatic navigation

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };
  const handleLogout = () => {
    logout(); // Clear session and user state
    navigate("/login"); // Redirect to the home page or login page
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <img
          src="/healthifylogo.png"
          alt="Healthify Logo"
          style={styles.logo}
        />
<Link to="/" style={styles.logs}>Healthify</Link>
</div>
      <nav style={styles.nav}>
        <Link to="/appointment" style={styles.link}>My Appointments</Link>
        <Link to="/ambulance" style={styles.link}>Call An Ambulance</Link>
        <Link to="/lab-test" style={styles.link}>My Lab Tests</Link>
        <Link to="/reports" style={styles.link}>View Lab Reports</Link>
        <Link to="/ordermedicine" style={styles.link}>Order Medicines</Link>
        <Link to="/articles" style={styles.link}>Read Articles</Link>
        {/* <Link to="/contact" style={styles.link}>Chat With A Doctor</Link> */}
        <div style={styles.profileIconContainer} onClick={togglePopup}>
          <FaUserCircle size={24} style={styles.icon} />
          {showPopup && (
            <div style={styles.popup}>
              <Link to="/profile" style={styles.popupItem}>
                View Profile
              </Link>
              <div style={styles.popupItem} onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      
      </nav>
    </header>
  );
};
const styles = {
  header: {
    backgroundColor: "#5B8B35",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    fontFamily: "'Roboto', sans-serif",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    width: "50px",
    height: "40px",
    marginRight: "10px",
  },
  title: {
    fontSize: "35px",
    fontWeight: "700",
    margin: 0,
    fontFamily: "'Roboto', sans-serif",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "400",
    fontFamily: "'Roboto', sans-serif",
  },
  icon: {
    verticalAlign: "middle",
  },
  logs:{
    fontSize: "35px",
    fontWeight: "700",
    margin: 0,
    fontFamily: "'Roboto', sans-serif",
    color: "white",
    textDecoration: "none",
  },profileIconContainer: {
    position: "relative",
  },
  popup: {
    position: "absolute",
    top: "30px",
    right: "0",
    backgroundColor: "white",
    color: "#333",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "5px",
    overflow: "hidden",
    zIndex: 1000,
    width: "120px",
  },
  popupItem: {
    display: "block",
    padding: "10px 15px",
    textDecoration: "none",
    color: "#5B8B35",
    fontSize: "14px",
    borderBottom: "1px solid #ddd",
    fontFamily: "'Roboto', sans-serif",
    cursor: "pointer",
  },
};
export default Header