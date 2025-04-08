import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const EvaluatePage = () => {
  const navigate = useNavigate();
  const [answerSheets, setAnswerSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "pending", "evaluated", "objective"
  const [searchTerm, setSearchTerm] = useState("");
  const [processingExamCode, setProcessingExamCode] = useState(null);
  const [groupByExamCode, setGroupByExamCode] = useState(false);

  // Set teacher role in localStorage for navbar
  useEffect(() => {
    if (!localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'teacher');
    }
  }, []);

  // Fetch answer sheets from the backend
  useEffect(() => {
    const fetchAnswerSheets = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/evaluations");

        if (!response.ok) {
          throw new Error("Failed to fetch answer sheets");
        }

        const data = await response.json();
        setAnswerSheets(data);
      } catch (error) {
        console.error("Error fetching answer sheets:", error);
        setAnswerSheets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswerSheets();
  }, []);

  // Get filtered sheets based on current filter
  const getFilteredSheets = () => {
    if (filter === "pending") {
      return answerSheets.filter(sheet => sheet.status === "Pending");
    } else if (filter === "evaluated") {
      return answerSheets.filter(sheet => sheet.status === "Evaluated");
    } else if (filter === "objective") {
      return answerSheets.filter(sheet => sheet.answer_type === "objective");
    } else if (filter === "descriptive") {
      return answerSheets.filter(sheet => sheet.answer_type === "descriptive" || !sheet.answer_type);
    }
    return answerSheets;
  };

  // Apply search filter
  const filteredSheets = getFilteredSheets().filter(sheet => {
    const studentId = sheet.student_id ? sheet.student_id.toLowerCase() : "";
    const username = sheet.username ? sheet.username.toLowerCase() : "";
    const fileName = sheet.file_path ? sheet.file_path.split("/").pop().toLowerCase() : "";
    const examCode = sheet.exam_code ? sheet.exam_code.toLowerCase() : "";
    const searchLower = searchTerm.toLowerCase();
    return studentId.includes(searchLower) ||
      username.includes(searchLower) ||
      fileName.includes(searchLower) ||
      examCode.includes(searchLower);
  });

  // Group sheets by exam code
  const groupedSheets = () => {
    const groups = {};

    filteredSheets.forEach(sheet => {
      const examCode = sheet.exam_code || "No Exam Code";

      if (!groups[examCode]) {
        groups[examCode] = [];
      }

      groups[examCode].push(sheet);
    });

    return groups;
  };

  // Get exam code statistics
  const getExamCodeStats = (sheets) => {
    const pending = sheets.filter(s => s.status === "Pending").length;
    const evaluated = sheets.filter(s => s.status === "Evaluated").length;
    const objective = sheets.filter(s => s.answer_type === "objective").length;
    const pendingObjective = sheets.filter(
      s => s.status === "Pending" && s.answer_type === "objective"
    ).length;

    return {
      total: sheets.length,
      pending,
      evaluated,
      objective,
      pendingObjective
    };
  };

  // Calculate dashboard stats
  const evaluatedCount = answerSheets.filter(s => s.status === "Evaluated").length;
  const pendingCount = answerSheets.filter(s => s.status === "Pending").length;
  const objectiveCount = answerSheets.filter(s => s.answer_type === "objective").length;
  const totalCount = answerSheets.length;

  // Handle auto-evaluation of all pending objective sheets for an exam code
  const handleAutoEvaluate = async (examCode) => {
    if (!examCode) return;

    setProcessingExamCode(examCode);

    try {
      const response = await fetch(`http://localhost:5000/api/answer-key/evaluate/${examCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer sheets');
      }

      const result = await response.json();

      // Update the local state to reflect the evaluated sheets
      if (result.evaluated && result.evaluated.count > 0) {
        // Create a map of the updated sheet IDs for quick lookup
        const updatedSheetIds = result.evaluated.sheets.reduce((acc, sheet) => {
          acc[sheet.id] = sheet;
          return acc;
        }, {});

        // Update answer sheets array with the new evaluation status
        const updatedSheets = answerSheets.map(sheet => {
          if (updatedSheetIds[sheet._id]) {
            return {
              ...sheet,
              status: "Evaluated",
              total_marks: updatedSheetIds[sheet._id].total_marks,
              evaluation_method: "auto",
              evaluated_at: new Date().toISOString()
            };
          }
          return sheet;
        });

        setAnswerSheets(updatedSheets);

        alert(`Successfully auto-evaluated ${result.evaluated.count} answer sheets!`);
      } else {
        alert('No answer sheets were evaluated.');
      }
    } catch (error) {
      console.error('Error during batch evaluation:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingExamCode(null);
    }
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setGroupByExamCode(!groupByExamCode);
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Evaluation Dashboard</h1>
          <div style={styles.headerButtons}>
            <button
              style={{
                ...styles.viewModeButton,
                ...(groupByExamCode ? styles.activeViewModeButton : {})
              }}
              onClick={toggleViewMode}
            >
              {groupByExamCode ? "Standard View" : "Group by Exam Code"}
            </button>
            <button
              style={styles.uploadButton}
              onClick={() => navigate('/teacher/answer-keys')}
            >
              Upload Answer Key
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{totalCount}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#A5B68D" }}>{evaluatedCount}</span>
            <span style={styles.statLabel}>Evaluated</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#B17F59" }}>{pendingCount}</span>
            <span style={styles.statLabel}>Pending</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: "#6366f1" }}>{objectiveCount}</span>
            <span style={styles.statLabel}>Objective</span>
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
              ...(filter === "evaluated" && styles.activeTab)
            }}
            onClick={() => setFilter("evaluated")}
          >
            Evaluated
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
            placeholder="Search by username, exam code, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading answer sheets...</p>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyStateTitle}>No Answer Sheets Found</h3>
            <p style={styles.emptyStateText}>
              {filter !== "all"
                ? `No ${filter} answer sheets available.`
                : searchTerm
                  ? "No results match your search."
                  : "There are no answer sheets to evaluate."}
            </p>
            {filter !== "all" && (
              <button
                style={styles.viewAllButton}
                onClick={() => setFilter("all")}
              >
                View All Answer Sheets
              </button>
            )}
          </div>
        ) : groupByExamCode ? (
          // Grouped by Exam Code View
          <div style={styles.groupedView}>
            {Object.entries(groupedSheets()).map(([examCode, sheets]) => {
              const stats = getExamCodeStats(sheets);

              return (
                <div key={examCode} style={styles.examCodeGroup}>
                  <div style={styles.examCodeHeader}>
                    <h3 style={styles.examCodeTitle}>{examCode}</h3>
                    <div style={styles.examCodeStats}>
                      <span style={styles.examCodeStat}>
                        Total: {stats.total}
                      </span>
                      <span style={styles.examCodeStat}>
                        Pending: {stats.pending}
                      </span>
                      {stats.objective > 0 && (
                        <span style={styles.examCodeStat}>
                          Objective: {stats.objective}
                        </span>
                      )}
                    </div>
                    {stats.pendingObjective > 0 && (
                      <button
                        style={{
                          ...styles.autoEvaluateButton,
                          ...(processingExamCode === examCode ? styles.processingButton : {})
                        }}
                        onClick={() => handleAutoEvaluate(examCode)}
                        disabled={processingExamCode === examCode}
                      >
                        {processingExamCode === examCode ? (
                          <>
                            <div style={styles.miniSpinner}></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          `Auto-Evaluate (${stats.pendingObjective})`
                        )}
                      </button>
                    )}
                  </div>

                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Username</th>
                          <th style={styles.th}>Type</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Score</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheets.map((sheet) => (
                          <tr key={sheet._id} style={styles.tableRow}>
                            <td style={styles.td}>{sheet.user_name || sheet.student_id}</td>
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
                                  backgroundColor: sheet.status === "Evaluated" ? "#C1CFA1" : "#EDE8DC",
                                  color: sheet.status === "Evaluated" ? "#4A4A4A" : "#B17F59"
                                }}>
                                  {sheet.status}
                                </span>
                                {sheet.evaluation_method === "auto" && (
                                  <span style={styles.autoTag}>Auto</span>
                                )}
                              </div>
                            </td>
                            <td style={styles.td}>
                              {sheet.status === "Evaluated" ? (
                                <span style={styles.scoreBadge}>
                                  {sheet.total_marks}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={styles.td}>
                              <button
                                onClick={() => navigate(`/teacher/evaluate/${sheet._id}`)}
                                style={{
                                  ...styles.actionButton,
                                  ...(sheet.status === "Pending" ? styles.evaluateButton : styles.viewButton)
                                }}
                              >
                                {sheet.status === "Pending" ? "Evaluate" : "View"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Standard Table View
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Exam Code</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSheets.map((sheet) => (
                  <tr key={sheet._id} style={styles.tableRow}>
                    <td style={styles.td}>{sheet.user_name || sheet.student_id}</td>
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
                          backgroundColor: sheet.status === "Evaluated" ? "#C1CFA1" : "#EDE8DC",
                          color: sheet.status === "Evaluated" ? "#4A4A4A" : "#B17F59"
                        }}>
                          {sheet.status}
                        </span>
                        {sheet.evaluation_method === "auto" && (
                          <span style={styles.autoTag}>Auto</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {sheet.status === "Evaluated" ? (
                        <span style={styles.scoreBadge}>
                          {sheet.total_marks}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/teacher/evaluate/${sheet._id}`)}
                        style={{
                          ...styles.actionButton,
                          ...(sheet.status === "Pending" ? styles.evaluateButton : styles.viewButton)
                        }}
                      >
                        {sheet.status === "Pending" ? "Evaluate" : "View"}
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
  headerButtons: {
    display: "flex",
    gap: "12px"
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
  viewModeButton: {
    backgroundColor: "#A5B68D",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
  },
  activeViewModeButton: {
    backgroundColor: "#8D9A78"
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
  groupedView: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  examCodeGroup: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  examCodeHeader: {
    padding: "16px",
    backgroundColor: "#F8F7F4",
    borderBottom: "1px solid #D6D0C4",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px"
  },
  examCodeTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#4A4A4A"
  },
  examCodeStats: {
    display: "flex",
    gap: "16px"
  },
  examCodeStat: {
    fontSize: "14px",
    color: "#767676"
  },
  autoEvaluateButton: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  processingButton: {
    backgroundColor: "#C99B7A",
    cursor: "not-allowed"
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
  actionButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer"
  },
  evaluateButton: {
    backgroundColor: "#B17F59",
    color: "white"
  },
  viewButton: {
    backgroundColor: "#C1CFA1",
    color: "#4A4A4A"
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
  miniSpinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 1s ease-in-out infinite",
    marginRight: "6px"
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
    cursor: "pointer"
  }
};

export default EvaluatePage;