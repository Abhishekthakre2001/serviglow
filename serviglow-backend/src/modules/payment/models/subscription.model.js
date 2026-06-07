import pool from "../../../config/db.js";

class Subscription {
  static async create(data) {
    const {
      userId,
      username,
      name,
      email,
      planKey,
      price,
      paypalSubscriptionId,
      status,
      subscription
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO subscriptions 
      (user_id, username, name, email, plan_key, price, paypal_subscription_id, status, subscription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        name,
        email,
        planKey,
        price,
        paypalSubscriptionId,
        status,
        subscription
      ]
    );

    return result;
  }


  // static async getAll(query) {
  //   const {
  //     page = 1,
  //     limit = 20,
  //     search = "",
  //     status,
  //     planKey,
  //     subscription,
  //   } = query;

  //   const pageNum = parseInt(page) || 1;
  //   const limitNum = parseInt(limit) || 20;
  //   const offset = (pageNum - 1) * limitNum;

  //   let where = "WHERE 1=1";
  //   let params = [];

  //   // 🔍 Search
  //   if (search) {
  //     where += ` AND (email LIKE ? OR username LIKE ? OR name LIKE ?)`;
  //     params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  //   }

  //   // 🎯 Filters
  //   if (status) {
  //     where += ` AND status = ?`;
  //     params.push(status);
  //   }

  //   if (planKey) {
  //     where += ` AND plan_key = ?`;
  //     params.push(planKey);
  //   }

  //   if (subscription !== undefined) {
  //     where += ` AND subscription = ?`;
  //     params.push(subscription === "true" ? 1 : 0);
  //   }

  //   // 📊 Total count
  //   const [countRows] = await pool.execute(
  //     `SELECT COUNT(*) as total FROM subscriptions ${where}`,
  //     params
  //   );

  //   const total = countRows[0].total;

  //   // 📦 Data query
  //   const [rows] = await pool.execute(
  //     `SELECT * FROM subscriptions
  //    ${where}
  //    ORDER BY id DESC
  //    LIMIT ? OFFSET ?`,
  //     [...params, limitNum, offset]
  //   );

  //   return {
  //     data: rows,
  //     page: pageNum,
  //     limit: limitNum,
  //     total,
  //     totalPages: Math.ceil(total / limitNum),
  //   };
  // }
  static async getAll(query) {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
    } = query;

    console.log("query", query);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    let where = "WHERE 1=1";
    const params = [];

    // ✅ STATUS FILTER
    if (status) {
      where += " AND status = ?";
      params.push(status);
    }

    // Date range filter
    if (startDate) {
      where += " AND DATE(created_at) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      where += " AND DATE(created_at) <= ?";
      params.push(endDate);
    }

    // 📊 COUNT QUERY
    const countQuery = `
    SELECT COUNT(*) AS total
    FROM subscriptions
    ${where}
  `;

    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows?.[0]?.total || 0;

    // 🚨 IMPORTANT FIX HERE (NO ? FOR LIMIT/OFFSET)
    const dataQuery = `
    SELECT *
    FROM subscriptions
    ${where}
    ORDER BY id DESC
    LIMIT ${limitNum} OFFSET ${offset}
  `;

    const [rows] = await pool.execute(dataQuery, params);

    return {
      data: rows,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }


  static async getMySubscription(userId) {
    const sql = `
    SELECT *
    FROM subscriptions
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;

    const [rows] = await pool.execute(sql, [userId]);

    return rows[0] || null;
  }

  static async updateByPaypalId(subscriptionId, data) {
    const { status, subscription, startDate, endDate } = data;

    const [result] = await pool.execute(
      `UPDATE subscriptions 
     SET status = ?, subscription = ?, start_date = ?, end_date = ?
     WHERE paypal_subscription_id = ?`,
      [status, subscription ? 1 : 0, startDate, endDate, subscriptionId]
    );

    return result;
  }

  // ✅ ADD THIS INSIDE CLASS
  static async updateStatusByPaypalId(paypalSubscriptionId, status) {
    const sql = `
      UPDATE subscriptions
      SET 
        status = ?,
        subscription = 0,
        end_date = NOW()
      WHERE paypal_subscription_id = ?
    `;

    const [result] = await pool.query(sql, [
      status,
      paypalSubscriptionId,
    ]);

    return result;
  }


  // UPSERT
  static async upsert(data, connection) {

    const {
      planId,
      planKey,
      planName,
      features,
    } = data;

    const executor = connection || pool;

    const [result] = await executor.execute(
      `
    INSERT INTO subscription_plan_details
    (
      plan_id,
      plan_key,
      plan_name,
      features
    )
    VALUES (?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE

    plan_id = VALUES(plan_id),
    plan_name = VALUES(plan_name),
    features = VALUES(features),
    updated_at = CURRENT_TIMESTAMP
    `,
      [
        planId,
        planKey,
        planName,
        JSON.stringify(features),
      ]
    );

    return result;
  }

  // GET ALL
  static async findAll() {
    const [rows] = await pool.execute(`
    SELECT
      spd.id,
      spd.plan_key,
      spd.plan_name,
      spd.features,
      spd.created_at,
      spd.updated_at,

      pp.plan_id,
      pp.product_id,
      pp.name AS paypal_plan_name,
      pp.status,
      pp.currency,
      pp.amount,
      pp.interval_unit,
      pp.interval_count,
      pp.active

    FROM subscription_plan_details spd

    INNER JOIN paypal_plans pp
      ON spd.plan_key = pp.plan_key

    WHERE pp.active = 1

    ORDER BY spd.id ASC
  `);

    return rows.map((row) => ({
      ...row,
      features: (() => {
        try {
          return typeof row.features === "string"
            ? JSON.parse(row.features)
            : row.features || [];
        } catch {
          return [];
        }
      })(),
    }));
  }


  // GET SINGLE
  static async findByPlanKey(planKey) {

    const [rows] = await pool.execute(
      `
    SELECT

      spd.id,
      spd.plan_key,
      spd.plan_name,
      spd.features,
      spd.created_at,
      spd.updated_at,

      pp.plan_id,
      pp.product_id,
      pp.name AS paypal_plan_name,
      pp.status,
      pp.currency,
      pp.amount,
      pp.interval_unit,
      pp.interval_count,
      pp.active

    FROM subscription_plan_details spd

    INNER JOIN paypal_plans pp
      ON spd.plan_key = pp.plan_key

    WHERE
      spd.plan_key = ?
      AND pp.active = 1

    LIMIT 1
    `,
      [planKey]
    );

    return rows[0] || null;
  }


  static async findByPaypalId(paypalSubscriptionId) {
    const sql = `
    SELECT *
    FROM subscriptions
    WHERE paypal_subscription_id = ?
    LIMIT 1
  `;

    const [rows] = await pool.execute(sql, [paypalSubscriptionId]);

    return rows[0] || null;
  }


  static async updatePlanByPaypalId(
    paypalSubscriptionId,
    { planKey, price }
  ) {
    const sql = `
    UPDATE subscriptions
    SET
      	plan_key = ?,
      price = ?,
      updated_at = NOW()
    WHERE paypal_subscription_id = ?
  `;

    await pool.execute(sql, [
      planKey,
      price,
      paypalSubscriptionId,
    ]);
  }

  static async findByPaypalSubscriptionId(
    paypalSubscriptionId
  ) {
    const [rows] = await pool.execute(
      `
    SELECT *
    FROM subscriptions
    WHERE paypal_subscription_id = ?
    LIMIT 1
    `,
      [paypalSubscriptionId]
    );

    return rows[0] || null;
  }


  static async createRefund(data) {
    const {
      partnerId,
      paypalRefundId,
      paypalSubscriptionId,
      paypalCaptureId,
      amount,
      currency,
      status,
      rawResponse,
    } = data;

    await pool.execute(
      `
    INSERT INTO refunds
    (
      partner_id,
      paypal_refund_id,
      paypal_subscription_id,
      paypal_capture_id,
      amount,
      currency,
      status,
      raw_response
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        partnerId,
        paypalRefundId,
        paypalSubscriptionId,
        paypalCaptureId,
        amount,
        currency,
        status,
        JSON.stringify(rawResponse),
      ]
    );
  }

  static async getrefundlist() {
    const [rows] = await pool.execute(`
    SELECT
      r.*,
      s.name,
      s.email,
      s.username
    FROM refunds r
    LEFT JOIN subscriptions s
      ON s.user_id = r.partner_id
    ORDER BY r.id DESC
  `);

    return rows;
  }
}


export default Subscription; // ✅ THIS LINE FIXES YOUR ERROR