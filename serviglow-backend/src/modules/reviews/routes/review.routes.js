import express from "express";
import {
    createReview, getServiceReviews, getBookingReview,
    getAllApprovedReviews, getAllReviewsAdmin, updateReview,
    toggleReviewApproval, deleteReview, getPartnerReviews,
} from "../controllers/review.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = express.Router();

/* ── Public ── */
router.get("/approved", getAllApprovedReviews);
router.get("/service/:serviceId", getServiceReviews);

/* ── Customer ── */
router.post("/", verifyUser, createReview);
router.get("/booking/:bookingId", verifyUser, getBookingReview);

/* ── Partner ── */
router.get("/partner", verifyUser, authorizeRoles("partner"), getPartnerReviews);

/* ── Admin ── */
router.get("/admin", verifyUser, authorizeRoles("admin", "superadmin"), getAllReviewsAdmin);
router.patch("/admin/:id", verifyUser, authorizeRoles("admin", "superadmin"), updateReview);
router.patch("/admin/:id/toggle", verifyUser, authorizeRoles("admin", "superadmin"), toggleReviewApproval);
router.delete("/admin/:id", verifyUser, authorizeRoles("admin", "superadmin"), deleteReview);

export default router;