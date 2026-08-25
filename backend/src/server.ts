/**
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: server.ts
 * Description: Main entry point for the Magic Touch Designs backend.
 * Languages: English (en) | Español (es)
 */

import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Magic Touch Designs API running on port ${PORT}`);
});