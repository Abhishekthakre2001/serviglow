import express from "express";
import {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/subCategory.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";
import { upload } from "../../../middleware/upload.js";

const router = express.Router();

router.get("/", getSubCategories);
router.post("/", verifyUser, authorizeRoles("admin", "superadmin"), upload.single("image"), createSubCategory);
router.put("/:id", verifyUser, authorizeRoles("admin", "superadmin"), upload.single("image"), updateSubCategory);
router.delete("/:id", verifyUser, authorizeRoles("admin", "superadmin"), deleteSubCategory);

export default router;