import Evaluation from "../models/Evaluation.js";

export const getEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find().populate("answer_sheet_id");
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitEvaluation = async (req, res) => {
  try {
    const { answer_sheet_id, teacher_id, marks, total_score } = req.body;
    
    const newEvaluation = new Evaluation({
      answer_sheet_id,
      teacher_id,
      marks,
      total_score
    });

    await newEvaluation.save();
    res.json({ message: "Evaluation submitted successfully!", evaluation: newEvaluation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
