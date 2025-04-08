import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Clear any existing localStorage data
      localStorage.clear();
      
      // Store only token and user object
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate based on role
      if (data.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Login</h1>
          
          {error && <div style={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          
          <div style={styles.footer}>
            Don't have an account? <a href="/signup" style={styles.link}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: "#EDE8DC",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  },
  container: {
    width: "100%",
    maxWidth: "400px"
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "30px",
    width: "100%"
  },
  title: {
    textAlign: "center",
    color: "#B17F59",
    fontSize: "24px",
    marginBottom: "24px",
    fontWeight: "600"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4A4A4A"
  },
  input: {
    padding: "12px 16px",
    borderRadius: "6px",
    border: "1px solid #D6D0C4",
    fontSize: "14px",
    transition: "border-color 0.2s",
    outline: "none",
    color: "#4A4A4A"
  },
  button: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "14px",
    borderRadius: "6px",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "10px"
  },
  buttonDisabled: {
    backgroundColor: "#D6D0C4",
    cursor: "not-allowed"
  },
  errorMessage: {
    backgroundColor: "#F8E0D8",
    color: "#B25A3D",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "500"
  },
  footer: {
    marginTop: "20px",
    textAlign: "center",
    fontSize: "14px",
    color: "#767676"
  },
  link: {
    color: "#B17F59",
    textDecoration: "none",
    fontWeight: "500"
  }
};

export default Login;