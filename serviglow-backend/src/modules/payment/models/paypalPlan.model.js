import pool from "../../../config/db.js";

class PaypalPlan {

  // 🔍 Find by planKey
  // static async findByPlanKey(planKey) {
  //   const [rows] = await pool.execute(
  //     "SELECT * FROM paypal_plans WHERE plan_key = ?",
  //     [planKey]
  //   );
  //   return rows[0] || null;
  // }
  static async findByPlanKey(planKey) {

    const [rows] = await pool.execute(
      `
    SELECT *
    FROM paypal_plans
    WHERE plan_key = ?
    AND active = 1
    ORDER BY id DESC
    LIMIT 1
    `,
      [planKey]
    );

    return rows[0] || null;
  }

  // deactive plans
  static async deactivatePlans(
    planKey,
    connection = null
  ) {

    const executor = connection || pool;

    const [result] = await executor.execute(
      `
    UPDATE paypal_plans
    SET active = 0
    WHERE plan_key = ?
    `,
      [planKey]
    );

    return result;
  }

  // ➕ Create plan
  static async create(data, connection = null) {

    const executor = connection || pool;

    const {
      planKey,
      productId,
      planId,
      name,
      status,
      currency,
      amount,
      intervalUnit,
      intervalCount,
      raw,
    } = data;

    const [result] = await executor.execute(
      `INSERT INTO paypal_plans
    (
      plan_key,
      product_id,
      plan_id,
      name,
      status,
      currency,
      amount,
      interval_unit,
      interval_count,
      raw
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planKey,
        productId,
        planId,
        name,
        status,
        currency,
        amount,
        intervalUnit,
        intervalCount,
        JSON.stringify(raw),
      ]
    );

    return {
      id: result.insertId,
      ...data,
    };
  }

  // 📄 Get all plans
  static async findAll() {
    const [rows] = await pool.execute(
      "SELECT * FROM paypal_plans ORDER BY created_at DESC"
    );
    return rows;
  }


  // find plan
  // static async findByPlanKey(planKey) {

  //   const [rows] = await pool.execute(
  //     `
  //     SELECT *
  //     FROM paypal_plans
  //     WHERE plan_key = ?
  //     LIMIT 1
  //     `,
  //     [planKey]
  //   );

  //   return rows[0] || null;
  // }

  // update price
  static async updatePrice(planKey, amount) {

    const [result] = await pool.execute(
      `
      UPDATE paypal_plans
      SET amount = ?
      WHERE plan_key = ?
      `,
      [amount, planKey]
    );

    return result;
  }

}

export default PaypalPlan;