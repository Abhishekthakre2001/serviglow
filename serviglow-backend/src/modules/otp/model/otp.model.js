import pool from "../../../config/db.js";

export const OtpModel = {

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1",
      [email]
    );
    return rows[0] || null;
  },

  async findValid({ email, otp, isVerified = false }) {
    const [rows] = await pool.query(
      `SELECT * FROM otps
       WHERE email = ? AND otp = ? AND is_verified = ? AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, isVerified]
    );
    return rows[0] || null;
  },

  async create({ email, otp, expiresAt, type }) {
    const [result] = await pool.query(
      `INSERT INTO otps (email, otp, expires_at, type, is_verified)
       VALUES (?, ?, ?, ?, false)`,
      [email, otp, expiresAt, type]
    );
    return result.insertId;
  },

  async deleteByEmail(email) {
    await pool.query("DELETE FROM otps WHERE email = ?", [email]);
  },

  async markVerified(id) {
    await pool.query(
      "UPDATE otps SET is_verified = true WHERE id = ?",
      [id]
    );
  },
};