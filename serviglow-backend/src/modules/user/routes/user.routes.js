import { Router } from "express";
import {
  registerUser,
  logout,
  getCurrentUser,
  getAllUsers,
  getAllCustomer,
  getCustomerBookings,
  updateUserProfile,
  toggleCustomerStatus,
  deleteCustomer
} from "../controllers/user.controller.js";
import { getCustomerDashboard } from "../../partner/controllers/partner.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = Router();

// ── Public ──
router.post("/register", registerUser);

// ── Protected ──
router.get("/", verifyUser, getCurrentUser);
router.get("/all", verifyUser, getAllUsers);
router.get("/customers", verifyUser, getAllCustomer);
router.get("/customers/booking",verifyUser,  getCustomerBookings);
router.get("/dashboard", verifyUser, authorizeRoles("customer"), getCustomerDashboard);
router.post("/logout", verifyUser, logout);
router.patch("/profile", verifyUser, updateUserProfile);
router.patch(
  "/customers/:id/status",
  verifyUser,
  toggleCustomerStatus
);

router.delete(
  "/customers/:id",
  verifyUser,
  deleteCustomer
);

export default router;