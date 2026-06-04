import express from "express";
import {
    createContact,
    getContacts,
    markContactViewed,
    deleteContact,
} from "../controllers/contact.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = express.Router();

router.post("/", createContact);
router.get("/", verifyUser, authorizeRoles("admin", "superadmin"), getContacts);
router.patch("/view/:id", verifyUser, authorizeRoles("admin", "superadmin"), markContactViewed);
router.delete("/:id", verifyUser, authorizeRoles("admin", "superadmin"), deleteContact);

export default router;