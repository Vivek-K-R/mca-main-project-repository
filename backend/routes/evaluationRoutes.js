import express from "express";
import AnswerSheet from "../models/AnswerSheet.js";
import { verifyToken, isTeacher } from "../middleware/authMiddleware.js"; 
const router = express.Router();

// ✅ Get all answer sheets
router.get("/", async (req, res) => {
  try {
    const answerSheets = await AnswerSheet.find();
    res.json(answerSheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get a specific answer sheet by ID (for evaluation)
router.get("/:id", async (req, res) => {
  try {
    const answerSheet = await AnswerSheet.findById(req.params.id);
    if (!answerSheet) {
      return res.status(404).json({ error: "Answer sheet not found" });
    }
    res.json(answerSheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ Protect Evaluation Route (Only Teachers Can Access)
router.post("/:id/evaluate", verifyToken, isTeacher, async (req, res) => {
  try {
    const { marks } = req.body;
    const totalMarks = Object.values(marks).reduce((sum, mark) => sum + Number(mark), 0);

    const updatedSheet = await AnswerSheet.findByIdAndUpdate(
      req.params.id,
      { marks, total_marks: totalMarks, status: "Evaluated" },
      { new: true }
    );

    res.json(updatedSheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// ✅ Save Progress (Allows Partial Grading Without Changing Status)
router.post("/:id/save-progress", async (req, res) => {
  try {
    const { marks } = req.body;

    const updatedSheet = await AnswerSheet.findByIdAndUpdate(
      req.params.id,
      { marks }, // ✅ Only update marks, don't change status
      { new: true }
    );

    res.json(updatedSheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
