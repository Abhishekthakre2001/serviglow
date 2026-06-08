import pool from "../../../config/db.js";

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
      "SELECT id, first_name, last_name, email, phone, role, addr_line1, addr_line2, addr_city, addr_state, addr_zip, partner_status, created_at FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  async create({ firstName, lastName, email, password, phone, address, role }) {
    const [result] = await pool.query(
      `INSERT INTO users
        (first_name, last_name, email, password, phone, role,
         addr_line1, addr_line2, addr_city, addr_state, addr_zip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName, lastName, email, password, phone, role || "customer",
        address?.line1 || null,
        address?.line2 || null,
        address?.city || null,
        address?.state || null,
        address?.zip || null,
      ]
    );
    return result.insertId;
  },

  async clearRefreshToken(id) {
    await pool.query(
      "UPDATE users SET refresh_token = NULL WHERE id = ?",
      [id]
    );
  },

  async countByRole(role) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = ?",
      [role]
    );
    return rows[0]?.total || 0;
  },

  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role,
              addr_line1, addr_line2, addr_city, addr_state, addr_zip,
              partner_status, created_at
       FROM users ORDER BY id DESC`
    );
    return rows;
  },

  async findByRole({ role, limit, skip }) {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone, role,
              addr_line1, addr_line2, addr_city, addr_state, addr_zip,
              partner_status, created_at
       FROM users WHERE role = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [role, limit, skip]
    );
    return rows;
  },

  async update(id, fields) {
    const allowed = [
      "first_name", "last_name", "email", "phone",
      "addr_line1", "addr_line2", "addr_city", "addr_state", "addr_zip"
    ];
    const setClauses = [];
    const values = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key) && val !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (!setClauses.length) return;

    values.push(id);
    await pool.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
  },

  async emailExistsExcept(email, excludeId) {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
      [email, excludeId]
    );
    return rows.length > 0;
  },

  // ══════════════════════════════════════════════
  // FIND BOOKINGS BY CUSTOMER ID
  // ══════════════════════════════════════════════
  async findByCustomerId({
    customerId,
    limit,
    skip,
  }) {

    const [rows] = await pool.query(
      `
    SELECT

      b.id,
      b.booking_date,
      b.booking_time,
      b.status,
      b.city,
      b.address,
      b.notes,
      b.created_at,

      -- SERVICE DETAILS
      s.id AS service_id,
      s.title AS service_title,
      s.subtitle AS service_subtitle,
      s.price,
      s.estimated_time,
      s.images,

      -- CATEGORY
      c.id AS category_id,
      c.category_name,

      -- SUB CATEGORY
      sc.id AS sub_category_id,
      sc.sub_category_name,

      -- PARTNER DETAILS
      u.id AS partner_id,
      CONCAT(u.first_name, ' ', u.last_name) AS partner_name,
      u.email AS partner_email,
      u.phone AS partner_phone

    FROM bookings b

    -- SERVICES
    LEFT JOIN services s
      ON b.service_id = s.id

    -- CATEGORY
    LEFT JOIN categories c
      ON s.category_id = c.id

    -- SUB CATEGORY
    LEFT JOIN sub_categories sc
      ON s.sub_category_id = sc.id

    -- PARTNER
    LEFT JOIN users u
      ON b.partner_id = u.id

    WHERE b.customer_id = ?

    ORDER BY b.id DESC

    LIMIT ? OFFSET ?
    `,
      [customerId, limit, skip]
    );

    return rows;
  },


  // ══════════════════════════════════════════════
  // COUNT CUSTOMER BOOKINGS
  // ══════════════════════════════════════════════
  async countByCustomer(customerId) {

    // console.log("customer_id",customerId)

    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE customer_id = ?
      `,
      [customerId]
    );

    return rows[0].total;
  },

  // ══════════════════════════════════════════════
  // UPDATE CUSTOMER STATUS
  // ══════════════════════════════════════════════
  async updateStatus(id, status) {

    await pool.query(
      `UPDATE users
     SET status = ?
     WHERE id = ?`,
      [status, id]
    );
  },

  // ══════════════════════════════════════════════
  // DELETE CUSTOMER
  // ══════════════════════════════════════════════
  async delete(customerId, conn) {
    await conn.query(
      `DELETE FROM users WHERE id = ?`,
      [customerId]
    );
  },

  // ══════════════════════════════════════════════
  // DELETE CUSTOMER BOOKINGS
  // ══════════════════════════════════════════════
  async deleteCustomerBookings(customerId, conn) {
    // Delete revenue records linked to customer's bookings
    await conn.query(
      `DELETE FROM partner_revenue
     WHERE booking_id IN (
       SELECT id
       FROM bookings
       WHERE customer_id = ?
     )`,
      [customerId]
    );

    // Delete bookings
    await conn.query(
      `DELETE FROM bookings
     WHERE customer_id = ?`,
      [customerId]
    );
  },
  async deleteById(customerId, conn) {
    await conn.query(
      `DELETE FROM reviews WHERE customer_id = ?`,
      [customerId]
    );
  },

  async revenuedeleteById(customerId) {

    await pool.query(
      `DELETE FROM partner_revenue
     WHERE service_id  = ?`,
      [customerId]
    );
  },

  async deleteCustomerQuotes(customerId, conn) {
  await conn.query(
    `DELETE FROM quotes
     WHERE customer_id = ?`,
    [customerId]
  );
},



  async findByRole({ role, limit, skip }) {
    const [rows] = await pool.query(
      `SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        status,
        addr_line1,
        addr_line2,
        addr_city,
        addr_state,
        addr_zip,
        partner_status,
        created_at
     FROM users
     WHERE role = ?
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
      [role, limit, skip]
    );

    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      status,
      addr_line1,
      addr_line2,
      addr_city,
      addr_state,
      addr_zip,
      partner_status,
      created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  },
};