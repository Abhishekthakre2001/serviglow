import express from "express";

import {
  exportPartners,
  exportMaster,
  exportCustomers,
  exportContacts,
  exportReviews,
  exportSubscriptions,
  exportMyServices,
  exportMyQuotes,
  exportMyRevenue,
  exportMyBookings,
  exportPartnerReviews
} from "../controllers/export.controller.js";

import { verifyUser } from "../../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/partners", exportPartners);
router.get("/master", exportMaster);
router.get("/customers", exportCustomers);
router.get("/contacts", exportContacts);
router.get("/reviews", exportReviews);
router.get(
  "/subscriptions",
  exportSubscriptions
);
router.get(
  "/services",
  verifyUser,
  exportMyServices
);
router.get(
  "/quotes",
  verifyUser,
  exportMyQuotes
);

router.get(
  "/revenue",
  verifyUser,
  exportMyRevenue
);

router.get(
  "/bookings",
  verifyUser,
  exportMyBookings
);

router.get(
  "/reviews",
  verifyUser,
  exportPartnerReviews
);

export default router;