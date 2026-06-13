import pool from "../../../config/db.js";

export const getPartnerServicesData = async (partnerId) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.*,
      c.category_name,
      sc.sub_category_name,
      u.first_name,
      u.last_name,
      u.email AS creator_email
    FROM services s
    LEFT JOIN categories c
      ON c.id = s.category_id
    LEFT JOIN sub_categories sc
      ON sc.id = s.sub_category_id
    LEFT JOIN users u
      ON u.id = s.created_by
    WHERE s.created_by = ?
    ORDER BY s.created_at DESC
    `,
    [partnerId]
  );

  return rows;
};