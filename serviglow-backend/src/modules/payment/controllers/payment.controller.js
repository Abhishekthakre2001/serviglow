import { paypalRequest } from "../../../config/paypal.js";
import PaypalPlan from "../models/paypalPlan.model.js";
import Subscription from "../models/subscription.model.js";
import pool from "../../../config/db.js";

const ALLOWED_PLAN_KEYS = [
  "BASIC",
  "MODERN",
  "PREMIUM",
];


// POST /api/v1/payment/create-subscription
export const createSubscription = async (req, res) => {

  console.log(req.body)
  try {
    const { planKey, email, userId, username, name } = req.body;

    if (!planKey || !email || !userId) {
      return res.status(400).json({
        success: false,
        message: "planKey, email, userId are required",
      });
    }

    // ✅ FIXED HERE
    const plan = await PaypalPlan.findByPlanKey(planKey);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: `No plan found for ${planKey}. Create plan first.`,
      });
    }

    const subscription = await paypalRequest("POST", "/v1/billing/subscriptions", {
      plan_id: plan.plan_id, // ⚠️ MySQL column name (check this)
      subscriber: { email_address: email },
      application_context: {
        // brand_name: "Urban",
        brand_name: "SERVIGLOW",
        user_action: "SUBSCRIBE_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${process.env.FRONTEND_URL}/partner/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/partner/subscription/cancel`,
      },
    });

    const approvalUrl =
      subscription?.links?.find((l) => l.rel === "approve")?.href || null;

    await Subscription.create({
      userId,
      username,
      name,
      email,
      planKey,
      price: Number(plan.amount),
      paypalSubscriptionId: subscription.id,
      status: "PENDING",
      subscription: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        approvalUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

// GET /api/v1/payment/subscription/:subscriptionId
export const getSubscriptionDetails = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const details = await paypalRequest(
      "GET",
      `/v1/billing/subscriptions/${subscriptionId}`
    );

    return res.status(200).json({ success: true, data: details });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

// POST /api/v1/payment/subscription/:subscriptionId/cancel
// POST /api/v1/payment/subscription/:subscriptionId/cancel
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Cancel from PayPal
    await paypalRequest(
      "POST",
      `/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        reason: "User requested cancellation",
      }
    );

    // Update DB
    await Subscription.updateStatusByPaypalId(
      subscriptionId,
      "CANCELLED"
    );

    return res.status(200).json({
      success: true,
      message: "Subscription cancelled",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const result = await Subscription.getAll(req.query);

    res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const getmysubscriptionSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    console.log("req id", userId);

    const result = await Subscription.getMySubscription(userId);

    return res.status(200).json({
      success: true,
      message: "Subscription fetched successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};


// UPSERT
// export const upsertPlanDetails = async (req, res) => {

//   try {

//     const {
//       planId,
//       planKey,
//       planName,
//       features,
//     } = req.body;

//     // validation
//     if (
//       !planId ||
//       !planKey ||
//       !planName ||
//       !Array.isArray(features)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     // allow only 3 keys
//     if (!ALLOWED_PLAN_KEYS.includes(planKey)) {

//       return res.status(400).json({
//         success: false,
//         message:
//           "Only BASIC, MODER, PREMIUM allowed",
//       });
//     }

//     await Subscription.upsert({
//       planId,
//       planKey,
//       planName,
//       features,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Plan upserted successfully",
//     });

//   } catch (err) {

//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export const upsertPlanDetails = async (req, res) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const { planKey } = req.params;

    const {
      planName,
      amount,
      features,
    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (
      !planKey ||
      !planName ||
      !amount ||
      !Array.isArray(features)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "planKey, planName, amount, features required",
      });
    }

    if (!ALLOWED_PLAN_KEYS.includes(planKey)) {

      return res.status(400).json({
        success: false,
        message:
          "Only BASIC, MODERN, PREMIUM allowed",
      });
    }

    // =========================
    // ACTIVE PLAN
    // =========================

    const currentPlan =
      await PaypalPlan.findByPlanKey(planKey);

    if (!currentPlan) {

      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Active plan not found",
      });
    }

    let finalPlanId = currentPlan.plan_id;

    // =========================
    // PRICE SAME
    // =========================

    if (
      Number(currentPlan.amount) === Number(amount)
    ) {

      await Subscription.upsert(
        {
          planId: currentPlan.plan_id,
          planKey,
          planName,
          features,
        },
        connection
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message:
          "Features updated successfully",
        data: {
          planId: currentPlan.plan_id,
          amount: currentPlan.amount,
          updated: true,
          newPlanCreated: false,
        },
      });
    }

    // =========================
    // PRICE CHANGED
    // =========================

    // CREATE NEW PAYPAL PLAN

    const newPaypalPlan =
      await paypalRequest(
        "POST",
        "/v1/billing/plans",
        {
          product_id: currentPlan.product_id,

          name: planName,

          description:
            `${planKey} updated pricing plan`,

          billing_cycles: [
            {
              frequency: {
                interval_unit:
                  currentPlan.interval_unit,

                interval_count:
                  currentPlan.interval_count,
              },

              tenure_type: "REGULAR",

              sequence: 1,

              total_cycles: 0,

              pricing_scheme: {
                fixed_price: {
                  value: String(amount),
                  currency_code:
                    currentPlan.currency,
                },
              },
            },
          ],

          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action:
              "CONTINUE",
            payment_failure_threshold: 3,
          },
        }
      );

    // =========================
    // DEACTIVATE OLD PLAN
    // =========================

    await PaypalPlan.deactivatePlans(
      planKey,
      connection
    );

    // =========================
    // SAVE NEW PLAN
    // =========================

    await PaypalPlan.create(
      {
        planKey,
        productId: currentPlan.product_id,
        planId: newPaypalPlan.id,
        name: planName,
        status: newPaypalPlan.status,
        currency: currentPlan.currency,
        amount,
        intervalUnit:
          currentPlan.interval_unit,
        intervalCount:
          currentPlan.interval_count,
        raw: newPaypalPlan,
      },
      connection
    );

    finalPlanId = newPaypalPlan.id;

    // =========================
    // UPDATE FEATURES TABLE
    // =========================

    await Subscription.upsert(
      {
        planId: finalPlanId,
        planKey,
        planName,
        features,
      },
      connection
    );

    // =========================
    // COMMIT
    // =========================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "New PayPal plan created and updated successfully",
      data: {
        oldPlanId: currentPlan.plan_id,
        newPlanId: finalPlanId,
        oldPrice: currentPlan.amount,
        newPrice: amount,
        newPlanCreated: true,
      },
    });

  } catch (err) {

    await connection.rollback();

    console.log(
      "PLAN UPDATE ERROR =>",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err?.response?.data || err.message,
    });

  } finally {

    connection.release();
  }
};

// GET ALL
export const getAllPlanDetails = async (req, res) => {

  try {

    const result =
      await Subscription.findAll();

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// GET SINGLE
export const getPlanDetailsByKey = async (req, res) => {

  try {

    const { planKey } = req.params;

    const result =
      await Subscription.findByPlanKey(planKey);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// POST /api/v1/payment/subscription/:subscriptionId/migrate
export const migrateSubscriptionPlan = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { planKey } = req.body;

    if (!planKey) {
      return res.status(400).json({
        success: false,
        message: "planKey is required",
      });
    }

    // Get latest active PayPal plan
    const newPlan = await PaypalPlan.findByPlanKey(planKey);

    if (!newPlan) {
      return res.status(404).json({
        success: false,
        message: `Plan ${planKey} not found`,
      });
    }

    // Revise PayPal Subscription
    const response = await paypalRequest(
      "POST",
      `/v1/billing/subscriptions/${subscriptionId}/revise`,
      {
        plan_id: newPlan.plan_id,
      }
    );

    const approvalUrl =
      response?.links?.find(
        (link) => link.rel === "approve"
      )?.href || null;

    // Optional DB update
    await Subscription.updatePlanByPaypalId(
      subscriptionId,
      {
        planKey,
        price: Number(newPlan.amount),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Subscription migrated successfully",
      data: {
        subscriptionId,
        newPlanId: newPlan.plan_id,
        approvalUrl,
        paypalResponse: response,
      },
    });
  } catch (err) {
    console.log(
      "MIGRATION ERROR =>",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err?.response?.data || err.message,
    });
  }
};