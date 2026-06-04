import pool from "../../../config/db.js";

export const ReviewModel = {

  async create({ customerId, partnerId, serviceId, bookingId, rating, comment }) {
    const [result] = await pool.query(
      `INSERT INTO reviews
        (customer_id, partner_id, service_id, booking_id, rating, comment, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, false)`,
      [customerId, partnerId, serviceId, bookingId || null, rating, comment || null]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email, cu.phone AS customer_phone,
         p.first_name  AS partner_first,  p.last_name  AS partner_last,
         p.email       AS partner_email,
         s.title AS service_title, s.price AS service_price,
         s.slug  AS service_slug,  s.about_service,
         b.booking_date, b.booking_time, b.status AS booking_status
       FROM reviews r
       LEFT JOIN users cu    ON cu.id = r.customer_id
       LEFT JOIN users p     ON p.id  = r.partner_id
       LEFT JOIN services s  ON s.id  = r.service_id
       LEFT JOIN bookings b  ON b.id  = r.booking_id
       WHERE r.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ? formatReview(rows[0]) : null;
  },

  async findByService(serviceId) {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email
       FROM reviews r
       LEFT JOIN users cu ON cu.id = r.customer_id
       WHERE r.service_id = ? AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [serviceId]
    );
    return rows.map(formatReview);
  },

  async findByBooking(bookingId) {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email
       FROM reviews r
       LEFT JOIN users cu ON cu.id = r.customer_id
       WHERE r.booking_id = ? LIMIT 1`,
      [bookingId]
    );
    return rows[0] ? formatReview(rows[0]) : null;
  },

  async findAllApproved() {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email,
         s.title AS service_title, s.slug AS service_slug
       FROM reviews r
       LEFT JOIN users cu   ON cu.id = r.customer_id
       LEFT JOIN services s ON s.id  = r.service_id
       WHERE r.is_approved = true
       ORDER BY r.created_at DESC`
    );
    return rows.map(formatReview);
  },

  async findAllAdmin({ limit, skip }) {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email,
         p.first_name AS partner_first, p.last_name AS partner_last,
         s.title AS service_title, s.slug AS service_slug
       FROM reviews r
       LEFT JOIN users cu   ON cu.id = r.customer_id
       LEFT JOIN users p    ON p.id  = r.partner_id
       LEFT JOIN services s ON s.id  = r.service_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, skip]
    );
    return rows.map(formatReview);
  },

  async countAll() {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM reviews");
    return rows[0]?.total || 0;
  },

  async findByPartner({ partnerId, limit, skip }) {
    const [rows] = await pool.query(
      `SELECT r.*,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email, cu.phone AS customer_phone,
         p.first_name AS partner_first, p.last_name AS partner_last,
         s.title AS service_title, s.slug AS service_slug,
         b.booking_date, b.booking_time, b.status AS booking_status
       FROM reviews r
       LEFT JOIN users cu   ON cu.id = r.customer_id
       LEFT JOIN users p    ON p.id  = r.partner_id
       LEFT JOIN services s ON s.id  = r.service_id
       LEFT JOIN bookings b ON b.id  = r.booking_id
       WHERE r.partner_id = ? AND r.is_approved = true
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [partnerId, limit, skip]
    );
    return rows.map(formatReview);
  },

  async countByPartner(partnerId) {
    console.log("in model partner",partnerId)
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM reviews WHERE partner_id = ? AND is_approved = true",
      [partnerId]
    );
    return rows[0]?.total || 0;
  },

  async update(id, { rating, comment }) {
    const setClauses = [];
    const values     = [];

    if (rating  !== undefined) { setClauses.push("rating = ?");  values.push(rating);  }
    if (comment !== undefined) { setClauses.push("comment = ?"); values.push(comment); }

    if (!setClauses.length) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE reviews SET ${setClauses.join(", ")} WHERE id = ?`, values
    );
    return this.findById(id);
  },

  async toggleApproval(id) {
    await pool.query(
      "UPDATE reviews SET is_approved = NOT is_approved WHERE id = ?", [id]
    );
    return this.findById(id);
  },

  async deleteById(id) {
    const [result] = await pool.query(
      "DELETE FROM reviews WHERE id = ?", [id]
    );
    return result.affectedRows > 0;
  },

  // ── Recalculate avg rating + total reviews for a service ──
  async recalcServiceRating(serviceId) {
    const [rows] = await pool.query(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS totalReviews
       FROM reviews WHERE service_id = ? AND is_approved = true`,
      [serviceId]
    );
    const { avgRating, totalReviews } = rows[0];
    await pool.query(
      "UPDATE services SET avg_rating = ?, total_reviews = ? WHERE id = ?",
      [avgRating || 0, totalReviews || 0, serviceId]
    );
  },
};

// ── Format flat SQL row into nested shape ──
const formatReview = (row) => ({
  id:          row.id,
  rating:      row.rating,
  comment:     row.comment,
  is_approved: row.is_approved,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
  customer: row.customer_id ? {
    id:         row.customer_id,
    first_name: row.customer_first,
    last_name:  row.customer_last,
    email:      row.customer_email,
    phone:      row.customer_phone,
  } : null,
  partner: row.partner_id ? {
    id:         row.partner_id,
    first_name: row.partner_first,
    last_name:  row.partner_last,
    email:      row.partner_email,
  } : null,
  service: row.service_id ? {
    id:            row.service_id,
    title:         row.service_title,
    slug:          row.service_slug,
    about_service: row.about_service,
    price:         row.service_price,
  } : null,
  booking: row.booking_id ? {
    id:           row.booking_id,
    booking_date: row.booking_date,
    booking_time: row.booking_time,
    status:       row.booking_status,
  } : null,
});