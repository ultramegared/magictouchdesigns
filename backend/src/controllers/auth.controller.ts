/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.controller.ts
 * Module: Authentication Controller
 * Language: TypeScript
 * Description:
 * User registration and authentication controller.
 * ================================================================
 */

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";

/**
 * ================================================================
 * REGISTER
 * ================================================================
 */

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
                message:
                    "Password must contain at least 8 characters.",
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
            [
                normalizedUsername,
                normalizedEmail,
            ]
        );

        if (
            existingUser.rowCount &&
            existingUser.rowCount > 0
        ) {
            res.status(409).json({
                status: "error",
                message:
                    "Username or email already exists.",
            });

            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(
            password,
            12
        );

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
            message:
                "User registered successfully.",
            user: result.rows[0],
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            status: "error",
            message:
                "Unable to register user.",
        });
    }
};

/**
 * ================================================================
 * LOGIN
 * ================================================================
 */

export const login = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {

        const {
            username,
            password,
        } = req.body;

        // Normalize input
        const normalizedUsername =
            typeof username === "string"
                ? username.trim().toLowerCase()
                : "";

        // Validate required fields
        if (
            !normalizedUsername ||
            typeof password !== "string" ||
            !password
        ) {
            res.status(400).json({
                status: "error",
                message:
                    "Username and password are required.",
            });

            return;
        }

        // Find user
        const result = await pool.query(
            `
            SELECT
                id,
                username,
                first_name,
                last_name,
                email,
                password_hash,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE LOWER(username) = $1
            LIMIT 1
            `,
            [normalizedUsername]
        );

        // User does not exist
        if (result.rowCount === 0) {
            res.status(401).json({
                status: "error",
                message:
                    "Invalid username or password.",
            });

            return;
        }

        const user = result.rows[0];

        // Check account status
        if (!user.is_active) {
            res.status(403).json({
                status: "error",
                message:
                    "This account is inactive.",
            });

            return;
        }

        // Compare password
        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatches) {
            res.status(401).json({
                status: "error",
                message:
                    "Invalid username or password.",
            });

            return;
        }

        // JWT secret
        const jwtSecret =
            process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error(
                "JWT_SECRET is not configured."
            );

            res.status(500).json({
                status: "error",
                message:
                    "Authentication configuration error.",
            });

            return;
        }

        // Create authentication token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
            },
            jwtSecret,
            {
                expiresIn: "7d",
            }
        );

        // Remove password hash from response
        const authenticatedUser = {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        res.status(200).json({
            status: "ok",
            message:
                "Login successful.",
            token,
            user: authenticatedUser,
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            status: "error",
            message:
                "Unable to sign in.",
        });
    }
};