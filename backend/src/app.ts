/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: app.ts
 * Module: Express Application
 * Language: TypeScript
 * Description:
 * Express application configuration and API routes.
 * ================================================================
 */

import express from "express";
import cors from "cors";
import { pool } from "./config/database";
import authRoutes from "./routes/auth.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "ok",
            project: "Magic Touch Designs",
            author: "ultramegared",
            database: "connected",
        });
    } catch (error) {
        console.error(
            "Database connection error:",
            error
        );

        res.status(503).json({
            status: "error",
            project: "Magic Touch Designs",
            author: "ultramegared",
            database: "disconnected",
        });
    }
});

export default app;