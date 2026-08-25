/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: database.ts
 * Module: Config / Database
 * Language: TypeScript
 * Description:
 * PostgreSQL database connection using Neon.
 * ================================================================
 */

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL environment variable is not configured."
    );
}

export const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false,
    },
});