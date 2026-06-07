// ← unchanged from your original, routes stay the same
import { Router } from "express";
import {
    registerPartner, getPartnerProfile, getPartnerDashboard,
    getLast7DaysBookings, togglePartnerActive,
    getPartnerRevenueDetailsByPartnerId, updatePartnerProfile,
    togglePartnerAvailability, getCustomerDashboard,
} from "../controllers/partner.controller.js";
import { upload } from "../../../middleware/upload.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = Router();

const uploadFields = upload.fields([
    { name: "businessLicense", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "taxid", maxCount: 1 },
    { name: "corporationcert", maxCount: 1 },
    { name: "govId", maxCount: 1 },
]);

router.post("/register", uploadFields, registerPartner);

router.patch("/profile", verifyUser, authorizeRoles("partner"), uploadFields, updatePartnerProfile);
router.get("/profile", verifyUser, authorizeRoles("partner"), getPartnerProfile);
router.get("/dashboard", verifyUser, authorizeRoles("partner"), getPartnerDashboard);
router.get("/last7days-bookings", verifyUser, authorizeRoles("partner"), getLast7DaysBookings);
router.patch("/toggle-availibility", verifyUser, authorizeRoles("partner"), togglePartnerAvailability);

router.get("/revenue-details/:partnerId", verifyUser, authorizeRoles("partner"), getPartnerRevenueDetailsByPartnerId);
router.patch("/partners/:id/toggle-active", verifyUser, authorizeRoles("admin", "superadmin"), togglePartnerActive);

export default router;