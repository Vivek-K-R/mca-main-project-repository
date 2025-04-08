import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import the Navbar component

const StudentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [answerSheet, setAnswerSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Set default user role for navbar display
        if (!localStorage.getItem('userRole')) {
            localStorage.setItem('userRole', 'student');
        }

        const fetchAnswerSheet = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/evaluations/${id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch answer sheet");
                }
                const data = await response.json();
                setAnswerSheet(data);
            } catch (error) {
                console.error("Error fetching answer sheet:", error);
                setError("Failed to load answer sheet. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnswerSheet();
    }, [id]);

    // Function to get score color based on marks
    const getScoreColor = (score, total = 100) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return "#10b981"; // green
        if (percentage >= 60) return "#3b82f6"; // blue
        if (percentage >= 40) return "#f59e0b"; // amber
        if (percentage >= 33) return "#f97316"; // orange
        return "#ef4444"; // red
    };

    return (
        <div style={styles.page}>
            <Navbar />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Graded Answer Sheet</h1>
                    <button onClick={() => navigate("/student/dashboard")} style={styles.backButton}>
                        Back to Dashboard
                    </button>
                </div>

                {loading && (
                    <div style={styles.loadingContainer}>
                        <div style={styles.spinner}></div>
                        <p>Loading your answer sheet...</p>
                    </div>
                )}

                {error && (
                    <div style={styles.errorContainer}>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button
                            style={styles.retryButton}
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && answerSheet && (
                    <div style={styles.container}>
                        <div style={styles.summaryCard}>
                            <div style={styles.scoreContainer}>
                                <div
                                    style={{
                                        ...styles.scoreCircle,
                                        borderColor: getScoreColor(answerSheet.total_marks)
                                    }}
                                >
                                    <span style={styles.scoreValue}>{answerSheet.total_marks}</span>
                                    <span style={styles.scoreTotal}>/100</span>
                                </div>
                                <div style={styles.scoreLabel}>Total Score</div>
                            </div>

                            <div style={styles.fileContainer}>
                                <h3 style={styles.fileLabel}>Original Answer Sheet</h3>
                                <a
                                    href={`http://localhost:5000/${answerSheet.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.fileLink}
                                >
                                    <span style={styles.fileIcon}>📄</span>
                                    View Original File
                                </a>
                            </div>
                        </div>

                        <div style={styles.tableContainer}>
                            <h2 style={styles.tableTitle}>Question-wise Evaluation</h2>

                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.questionHeader}>Question</th>
                                        <th style={styles.answerHeader}>Answer</th>
                                        <th style={styles.markHeader}>Marks</th>
                                    </tr>
                                </thead>
                                <tbody>
                            

                                    {answerSheet.structured_answers.map((question) => {
                                        const summary = answerSheet.summarized_answers?.find(
                                            (s) => s.question_number === question.question_number
                                        );

                                        // Check if marks exists, otherwise use total_marks or default to 0
                                        // This handles the case where marks object might not exist in the data
                                        const mark = answerSheet.marks?.[question.question_number] ||
                                            (question.question_number === "N/A" ? answerSheet.total_marks : 0);

                                        return (
                                            <tr key={`q-${question.question_number}`} style={styles.tableRow}>
                                                <td style={styles.questionCell}>
                                                    <div style={styles.questionNumber}>Q{question.question_number}</div>
                                                </td>

                                                <td style={styles.answerCell}>
                                                    <div style={styles.answerBox}>
                                                        <div style={styles.answerSection}>
                                                            <h4 style={styles.answerLabel}>Your Answer:</h4>
                                                            <div style={styles.scrollableBox}>
                                                                <p style={styles.answerText}>{question.answer}</p>
                                                            </div>
                                                        </div>

                                                        <div style={styles.answerSection}>
                                                            <h4 style={styles.answerLabel}>Summary:</h4>
                                                            <div style={styles.scrollableBox}>
                                                                <p style={styles.summaryText}>
                                                                    {summary ? summary.summary : "No summary available"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td style={styles.markCell}>
                                                    <div
                                                        style={{
                                                            ...styles.markBadge,
                                                            backgroundColor: answerSheet.status === "Pending" ?
                                                                "#9ca3af" : getScoreColor(mark, 10)
                                                        }}
                                                    >
                                                        {answerSheet.status === "Pending" ? "—" : mark}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        color: "#333333"
    },
    content: {
        maxWidth: "1200px",
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
        fontSize: "28px",
        fontWeight: "600",
        margin: 0,
        color: "#2c3e50"
    },
    backButton: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "#6366f1",
        color: "white",
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "background-color 0.2s",
        boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)"
    },
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px"
    },
    summaryCard: {
        display: "flex",
        flexWrap: "wrap",
        gap: "24px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #edf2f7"
    },
    scoreContainer: {
        flex: "1 1 200px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    },
    scoreCircle: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        border: "8px solid #10b981",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px"
    },
    scoreValue: {
        fontSize: "32px",
        fontWeight: "bold",
        color: "#2d3748"
    },
    scoreTotal: {
        fontSize: "16px",
        color: "#718096"
    },
    scoreLabel: {
        fontSize: "16px",
        fontWeight: "500",
        color: "#4a5568"
    },
    fileContainer: {
        flex: "2 1 300px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 20px"
    },
    fileLabel: {
        margin: "0 0 10px 0",
        color: "#4a5568",
        fontSize: "16px",
        fontWeight: "500"
    },
    fileLink: {
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#3b82f6",
        padding: "10px 16px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "500",
        fontSize: "14px",
        transition: "background-color 0.2s",
        maxWidth: "fit-content"
    },
    fileIcon: {
        marginRight: "8px",
        fontSize: "20px"
    },
    tableContainer: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #edf2f7"
    },
    tableTitle: {
        margin: "0 0 20px 0",
        fontSize: "20px",
        fontWeight: "600",
        color: "#2d3748"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e2e8f0"
    },
    tableRow: {
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        transition: "background-color 0.2s",
        ":hover": {
            backgroundColor: "#f8fafc"
        }
    },
    questionHeader: {
        padding: "12px 16px",
        textAlign: "center",
        backgroundColor: "#f8fafc",
        fontWeight: "600",
        color: "#4a5568",
        width: "100px",
        borderBottom: "2px solid #e2e8f0"
    },
    answerHeader: {
        padding: "12px 16px",
        textAlign: "left",
        backgroundColor: "#f8fafc",
        fontWeight: "600",
        color: "#4a5568",
        borderBottom: "2px solid #e2e8f0"
    },
    markHeader: {
        padding: "12px 16px",
        textAlign: "center",
        backgroundColor: "#f8fafc",
        fontWeight: "600",
        color: "#4a5568",
        width: "80px",
        borderBottom: "2px solid #e2e8f0"
    },
    questionCell: {
        padding: "16px",
        textAlign: "center",
        verticalAlign: "middle",
        borderBottom: "1px solid #e2e8f0"
    },
    questionNumber: {
        fontWeight: "700",
        fontSize: "16px",
        color: "#4a5568",
        backgroundColor: "#f8fafc",
        borderRadius: "6px",
        padding: "8px 12px",
        display: "inline-block"
    },
    answerCell: {
        padding: "16px",
        borderBottom: "1px solid #e2e8f0"
    },
    answerBox: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    answerSection: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },
    answerLabel: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "600",
        color: "#4a5568"
    },
    scrollableBox: {
        maxHeight: "120px",
        overflowY: "auto",
        backgroundColor: "#f8fafc",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
        padding: "12px"
    },
    answerText: {
        margin: 0,
        fontSize: "14px",
        lineHeight: "1.5",
        color: "#2d3748"
    },
    summaryText: {
        margin: 0,
        fontSize: "14px",
        lineHeight: "1.5",
        color: "#4a5568",
        fontStyle: "italic"
    },
    markCell: {
        padding: "16px",
        textAlign: "center",
        verticalAlign: "middle",
        borderBottom: "1px solid #e2e8f0"
    },
    markBadge: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "#10b981",
        color: "white",
        fontWeight: "700",
        fontSize: "16px"
    },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
        color: "#4a5568"
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(99, 102, 241, 0.1)",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 1s ease-in-out infinite",
        marginBottom: "16px"
    },
    errorContainer: {
        textAlign: "center",
        padding: "60px 20px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #edf2f7"
    },
    retryButton: {
        backgroundColor: "#6366f1",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        marginTop: "20px",
        cursor: "pointer",
        fontWeight: "500",
        boxShadow: "0 2px 4px rgba(99, 102, 241, 0.3)"
    }
};

export default StudentView;