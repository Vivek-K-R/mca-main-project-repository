import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" // Default role is student
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);

  const { name, email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({ ...formData, [name]: value });
    
    // Check password strength
    if (name === "password") {
      checkPasswordStrength(value);
    }
    
    // Check if passwords match
    if (name === "password" || name === "confirmPassword") {
      setPasswordMatch(
        formData.password === value || 
        value === formData.password
      );
    }
  };

  const checkPasswordStrength = (password) => {
    // Simple password strength checker
    if (password.length === 0) {
      setPasswordStrength("");
    } else if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("strong");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
      
      // Registration successful
      setLoading(false);
      
      // Redirect to login page with success message
      navigate("/login", { 
        state: { message: "Registration successful! Please log in." } 
      });
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return styles.weakPassword;
      case "medium":
        return styles.mediumPassword;
      case "strong":
        return styles.strongPassword;
      default:
        return {};
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>Create an Account</h1>
          
          {error && <div style={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(passwordStrength && getPasswordStrengthColor())
                }}
                placeholder="Create a password"
                required
              />
              {passwordStrength && (
                <div style={styles.passwordStrength}>
                  Password strength: 
                  <span style={{
                    ...styles.strengthIndicator,
                    ...getPasswordStrengthColor()
                  }}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(confirmPassword && !passwordMatch ? styles.errorInput : {})
                }}
                placeholder="Confirm your password"
                required
              />
              {confirmPassword && !passwordMatch && (
                <div style={styles.passwordMismatch}>
                  Passwords do not match
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Account Type</label>
              <div style={styles.roleSelector}>
                <label style={styles.roleOption}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === "student"}
                    onChange={handleChange}
                  />
                  <span style={styles.roleText}>Student</span>
                </label>
                <label style={styles.roleOption}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === "teacher"}
                    onChange={handleChange}
                  />
                  <span style={styles.roleText}>Teacher</span>
                </label>
              </div>
            </div>
            
            <button 
              type="submit" 
              style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div style={styles.footer}>
            Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
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
    maxWidth: "500px"
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
  errorInput: {
    borderColor: "#B25A3D",
    backgroundColor: "#F8E0D8"
  },
  passwordStrength: {
    fontSize: "12px",
    color: "#767676",
    marginTop: "4px"
  },
  strengthIndicator: {
    marginLeft: "4px",
    fontWeight: "500"
  },
  weakPassword: {
    color: "#B25A3D",
    borderColor: "#B25A3D"
  },
  mediumPassword: {
    color: "#D97706",
    borderColor: "#D97706"
  },
  strongPassword: {
    color: "#166534",
    borderColor: "#166534"
  },
  passwordMismatch: {
    fontSize: "12px",
    color: "#B25A3D",
    marginTop: "4px"
  },
  roleSelector: {
    display: "flex",
    gap: "20px"
  },
  roleOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  roleText: {
    fontSize: "14px",
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

export default Signup;