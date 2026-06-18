import express from "express";
import {
    createService, updateService, deleteService,
    getAllServices, getServiceBySlug, reviewService,
    getServicesByUserId, getMyServices,
    getUsedCategories, getServiceById,
    getUsedSubCategoriesByCategory, getPartnersBySubCategory,
    toggleServiceStatus, getAvailableServices,getPartnerServices
} from "../controllers/service.controller.js";
import { upload } from "../../../middleware/upload.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = express.Router();

/* ── Public ── */
router.get("/used-categories", getUsedCategories);
router.get("/used-subcategories/:categoryId", getUsedSubCategoriesByCategory);
router.get("/partners-by-subcategory/:subCategoryId", getPartnersBySubCategory);
router.get("/services-with-used-categories", getUsedCategories);
router.get("/services/available-services", getAvailableServices);
router.get("/", getAllServices);
router.get("/slug/:slug", getServiceBySlug);

/* ── Partner/Admin ── */
router.get("/my", verifyUser, authorizeRoles("partner", "admin", "superadmin"), getMyServices);
router.get("/partner-services", getPartnerServices);
router.get("/my-services", verifyUser, getMyServices);
router.get("/partner/:userId", verifyUser, getServicesByUserId);

/* ── IMPORTANT: keep :id at bottom ── */
router.get("/:id", getServiceById);

router.post("/", verifyUser, authorizeRoles("partner", "admin", "superadmin"), upload.any(), createService);
router.put("/:id", verifyUser, authorizeRoles("partner", "admin", "superadmin"), upload.any(), updateService);
router.delete("/:id", verifyUser, authorizeRoles("partner", "admin", "superadmin"), deleteService);

router.patch("/toggle-status/:id", verifyUser, authorizeRoles("partner"), toggleServiceStatus);
router.patch("/review/:id", verifyUser, authorizeRoles("admin", "superadmin"), reviewService);

export default router;