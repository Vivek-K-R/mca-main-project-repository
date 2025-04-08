import mongoose from "mongoose";

const answerKeySchema = new mongoose.Schema({
  exam_code: { 
    type: String, 
    required: true, 
    unique: true // Each exam code can have only one answer key
  },
  exam_name: { type: String, required: true },
  answer_key: {
    type: mongoose.Schema.Types.Mixed,  // This allows for a flexible object structure
    default: {}
  },
  answer_type: { 
    type: String, 
    default: "objective", 
    enum: ["objective"] 
  },
  created_by: { type: String }, // Teacher ID
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update the timestamps when modified
answerKeySchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updated_at = Date.now();
  }
  next();
});

export default mongoose.model("AnswerKey", answerKeySchema);