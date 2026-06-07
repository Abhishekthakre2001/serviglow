// routes stay the same — only import paths updated
import { Router } from "express";
import {
  registerAdmin, approvePartner, rejectPartner,
  getPendingPartners, getAllPartners, getPartnerDetails,
  getAdminDashboard, getAdminLast7DaysBookings, updateAdminProfile,
  upsertFooter, getFooter, upsertHomeSection, getHomeSection,
  updateBanner, getBanner,
  getPolicies, upsertPolicy, deletePolicy, getPolicy, getAdmins, updateAdmin, deleteAdmin, updateAdminStatus, updateAdminPermissions, getAdminPermissions,upsertBookingTerms,
  getBookingTerms,
  createPage, getAllPages, getPageBySlug, updatePage, deletePage
} from "../controllers/admin.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = Router();

const adminOnly = [
  verifyUser,
  authorizeRoles("admin", "superadmin"),
];

router.post("/register", registerAdmin);
router.get("/footer", getFooter);
router.get("/policies", getPolicies);
router.get("/policies/:id", getPolicy);
router.get("/homeSection", getHomeSection);
router.get("/banner", getBanner);

router.patch("/profile", ...adminOnly, updateAdminProfile);
router.post("/footer", ...adminOnly, upsertFooter);
router.post("/homeSection", ...adminOnly, upsertHomeSection);
router.post("/banner", ...adminOnly, updateBanner);
router.post("/policies", ...adminOnly, upsertPolicy);
router.delete("/policies/:id", ...adminOnly, deletePolicy);
router.get("/dashboard", ...adminOnly, getAdminDashboard);
router.get("/last7days-bookings", ...adminOnly, getAdminLast7DaysBookings);
router.get("/partners/pending", ...adminOnly, getPendingPartners);
router.get("/partners", ...adminOnly, getAllPartners);
router.get("/partners/:partnerId", ...adminOnly, getPartnerDetails);
router.patch("/partners/:partnerId/approve", ...adminOnly, approvePartner);
router.patch("/partners/:partnerId/reject", ...adminOnly, rejectPartner);

// admin management routes
router.get("/admins", ...adminOnly, getAdmins);

router.put("/admins/:id", ...adminOnly, updateAdmin);

router.delete("/admins/:id", ...adminOnly, deleteAdmin);

router.patch("/admins/:id/status", ...adminOnly, updateAdminStatus);

router.patch("/admins/:id/permissions", ...adminOnly, updateAdminPermissions);

router.get("/admins/:id/permissions", getAdminPermissions);

// Public
router.get("/booking-terms", getBookingTerms);

// Admin Only
router.post(
  "/booking-terms",
  upsertBookingTerms
);

router.post("/createpage", ...adminOnly, createPage);

router.get("/pages", getAllPages);

router.get("/pages/:slug", getPageBySlug);

router.put("/pages/:id", ...adminOnly, updatePage);

router.delete("/pages/:id", ...adminOnly, deletePage);

export default router;