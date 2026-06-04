import express from "express";

const router = express.Router();

import {
  upsertAnnouncement,
  getAnnouncement,
} from "../controllers/announcement.controller.js";

import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

router.post(
  "/upsert",
  verifyUser,
  authorizeRoles("admin", "superadmin"),
  upsertAnnouncement
);

// PUBLIC API
router.get("/", getAnnouncement);

export default router;