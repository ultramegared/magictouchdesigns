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
import userRoutes from "./routes/user.routes";
import reviewRoutes from "./routes/review.routes";
import favoriteRoutes from "./routes/favorite.routes";


const app = express();


/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
    cors()
);

app.use(
    express.json()
);


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication routes
app.use(
    "/api/auth",
    authRoutes
);


// Review routes
app.use(
    "/api/reviews",
    reviewRoutes
);


// Favorite routes
app.use(
    "/api/favorites",
    favoriteRoutes
);


// User routes
app.use(
    "/api/user",
    userRoutes
);


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    async (
        _req,
        res
    ) => {

        try {

            await pool.query(
                "SELECT 1"
            );


            res.json({

                status:
                    "ok",

                project:
                    "Magic Touch Designs",

                author:
                    "ultramegared",

                database:
                    "connected",

            });

        } catch (error) {

            console.error(
                "Database connection error:",
                error
            );


            res.status(503).json({

                status:
                    "error",

                project:
                    "Magic Touch Designs",

                author:
                    "ultramegared",

                database:
                    "disconnected",

            });

        }

    }
);


export default app;