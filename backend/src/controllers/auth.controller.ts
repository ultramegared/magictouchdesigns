/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.controller.ts
 * Module: Authentication Controller
 * Language: TypeScript
 * Description:
 * User registration controller.
 * ================================================================
 */

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database";

export const register = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            username,
            firstName,
            lastName,
            email,
            password,
        } = req.body;

        // Normalize input
        const normalizedUsername =
            typeof username === "string"
                ? username.trim().toLowerCase()
                : "";

        const normalizedFirstName =
            typeof firstName === "string"
                ? firstName.trim()
                : "";

        const normalizedLastName =
            typeof lastName === "string"
                ? lastName.trim()
                : "";

        const normalizedEmail =
            typeof email === "string"
                ? email.trim().toLowerCase()
                : "";

        // Validate required fields
        if (
            !normalizedUsername ||
            !normalizedFirstName ||
            !normalizedLastName ||
            !normalizedEmail ||
            typeof password !== "string" ||
            !password
        ) {
            res.status(400).json({
                status: "error",
                message: "All registration fields are required.",
            });

            return;
        }

        // Validate password length
        if (password.length < 8) {
            res.status(400).json({
                status: "error",
                message: "Password must contain at least 8 characters.",
            });

            return;
        }

        // Check username and email
        const existingUser = await pool.query(
            `
            SELECT id
            FROM users
            WHERE LOWER(username) = $1
               OR LOWER(email) = $2
            LIMIT 1
            `,
            [normalizedUsername, normalizedEmail]
        );

        if (existingUser.rowCount && existingUser.rowCount > 0) {
            res.status(409).json({
                status: "error",
                message: "Username or email already exists.",
            });

            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = await pool.query(
            `
            INSERT INTO users (
                username,
                first_name,
                last_name,
                email,
                password_hash
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                username,
                first_name,
                last_name,
                email,
                is_active,
                created_at,
                updated_at
            `,
            [
                normalizedUsername,
                normalizedFirstName,
                normalizedLastName,
                normalizedEmail,
                passwordHash,
            ]
        );

        res.status(201).json({
            status: "ok",
            message: "User registered successfully.",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            status: "error",
            message: "Unable to register user.",
        });
    }
};