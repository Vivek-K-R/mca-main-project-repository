import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [answerSheets, setAnswerSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "pending", "graded", "objective", "descriptive"
  const [studentId, setStudentId] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    objective: 0,
    descriptive: 0,
    pending: 0,
    graded: 0,
    avgScore: 0
  });

  // Get student ID from user object in localStorage
  useEffect(() => {
    const userString = localStorage.getItem('user');
    console.log("User data from localStorage:", userString);

    if (userString) {
      try {
        const userData = JSON.parse(userString);
        console.log("Parsed user data:", userData);
        // Note: the backend sends _id but we might want to use id for consistency
        const id = userData._id || userData.id || "Sona";
        console.log("Using student ID:", id);
        setStudentId(id); // Fallback for development
      } catch (error) {
        console.error("Error parsing user data:", error);
        setStudentId("Sona"); // Fallback for development
      }
    } else {
      console.log("No user data found in localStorage, using fallback ID");
      setStudentId("Sona"); // Fallback for development
    }
  }, []);

  // Fetch answer sheets
  useEffect(() => {
    if (!studentId) {
      console.log("No student ID available, skipping fetch");
      return; // Skip if studentId is not set yet
    }

    const fetchAnswerSheets = async () => {
      setLoading(true);

      try {
        // Get the auth token
        const token = localStorage.getItem('token');
        console.log("Using auth token:", token ? "Token available" : "No token found");

        // Use the new endpoint that returns ALL answer sheets
        const apiUrl = `http://localhost:5000/api/students/${studentId}/answer-sheets`;
        console.log("Fetching all answer sheets from:", apiUrl);

        const response = await fetch(apiUrl, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });

        console.log("API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch answer sheets: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Raw data from API:", data);

        if (!Array.isArray(data)) {
          console.error("API did not return an array as expected:", data);
          setAnswerSheets([]);
          setLoading(false);
          return;
        }

        // Add type and date fields if they don't exist
        const processedData = data.map(sheet => ({
          ...sheet,
          uploadDate: sheet.uploadDate || sheet.createdAt || new Date().toISOString(),
          status: sheet.status || "Pending",
          answer_type: sheet.answer_type || (Math.random() > 0.5 ? "objective" : "descriptive")
        }));

        console.log("Processed data:", processedData);
        setAnswerSheets(processedData);

        // Calculate statistics
        const objectiveSheets = processedData.filter(sheet => sheet.answer_type === "objective");
        const descriptiveSheets = processedData.filter(sheet => sheet.answer_type === "descriptive");
        const gradedSheets = processedData.filter(sheet => sheet.status === "Evaluated" || sheet.status === "Graded");
        const pendingSheets = processedData.filter(sheet => sheet.status === "Pending");

        // Calculate average score only from graded sheets
        const totalScore = gradedSheets.reduce((sum, sheet) => sum + (sheet.total_marks || 0), 0);
        const avgScore = gradedSheets.length > 0 ? (totalScore / gradedSheets.length).toFixed(1) : 0;

        setStats({
          total: processedData.length,
          objective: objectiveSheets.length,
          descriptive: descriptiveSheets.length,
          pending: pendingSheets.length,
          graded: gradedSheets.length,
          avgScore
        });

        console.log("Dashboard statistics updated:", {
          total: processedData.length,
          objective: objectiveSheets.length,
          descriptive: descriptiveSheets.length,
          pending: pendingSheets.length,
          graded: gradedSheets.length,
          avgScore
        });
      } catch (error) {
        console.error("Error fetching answer sheets:", error);
        setAnswerSheets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswerSheets();
  }, [studentId]);

  // Get filtered sheets based on current filter
  const getFilteredSheets = () => {
    if (filter === "pending") {
      return answerSheets.filter(sheet => sheet.status === "Pending");
    } else if (filter === "graded") {
      return answerSheets.filter(sheet => sheet.status === "Evaluated" || sheet.status === "Graded");
    } else if (filter === "objective") {
      return answerSheets.filter(sheet => sheet.answer_type === "objective");
    } else if (filter === "descriptive") {
      return answerSheets.filter(sheet => sheet.answer_type === "descriptive");
    }
    return answerSheets;
  };

  // Apply search filter
  const filteredSheets = getFilteredSheets().filter(sheet => {
    const fileName = sheet.file_path ? sheet.file_path.split("/").pop().toLowerCase() : "";
    const examCode = sheet.exam_code ? sheet.exam_code.toLowerCase() : "";
    const searchLower = searchTerm.toLowerCase();
    return fileName.includes(searchLower) || examCode.includes(searchLower);
  });

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "";
    }
  }

  // Helper function for score color
  function getScoreColor(score) {
    if (!score && score !== 0) return "#333";

    if (score >= 80) return "#10b981"; // green
    else if (score >= 60) return "#3b82f6"; // blue
    else if (score >= 40) return "#f59e0b"; // amber
    else if (score >= 33) return "#f97316"; // orange
    else return "#ef4444"; // red
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading your answer sheets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Answer Sheets</h1>
          <button
            style={styles.uploadButton}
            onClick={() => navigate('/student/upload')}
          >
            + Upload New
          </button>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#A5B68D" }}>{stats.graded}</span>
            <span style={styles.statLabel}>Graded</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#B17F59" }}>{stats.pending}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#6366f1" }}>{stats.objective}</span>
            <span style={styles.statLabel}>Objective</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#8B5CF6" }}>{stats.descriptive}</span>
            <span style={styles.statLabel}>Descriptive</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(filter === "all" && styles.activeTab)
            }}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(filter === "pending" && styles.activeTab)
            }}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(filter === "graded" && styles.activeTab)
            }}
            onClick={() => setFilter("graded")}
          >
            Graded
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(filter === "objective" && styles.activeTab)
            }}
            onClick={() => setFilter("objective")}
          >
            Objective
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(filter === "descriptive" && styles.activeTab)
            }}
            onClick={() => setFilter("descriptive")}
          >
            Descriptive
          </button>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by filename or exam code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* No Results State */}
        {filteredSheets.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyStateTitle}>No Answer Sheets Found</h3>
            <p style={styles.emptyStateText}>
              {filter !== "all"
                ? `No ${filter} answer sheets available.`
                : searchTerm
                  ? "No results match your search."
                  : "You haven't uploaded any answer sheets yet."}
            </p>
            {filter !== "all" && (
              <button
                style={styles.viewAllButton}
                onClick={() => setFilter("all")}
              >
                View All Submissions
              </button>
            )}
            <button
              style={styles.uploadNowButton}
              onClick={() => navigate('/student/upload')}
            >
              Upload New Answer Sheet
            </button>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Filename</th>
                  <th style={styles.th}>Exam Code</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSheets.map((sheet) => (
                  <tr key={sheet._id} style={styles.tableRow}>
                    <td style={styles.td}>
                      {sheet.file_path?.split(/[\/\\]/).pop() || "Unnamed"}
                    </td>
                    <td style={styles.td}>{sheet.exam_code || "—"}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: sheet.answer_type === "objective" ? "#e0e7ff" : "#f3f4f6",
                        color: sheet.answer_type === "objective" ? "#4338ca" : "#4b5563"
                      }}>
                        {sheet.answer_type || "descriptive"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.statusContainer}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: (sheet.status === "Evaluated" || sheet.status === "Graded") ? "#C1CFA1" : "#EDE8DC",
                          color: (sheet.status === "Evaluated" || sheet.status === "Graded") ? "#4A4A4A" : "#B17F59"
                        }}>
                          {sheet.status}
                        </span>
                        {sheet.evaluation_method === "auto" && (
                          <span style={styles.autoTag}>Auto</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {(sheet.status === "Evaluated" || sheet.status === "Graded") ? (
                        <span style={{
                          ...styles.scoreBadge,
                          color: getScoreColor(sheet.total_marks)
                        }}>
                          {sheet.total_marks || 0}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={styles.td}>
                      {formatDate(sheet.uploadDate)}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/student/view/${sheet._id}`)}
                        style={styles.viewButton}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  page: {
    fontFamily: "'Poppins', 'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: "#EDE8DC",
    minHeight: "100vh",
    color: "#4A4A4A"
  },
  content: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "30px 20px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: 0,
    color: "#B17F59"
  },
  uploadButton: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
    backgroundColor: "#ffffff",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: "1"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#B17F59"
  },
  statLabel: {
    fontSize: "13px",
    color: "#767676",
    marginTop: "4px"
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid #D6D0C4",
    marginBottom: "20px"
  },
  tabButton: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#767676",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginRight: "16px"
  },
  activeTab: {
    color: "#B17F59",
    borderBottom: "2px solid #B17F59"
  },
  searchContainer: {
    marginBottom: "20px"
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    color: "#4A4A4A",
    border: "1px solid #D6D0C4",
    borderRadius: "8px",
    fontSize: "14px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#ffffff"
  },
  tableRow: {
    borderBottom: "1px solid #F1F0EB"
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid #D6D0C4",
    backgroundColor: "#F8F7F4",
    fontWeight: "600",
    fontSize: "13px",
    color: "#767676"
  },
  td: {
    padding: "12px 16px",
    color: "#4A4A4A",
    fontSize: "14px"
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  typeBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500"
  },
  autoTag: {
    display: "inline-block",
    padding: "2px 5px",
    borderRadius: "3px",
    fontSize: "10px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    fontWeight: "600"
  },
  scoreBadge: {
    fontWeight: "600"
  },
  viewButton: {
    backgroundColor: "#B17F59",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    color: "#767676"
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid rgba(177, 127, 89, 0.2)",
    borderTopColor: "#B17F59",
    borderRadius: "50%",
    animation: "spin 1s ease-in-out infinite",
    marginBottom: "16px"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  emptyStateTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#B17F59",
    margin: "0 0 8px 0"
  },
  emptyStateText: {
    fontSize: "14px",
    color: "#767676",
    margin: "0 0 16px 0"
  },
  viewAllButton: {
    backgroundColor: "transparent",
    border: "1px solid #B17F59",
    color: "#B17F59",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "12px",
    display: "inline-block"
  },
  uploadNowButton: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "inline-block"
  }
};

export default StudentDashboard;