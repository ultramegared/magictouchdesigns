/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: auth.middleware.ts
 * Module: Authentication Middleware
 * Language: TypeScript
 * Description:
 * JWT authentication middleware for protected API routes.
 * ================================================================
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest
    extends Request {
    user?: {
        userId: string;
        username: string;
    };
}

/**
 * Verifies the JWT authentication token.
 */
export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {

    const authorization =
        req.headers.authorization;

    if (!authorization) {
        res.status(401).json({
            status: "error",
            message: "Authentication token is required.",
        });

        return;
    }

    const [scheme, token] =
        authorization.split(" ");

    if (
        scheme !== "Bearer" ||
        !token
    ) {
        res.status(401).json({
            status: "error",
            message: "Invalid authentication token.",
        });

        return;
    }

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

    try {

        const decoded = jwt.verify(
            token,
            jwtSecret
        );

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.userId !== "string" ||
            typeof decoded.username !== "string"
        ) {
            res.status(401).json({
                status: "error",
                message:
                    "Invalid authentication token.",
            });

            return;
        }

        req.user = {
            userId: decoded.userId,
            username: decoded.username,
        };

        next();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        res.status(401).json({
            status: "error",
            message:
                "Invalid or expired authentication token.",
        });
    }
};