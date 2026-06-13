import pool from "../../../config/db.js";

export const getPartnerQuotesData = async (partnerId) => {
  const [rows] = await pool.query(
    `SELECT
        q.*,
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
      ORDER BY q.viewing_status ASC, q.created_at DESC`,
    [partnerId]
  );

  return rows;
};