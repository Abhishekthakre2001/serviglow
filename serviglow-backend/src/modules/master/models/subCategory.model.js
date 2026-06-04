import pool from "../../../config/db.js";

export const SubCategoryModel = {

  async findByNameAndCategory(subCategoryName, categoryId) {
    const [rows] = await pool.query(
      `SELECT * FROM sub_categories
       WHERE sub_category_name = ? AND category_id = ? LIMIT 1`,
      [subCategoryName, categoryId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT sc.*, c.category_name
       FROM sub_categories sc
       LEFT JOIN categories c ON c.id = sc.category_id
       WHERE sc.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ subCategoryName, subTitle, categoryId, image }) {
    const [result] = await pool.query(
      `INSERT INTO sub_categories (sub_category_name, sub_title, category_id, image, status)
       VALUES (?, ?, ?, ?, 1)`,
      [subCategoryName, subTitle, categoryId, image]
    );
    return this.findById(result.insertId);
  },

  async countActive(categoryId) {
    let query  = "SELECT COUNT(*) AS total FROM sub_categories WHERE status = 1";
    const vals = [];

    if (categoryId) {
      query += " AND category_id = ?";
      vals.push(categoryId);
    }

    const [rows] = await pool.query(query, vals);
    return rows[0]?.total || 0;
  },

  async findAllActive({ categoryId, limit, skip }) {
    let query = `
      SELECT sc.*, c.category_name
      FROM sub_categories sc
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE sc.status = 1`;
    const vals = [];

    if (categoryId) {
      query += " AND sc.category_id = ?";
      vals.push(categoryId);
    }

    query += " ORDER BY sc.created_at DESC LIMIT ? OFFSET ?";
    vals.push(limit, skip);

    const [rows] = await pool.query(query, vals);
    return rows;
  },

  async findDuplicate({ subCategoryName, categoryId, excludeId }) {
    const [rows] = await pool.query(
      `SELECT id FROM sub_categories
       WHERE sub_category_name = ? AND category_id = ? AND id != ?
       LIMIT 1`,
      [subCategoryName, categoryId, excludeId]
    );
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ["sub_category_name", "sub_title", "category_id", "image", "status"];
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
      `UPDATE sub_categories SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );
    return this.findById(id);
  },
};