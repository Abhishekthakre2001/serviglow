import pool from "../../../config/db.js";

export const ServiceModel = {

  async findBySlug(slug) {
    const [rows] = await pool.query(
      "SELECT * FROM services WHERE slug = ? LIMIT 1", [slug]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT s.*,
         c.category_name, c.sub_title AS category_sub_title, c.image AS category_image,
         sc.sub_category_name, sc.sub_title AS sub_category_sub_title, sc.image AS sub_category_image,
         u.first_name, u.last_name, u.email AS creator_email, u.phone AS creator_phone, u.role AS creator_role
       FROM services s
       LEFT JOIN categories c   ON c.id  = s.category_id
       LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
       LEFT JOIN users u         ON u.id  = s.created_by
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findBySlugActive(slug) {
    const [rows] = await pool.query(
      `SELECT s.*,
         c.category_name, sc.sub_category_name
       FROM services s
       LEFT JOIN categories c   ON c.id  = s.category_id
       LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
       WHERE s.slug = ? AND s.is_active = true LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  },

  async create({ title, subtitle, slug, aboutService, price, estimatedTime,
    keyFeatures, images, categoryId, subCategoryId, createdBy }) {
    const [result] = await pool.query(
      `INSERT INTO services
        (title, subtitle, slug, about_service, price, estimated_time,
         key_features, images, category_id, sub_category_id, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        title, subtitle || null, slug, aboutService, price, estimatedTime,
        JSON.stringify(keyFeatures || []),
        JSON.stringify(images || []),
        categoryId, subCategoryId, createdBy,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, fields) {
    const allowed = [
      "title", "subtitle", "slug", "about_service", "price",
      "estimated_time", "key_features", "images",
      "category_id", "sub_category_id", "is_active",
      "avg_rating", "total_reviews",
    ];
    const setClauses = [];
    const values = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key) && val !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(
          (key === "key_features" || key === "images") ? JSON.stringify(val) : val
        );
      }
    }
    if (!setClauses.length) return null;

    values.push(id);
    await pool.query(
      `UPDATE services SET ${setClauses.join(", ")} WHERE id = ?`, values
    );
    return this.findById(id);
  },

  async deleteById(id) {
    const [result] = await pool.query(
      "DELETE FROM services WHERE id = ?", [id]
    );
    return result.affectedRows > 0;
  },

  async findAllActive() {
    const [rows] = await pool.query(
      `SELECT s.*,
         c.category_name, sc.sub_category_name,
         u.first_name, u.last_name, u.email AS creator_email
       FROM services s
       LEFT JOIN categories c      ON c.id  = s.category_id
       LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
       LEFT JOIN users u            ON u.id  = s.created_by
       WHERE s.is_active = true
       ORDER BY s.created_at DESC`
    );
    return rows;
  },

  async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT s.*,
         c.category_name, sc.sub_category_name,
         u.first_name, u.last_name, u.email AS creator_email
       FROM services s
       LEFT JOIN categories c      ON c.id  = s.category_id
       LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
       LEFT JOIN users u            ON u.id  = s.created_by
       WHERE s.is_active = true AND s.created_by = ?
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findMyServicesPaginated({ userId, limit, skip }) {

    console.log("userid", userId)

    const [rows] = await pool.query(
      `SELECT s.*,
     c.category_name, sc.sub_category_name,
     u.first_name, u.last_name, u.email AS creator_email
   FROM services s
   LEFT JOIN categories c      ON c.id  = s.category_id
   LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
   LEFT JOIN users u           ON u.id  = s.created_by
   WHERE s.created_by = ?
   ORDER BY s.created_at DESC
   LIMIT ? OFFSET ?`,
      [userId, limit, skip]
    );
    return rows;
  },

  async countMyServices(userId) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM services WHERE is_active = true AND created_by = ?",
      [userId]
    );
    return rows[0]?.total || 0;
  },

  async findBySubCategory(subCategoryId) {
    const [rows] = await pool.query(
      `SELECT s.*,
         c.category_name, sc.sub_category_name,
         u.first_name, u.last_name, u.email AS creator_email, u.phone AS creator_phone
       FROM services s
       LEFT JOIN categories c      ON c.id  = s.category_id
       LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
       LEFT JOIN users u            ON u.id  = s.created_by
       WHERE s.is_active = true AND s.sub_category_id = ?
       ORDER BY s.created_at DESC`,
      [subCategoryId]
    );
    return rows;
  },

  async toggleStatus(id) {
    await pool.query(
      "UPDATE services SET is_active = NOT is_active WHERE id = ?", [id]
    );
    return this.findById(id);
  },
};