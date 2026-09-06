/**
 * Magic Touch Designs - Express Application
 */
import express from "express";
import cors from "cors";
import { pool } from "./config/database";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import reviewRoutes from "./routes/review.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import settingsRoutes from "./routes/settings.routes";
import reportsRoutes from "./routes/reports.routes";
import productRoutes from "./routes/product.routes";
import collectionRoutes from "./routes/collection.routes";
import subscriberRoutes from "./routes/subscriber.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import orderRoutes from "./routes/order.routes";
import adminOrderRoutes from "./routes/order.admin.routes";
import { stripeWebhook } from "./controllers/order.controller";
const app = express();
app.use(cors());
app.post("/api/orders/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json({ limit: "12mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/orders", orderRoutes);
app.get("/api/health", async (_req, res) => { try { await pool.query("SELECT 1"); res.json({ status: "ok", project: "Magic Touch Designs", author: "ultramegared", database: "connected" }); } catch (error) { console.error("Database connection error:", error); res.status(503).json({ status: "error", project: "Magic Touch Designs", author: "ultramegared", database: "disconnected" }); } });
export default app;
