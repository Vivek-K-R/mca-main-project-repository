import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const UploadPage = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(""); 
  const [studentName, setStudentName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [answerType, setAnswerType] = useState("descriptive"); // Default to descriptive
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [fileName, setFileName] = useState("No file selected");

  // Set default user role for navbar and fetch student ID and name
  useEffect(() => {
    const userString = localStorage.getItem('user');
    console.log("User data from localStorage:", userString);
    
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        console.log("Parsed user data:", userData);
        
        if (userData.role === 'student') {
          // Make sure we're using _id consistently
          const id = userData._id || userData.id;
          console.log("Setting student ID to:", id);
          setStudentId(id);
          
          // Also set the name for display
          setStudentName(userData.name || "Student");
        } else {
          // Redirect if not a student
          navigate('/login');
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        // If there's an error parsing, set default for development
        setStudentId("Sona");
        setStudentName("Student");
      }
    } else {
      // For development: set defaults if not found
      console.log("No user data found, using default values");
      setStudentId("Sona");
      setStudentName("Student");
    }
  }, [navigate]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setFile(null);
      setFileName("No file selected");
    }
  };

  const handleUpload = async () => {
    if (!examCode) {
      setMessage("Please enter an exam code");
      setMessageType("error");
      return;
    }
    
    if (!file) {
      setMessage("Please select a file to upload");
      setMessageType("error");
      return;
    }

    if (!studentId) {
      setMessage("Student ID not available. Please try logging in again.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    // Create the form data
    const formData = new FormData();
    
    // Add required fields based on your MongoDB schema
    formData.append("student_id", studentId); // This matches your schema field name exactly
    formData.append("exam_code", examCode);   // This should match the updated schema field
    formData.append("file", file);
    
    // Use userName to match the backend field name (camelCase)
    formData.append("userName", studentName || "Anonymous User");
    
    // Add status field with default "Pending" value
    formData.append("status", "Pending");
    
    // Add answer_type field from the dropdown selection
    formData.append("answer_type", answerType);
    
    // Initialize empty fields with defaults as defined in your schema
    formData.append("total_marks", 0);

    try {
      console.log("Sending upload request to: http://localhost:5000/api/upload");
      // Log what we're actually sending to help debug
      console.log("Upload data:", {
        student_id: studentId,
        exam_code: examCode,
        userName: studentName, // Changed to camelCase to match backend
        answer_type: answerType
      });
      
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);
      const data = await response.json();
      console.log("Upload response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("Answer sheet uploaded successfully!");
      setMessageType("success");
      
      // Reset form after successful upload
      setExamCode("");
      setFile(null);
      setFileName("No file selected");
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Upload Answer Sheet</h1>
          <button 
            onClick={() => navigate("/student/dashboard")} 
            style={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>
        
        <div style={styles.formContainer}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <div style={styles.formIcon}>📄</div>
              <h2 style={styles.formTitle}>Submit Your Answer Sheet</h2>
            </div>
            
            <div style={styles.formBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Student Name</label>
                <div style={styles.studentInfoBox}>
                  <div style={styles.studentName}>{studentName}</div>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Student ID (Debug)</label>
                <div style={styles.studentInfoBox}>
                  <div style={styles.studentName}>{studentId || "Not available"}</div>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Code</label>
                <input
                  type="text"
                  placeholder="Enter the exam code provided by your teacher"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Answer Sheet Type</label>
                <select
                  value={answerType}
                  onChange={(e) => setAnswerType(e.target.value)}
                  style={styles.select}
                >
                  <option value="descriptive">Descriptive (Essay/Written)</option>
                  <option value="objective">Objective (MCQ/Short Answer)</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Answer Sheet</label>
                <div style={styles.fileInputContainer}>
                  <label style={styles.fileInputLabel}>
                    <span style={styles.browseButton}>Browse Files</span>
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      onChange={handleFileChange} 
                      style={styles.hiddenFileInput} 
                    />
                  </label>
                  <div style={styles.fileNameDisplay}>
                    {fileName}
                  </div>
                </div>
                <p style={styles.fileHint}>Accepted formats: PDF, PNG, JPG, JPEG</p>
              </div>
              
              {message && (
                <div 
                  style={{
                    ...styles.messageBox,
                    ...(messageType === "success" ? styles.successMessage : styles.errorMessage)
                  }}
                >
                  {message}
                </div>
              )}
              
              <button 
                onClick={handleUpload} 
                style={{
                  ...styles.uploadButton,
                  ...(uploading ? styles.uploadingButton : {})
                }} 
                disabled={uploading}
              >
                {uploading ? (
                  <div style={styles.uploadingContent}>
                    <div style={styles.smallSpinner}></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Submit Answer Sheet"
                )}
              </button>
            </div>
          </div>
          
          <div style={styles.instructionsCard}>
            <h3 style={styles.instructionsTitle}>How to Upload</h3>
            <ul style={styles.instructionsList}>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>1</span>
                <span>Enter the exam code provided by your teacher</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>2</span>
                <span>Upload a clear scan or photo of your answer sheet</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>3</span>
                <span>Make sure all answers are clearly visible</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>4</span>
                <span>Submit and wait for evaluation</span>
              </li>
            </ul>
            <div style={styles.note}>
              <strong>Note:</strong> Your answer sheet will be processed automatically. You'll receive a notification once it's evaluated.
            </div>
          </div>
        </div>
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
    color: "#B17F59"
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#A5B68D",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(165, 182, 141, 0.2)"
  },
  formContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "24px",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "3fr 2fr"
    }
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #D6D0C4",
    overflow: "hidden"
  },
  formHeader: {
    background: "linear-gradient(135deg, #B17F59 0%, #C99B7A 100%)",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  formIcon: {
    fontSize: "24px",
    color: "white"
  },
  formTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "white"
  },
  formBody: {
    padding: "24px"
  },
  formGroup: {
    marginBottom: "20px"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#4A4A4A"
  },
  studentInfoBox: {
    backgroundColor: "#F8F7F4",
    border: "1px solid #D6D0C4",
    borderRadius: "8px",
    padding: "14px 16px",
    fontSize: "15px",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)"
  },
  studentName: {
    color: "#4A4A4A",
    fontSize: "15px",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #D6D0C4",
    backgroundColor: "#ffffff",
    color: "#4A4A4A",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)",
    ":focus": {
      borderColor: "#B17F59",
      outline: "none"
    }
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #D6D0C4",
    backgroundColor: "#ffffff",
    color: "#4A4A4A",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)",
    appearance: "none"
  },
  fileInputContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    "@media (min-width: 768px)": {
      flexDirection: "row",
      alignItems: "center"
    }
  },
  fileInputLabel: {
    display: "inline-block",
    cursor: "pointer"
  },
  browseButton: {
    display: "inline-block",
    background: "linear-gradient(to bottom, #B17F59, #A06F4A)",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 2px 4px rgba(177, 127, 89, 0.2)"
  },
  hiddenFileInput: {
    display: "none"
  },
  fileNameDisplay: {
    flex: 1,
    backgroundColor: "#F8F7F4",
    border: "1px solid #D6D0C4",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#767676",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)"
  },
  fileHint: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#767676",
    fontStyle: "italic"
  },
  messageBox: {
    padding: "14px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  successMessage: {
    backgroundColor: "#C1CFA1",
    color: "#4A4A4A",
    border: "1px solid #A5B68D"
  },
  errorMessage: {
    backgroundColor: "#F8E0D8",
    color: "#B25A3D",
    border: "1px solid #B25A3D"
  },
  uploadButton: {
    width: "100%",
    background: "linear-gradient(to bottom, #B17F59, #A06F4A)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(177, 127, 89, 0.2)"
  },
  uploadingButton: {
    background: "#C99B7A",
    cursor: "not-allowed",
    opacity: 0.8
  },
  uploadingContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  smallSpinner: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    animation: "spin 1s infinite linear"
  },
  instructionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #D6D0C4",
    padding: "24px"
  },
  instructionsTitle: {
    margin: "0 0 20px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#B17F59",
    borderBottom: "2px solid #D6D0C4",
    paddingBottom: "10px",
    display: "inline-block"
  },
  instructionsList: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  instructionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
    padding: "10px",
    borderRadius: "8px"
  },
  instructionNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    backgroundColor: "#B17F59",
    color: "white",
    borderRadius: "50%",
    fontSize: "14px",
    fontWeight: "bold",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(177, 127, 89, 0.2)"
  },
  note: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#F8F7F4",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#767676",
    border: "1px solid #D6D0C4"
  }
};

export default UploadPage;