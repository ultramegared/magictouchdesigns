/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: server.ts
 * Module: Backend Server
 * Language: TypeScript
 * Description:
 * Main entry point for the Magic Touch Designs backend API.
 * Languages: English (en) | Español (es)
 * ================================================================
 */

import dotenv from "dotenv";

dotenv.config();

import app from "./app";


/**
 * ================================================================
 * SERVER CONFIGURATION
 * ================================================================
 */

const PORT =
    Number(
        process.env.PORT
    ) || 5000;


/**
 * ================================================================
 * START SERVER
 * ================================================================
 */

app.listen(
    PORT,
    () => {

        console.log(
            `Magic Touch Designs API running on port ${PORT}`
        );

    }
);