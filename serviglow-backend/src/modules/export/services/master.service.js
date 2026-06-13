import pool from "../../../config/db.js";

export const getMasterData = async (type) => {
  if (type === "category") {
    const [rows] = await pool.query(
      `SELECT
        id,
        category_name,
        image,
        status,
        created_at
      FROM categories
      WHERE status = 1
      ORDER BY created_at DESC`
    );

    return rows;
  }

  if (type === "sub-category") {
    const [rows] = await pool.query(`
      SELECT
        sc.id,
        sc.sub_category_name,
        sc.image
        c.category_name,
        sc.status,
        sc.created_at
      FROM sub_categories sc
      LEFT JOIN categories c
        ON c.id = sc.category_id
      WHERE sc.status = 1
      ORDER BY sc.created_at DESC
    `);

    return rows;
  }

  throw new Error("Invalid export type");
};