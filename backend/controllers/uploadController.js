import AnswerSheet from "../models/AnswerSheet.js";
import path from "path";
import vision from "@google-cloud/vision";
import fetch from "node-fetch"; // ✅ Import fetch for API requests
import fs from "fs";

// ✅ Google Gemini API Key
const GEMINI_API_KEY = "AIzaSyAIYq5nvKjqynQ7P7cyypCEGXBr5rDl2DY";  // 🔥 Replace with your actual API key

// ✅ Initialize Google Vision Client
const client = new vision.ImageAnnotatorClient();

// ✅ Function to Extract Text from Image/PDF
const extractText = async (filePath) => {
  try {
    const [result] = await client.textDetection(filePath);
    const extractedText = result.textAnnotations[0]?.description || "";
    console.log("✅ Extracted Text Before Structuring:\n", extractedText);
    return extractedText;
  } catch (error) {
    console.error("❌ Google Vision API Error:", error);
    return "";
  }
};

// ✅ Function to Structure Extracted Answers
const structureAnswers = (text) => {
  const lines = text.split("\n");
  const structuredAnswers = [];
  let currentQuestion = null;
  let currentAnswer = [];

  let hasQuestionNumbers = false;

  lines.forEach((line) => {
    const match = line.match(/^(\d+)[.)]\s*(.*)/);
    if (match) {
      hasQuestionNumbers = true;
      if (currentQuestion !== null) {
        structuredAnswers.push({ question_number: currentQuestion, answer: currentAnswer.join(" ") });
      }
      currentQuestion = match[1];
      currentAnswer = [match[2]];
    } else if (currentQuestion !== null) {
      currentAnswer.push(line);
    }
  });

  if (currentQuestion !== null) {
    structuredAnswers.push({ question_number: currentQuestion, answer: currentAnswer.join(" ") });
  }

  // ✅ If NO question numbers, store full text as one answer
  if (!hasQuestionNumbers) {
    structuredAnswers.push({ question_number: "N/A", answer: text });
  }

  console.log("✅ Structured Answers:\n", structuredAnswers);
  return structuredAnswers;
};

// ✅ Function to Summarize Answers Using Google Gemini
const summarizeAnswers = async (answers) => {
  const summarizedAnswers = [];

  for (const ans of answers) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Summarize this answer: ${ans.answer}` }] }],
        }),
      });

      const data = await response.json();
      console.log("🔍 Gemini API Response:", JSON.stringify(data, null, 2));  // ✅ Print full API response

      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary not available";
      summarizedAnswers.push({ question_number: ans.question_number, summary });
    } catch (error) {
      console.error("❌ Gemini API Error:", error);
      summarizedAnswers.push({ question_number: ans.question_number, summary: "Error generating summary" });
    }
  }

  console.log("✅ Summarized Answers:\n", summarizedAnswers);
  return summarizedAnswers;
};


// ✅ Upload Controller (Modified)
// Enhanced Upload Controller with User Name tracking
export const uploadAnswerSheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ No file uploaded" });
    }

    // Extract user data from request
    const studentId = req.body.student_id || "unknown";
    const userName = req.body.userName || "Anonymous User";
    
    console.log(`✅ Processing upload for student: ${studentId}, name: ${userName}`);

    // Get the correct file path
    const filePath = path.join("uploads", req.file.filename);

    // Extract Text from File
    const extractedText = await extractText(filePath);
    const structuredAnswers = structureAnswers(extractedText);

    // Summarize Answers
    const summarizedAnswers = await summarizeAnswers(structuredAnswers);

    // Format summary as HTML for frontend display
    let summaryHtml = `<div class="summary-container">
      <h3>Student: ${studentId} (${userName})</h3>
      <div class="answers-list">`;
    
    summarizedAnswers.forEach(ans => {
      summaryHtml += `
        <div class="answer-item">
          <h4>Question ${ans.question_number}</h4>
          <p>${ans.summary}</p>
        </div>`;
    });
    
    summaryHtml += `</div></div>`;

    // Save the answer sheet in MongoDB with student information
    const answerSheet = new AnswerSheet({
      student_id: studentId,
      user_name: userName,                       // Add user name
      exam_code: req.body.exam_code,          
      answer_type: req.body.answer_type || "descriptive",
      file_path: filePath,
      status: "Pending",
      structured_answers: structuredAnswers,
      summarized_answers: summarizedAnswers,
      total_marks: 0,
      upload_date: new Date(),                  // Add timestamp
    });

    await answerSheet.save();
    
    res.json({ 
      message: "✅ File uploaded and processed successfully!",
      summary: summaryHtml,
      answerSheet 
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
};