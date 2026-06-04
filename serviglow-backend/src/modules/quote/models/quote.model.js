import pool from "../../../config/db.js";

export const QuoteModel = {

    async create({ name, phone, email, serviceId, requirement, partnerId, customerId }) {
        const [result] = await pool.query(
            `INSERT INTO quotes
        (name, phone, email, service_id, requirement, partner_id, customer_id, viewing_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, false, 'new')`,
            [name, phone, email, serviceId, requirement, partnerId || null, customerId || null]
        );
        return this.findById(result.insertId);
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT q.*,
         c.category_name, c.image AS service_image,
         cu.first_name AS customer_first_name, cu.last_name AS customer_last_name,
         cu.email AS customer_email, cu.phone AS customer_phone,
         p.first_name AS partner_first_name, p.last_name AS partner_last_name,
         p.email AS partner_email, p.phone AS partner_phone
       FROM quotes q
     LEFT JOIN services s ON s.id = q.service_id
LEFT JOIN categories c ON c.id = s.category_id
       LEFT JOIN users cu ON cu.id = q.customer_id
       LEFT JOIN users p  ON p.id  = q.partner_id
       WHERE q.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] ? formatQuote(rows[0]) : null;
    },

    async findAll() {
        const [rows] = await pool.query(
            `SELECT q.*,
       s.title AS service_title,
       c.category_name,
       c.image AS service_image
     FROM quotes q
     LEFT JOIN services s ON s.id = q.service_id
     LEFT JOIN categories c ON c.id = s.category_id
     ORDER BY q.viewing_status ASC, q.created_at DESC`
        );
        return rows.map(formatQuote);
    },

    async countUnread() {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS total FROM quotes WHERE viewing_status = false"
        );
        return rows[0]?.total || 0;
    },

    async countByPartner(partnerId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS total FROM quotes WHERE partner_id = ?",
            [partnerId]
        );
        return rows[0]?.total || 0;
    },

    async countUnreadByPartner(partnerId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS total FROM quotes WHERE partner_id = ? AND viewing_status = false",
            [partnerId]
        );
        return rows[0]?.total || 0;
    },

    async findByPartnerPaginated({ partnerId, limit, skip }) {
        const [rows] = await pool.query(
            `SELECT q.*,
       s.title AS service_title,
       c.category_name,
       c.image AS service_image,
       cu.first_name AS customer_first_name,
       cu.last_name AS customer_last_name,
       cu.email AS customer_email,
       cu.phone AS customer_phone
     FROM quotes q
     LEFT JOIN services s ON s.id = q.service_id
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN users cu ON cu.id = q.customer_id
     WHERE q.partner_id = ?
     ORDER BY q.viewing_status ASC, q.created_at DESC
     LIMIT ? OFFSET ?`,
            [partnerId, limit, skip]
        );
        return rows.map(formatQuote);
    },

    async findByCustomer(customerId) {
        const [rows] = await pool.query(
            `SELECT q.*,
       s.title AS service_title,
       c.category_name,
       c.image AS service_image,
       p.first_name AS partner_first_name,
       p.last_name AS partner_last_name,
       p.email AS partner_email,
       p.phone AS partner_phone
     FROM quotes q
     LEFT JOIN services s ON s.id = q.service_id
     LEFT JOIN categories c ON c.id = s.category_id
     LEFT JOIN users p ON p.id = q.partner_id
     WHERE q.customer_id = ?
     ORDER BY q.created_at DESC`,
            [customerId]
        );
        return rows.map(formatQuote);
    },

    async markViewed(id) {
        await pool.query(
            "UPDATE quotes SET viewing_status = true WHERE id = ?", [id]
        );
        return this.findById(id);
    },

    async updateStatus(id, status) {
        await pool.query(
            "UPDATE quotes SET status = ? WHERE id = ?", [status, id]
        );
        return this.findById(id);
    },

    async deleteById(id) {
        const [result] = await pool.query(
            "DELETE FROM quotes WHERE id = ?", [id]
        );
        return result.affectedRows > 0;
    },
};

// ── Format flat SQL row into nested shape ──
const formatQuote = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  requirement: row.requirement,
  viewing_status: row.viewing_status,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,

  service: {
    id: row.service_id,
    title: row.service_title,        // ✅ ADDED
    category_name: row.category_name,
    image: row.service_image,
  },

  customer: row.customer_id ? {
    id: row.customer_id,
    first_name: row.customer_first_name,
    last_name: row.customer_last_name,
    email: row.customer_email,
    phone: row.customer_phone,
  } : null,

  partner: row.partner_id ? {
    id: row.partner_id,
    first_name: row.partner_first_name,
    last_name: row.partner_last_name,
    email: row.partner_email,
    phone: row.partner_phone,
  } : null,
});