// unchanged structure, just updated import paths
import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  sendOtpToAnyone,
  verifyBookingOtp,
} from "../controller/otp.controller.js";

const router = Router();

router.post("/send-otp",        sendOtp);
router.post("/verify-otp",      verifyOtp);
router.post("/send-otp-any",    sendOtpToAnyone);
router.post("/Complete-booking", verifyBookingOtp);

export default router;