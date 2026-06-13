import pool from "../../../config/db.js";

export const getPartnersData = async (status) => {
  let query = `
    SELECT
      pp.*,

      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.role,
      u.partner_status,
      u.addr_line1,
      u.addr_line2,
      u.addr_city,
      u.addr_state,
      u.addr_zip,
      u.designation,
      u.status AS user_status,
      u.created_at AS user_created_at,

      c.category_name,
      sc.sub_category_name

    FROM partner_profiles pp

    JOIN users u
      ON u.id = pp.user_id

    LEFT JOIN categories c
      ON c.id = pp.category_id

    LEFT JOIN sub_categories sc
      ON sc.id = pp.sub_category_id
  `;

  const params = [];

  if (status) {
    query += ` WHERE pp.approval_status = ?`;
    params.push(status.toLowerCase());
  }

  query += ` ORDER BY pp.created_at DESC`;

  const [partners] = await pool.query(query, params);

  return partners;
};