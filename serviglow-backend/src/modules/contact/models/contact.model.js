import pool from "../../../config/db.js";

export const ContactModel = {

  async create({ name, email, whatsappNumber, subject, message }) {
    const [result] = await pool.query(
      `INSERT INTO contacts 
    (name, email, whatsapp_number, subject, message, viewing_status)
     VALUES (?, ?, ?, ?, ?, false)`,
      [name, email, whatsappNumber, subject, message]
    );

    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM contacts WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  async countAll() {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM contacts");
    return rows[0]?.total || 0;
  },

  async countUnread() {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM contacts WHERE viewing_status = false"
    );
    return rows[0]?.total || 0;
  },

  // JOIN with users to get phone number (same logic as your aggregate)
  async findAllPaginated({ limit, skip }) {
    const [rows] = await pool.query(
      `SELECT 
         c.*,
         u.phone
       FROM contacts c
       LEFT JOIN users u ON u.email = c.email
       ORDER BY c.viewing_status ASC, c.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, skip]
    );
    return rows;
  },

  async markViewed(id) {
    await pool.query(
      "UPDATE contacts SET viewing_status = true WHERE id = ?",
      [id]
    );
    return this.findById(id);
  },

  async deleteById(id) {
    const [result] = await pool.query(
      "DELETE FROM contacts WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },
};