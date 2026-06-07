import express from "express";
import {
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  getAllSubscriptions,
  getmysubscriptionSubscriptions,
  upsertPlanDetails,
  getAllPlanDetails,
  getPlanDetailsByKey,
  migrateSubscriptionPlan,
  refundSubscription,
} from "../controllers/payment.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

import {
  createPaypalProduct,
  createPaypalPlan,
  listPaypalPlans,
  updatePlanPrice,
  createNewPlanPrice,
} from "../controllers/paypalSetup.controller.js";

import { paypalWebhookHandler } from "../webhooks/paypal.webhook.js";
// import { paypalWebhookMailHandler } from "../webhooks/paypalWebhookMailHandler.js";
import { rawBodySaver } from "../../../utils/rawBody.js";

const router = express.Router();

// ---- Setup APIs ----
router.post("/paypal/product", createPaypalProduct);
router.post("/paypal/plan", createPaypalPlan);
router.get("/paypal/plans", listPaypalPlans);


// update paypal price 
router.patch(
  "/paypal/plan/:planKey/price",
  updatePlanPrice
);
// http://localhost:4000/api/v1/payment/paypal/plan/BASIC/price
// {
//   "amount": 29
// }
router.post(
  "/subscription/:subscriptionId/migrate",
  migrateSubscriptionPlan
);


// create new paypal plans insead of the update price 
router.post(
  "/paypal/plan/:planKey/new-price",
  createNewPlanPrice
);

// ---- Subscription APIs ----
router.post("/create-subscription", createSubscription);
router.get("/subscription/:subscriptionId", getSubscriptionDetails);
router.post("/subscription/:subscriptionId/cancel", cancelSubscription);

// ---- Webhook ----
router.post("/webhook", express.json({ verify: rawBodySaver }), paypalWebhookHandler);
// router.post("/webhook/alert", express.json({ verify: rawBodySaver }), paypalWebhookMailHandler);

// ---- get all payment history ------
router.get("/", verifyUser, authorizeRoles("admin", "superadmin"), getAllSubscriptions);
router.get("/mysubscription", verifyUser, authorizeRoles("admin", "partner"), getmysubscriptionSubscriptions);

// update payment details
// UPSERT
// router.post(
//   "/plan-details",
//   upsertPlanDetails
// );


router.post(
  "/plans-update/:planKey",
  upsertPlanDetails
);

// GET ALL
router.get(
  "/plan-details",
  getAllPlanDetails
);


// GET SINGLE
router.get(
  "/plan-details/:planKey",
  getPlanDetailsByKey
);

router.post(
  "/subscription/:subscriptionId/refund",
  refundSubscription
);



export default router;