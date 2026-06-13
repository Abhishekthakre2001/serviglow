import pool from "../../../config/db.js";

export const getCustomersData = async () => {
  const [customers] = await pool.query(`
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      addr_line1,
      addr_line2,
      addr_city,
      addr_state,
      addr_zip,
      status,
      created_at
    FROM users
    WHERE role = 'customer'
      AND status != 'softdeleted'
    ORDER BY id DESC
  `);

  return customers;
};