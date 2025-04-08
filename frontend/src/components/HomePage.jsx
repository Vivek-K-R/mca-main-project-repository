import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  // Example state (replace with real data fetching logic)
  const [evaluatedSheets, setEvaluatedSheets] = useState(15);
  const [pendingSheets, setPendingSheets] = useState(5);

  return (
    <div style={darkModeStyles.page}>
      {/* Navigation Bar */}
      <nav style={darkModeStyles.navbar}>
        <h2 style={darkModeStyles.logo}>CheckThis App</h2>
        <div>
          <button onClick={() => navigate("/")} style={darkModeStyles.navButton}>Dashboard</button>
          <button onClick={() => navigate("/evaluate")} style={darkModeStyles.navButton}>Evaluate Answer Sheets</button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div style={darkModeStyles.container}>
        <h1 style={darkModeStyles.heading}>Welcome, Teacher!</h1>
        {/* <p style={darkModeStyles.text}>View and evaluate answer sheets efficiently.</p> */}

        {/* Quick Access */}
        <div style={darkModeStyles.cardContainer}>
          <div style={darkModeStyles.card}>
            <h3 style={darkModeStyles.cardTitle}>📑 Evaluate Answer Sheets</h3>
            <p style={darkModeStyles.cardText}>Review extracted answers and assign marks.</p>
            <button onClick={() => navigate("/evaluate")} style={darkModeStyles.cardButton}>Go to Evaluation</button>
          </div>
        </div>

        
        {/* Stats Widgets */}
        <div style={darkModeStyles.widgetContainer}>
          {/* Evaluated Sheets Widget */}
          <div style={darkModeStyles.widget}>
            <h2 style={darkModeStyles.widgetNumber}>{evaluatedSheets}</h2>
            <p style={darkModeStyles.widgetText}>Answer Sheets Evaluated</p>
          </div>

          {/* Pending Sheets Widget */}
          <div style={darkModeStyles.widget}>
            <h2 style={darkModeStyles.widgetNumber}>{pendingSheets}</h2>
            <p style={darkModeStyles.widgetText}>Pending Evaluations</p>
          </div>
        </div>

      </div>
    </div>
  );
};

// 🔹 Dark Mode Styles
const darkModeStyles = {
  page: { fontFamily: "Arial, sans-serif", backgroundColor: "#1e1e2f", minHeight: "100vh", padding: "20px", color: "#ffffff" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111122", padding: "15px 30px" },
  logo: { margin: 0, color: "#ffffff" },
  navButton: { background: "none", color: "#ffffff", border: "none", padding: "10px 15px", cursor: "pointer", fontSize: "16px" },
  container: { textAlign: "center", padding: "40px" },
  heading: { fontSize: "28px", color: "#ffffff" },
  text: { fontSize: "16px", color: "#b3b3b3" },
  widgetContainer: { display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "20px" },
  widget: { background: "#29293d", padding: "20px", borderRadius: "10px", width: "200px", textAlign: "center", boxShadow: "0px 4px 8px rgba(0,0,0,0.3)" },
  widgetNumber: { fontSize: "24px", color: "#ffcc00" },
  widgetText: { fontSize: "14px", color: "#cccccc" },
  cardContainer: { display: "flex", justifyContent: "center", marginTop: "30px" },
  card: { background: "#29293d", padding: "20px", borderRadius: "10px", width: "250px", textAlign: "center", boxShadow: "0px 4px 8px rgba(0,0,0,0.3)" },
  cardTitle: { fontSize: "18px", color: "#ffffff" },
  cardText: { fontSize: "14px", color: "#b3b3b3" },
  cardButton: { marginTop: "10px", background: "#ffcc00", color: "#000", padding: "8px 12px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "bold" }
};

export default HomePage;

