import cron from "node-cron";
import pool from "../config/db.js";

export const startOtpCleanupCron = () => {
    // Runs every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        try {
            const [result] = await pool.query(
                ` DELETE FROM otps
                    WHERE expires_at < NOW()
                    OR is_verified = 1`
            );

            console.log(
                `[OTP CRON] Deleted ${result.affectedRows} expired OTP(s) at ${new Date().toISOString()}`
            );
        } catch (error) {
            console.error("[OTP CRON ERROR]", error);
        }
    });

    console.log("✅ OTP cleanup cron started (every 30 minutes)");
};