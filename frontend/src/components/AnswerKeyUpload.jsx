import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const AnswerKeyUpload = () => {
  const navigate = useNavigate();
  const [examName, setExamName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("No file selected");
  const [showCodeCopied, setShowCodeCopied] = useState(false);

  // Set teacher role for navbar
  useEffect(() => {
    const userString = localStorage.getItem('user');

    if (userString) {
      try {
        const userData = JSON.parse(userString);
        if (userData.role !== 'teacher') {
          // If not a teacher, redirect to login
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    } else {
      // No user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check if file type is supported
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage(`File type ${selectedFile.type} is not supported. Please upload a PDF, JPG, or PNG file.`);
        setMessageType("error");
        setFile(null);
        setFileName("No file selected");
        return;
      }
      
      console.log("Selected file:", selectedFile.name, "Type:", selectedFile.type);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setFile(null);
      setFileName("No file selected");
    }
  };

  const copyExamCode = () => {
    navigator.clipboard.writeText(examCode).then(() => {
      setShowCodeCopied(true);
      setTimeout(() => setShowCodeCopied(false), 2000);
    });
  };

  const handleUpload = async () => {
    if (!examName) {
      setMessage("Please enter an exam name");
      setMessageType("error");
      return;
    }

    if (!examCode) {
      setMessage("Please enter an exam code");
      setMessageType("error");
      return;
    }

    if (!file) {
      setMessage("Please select a file");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    // Now prepare the upload
    const formData = new FormData();
    
    // Add file to FormData
    formData.append("file", file);
    
    // Add metadata to FormData
    formData.append("exam_name", examName);
    formData.append("exam_code", examCode);
    formData.append("answer_type", "objective");
    
    // Log FormData contents for debugging
    console.log("FormData contents:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]}`);
    }

    try {
      const response = await fetch("http://localhost:5000/api/answer-key/upload", {
        method: "POST",
        body: formData,
      });

      // Log the complete response for debugging
      console.log("Response status:", response.status);
      
      let data;
      try {
        // Try to parse the response as JSON
        data = await response.json();
        console.log("Response data:", data);
        
        // Check if structured answers were extracted
        if (data.answer_key && Object.keys(data.answer_key).length === 0) {
          setMessage("Upload succeeded but no answers were extracted. Please check your file format.");
          setMessageType("warning");
          return;
        }
      } catch (jsonError) {
        // If response isn't valid JSON, get the text instead
        const textResponse = await response.text();
        console.log("Response text:", textResponse);
        throw new Error("Server returned invalid JSON. Check console for details.");
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to upload");
      }

      setMessage(`Answer key uploaded successfully! Share the exam code with students.`);
      setMessageType("success");
    } catch (error) {
      console.error("Upload error details:", error);
      setMessage(`Upload failed: ${error.message}`);
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
          <h1 style={styles.title}>Upload Answer Key</h1>
          <button
            onClick={() => navigate("/teacher/dashboard")}
            style={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>

        <div style={styles.cardContainer}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <div style={styles.formIcon}>🔑</div>
              <h2 style={styles.formTitle}>Answer Key Details</h2>
            </div>

            <div style={styles.formBody}>
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

              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics Midterm"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Code</label>
                <input
                  type="text"
                  placeholder="e.g., MATH-2023"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  style={styles.input}
                />
                <p style={styles.fieldHint}>
                  Choose a unique code that students will use to submit their answers
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Answer Key (PDF, JPG, PNG)</label>
                <div style={styles.fileInputContainer}>
                  <label style={styles.fileInputLabel}>
                    <span style={styles.browseButton}>Browse Files</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={styles.hiddenFileInput}
                    />
                  </label>
                  <div style={styles.fileNameDisplay}>
                    {fileName}
                  </div>
                </div>
                <p style={styles.fileHint}>Upload a file containing your answer key in the proper format</p>
              </div>

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
                  "Upload Answer Key"
                )}
              </button>
            </div>
          </div>

          {messageType === "success" && (
            <div style={styles.codeCard}>
              <div style={styles.codeHeader}>
                <h3 style={styles.codeTitle}>Exam Code Submitted</h3>
              </div>
              <div style={styles.codeBody}>
                <p style={styles.codeInstructions}>
                  Share this code with your students to link their answers to this key:
                </p>
                <div style={styles.codeDisplay}>
                  <span style={styles.code}>{examCode}</span>
                  <button
                    onClick={copyExamCode}
                    style={styles.copyButton}
                    aria-label="Copy exam code"
                  >
                    {showCodeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div style={styles.codeNote}>
                  This code will be used to automatically grade students' objective answers.
                </div>
              </div>
            </div>
          )}

          <div style={styles.instructionsCard}>
            <h3 style={styles.instructionsTitle}>How to Prepare Answer Keys</h3>
            <ul style={styles.instructionsList}>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>1</span>
                <span>Create a PDF or image with one answer per line (make sure the text is selectable, not a scanned image)</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>2</span>
                <span>Format each line as "Question Number. Answer" (Example: "1. A" or "Question 1. A")</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>3</span>
                <span>Ensure consistent formatting throughout the document</span>
              </li>
              <li style={styles.instructionItem}>
                <span style={styles.instructionNumber}>4</span>
                <span>Each answer should be a single letter (A, B, C, D) or a short value</span>
              </li>
            </ul>
            <div style={styles.exampleFormat}>
              <h4 style={styles.exampleTitle}>Example Format:</h4>
              <pre style={styles.exampleCode}>
                1. A{'\n'}
                2. B{'\n'}
                3. C{'\n'}
                4. D{'\n'}
                5. A
              </pre>
            </div>
            <div style={styles.note}>
              <strong>Note:</strong> Currently, only objective-type answer keys are supported. Make sure your file contains clear, readable text for proper extraction.
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
  cardContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "24px",
    "@media (min-width: 768px)": {
      gridTemplateColumns: "3fr 2fr"
    }
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    gridColumn: "1 / -1"
  },
  formHeader: {
    background: "linear-gradient(135deg, #B17F59 0%, #C99B7A 100%)",
    padding: "20px 24px",
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
    fontSize: "18px",
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
    fontWeight: "500",
    color: "#4A4A4A"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #D6D0C4",
    backgroundColor: "#ffffff",
    color: "#4A4A4A",
    transition: "border-color 0.2s",
    ":focus": {
      borderColor: "#B17F59",
      outline: "none"
    }
  },
  fieldHint: {
    margin: "8px 0 0",
    fontSize: "12px",
    color: "#767676",
    fontStyle: "italic"
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
    backgroundColor: "#F8F7F4",
    border: "1px solid #D6D0C4",
    color: "#B17F59",
    padding: "12px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#EDE8DC"
    }
  },
  hiddenFileInput: {
    display: "none"
  },
  fileNameDisplay: {
    flex: 1,
    backgroundColor: "#F8F7F4",
    border: "1px solid #D6D0C4",
    borderRadius: "6px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#767676",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  fileHint: {
    margin: "8px 0 0",
    fontSize: "12px",
    color: "#767676",
    fontStyle: "italic"
  },
  messageBox: {
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  successMessage: {
    backgroundColor: "#C1CFA1",
    color: "#4A4A4A",
    border: "1px solid #A5B68D"
  },
  warningMessage: {
    backgroundColor: "#FFF8E1",
    color: "#856404",
    border: "1px solid #FFE082"
  },
  errorMessage: {
    backgroundColor: "#F8E0D8",
    color: "#B25A3D",
    border: "1px solid #B25A3D"
  },
  uploadButton: {
    width: "100%",
    backgroundColor: "#B17F59",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ":hover": {
      backgroundColor: "#A06F4A"
    }
  },
  uploadingButton: {
    backgroundColor: "#C99B7A",
    cursor: "not-allowed"
  },
  uploadingContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  smallSpinner: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    animation: "spin 1s infinite linear"
  },
  codeCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    gridColumn: "1 / -1"
  },
  codeHeader: {
    backgroundColor: "#A5B68D",
    padding: "16px 24px"
  },
  codeTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "white"
  },
  codeBody: {
    padding: "24px",
    textAlign: "center"
  },
  codeInstructions: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#4A4A4A"
  },
  codeDisplay: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    margin: "16px 0",
    backgroundColor: "#F8F7F4",
    padding: "12px",
    borderRadius: "6px",
    border: "1px dashed #D6D0C4"
  },
  code: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#B17F59",
    letterSpacing: "1px"
  },
  copyButton: {
    backgroundColor: "#A5B68D",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#94A47C"
    }
  },
  codeNote: {
    fontSize: "13px",
    color: "#767676",
    marginTop: "16px",
    fontStyle: "italic"
  },
  instructionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    gridColumn: "1 / -1"
  },
  instructionsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#B17F59",
    margin: "0 0 16px 0",
    borderBottom: "1px solid #EDE8DC",
    paddingBottom: "8px"
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
    marginBottom: "16px"
  },
  instructionNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    backgroundColor: "#B17F59",
    color: "white",
    borderRadius: "50%",
    fontSize: "12px",
    fontWeight: "bold",
    flexShrink: 0
  },
  exampleFormat: {
    backgroundColor: "#F8F7F4", 
    padding: "16px",
    borderRadius: "6px",
    marginTop: "16px"
  },
  exampleTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#4A4A4A",
    margin: "0 0 8px 0"
  },
  exampleCode: {
    fontFamily: "monospace",
    fontSize: "14px",
    backgroundColor: "#FFFFFF",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #E0E0E0",
    color: "#333333",
    margin: 0
  },
  note: {
    marginTop: "16px",
    padding: "12px 16px",
    backgroundColor: "#F8F7F4",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#767676",
    border: "1px solid #EDE8DC"
  }
};

export default AnswerKeyUpload;