import pool from "../../../config/db.js";

export const BookingModel = {

  async create({
    serviceId, serviceCategory, serviceType, customerId, partnerId,
    date, time, name, phone, email, address, city, zip, notes
  }) {
    const [result] = await pool.query(
      `INSERT INTO bookings
        (service_id, service_category, service_type, customer_id, partner_id,
         booking_date, booking_time, name, phone, email, address, city, zip,
         notes, status, is_verified, cancel_by_user)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', false, false)`,
      [serviceId, serviceCategory, serviceType, customerId, partnerId,
       date, time, name, phone, email, address, city, zip, notes || null]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT b.*,
         s.title AS service_title, s.price AS service_price,
         c.category_name, sc.sub_category_name,
         cu.first_name AS customer_first, cu.last_name AS customer_last,
         cu.email AS customer_email, cu.phone AS customer_phone,
         p.first_name AS partner_first, p.last_name AS partner_last,
         p.email AS partner_email, p.phone AS partner_phone
       FROM bookings b
       LEFT JOIN services s       ON s.id  = b.service_id
       LEFT JOIN categories c     ON c.id  = b.service_category
       LEFT JOIN sub_categories sc ON sc.id = b.service_type
       LEFT JOIN users cu          ON cu.id = b.customer_id
       LEFT JOIN users p           ON p.id  = b.partner_id
       WHERE b.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ? formatBooking(rows[0]) : null;
  },

  async findAll({ limit, skip }) {
    const [rows] = await pool.query(
      `SELECT b.*,
         s.title AS service_title, s.price AS service_price,
         c.category_name, sc.sub_category_name
       FROM bookings b
       LEFT JOIN services s        ON s.id  = b.service_id
       LEFT JOIN categories c      ON c.id  = b.service_category
       LEFT JOIN sub_categories sc ON sc.id = b.service_type
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, skip]
    );
    return rows.map(formatBooking);
  },

  async countAll() {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM bookings");
    return rows[0]?.total || 0;
  },

  async findByUser({ userId, role, status, limit, skip }) {
    const col = role === "customer" ? "customer_id" : "partner_id";

    let query = `
      SELECT b.*,
        s.title AS service_title, s.price AS service_price,
        s.images AS service_images,
        c.category_name, sc.sub_category_name,
        cu.first_name AS customer_first, cu.last_name AS customer_last,
        cu.email AS customer_email, cu.phone AS customer_phone,
        p.first_name AS partner_first, p.last_name AS partner_last,
        p.email AS partner_email, p.phone AS partner_phone
      FROM bookings b
      LEFT JOIN services s        ON s.id  = b.service_id
      LEFT JOIN categories c      ON c.id  = b.service_category
      LEFT JOIN sub_categories sc ON sc.id = b.service_type
      LEFT JOIN users cu           ON cu.id = b.customer_id
      LEFT JOIN users p            ON p.id  = b.partner_id
      WHERE b.${col} = ?`;

    const values = [userId];

    if (status) {
      query += " AND b.status = ?";
      values.push(status);
    }

    query += " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
    values.push(limit, skip);

    const [rows] = await pool.query(query, values);
    return rows.map(formatBooking);
  },

  async countByUser({ userId, role, status }) {
    const col = role === "customer" ? "customer_id" : "partner_id";
    let query = `SELECT COUNT(*) AS total FROM bookings WHERE ${col} = ?`;
    const values = [userId];

    if (status) {
      query += " AND status = ?";
      values.push(status);
    }

    const [rows] = await pool.query(query, values);
    return rows[0]?.total || 0;
  },

  async updateStatus(id, status) {
    await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
    return this.findById(id);
  },

  async updateFields(id, fields) {
    const allowed = [
      "status", "is_verified", "cancel_by_user", "booking_date", "booking_time"
    ];
    const setClauses = [];
    const values     = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key) && val !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (!setClauses.length) return null;

    values.push(id);
    await pool.query(
      `UPDATE bookings SET ${setClauses.join(", ")} WHERE id = ?`, values
    );
    return this.findById(id);
  },
};

// ── Format flat SQL row into nested shape ──
const formatBooking = (row) => ({
  id:             row.id,
  name:           row.name,
  phone:          row.phone,
  email:          row.email,
  address:        row.address,
  city:           row.city,
  zip:            row.zip,
  notes:          row.notes,
  status:         row.status,
  booking_date:   row.booking_date,
  booking_time:   row.booking_time,
  is_verified:    row.is_verified,
  cancel_by_user: row.cancel_by_user,
  created_at:     row.created_at,
  updated_at:     row.updated_at,
  serviceId: {
    id:    row.service_id,
    title: row.service_title,
    price: row.service_price,
  },
  serviceCategory: {
    id:            row.service_category,
    category_name: row.category_name,
  },
  serviceType: {
    id:                row.service_type,
    sub_category_name: row.sub_category_name,
  },
  customerId: row.customer_id ? {
    id:         row.customer_id,
    first_name: row.customer_first,
    last_name:  row.customer_last,
    email:      row.customer_email,
    phone:      row.customer_phone,
  } : null,
  partnerId: row.partner_id ? {
    id:         row.partner_id,
    first_name: row.partner_first,
    last_name:  row.partner_last,
    email:      row.partner_email,
    phone:      row.partner_phone,
  } : null,
});