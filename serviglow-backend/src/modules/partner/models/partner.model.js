import pool from "../../../config/db.js";

export const PartnerModel = {

    // ── Find partner profile by userId ──
    async findByUserId(userId) {
        const [rows] = await pool.query(
            `SELECT pp.*, 
        u.first_name, u.last_name, u.email, u.phone, u.role,
        c.category_name, sc.sub_category_name
       FROM partner_profiles pp
       JOIN users u ON u.id = pp.user_id
       LEFT JOIN categories c ON c.id = pp.category_id
       LEFT JOIN sub_categories sc ON sc.id = pp.sub_category_id
       WHERE pp.user_id = ? LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    },

    // ── Find partner profile by profile id ──
    async findById(id) {
        const [rows] = await pool.query(
            "SELECT * FROM partner_profiles WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    // ── Create partner profile ──
    async create({ userId, businessName, categoryId, subCategoryId, yearsOfExperience,
        serviceAreas, logo, businessLicense, certificate, insurance, about }) {
        const [result] = await pool.query(
            `INSERT INTO partner_profiles
        (user_id, business_name, category_id, sub_category_id, years_of_experience,
         service_areas, logo, doc_business_license, doc_certificate, doc_insurance,
         about, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                userId, businessName, categoryId, subCategoryId, yearsOfExperience,
                JSON.stringify(serviceAreas), logo || null,
                businessLicense || null, certificate || null, insurance || null, about || null
            ]
        );
        return result.insertId;
    },

    // ── Update partner profile ──
    async update(userId, fields) {
        const allowed = [
            "business_name", "category_id", "sub_category_id", "years_of_experience",
            "service_areas", "about", "is_available", "is_active",
            "doc_business_license", "doc_certificate", "doc_insurance", "logo"
        ];
        const setClauses = [];
        const values = [];

        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key) && val !== undefined) {
                setClauses.push(`${key} = ?`);
                values.push(key === "service_areas" ? JSON.stringify(val) : val);
            }
        }
        if (!setClauses.length) return;

        values.push(userId);
        await pool.query(
            `UPDATE partner_profiles SET ${setClauses.join(", ")} WHERE user_id = ?`,
            values
        );
    },

    // ── Toggle isAvailable ──
    async toggleAvailability(userId) {
        await pool.query(
            `UPDATE partner_profiles SET is_available = NOT is_available WHERE user_id = ?`,
            [userId]
        );
        const [rows] = await pool.query(
            "SELECT is_available FROM partner_profiles WHERE user_id = ?",
            [userId]
        );
        return rows[0]?.is_available;
    },

    // ── Toggle isActive by profile id (admin) ──
    async toggleActive(id, isActive) {
        await pool.query(
            "UPDATE partner_profiles SET is_active = ? WHERE id = ?",
            [isActive, id]
        );
    },
};