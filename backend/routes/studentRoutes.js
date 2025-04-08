import express from "express";
import AnswerSheet from "../models/AnswerSheet.js";
import { verifyToken, isStudent } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// ✅ Get ALL answer sheets for a student (both graded and pending)
router.get("/:student_id/answer-sheets", verifyToken, isStudent, async (req, res) => {
  try {
    if (req.user.id !== req.params.student_id) {
      return res.status(403).json({ error: "Access Denied. You can only view your own answer sheets." });
    }

    const allSheets = await AnswerSheet.find({ student_id: req.params.student_id });
    res.json(allSheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Keep the original endpoint for backward compatibility
router.get("/:student_id/graded", verifyToken, isStudent, async (req, res) => {
  try {
    if (req.user.id !== req.params.student_id) {
      return res.status(403).json({ error: "Access Denied. You can only view your own answer sheets." });
    }

    const gradedSheets = await AnswerSheet.find({ 
      student_id: req.params.student_id, 
      status: "Evaluated" 
    });

    res.json(gradedSheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;