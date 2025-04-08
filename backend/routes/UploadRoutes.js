import express from "express";
import multer from "multer";
import path from "path";
import { uploadAnswerSheet } from "../controllers/uploadController.js";

const router = express.Router();

// ✅ Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: "uploads/",  // Save files in the "uploads" folder
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);  // Unique filename
  }
});
const upload = multer({ storage });

router.post("/", upload.single("file"), uploadAnswerSheet);  // ✅ Add Multer middleware

export default router;
