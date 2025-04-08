import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import uploadRoutes from "./routes/UploadRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js"; 
import answerKeyRoutes from "./routes/answerKeyRoutes.js";


process.env.GOOGLE_APPLICATION_CREDENTIALS = "D:/Campaigns/PersonalQuests/Main Project/backend/google-key.json";





const app = express();
app.use(cors());
app.use(express.json());

// ✅ Direct MongoDB Connection (No .env)
mongoose.connect("mongodb+srv://vivek:q3w3r7yr77i@cluster0.lzcnjke.mongodb.net/AnsEvalSysDB?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((error) => console.error("❌ MongoDB Connection Error:", error));

app.use("/uploads", express.static("uploads"));
app.use("/api/upload", uploadRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/answer-key", answerKeyRoutes);






const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
