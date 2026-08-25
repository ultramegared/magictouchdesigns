/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: app.ts
 * Description: Express application configuration and API routes.
 * Languages: English (en) | Español (es)
 */

import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    project: "Magic Touch Designs",
    author: "ultramegared",
  });
});

export default app;