// Add this import at the top of models/AnswerSheet.js
import mongoose from 'mongoose';

// Keeping the existing schema and just adding the new fields
const answerSheetSchema = new mongoose.Schema({
  student_id: { type: String, required: true },
  exam_code: { type: String, required: true },  
  file_path: { type: String, required: true },  
  structured_answers: { type: Array, default: []},
  summarized_answers: { type: Array, default: [] }, 
  marks: { type: Object, default: {} }, 
  total_marks: { type: Number, default: 0 }, 
  status: { type: String, default: "Pending" }, // Keep as-is
  answer_type: { type: String, default: "descriptive" }, // Keep as-is
  
  // New fields that don't interfere with existing code
  evaluation_method: { type: String, default: null }, // "auto", "manual", or null
  evaluated_at: { type: Date },
  evaluated_by: { type: String }, // Teacher ID or "system"
  
  // Add user_name field for tracking who uploaded the sheet
  user_name: { type: String, default: "Anonymous User" },
  
  // Optional: Add upload timestamp if you want to track when sheets were uploaded
  upload_date: { type: Date, default: Date.now }
});

// In models/AnswerSheet.js
const AnswerSheet = mongoose.model("AnswerSheet", answerSheetSchema);
export default AnswerSheet;