import dotenv from "dotenv";
import app from "./src/app.js";
import pool from "./src/config/db.js";
import { startOtpCleanupCron } from "./src/cron/deleteExpiredOtps.js";

dotenv.config();

const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log("Server running on port", PORT);
// });
async function startServer() {
  try {
    // ✅ Check DB connection
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");

    // ✅ Start server only if DB is connected
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      startOtpCleanupCron();
    });

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // stop app if DB fails
  }
}

startServer();