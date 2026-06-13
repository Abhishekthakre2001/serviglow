import pool from "../../../config/db.js";

export const getSubscriptionsData = async (status) => {
  let query = `
    SELECT
      id,
      user_id,
      username,
      name,
      email,
      plan_key,
      price,
      paypal_subscription_id,
      subscription,
      status,
      start_date,
      end_date,
      cancel_date,
      refund_status,
      refund_date,
      refund_amount,
      paypal_refund_id,
      created_at,
      updated_at
    FROM subscriptions
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY id DESC`;

  const [rows] = await pool.query(query, params);

  return rows;
};