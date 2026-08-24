import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    project: "Magic Touch Designs",
    author: "ultramegared"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Magic Touch Designs API running on port ${PORT}`);
});