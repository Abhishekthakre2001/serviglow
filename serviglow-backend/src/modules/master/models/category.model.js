import pool from "../../../config/db.js";

export const CategoryModel = {

  async findByName(categoryName) {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE category_name = ? LIMIT 1",
      [categoryName]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  async create({ categoryName, subTitle, image }) {
    const [result] = await pool.query(
      `INSERT INTO categories (category_name, sub_title, image, status)
       VALUES (?, ?, ?, 1)`,
      [categoryName, subTitle, image]
    );
    return this.findById(result.insertId);
  },

  async countActive() {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM categories WHERE status = 1"
    );
    return rows[0]?.total || 0;
  },

  async findAllActive({ limit, skip }) {
    const [rows] = await pool.query(
      `SELECT * FROM categories WHERE status = 1
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, skip]
    );
    return rows;
  },

  async update(id, fields) {
    const allowed = ["category_name", "sub_title", "image", "status"];
    const setClauses = [];
    const values     = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key) && val !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (!setClauses.length) return;

    values.push(id);
    await pool.query(
      `UPDATE categories SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
    return this.findById(id);
  },
};