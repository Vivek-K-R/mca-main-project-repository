import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const EvaluationPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answerSheet, setAnswerSheet] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "warning"
  const [totalMarks, setTotalMarks] = useState(0);

  // Set teacher role for navbar
  useEffect(() => {
    if (!localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'teacher');
    }
  }, []);

  // Fetch the answer sheet & retain previously assigned marks
  useEffect(() => {
    const fetchAnswerSheet = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/evaluations/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch answer sheet");
        }
        
        const data = await response.json();

        // Ensure required properties exist
        if (!data.structured_answers) data.structured_answers = [];
        if (!data.summarized_answers) data.summarized_answers = [];
        if (!data.marks) data.marks = {};

        setAnswerSheet(data);
        setMarks(data.marks);
        
        // Calculate total marks
        const total = Object.values(data.marks).reduce(
          (sum, mark) => sum + (parseInt(mark) || 0), 0
        );
        setTotalMarks(total);
      } catch (error) {
        console.error("Error fetching answer sheet:", error);
        setMessage("Failed to load answer sheet. Please try again.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnswerSheet();
  }, [id]);

  // Handle marks input
  const handleMarkChange = (questionNumber, value) => {
    // Ensure value is a number and between 0-10
    let numValue = parseInt(value) || 0;
    numValue = Math.max(0, Math.min(10, numValue));
    
    const updatedMarks = { ...marks, [questionNumber]: numValue };
    setMarks(updatedMarks);
    
    // Update total marks
    const total = Object.values(updatedMarks).reduce(
      (sum, mark) => sum + (parseInt(mark) || 0), 0
    );
    setTotalMarks(total);
  };

  // Save Progress (Stores Partial Marks but Keeps Status as "Pending")
  const handleSaveProgress = async () => {
    setMessage("");
    setMessageType("");
    
    try {
      const response = await fetch(`http://localhost:5000/api/evaluations/${id}/save-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage("Progress saved successfully!");
        setMessageType("success");
      } else {
        setMessage(`Error: ${data.error || "Failed to save progress"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
      setMessage("Failed to save progress. Check your connection.");
      setMessageType("error");
    }
  };

  // Submit Final Evaluation
  const handleSubmitEvaluation = async () => {
    // Check if all questions are graded
    const allGraded = answerSheet.structured_answers.every(
      (q) => marks[q.question_number] !== undefined && marks[q.question_number] !== ""
    );

    if (!allGraded) {
      setMessage("Please grade all answers before submitting.");
      setMessageType("warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:5000/api/evaluations/${id}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ marks }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage("Evaluation submitted successfully!");
        setMessageType("success");
        
        // Redirect after a brief delay
        setTimeout(() => navigate("/teacher/dashboard"), 1500);
      } else {
        setMessage(`Error: ${data.error || "Failed to submit evaluation"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Failed to submit evaluation:", error);
      setMessage("Failed to submit evaluation. Check your connection.");
      setMessageType("error");
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Evaluation Panel</h1>
          <button 
            onClick={() => navigate("/teacher/dashboard")}
            style={styles.backButton}
          >
            Back to List
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading answer sheet...</p>
          </div>
        ) : answerSheet ? (
          <div style={styles.evaluationContainer}>
            {/* Student info and summary */}
            <div style={styles.summaryCard}>
              <div style={styles.studentInfo}>
                <h2 style={styles.sectionTitle}>Student Information</h2>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Student ID:</span>
                  <span style={styles.infoValue}>{answerSheet.student_id}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Exam Code:</span>
                  <span style={styles.infoValue}>{answerSheet.exam_code || "N/A"}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Answer Type:</span>
                  <span style={styles.infoValue}>{answerSheet.answer_type || "Descriptive"}</span>
                </div>
              </div>
              
              <div style={styles.scoreSection}>
                <div style={styles.totalScore}>
                  <div style={styles.scoreCircle}>
                    <span style={styles.scoreValue}>{totalMarks}</span>
                  </div>
                  <span style={styles.scoreLabel}>Total Score</span>
                </div>
                
                <a
                  href={`http://localhost:5000/${answerSheet.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.fileLink}
                >
                  <span style={styles.fileIcon}>📄</span>
                  View Original Answer Sheet
                </a>
              </div>
            </div>
            
            {/* Message display */}
            {message && (
              <div style={{
                ...styles.messageBox,
                ...(messageType === "success" ? styles.successMessage : 
                   messageType === "warning" ? styles.warningMessage : 
                   styles.errorMessage)
              }}>
                {message}
              </div>
            )}
            
            {/* Questions and answers */}
            <div style={styles.questionsContainer}>
              <h2 style={styles.sectionTitle}>Questions & Answers</h2>
              
              {answerSheet.structured_answers.length === 0 ? (
                <div style={styles.emptyState}>
                  No answers found for this submission.
                </div>
              ) : (
                answerSheet.structured_answers.map((question) => {
                  const summary = answerSheet.summarized_answers.find(
                    (s) => s.question_number === question.question_number
                  );
                  
                  return (
                    <div key={question.question_number} style={styles.questionCard}>
                      <div style={styles.questionHeader}>
                        <h3 style={styles.questionTitle}>Question {question.question_number}</h3>
                        <div style={styles.marksInput}>
                          <label style={styles.marksLabel}>Marks:</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={marks[question.question_number] || ""}
                            onChange={(e) => handleMarkChange(question.question_number, e.target.value)}
                            style={styles.marksField}
                          />
                          <span style={styles.marksMax}>/10</span>
                        </div>
                      </div>
                      
                      <div style={styles.answerContainer}>
                        <div style={styles.answerSection}>
                          <h4 style={styles.answerTitle}>Student's Answer</h4>
                          <div style={styles.scrollableBox}>
                            <p style={styles.answerText}>{question.answer}</p>
                          </div>
                        </div>
                        
                        <div style={styles.answerSection}>
                          <h4 style={styles.answerTitle}>AI Summary</h4>
                          <div style={styles.scrollableBox}>
                            <p style={styles.summaryText}>
                              {summary ? summary.summary : "No summary available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Action buttons */}
            <div style={styles.actionBar}>
              <button 
                onClick={handleSaveProgress} 
                style={styles.saveButton}
              >
                Save Progress
              </button>
              <button 
                onClick={handleSubmitEvaluation} 
                style={styles.submitButton}
              >
                Submit Evaluation
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.errorContainer}>
            <h3 style={styles.errorTitle}>Failed to load answer sheet</h3>
            <p style={styles.errorText}>The requested answer sheet could not be found or loaded.</p>
            <button 
              onClick={() => navigate("/teacher/dashboard")}
              style={styles.returnButton}
            >
              Return to Evaluation List
            </button>
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
  backButton: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#A5B68D",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  evaluationContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  summaryCard: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  studentInfo: {
    flex: "1 1 300px"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#B17F59",
    margin: "0 0 16px 0",
    padding: "0 0 8px 0",
    borderBottom: "1px solid #EDE8DC"
  },
  infoRow: {
    display: "flex",
    marginBottom: "8px"
  },
  infoLabel: {
    width: "100px",
    color: "#767676",
    fontSize: "14px"
  },
  infoValue: {
    fontWeight: "500",
    color: "#4A4A4A",
    fontSize: "14px"
  },
  scoreSection: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px"
  },
  totalScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  scoreCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#B17F59",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px"
  },
  scoreValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white"
  },
  scoreLabel: {
    fontSize: "14px",
    color: "#767676"
  },
  fileLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#EDE8DC",
    color: "#B17F59",
    padding: "10px 16px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s"
  },
  fileIcon: {
    fontSize: "18px"
  },
  messageBox: {
    padding: "12px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500"
  },
  successMessage: {
    backgroundColor: "#C1CFA1",
    color: "#4A4A4A",
    border: "1px solid #A5B68D"
  },
  warningMessage: {
    backgroundColor: "#EDE8DC",
    color: "#B17F59",
    border: "1px solid #B17F59"
  },
  errorMessage: {
    backgroundColor: "#F8E0D8",
    color: "#B25A3D",
    border: "1px solid #B25A3D"
  },
  questionsContainer: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  questionCard: {
    borderBottom: "1px solid #EDE8DC",
    paddingBottom: "20px",
    marginBottom: "20px"
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px"
  },
  questionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#B17F59"
  },
  marksInput: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  marksLabel: {
    fontSize: "14px",
    color: "#767676"
  },
  marksField: {
    width: "50px",
    padding: "8px",
    border: "1px solid #C1CFA1",
    borderRadius: "4px",
    fontSize: "14px",
    textAlign: "center"
  },
  marksMax: {
    fontSize: "14px",
    color: "#767676"
  },
  answerContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  answerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  answerTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#767676"
  },
  scrollableBox: {
    maxHeight: "160px",
    overflowY: "auto",
    padding: "12px",
    backgroundColor: "#F8F7F4",
    border: "1px solid #EDE8DC",
    borderRadius: "6px"
  },
  answerText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#4A4A4A"
  },
  summaryText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#767676",
    fontStyle: "italic"
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    padding: "20px 0"
  },
  saveButton: {
    backgroundColor: "#C1CFA1",
    color: "#4A4A4A",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  submitButton: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#767676",
    fontSize: "15px"
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
  errorContainer: {
    textAlign: "center",
    backgroundColor: "#ffffff",
    padding: "40px 20px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
  },
  errorTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#B17F59",
    margin: "0 0 12px 0"
  },
  errorText: {
    fontSize: "14px",
    color: "#767676",
    margin: "0 0 20px 0"
  },
  returnButton: {
    backgroundColor: "#B17F59",
    color: "white",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  }
};

export default EvaluationPanel;