import pool from "../../config/db.js";

export const UserModel = {

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  async updateRefreshToken(id, refreshToken) {
    await pool.query(
      "UPDATE users SET refresh_token = ? WHERE id = ?",
      [refreshToken, id]
    );
  },

  async updatePassword(id, hashedPassword) {
    await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
  },
};

export const OtpModel = {

  async create({ email, otp, expiresAt, type }) {
    await pool.query(
      `INSERT INTO otps (email, otp, expires_at, type, is_verified)
       VALUES (?, ?, ?, ?, false)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), is_verified = false`,
      [email, otp, expiresAt, type]
    );
  },

  async findValid(email, otp, type) {
    const [rows] = await pool.query(
      `SELECT * FROM otps
       WHERE email = ? AND otp = ? AND type = ?
         AND is_verified = false AND expires_at > NOW()
       LIMIT 1`,
      [email, otp, type]
    );
    return rows[0] || null;
  },

  async markVerified(email, type) {
    await pool.query(
      `UPDATE otps SET is_verified = true
       WHERE email = ? AND type = ?`,
      [email, type]
    );
  },

  async deleteByEmail(email, type) {
    await pool.query(
      "DELETE FROM otps WHERE email = ? AND type = ?",
      [email, type]
    );
  },
};