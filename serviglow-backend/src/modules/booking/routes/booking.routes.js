import express from "express";
import {
    createBooking, getAllBookings, acceptBooking, rejectBooking,
    getMyBookings, cancelBookingByCustomer, rescheduleBookingByCustomer,
    sendBookingOtp, verifyBookingOtp, updateBookingStatusByPartner, getPartnerBookings
} from "../controllers/booking.controller.js";
import { verifyUser } from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = express.Router();

router.post("/", verifyUser, authorizeRoles("customer"), createBooking);
router.get("/admin", verifyUser, authorizeRoles("admin", "superadmin"), getAllBookings);
router.get("/my-bookings", verifyUser, authorizeRoles("customer", "partner"), getMyBookings);
router.get(
    "/partner-bookings/:partnerId",
    verifyUser,
    getPartnerBookings
);

router.patch("/partner/accept/:bookingId", verifyUser, authorizeRoles("partner"), acceptBooking);
router.patch("/partner/reject/:bookingId", verifyUser, authorizeRoles("partner"), rejectBooking);
router.post("/partner/send-otp/:bookingId", verifyUser, authorizeRoles("partner"), sendBookingOtp);
router.post("/partner/verify-otp", verifyUser, authorizeRoles("partner"), verifyBookingOtp);
router.patch("/partner/update-status", verifyUser, authorizeRoles("partner"), updateBookingStatusByPartner);

router.patch("/customer/cancel/:bookingId", verifyUser, authorizeRoles("customer"), cancelBookingByCustomer);
router.patch("/customer/reschedule/:bookingId", verifyUser, authorizeRoles("customer"), rescheduleBookingByCustomer);

export default router;