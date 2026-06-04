import express from "express";
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";
import { upload } from "../../../middleware/upload.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", verifyUser, authorizeRoles("admin", "superadmin"), upload.single("image"), createCategory);
router.put("/:id", verifyUser, authorizeRoles("admin", "superadmin"), upload.single("image"), updateCategory);
router.delete("/:id", verifyUser, authorizeRoles("admin", "superadmin"), deleteCategory);

export default router;