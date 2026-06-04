import { Router } from "express";
import { login, forgotPassword, verifyForgotOtp, resetPassword } from "./auth.controller.js";

const router = Router();

router.post("/login",              login);
router.post("/forgot-password",    forgotPassword);
router.post("/verify-forgot-otp",  verifyForgotOtp);
router.post("/reset-password",     resetPassword);

export default router;