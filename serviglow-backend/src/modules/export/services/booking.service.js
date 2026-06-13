import pool from "../../../config/db.js";

export const getPartnerBookingsData = async (
  partnerId,
  status
) => {
  let query = `
    SELECT
      b.*,
      s.title AS service_title,
      c.category_name,
      sc.sub_category_name
    FROM bookings b
    LEFT JOIN services s
      ON s.id = b.service_id
    LEFT JOIN categories c
      ON c.id = b.service_category
    LEFT JOIN sub_categories sc
      ON sc.id = b.service_type
    WHERE b.partner_id = ?
  `;

  const params = [partnerId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  query += `
    ORDER BY b.created_at DESC
  `;

  const [rows] = await pool.query(
    query,
    params
  );

  return rows;
};