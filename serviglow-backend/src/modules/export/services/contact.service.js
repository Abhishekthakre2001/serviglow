import pool from "../../../config/db.js";

export const getContactsData = async () => {
  const [rows] = await pool.query(`
    SELECT
      c.*
    FROM contacts c
    ORDER BY c.viewing_status ASC, c.created_at DESC
  `);

  return rows;
};