import pool from "../../../config/db.js";

export const PartnerRevenueModel = {

    async getTotalRevenue(partnerId) {
        const [rows] = await pool.query(
            `SELECT COALESCE(SUM(service_charges), 0) AS totalRevenue
       FROM partner_revenue WHERE partner_id = ?`,
            [partnerId]
        );
        return rows[0]?.totalRevenue || 0;
    },

    async countByPartner(partnerId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) AS total FROM partner_revenue WHERE partner_id = ?",
            [partnerId]
        );
        return rows[0]?.total || 0;
    },

    async getPaginated(partnerId, skip, limit) {
        const [rows] = await pool.query(
            `SELECT 
          pr.*,
          u.first_name, u.last_name, u.email AS customer_email, u.phone AS customer_phone,
          u.addr_line1, u.addr_line2, u.addr_city, u.addr_state, u.addr_zip,
          b.status AS booking_status
       FROM partner_revenue pr
       LEFT JOIN users u ON u.id = pr.customer_id
       LEFT JOIN bookings b ON b.id = pr.booking_id
       WHERE pr.partner_id = ?
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
            [partnerId, limit, skip]
        );
        return rows;
    },
};