import jwt from "jsonwebtoken";

const JWT_SECRET = "your_secret_key"; // ✅ Change this to a secure secret

// ✅ Middleware to Verify Token
export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access Denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// ✅ Middleware to Restrict Access to Teachers Only
export const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access Denied. Teachers only." });
  }
  next();
};

// ✅ Middleware to Restrict Access to Student's Own Data
export const isStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access Denied. Students only." });
  }
  next();
};
