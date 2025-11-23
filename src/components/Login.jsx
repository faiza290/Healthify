import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // Context for storing auth details
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const record = { username, password };

      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Display success notification
        toast.success("User logged in successfully!");

        // Save user ID to session storage
        sessionStorage.setItem("userId", data.user.id); 
        
        // Save user details in auth context
        login(data.user);

        // Navigate to the profile page
        navigate(`/profile/${data.user.id}`);
        
        // Clear input fields
        setUsername("");
        setPassword("");
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error occurred. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer />
      <img src="/healthifylogo.png" style={styles.logo} alt="Healthify Logo" />
      <h2 style={styles.heading}>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.loginButton}>
          Login
        </button>
      </form>
      <p style={styles.text}>Don't have an account?</p>
      <button
        type="button"
        style={styles.registerButton}
        onClick={() => navigate("/signup")} // Redirect to sign-up page
      >
        Sign Up
      </button>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#5B8B35",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    padding: "20px",
  },
  logo: {
    width: "100px",
    height: "80px",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "32px",
    color: "white",
    marginBottom: "20px",
    fontFamily: "'Roboto', sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "300px",
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  loginButton: {
    backgroundColor: "#DA8026",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "15px",
    marginBottom: "15px",
    width: "100%",
  },
  text: {
    color: "white",
    fontSize: "18px",
    marginBottom: "10px",
    fontFamily: "'Roboto', sans-serif",
  },
  registerButton: {
    backgroundColor: "white",
    color: "#5B8B35",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    width: "20%",
  },
};

export default LoginPage;
