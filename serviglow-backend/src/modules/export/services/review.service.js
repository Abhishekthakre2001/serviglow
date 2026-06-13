import pool from "../../../config/db.js";

export const getReviewsData = async () => {
  const [rows] = await pool.query(`
    SELECT
      r.*,
      cu.first_name AS customer_first,
      cu.last_name AS customer_last,
      cu.email AS customer_email,

      p.first_name AS partner_first,
      p.last_name AS partner_last,
      p.email AS partner_email,

      s.title AS service_title,
      s.slug AS service_slug

    FROM reviews r

    LEFT JOIN users cu
      ON cu.id = r.customer_id

    LEFT JOIN users p
      ON p.id = r.partner_id

    LEFT JOIN services s
      ON s.id = r.service_id

    ORDER BY r.created_at DESC
  `);

  return rows;
};

export const getPartnerReviewsData = async (partnerId) => {
  const [rows] = await pool.query(
    `SELECT
      r.*,
      cu.first_name AS customer_first,
      cu.last_name AS customer_last,
      cu.email AS customer_email,
      cu.phone AS customer_phone,

      p.first_name AS partner_first,
      p.last_name AS partner_last,

      s.title AS service_title,
      s.slug AS service_slug,

      b.booking_date,
      b.booking_time,
      b.status AS booking_status

    FROM reviews r
    LEFT JOIN users cu ON cu.id = r.customer_id
    LEFT JOIN users p ON p.id = r.partner_id
    LEFT JOIN services s ON s.id = r.service_id
    LEFT JOIN bookings b ON b.id = r.booking_id

    WHERE r.partner_id = ?
      AND r.is_approved = 1

    ORDER BY r.created_at DESC`,
    [partnerId]
  );

  return rows;
};