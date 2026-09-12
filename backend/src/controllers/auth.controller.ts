/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.controller.ts
 * Module: Authentication Controller
 * Language: TypeScript
 * Description:
 * User registration, authentication, and password recovery controller.
 * ================================================================
 */

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { pool } from "../config/database";
import { sendEmail } from "../services/email.service";

const PASSWORD_RESET_EXPIRY_MINUTES = 30;
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jqydesigns.com").replace(/\/$/, "");

const ensurePasswordResetTable = async (): Promise<void> => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token_hash TEXT PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
        ON password_reset_tokens(user_id)
    `);
};

const hashResetToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");

const passwordResetEmail = (firstName: string, resetUrl: string) => ({
    subject: "Reset your Magic Touch Designs password",
    text: `Hi ${firstName || "there"},\n\nWe received a request to reset your Magic Touch Designs password. Use this link within ${PASSWORD_RESET_EXPIRY_MINUTES} minutes:\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f6f2;font-family:Arial,sans-serif;color:#151515"><div style="max-width:560px;margin:40px auto;padding:32px;background:#fff;border:1px solid #e4e1da;border-radius:18px"><div style="font-size:12px;letter-spacing:.18em;font-weight:800;color:#9a7a12">MAGIC TOUCH DESIGNS</div><h1 style="font-size:28px;margin:18px 0 10px">Reset your password</h1><p style="color:#666;line-height:1.6">Hi ${firstName || "there"}, we received a request to reset your password.</p><p style="color:#666;line-height:1.6">This secure link expires in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;padding:13px 20px;background:#151515;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Reset password</a></p><p style="font-size:12px;color:#888;line-height:1.5">If you did not request a password reset, you can safely ignore this email.</p></div></body></html>`,
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, firstName, lastName, email, password } = req.body;
        const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
        const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
        const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!normalizedUsername || !normalizedFirstName || !normalizedLastName || !normalizedEmail || typeof password !== "string" || !password) {
            res.status(400).json({ status: "error", message: "All registration fields are required." }); return;
        }
        if (password.length < 8) {
            res.status(400).json({ status: "error", message: "Password must contain at least 8 characters." }); return;
        }
        const existingUser = await pool.query(`SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2 LIMIT 1`, [normalizedUsername, normalizedEmail]);
        if (existingUser.rowCount && existingUser.rowCount > 0) {
            res.status(409).json({ status: "error", message: "Username or email already exists." }); return;
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(`INSERT INTO users (username, first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, first_name, last_name, email, is_active, created_at, updated_at`, [normalizedUsername, normalizedFirstName, normalizedLastName, normalizedEmail, passwordHash]);
        res.status(201).json({ status: "ok", message: "User registered successfully.", user: result.rows[0] });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ status: "error", message: "Unable to register user." });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
        if (!normalizedUsername || typeof password !== "string" || !password) {
            res.status(400).json({ status: "error", message: "Username and password are required." }); return;
        }
        const result = await pool.query(`SELECT id, username, first_name, last_name, email, password_hash, is_active, created_at, updated_at FROM users WHERE LOWER(username) = $1 LIMIT 1`, [normalizedUsername]);
        if (result.rowCount === 0) {
            res.status(401).json({ status: "error", message: "Invalid username or password." }); return;
        }
        const user = result.rows[0];
        if (!user.is_active) {
            res.status(403).json({ status: "error", message: "This account is inactive." }); return;
        }
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            res.status(401).json({ status: "error", message: "Invalid username or password." }); return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("JWT_SECRET is not configured.");
            res.status(500).json({ status: "error", message: "Authentication configuration error." }); return;
        }
        const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: "7d" });
        const authenticatedUser = { id: user.id, username: user.username, first_name: user.first_name, last_name: user.last_name, email: user.email, is_active: user.is_active, created_at: user.created_at, updated_at: user.updated_at };
        res.status(200).json({ status: "ok", message: "Login successful.", token, user: authenticatedUser });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ status: "error", message: "Unable to sign in." });
    }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const genericMessage = "If an account exists for that email, a password reset link has been sent.";
    try {
        const normalizedEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
        if (!normalizedEmail) {
            res.status(400).json({ status: "error", message: "A valid email address is required." }); return;
        }
        await ensurePasswordResetTable();
        const result = await pool.query(`SELECT id, first_name, email, is_active FROM users WHERE LOWER(email) = $1 LIMIT 1`, [normalizedEmail]);
        if (result.rowCount === 0 || !result.rows[0].is_active) {
            res.status(200).json({ status: "ok", message: genericMessage }); return;
        }
        const user = result.rows[0];
        await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()`, [user.id]);
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(rawToken);
        await pool.query(`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))`, [tokenHash, user.id, PASSWORD_RESET_EXPIRY_MINUTES]);
        const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
        const email = passwordResetEmail(user.first_name, resetUrl);
        try {
            await sendEmail({ to: user.email, subject: email.subject, text: email.text, html: email.html, idempotencyKey: `password-reset:${tokenHash}` });
        } catch (emailError) {
            await pool.query(`DELETE FROM password_reset_tokens WHERE token_hash = $1`, [tokenHash]);
            console.error("Password reset email error:", emailError);
            res.status(500).json({ status: "error", message: "We could not send the password reset email. Please try again." }); return;
        }
        res.status(200).json({ status: "ok", message: genericMessage });
    } catch (error) {
        console.error("Password reset request error:", error);
        res.status(500).json({ status: "error", message: "Unable to process password recovery right now." });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        if (!token || !password) {
            res.status(400).json({ status: "error", message: "Reset token and new password are required." }); return;
        }
        if (password.length < 8) {
            res.status(400).json({ status: "error", message: "Password must contain at least 8 characters." }); return;
        }
        await ensurePasswordResetTable();
        const tokenHash = hashResetToken(token);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const tokenResult = await client.query(`SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE`, [tokenHash]);
            if (tokenResult.rowCount === 0) {
                await client.query("ROLLBACK");
                res.status(400).json({ status: "error", message: "This password reset link is invalid or has expired." }); return;
            }
            const passwordHash = await bcrypt.hash(password, 12);
            await client.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, tokenResult.rows[0].user_id]);
            await client.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`, [tokenHash]);
            await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1 AND token_hash <> $2`, [tokenResult.rows[0].user_id, tokenHash]);
            await client.query("COMMIT");
        } catch (transactionError) {
            await client.query("ROLLBACK");
            throw transactionError;
        } finally {
            client.release();
        }
        res.status(200).json({ status: "ok", message: "Password reset successfully." });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ status: "error", message: "Unable to reset the password right now." });
    }
};
