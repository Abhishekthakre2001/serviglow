import { paypalRequest } from "../../../config/paypal.js";
import PaypalPlan from "../models/paypalPlan.model.js";
import { PLAN_KEYS } from "../constant/payment.keys.js";


const ALLOWED_PLAN_KEYS = [
  "BASIC",
  "MODERATE",
  "PREMIUM",
];

export const listPaypalProducts = async (req, res) => {
  try {
    const products = await paypalRequest(
      "GET",
      "/v1/catalogs/products?page_size=100"
    );

    return res.status(200).json({
      success: true,
      data: products,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

export const updatePaypalProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name } = req.body;

    const response = await paypalRequest(
      "PATCH",
      `/v1/catalogs/products/${productId}`,
      [
        {
          op: "replace",
          path: "/name",
          value: name,
        },
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};


// POST /api/v1/payment/paypal/product
export const createPaypalProduct = async (req, res) => {
  try {
    const {
      name = "Serviglow Subscriptions",
      description = "Partner subscriptions product",
      type = "SERVICE",
      category = "SOFTWARE",
    } = req.body;

    const product = await paypalRequest("POST", "/v1/catalogs/products", {
      name,
      description,
      type,
      category,
    });

    return res.status(201).json({
      success: true,
      data: {
        productId: product.id,
        product,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

// POST /api/v1/payment/paypal/plan
export const createPaypalPlan = async (req, res) => {
  try {
    const {
      planKey,
      productId,
      name,
      description,
      currency = "USD",
      amount,
      intervalUnit = "MONTH",
      intervalCount = 1,
    } = req.body;

    if (!planKey || !productId || !amount) {
      return res.status(400).json({
        success: false,
        message: "planKey, productId, amount are required",
      });
    }

    if (!PLAN_KEYS.includes(planKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid planKey. Use: ${PLAN_KEYS.join(", ")}`,
      });
    }

    // ✅ use model instead of raw SQL
    const existing = await PaypalPlan.findByPlanKey(planKey);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Plan already exists for ${planKey}`,
        data: existing,
      });
    }

    const paypalPlan = await paypalRequest("POST", "/v1/billing/plans", {
      product_id: productId,
      name: name || `${planKey} Plan`,
      description: description || `${planKey} subscription plan`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: String(amount), currency_code: currency },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    });

    // ✅ insert via model
    const saved = await PaypalPlan.create({
      planKey,
      productId,
      planId: paypalPlan.id,
      name: paypalPlan.name,
      status: paypalPlan.status,
      currency,
      amount,
      intervalUnit,
      intervalCount,
      raw: paypalPlan,
    });

    return res.status(201).json({
      success: true,
      data: saved,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};

// GET /api/v1/payment/paypal/plans
export const listPaypalPlans = async (req, res) => {
  try {
    const plans = await PaypalPlan.findAll();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// PATCH /api/v1/payment/paypal/plan/:planKey/price
export const updatePlanPrice = async (req, res) => {
  try {

    const { planKey } = req.params;
    const { amount } = req.body;

    // validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // get plan from DB
    const plan = await PaypalPlan.findByPlanKey(planKey);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: `No plan found for ${planKey}`,
      });
    }

    console.log("PLAN =>", plan);

    // update PayPal pricing
    const paypalResponse = await paypalRequest(
      "POST",
      `/v1/billing/plans/${plan.plan_id}/update-pricing-schemes`,
      {
        pricing_schemes: [
          {
            billing_cycle_sequence: 1,
            pricing_scheme: {
              fixed_price: {
                value: String(amount),
                currency_code: plan.currency,
              },
            },
          },
        ],
      }
    );

    console.log("PAYPAL RESPONSE =>", paypalResponse);

    // update DB
    await PaypalPlan.updatePrice(planKey, amount);

    return res.status(200).json({
      success: true,
      message: "Plan price updated successfully",
      data: {
        oldPrice: plan.amount,
        newPrice: amount,
      },
    });

  } catch (err) {

    console.log(
      "PRICE UPDATE ERROR =>",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
    });
  }
};


// POST /api/v1/payment/paypal/plan/:planKey/new-price

// NOte : create new plan insted of update paypal priceing

export const createNewPlanPrice = async (req, res) => {

  try {

    const { planKey } = req.params;

    const {
      amount,
      currency = "USD",
    } = req.body;

    // validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount required",
      });
    }

    // old active plan
    const oldPlan = await PaypalPlan.findByPlanKey(planKey);

    if (!oldPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // create NEW PayPal plan
    const newPaypalPlan = await paypalRequest(
      "POST",
      "/v1/billing/plans",
      {
        product_id: oldPlan.product_id,

        name: oldPlan.name,

        description: `${planKey} updated pricing plan`,

        billing_cycles: [
          {
            frequency: {
              interval_unit: oldPlan.interval_unit,
              interval_count: oldPlan.interval_count,
            },

            tenure_type: "REGULAR",

            sequence: 1,

            total_cycles: 0,

            pricing_scheme: {
              fixed_price: {
                value: String(amount),
                currency_code: currency,
              },
            },
          },
        ],

        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }
    );

    // deactivate old plans
    await PaypalPlan.deactivatePlans(planKey);

    // save new plan
    const saved = await PaypalPlan.create({
      planKey,
      productId: oldPlan.product_id,
      planId: newPaypalPlan.id,
      name: newPaypalPlan.name,
      status: newPaypalPlan.status,
      currency,
      amount,
      intervalUnit: oldPlan.interval_unit,
      intervalCount: oldPlan.interval_count,
      raw: newPaypalPlan,
    });

    return res.status(201).json({
      success: true,
      message: "New pricing plan created",
      data: saved,
    });

  } catch (err) {

    console.log(
      "NEW PRICE PLAN ERROR =>",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: err?.response?.data || err.message,
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