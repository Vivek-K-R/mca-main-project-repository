import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import AnswerKey from "../models/AnswerKey.js"; // ✅ MongoDB model
import AnswerSheet from "../models/AnswerSheet.js"; // Add import for AnswerSheet model
import vision from "@google-cloud/vision";

const router = express.Router();
const client = new vision.ImageAnnotatorClient();

// 📂 Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Helper function: Extract structured answers
const extractStructuredAnswers = (text) => {
  const answers = {};
  const lines = text.split("\n");
  lines.forEach((line) => {
    const match = line.match(/^(\d+)\.\s*(.+)$/); // Matches "1. Answer"
    if (match) {
      const questionNumber = match[1].trim();
      const answer = match[2].trim();
      answers[questionNumber] = answer;
    }
  });
  return answers;
};

// ✅ NEW: Helper function to evaluate an objective answer sheet
// ✅ UPDATED: Helper function to evaluate an objective answer sheet
const evaluateObjectiveSheet = async (answerSheet, answerKey) => {
  try {
    // Initialize marks object if it doesn't exist
    if (!answerSheet.marks) {
      answerSheet.marks = {};
    }

    let totalMarks = 0;
    const maxPossibleMarks = Object.keys(answerKey.answer_key || {}).length; // Total number of questions
    
    console.log("Starting evaluation for student:", answerSheet.student_id);
    console.log("Found", answerSheet.structured_answers.length, "student answers");
    console.log("Found", maxPossibleMarks, "questions in answer key");
    
    // Evaluate each student answer against the answer key
    for (const studentAnswer of answerSheet.structured_answers) {
      const questionNumber = studentAnswer.question_number;
      const studentResponseAnswer = studentAnswer.answer;
      const correctAnswer = answerKey.answer_key[questionNumber];
      
      console.log(`Question ${questionNumber}:`);
      console.log(`- Student's answer: "${studentResponseAnswer}"`);
      console.log(`- Correct answer: "${correctAnswer}"`);
      
      if (correctAnswer) {
        // Compare student answer with correct answer (case-insensitive)
        const isCorrect = studentResponseAnswer.trim().toLowerCase() === 
                          correctAnswer.trim().toLowerCase();
        
        // Each question is worth 1 point by default
        const marks = isCorrect ? 1 : 0;
        answerSheet.marks[questionNumber] = marks;
        totalMarks += marks;
        
        console.log(`- Result: ${isCorrect ? "Correct" : "Incorrect"} (${marks} mark)`);
      } else {
        console.log(`- Error: No correct answer found for question ${questionNumber}`);
      }
    }

    // Calculate percentage score (out of 100)
    const percentageScore = maxPossibleMarks > 0 ? 
      Math.round((totalMarks / maxPossibleMarks) * 100) : 0;
    
    console.log(`Evaluation complete: ${totalMarks}/${maxPossibleMarks} (${percentageScore}%)`);
    
    // CHANGE: Store raw marks instead of percentage
    answerSheet.total_marks = totalMarks;
    answerSheet.status = "Evaluated";
    answerSheet.evaluation_method = "auto";
    answerSheet.evaluated_at = new Date();
    answerSheet.evaluated_by = "system";

    // Save the updated answer sheet
    await answerSheet.save();
    console.log("Answer sheet updated in database");
    return true;
  } catch (error) {
    console.error("Error evaluating objective sheet:", error);
    return false;
  }
};

// ✅ API Endpoint: Upload Answer Key
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { exam_name, exam_code, answer_type } = req.body;

    // ❌ Reject non-objective answer keys
    if (answer_type !== "objective") {
      return res.status(400).json({ error: "Only objective answer keys are allowed." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = req.file.path;

    // 🔍 Extract text from the uploaded PDF/image
    const [result] = await client.textDetection(filePath);
    const extractedText = result.fullTextAnnotation ? result.fullTextAnnotation.text : "";

    // 📌 Convert extracted text to structured format
    const structuredAnswers = extractStructuredAnswers(extractedText);

    // Check if an answer key already exists for this exam code
    let existingKey = await AnswerKey.findOne({ exam_code });
    let newAnswerKey;

    if (existingKey) {
      // Update existing answer key
      existingKey.exam_name = exam_name;
      existingKey.answer_key = structuredAnswers;
      await existingKey.save();
      newAnswerKey = existingKey;
    } else {
      // 🔥 Store the extracted answer key in MongoDB
      newAnswerKey = new AnswerKey({
        exam_name,
        exam_code,
        answer_type,
        answer_key: structuredAnswers,
      });
      // await newAnswerKey.save();

      console.log("About to save answer key:", JSON.stringify(newAnswerKey));
      try {
        await newAnswerKey.save();
        console.log("Answer key saved successfully with ID:", newAnswerKey._id);
      } catch (dbError) {
        console.error("Database save error:", dbError);
        throw dbError;
      }
    }

    // ✨ NEW: Auto-evaluate pending objective answer sheets with this exam code
    const pendingSheets = await AnswerSheet.find({
      exam_code,
      answer_type: "objective",
      status: "Pending"
    });

    // Track how many sheets were auto-evaluated
    let evaluatedCount = 0;
    let evaluationResults = [];

    for (const sheet of pendingSheets) {
      const success = await evaluateObjectiveSheet(sheet, newAnswerKey);
      if (success) {
        evaluatedCount++;
        evaluationResults.push({
          id: sheet._id,
          student_id: sheet.student_id,
          total_marks: sheet.total_marks
        });
      }
    }

    res.json({
      message: "✅ Answer key uploaded successfully!",
      exam_code,
      answer_key: structuredAnswers,
      auto_evaluated: {
        count: evaluatedCount,
        sheets: evaluationResults
      }
    });
  } catch (error) {
    console.error("Error in answer key upload:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Get pending objective answer sheets by exam code
router.get("/pending/:exam_code", async (req, res) => {
  try {
    const { exam_code } = req.params;

    const pendingSheets = await AnswerSheet.find({
      exam_code,
      answer_type: "objective",
      status: "Pending"
    }).select('_id student_id file_path');

    res.json({
      count: pendingSheets.length,
      sheets: pendingSheets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Manually trigger evaluation for pending sheets
router.post("/evaluate/:exam_code", async (req, res) => {
  try {
    const { exam_code } = req.params;

    // Find the answer key
    const answerKey = await AnswerKey.findOne({ exam_code });
    if (!answerKey) {
      return res.status(404).json({ error: "Answer key not found" });
    }

    // Find pending sheets
    const pendingSheets = await AnswerSheet.find({
      exam_code,
      answer_type: "objective",
      status: "Pending"
    });

    let evaluatedCount = 0;
    let evaluationResults = [];

    for (const sheet of pendingSheets) {
      const success = await evaluateObjectiveSheet(sheet, answerKey);
      if (success) {
        evaluatedCount++;
        evaluationResults.push({
          id: sheet._id,
          student_id: sheet.student_id,
          total_marks: sheet.total_marks
        });
      }
    }

    res.json({
      message: `✅ Evaluated ${evaluatedCount} pending answer sheets`,
      exam_code,
      evaluated: {
        count: evaluatedCount,
        sheets: evaluationResults
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;