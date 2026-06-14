import validator from "validator";
import pool from "../../../config/db.js";
import { BookingModel } from "../models/booking.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js"
import ms from "ms";;
import { sendMail } from "../../../utils/sendMail.js";

// ══════════════════════════════════════════════
// CREATE BOOKING
// ══════════════════════════════════════════════
export const createBooking = asyncHandler(async (req, res) => {
    const {
        serviceId, partnerEmail, partnerId, serviceCategory, serviceType,
        date, time, name, phone, email, address, city, zip, notes,
    } = req.body;

    const customerId = req.user.id;

    if (!serviceId || !serviceCategory || !serviceType || !date || !time ||
        !name || !phone || !email || !address || !city || !zip) {
        return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // ── Parse date ──
    let bookingDate;
    if (typeof date === "string" && date.includes("/")) {
        const [day, month, year] = date.split("/").map(Number);
        bookingDate = new Date(year, month - 1, day);
    } else {
        bookingDate = new Date(date);
    }

    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid booking date format" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
        return res.status(400).json({ success: false, message: "Past booking date is not allowed" });
    }

    // ── Validate category + subcategory ──
    const [[catRows], [subCatRows]] = await Promise.all([
        pool.query("SELECT * FROM categories WHERE id = ? LIMIT 1", [serviceCategory]),
        pool.query("SELECT * FROM sub_categories WHERE id = ? LIMIT 1", [serviceType]),
    ]);

    if (!catRows.length || !subCatRows.length) {
        return res.status(404).json({ success: false, message: "Category or service type not found" });
    }

    const category = catRows[0];
    const subCategory = subCatRows[0];

    const booking = await BookingModel.create({
        serviceId, serviceCategory, serviceType, customerId, partnerId,
        date: bookingDate.toISOString().split("T")[0],
        time, name: name.trim(), phone: phone.trim(),
        email: email.toLowerCase(),
        address: address.trim(), city: city.trim(), zip: zip.trim(), notes,
    });

    // ── Emails (non-blocking) ──
    sendMail({
        to: partnerEmail,
        subject: "📌 New Booking Request - Action Required",
        html: newBookingPartnerEmail({
            booking, name, email, phone, date, time,
            address, city, zip, notes, category, subCategory
        }),
    }).catch(console.error);

    sendMail({
        to: email.toLowerCase(),
        subject: "✅ Booking Created Successfully",
        html: bookingConfirmationEmail({ booking, name, date, time, address, city, zip, notes, category, subCategory }),
    }).catch(console.error);

    res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
    });
});

// ══════════════════════════════════════════════
// GET ALL BOOKINGS (admin, paginated)
// ══════════════════════════════════════════════
export const getAllBookings = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
    const skip = (page - 1) * limit;

    const total = await BookingModel.countAll();
    const bookings = await BookingModel.findAll({ limit, skip });

    if (!bookings.length) {
        return res.status(404).json({ success: false, message: "No bookings found" });
    }

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

// ══════════════════════════════════════════════
// ACCEPT BOOKING
// ══════════════════════════════════════════════
export const acceptBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const partnerId = req.user.id;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (String(booking.partnerId?.id) !== String(partnerId)) {
        return res.status(403).json({ success: false, message: "You are not authorized for this booking" });
    }

    const updated = await BookingModel.updateStatus(bookingId, "Accept");

    sendMail({
        to: booking.email,
        subject: "✅ Booking Confirmed - ServiGlow",
        html: acceptBookingEmail(booking),
    }).catch(console.error);

    res.status(200).json({ success: true, message: "Booking accepted successfully", data: updated });
});

// ══════════════════════════════════════════════
// REJECT BOOKING
// ══════════════════════════════════════════════
export const rejectBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const partnerId = req.user.id;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (String(booking.partnerId?.id) !== String(partnerId)) {
        return res.status(403).json({ success: false, message: "You are not authorized for this booking" });
    }

    const updated = await BookingModel.updateStatus(bookingId, "Reject");

    sendMail({
        to: booking.email,
        subject: "❌ Booking Cancelled - ServiGlow",
        html: rejectBookingEmail(booking),
    }).catch(console.error);

    res.status(200).json({ success: true, message: "Booking rejected successfully", data: updated });
});

// ══════════════════════════════════════════════
// GET MY BOOKINGS (customer + partner, paginated)
// ══════════════════════════════════════════════
export const getMyBookings = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access" });
    if (!["customer", "partner"].includes(role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { status } = req.query;
    const validStatus = ["Pending", "Confirmed", "Cancelled", "Completed", "Accept", "Reject"];

    if (status && !validStatus.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
    const skip = (page - 1) * limit;

    const total = await BookingModel.countByUser({ userId, role, status });
    const bookings = await BookingModel.findByUser({ userId, role, status, limit, skip });

    return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});


// Partner wise booking
export const getPartnerBookings = asyncHandler(async (req, res) => {

    const { partnerId } = req.params;
    const { status } = req.query;

    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
    const skip = (page - 1) * limit;

    const total = await BookingModel.countByUser({
        userId: partnerId,
        role: "partner",
        status
    });

    const bookings = await BookingModel.findByUser({
        userId: partnerId,
        role: "partner",
        status,
        limit,
        skip
    });

    return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// ══════════════════════════════════════════════
// CANCEL BOOKING BY CUSTOMER
// ══════════════════════════════════════════════
export const cancelBookingByCustomer = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const customerId = req.user.id;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (String(booking.customerId?.id) !== String(customerId)) {
        return res.status(403).json({ success: false, message: "You are not authorized for this booking" });
    }
    if (booking.status === "Cancelled") {
        return res.status(400).json({ success: false, message: "Booking already cancelled" });
    }
    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Completed booking cannot be cancelled" });
    }

    await BookingModel.updateFields(bookingId, { status: "Cancelled", cancel_by_user: true });
    const updated = await BookingModel.findById(bookingId);

    // ── Notify customer ──
    sendMail({
        to: booking.email,
        subject: "✅ Booking Cancelled - ServiGlow",
        html: cancelCustomerEmail(booking),
    }).catch(console.error);

    // ── Notify partner ──
    if (booking.partnerId?.email) {
        sendMail({
            to: booking.partnerId.email,
            subject: "❌ Booking Cancelled by Customer - ServiGlow",
            html: cancelPartnerEmail(booking),
        }).catch(console.error);
    }

    return res.status(200).json({ success: true, message: "Booking cancelled successfully", data: updated });
});

// ══════════════════════════════════════════════
// RESCHEDULE BOOKING BY CUSTOMER
// ══════════════════════════════════════════════
export const rescheduleBookingByCustomer = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const customerId = req.user.id;
    const { date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ success: false, message: "Date and time are required" });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (String(booking.customerId?.id) !== String(customerId)) {
        return res.status(403).json({ success: false, message: "You are not authorized for this booking" });
    }
    if (booking.status === "Cancelled") {
        return res.status(400).json({ success: false, message: "Cancelled booking cannot be rescheduled" });
    }
    if (booking.status === "Completed") {
        return res.status(400).json({ success: false, message: "Completed booking cannot be rescheduled" });
    }

    let bookingDate;
    if (typeof date === "string" && date.includes("/")) {
        const [day, month, year] = date.split("/").map(Number);
        bookingDate = new Date(year, month - 1, day);
    } else {
        bookingDate = new Date(date);
    }

    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid booking date format" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
        return res.status(400).json({ success: false, message: "Past booking date is not allowed" });
    }

    const updated = await BookingModel.updateFields(bookingId, {
        booking_date: bookingDate.toISOString().split("T")[0],
        booking_time: time,
    });

    // ── Notify partner ──
    if (booking.partnerId?.email) {
        sendMail({
            to: booking.partnerId.email,
            subject: "📅 Booking Rescheduled by Customer - ServiGlow",
            html: reschedulePartnerEmail(booking, updated),
        }).catch(console.error);
    }

    // ── Notify customer ──
    sendMail({
        to: booking.email,
        subject: "🕒 Booking Rescheduled - ServiGlow",
        html: rescheduleCustomerEmail(updated),
    }).catch(console.error);

    return res.status(200).json({ success: true, message: "Booking rescheduled successfully", data: updated });
});

// ══════════════════════════════════════════════
// SEND BOOKING OTP
// ══════════════════════════════════════════════
export const sendBookingOtp = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = ms(process.env.OTP_EXPIRE_TIME || "10m");

    const expiresAt = new Date(Date.now() + otpExpiry);
    // ── Delete old OTPs for this booking ──
    await pool.query(
        "DELETE FROM otps WHERE type = 'booking' AND reference_id = ?",
        [bookingId]
    );

    // ── Save new OTP ──
    await pool.query(
        `INSERT INTO otps (email, otp, type, reference_id, expires_at, is_verified)
     VALUES (?, ?, 'booking', ?, ?, false)`,
        [booking.email, otp, bookingId, expiresAt]
    );

    await sendMail({
        to: booking.email,
        subject: "Booking Verification OTP",
        html: bookingOtpEmail(booking.name, otp, ms(otpExpiry, { long: true })),
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
});

// ══════════════════════════════════════════════
// VERIFY BOOKING OTP
// ══════════════════════════════════════════════
export const verifyBookingOtp = asyncHandler(async (req, res) => {
    const { bookingId, otp } = req.body;

    if (!bookingId || !otp) {
        return res.status(400).json({ success: false, message: "Booking ID and OTP are required" });
    }

    const [otpRows] = await pool.query(
        `SELECT * FROM otps
     WHERE reference_id = ? AND otp = ? AND type = 'booking'
     LIMIT 1`,
        [bookingId, otp]
    );

    if (!otpRows.length) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const otpRecord = otpRows[0];

    if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (otpRecord.is_verified) {
        return res.status(400).json({ success: false, message: "OTP already used" });
    }

    await pool.query("UPDATE otps SET is_verified = true WHERE id = ?", [otpRecord.id]);
    await pool.query("UPDATE bookings SET is_verified = true WHERE id = ?", [bookingId]);

    res.status(200).json({ success: true, message: "OTP verified successfully" });
});

// ══════════════════════════════════════════════
// UPDATE BOOKING STATUS BY PARTNER
// ══════════════════════════════════════════════
export const updateBookingStatusByPartner = asyncHandler(async (req, res) => {
    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
        return res.status(400).json({ success: false, message: "Booking ID and status are required" });
    }

    const allowed = ["Confirmed", "Cancelled", "Completed"];
    if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (!booking.is_verified) {
        return res.status(403).json({ success: false, message: "Booking not verified by customer" });
    }

    const [otpRows] = await pool.query(
        `SELECT id FROM otps
     WHERE reference_id = ? AND type = 'booking' AND is_verified = true LIMIT 1`,
        [bookingId]
    );
    if (!otpRows.length) {
        return res.status(403).json({ success: false, message: "OTP verification required" });
    }

    const updated = await BookingModel.updateStatus(bookingId, status);

    res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: updated,
    });
});

// ══════════════════════════════════════════════
// EMAIL TEMPLATES
// ══════════════════════════════════════════════
const newBookingPartnerEmail = ({ booking, name, email, phone, date, time,
    address, city, zip, notes, category, subCategory }) => `
<div style="font-family:Arial;background:#f4f7fb;padding:30px 15px;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(17,24,39,0.10);">
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:26px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:24px;">New Booking Request</h1>
    </div>
    <div style="padding:30px;">
      <div style="background:#f9fafb;border-radius:12px;padding:20px;">
        <p><b>Booking ID:</b> ${booking.id}</p>
        <p><b>Customer:</b> ${name} | ${email} | ${phone}</p>
        <p><b>Service:</b> ${category.category_name} - ${subCategory.sub_category_name}</p>
        <p><b>Date:</b> ${date} | <b>Time:</b> ${time}</p>
        <p><b>Address:</b> ${address}, ${city}, ${zip}</p>
        <p><b>Notes:</b> ${notes || "N/A"}</p>
      </div>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>
  </div>
</div>`;

const bookingConfirmationEmail = ({ booking, name, date, time, address, city, zip, notes, category, subCategory }) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#16a34a;padding:20px;text-align:center;color:#fff;"><h2>Booking Confirmation</h2></div>
    <div style="padding:30px;">
      <p>Hello <b>${name}</b>, your booking has been created successfully.</p>
      <div style="background:#f9fafb;padding:20px;border-radius:8px;">
        <p><b>Booking ID:</b> ${booking.id}</p>
        <p><b>Service:</b> ${category.category_name} - ${subCategory.sub_category_name}</p>
        <p><b>Date:</b> ${date} | <b>Time:</b> ${time}</p>
        <p><b>Address:</b> ${address}, ${city}, ${zip}</p>
        <p><b>Notes:</b> ${notes || "N/A"}</p>
      </div>
    </div>
    <div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const acceptBookingEmail = (booking) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(90deg,#16a34a,#2563eb);padding:20px;text-align:center;color:#fff;"><h2>ServiGlow</h2></div>
    <div style="padding:30px;">
      <h3>✅ Your Booking Has Been Confirmed!</h3>
      <p>Hello <b>${booking.name}</b>, your booking has been <b style="color:#16a34a;">accepted</b>.</p>
      <div style="background:#f9fafb;padding:18px;border-radius:10px;">
        <p><b>Date:</b> ${new Date(booking.booking_date).toDateString()}</p>
        <p><b>Time:</b> ${booking.booking_time}</p>
        <p><b>Status:</b> <b style="color:#16a34a;">Confirmed</b></p>
      </div>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const rejectBookingEmail = (booking) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(90deg,#ef4444,#f97316);padding:20px;text-align:center;color:#fff;"><h2>ServiGlow</h2></div>
    <div style="padding:30px;">
      <h3>❌ Your Booking Was Rejected</h3>
      <p>Hello <b>${booking.name}</b>, the partner could not accept your booking.</p>
      <div style="background:#fff7ed;padding:18px;border-radius:10px;border-left:4px solid #f97316;">
        <p>⚠️ You can book another available partner from your dashboard.</p>
      </div>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const cancelCustomerEmail = (booking) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#ef4444;padding:20px;text-align:center;color:#fff;"><h2>Booking Cancelled</h2></div>
    <div style="padding:30px;">
      <p>Hello <b>${booking.name}</b>, your booking has been cancelled.</p>
      <div style="background:#f9fafb;padding:15px;border-radius:8px;">
        <p><b>Date:</b> ${new Date(booking.booking_date).toDateString()}</p>
        <p><b>Time:</b> ${booking.booking_time}</p>
        <p><b>Status:</b> Cancelled</p>
      </div>
    </div>
    <div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const cancelPartnerEmail = (booking) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#ef4444;padding:20px;text-align:center;color:#fff;"><h2>Booking Cancelled</h2></div>
    <div style="padding:30px;">
      <p>Hello <b>${booking.partnerId?.first_name || ""} ${booking.partnerId?.last_name || ""}</b>,</p>
      <p>The customer has cancelled the booking assigned to you.</p>
      <div style="background:#f9fafb;padding:15px;border-radius:8px;">
        <p><b>Customer:</b> ${booking.name} | ${booking.email} | ${booking.phone}</p>
        <p><b>Date:</b> ${new Date(booking.booking_date).toDateString()}</p>
        <p><b>Time:</b> ${booking.booking_time}</p>
        <p><b>Address:</b> ${booking.address}, ${booking.city} - ${booking.zip}</p>
      </div>
    </div>
    <div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const reschedulePartnerEmail = (booking, updated) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#f97316;padding:20px;text-align:center;color:#fff;"><h2>Booking Rescheduled</h2></div>
    <div style="padding:30px;">
      <p>Hello <b>${booking.partnerId?.first_name || ""} ${booking.partnerId?.last_name || ""}</b>,</p>
      <p>The customer has rescheduled the booking.</p>
      <div style="background:#f9fafb;padding:15px;border-radius:8px;">
        <p><b>Customer:</b> ${booking.name} | ${booking.email} | ${booking.phone}</p>
        <p><b>New Date:</b> ${new Date(updated.booking_date).toDateString()}</p>
        <p><b>New Time:</b> ${updated.booking_time}</p>
        <p><b>Address:</b> ${booking.address}, ${booking.city} - ${booking.zip}</p>
      </div>
    </div>
    <div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const rescheduleCustomerEmail = (updated) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:#2563eb;padding:20px;text-align:center;color:#fff;"><h2>Booking Rescheduled</h2></div>
    <div style="padding:30px;">
      <p>Hello <b>${updated.name}</b>, your booking date/time has been updated.</p>
      <div style="background:#f9fafb;padding:15px;border-radius:8px;">
        <p><b>New Date:</b> ${new Date(updated.booking_date).toDateString()}</p>
        <p><b>New Time:</b> ${updated.booking_time}</p>
        <p><b>Status:</b> ${updated.status}</p>
      </div>
    </div>
    <div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;

const bookingOtpEmail = (name, otp, expiryText) => `
<div style="font-family:Arial;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;"><h2>ServiGlow</h2></div>
    <div style="padding:30px;">
      <h3>🔐 Booking Verification OTP</h3>
      <p>Dear <b>${name}</b>, use the OTP below to verify your booking.</p>
      <div style="background:#f9fafb;padding:25px;text-align:center;border-radius:8px;margin:20px 0;">
        <h1 style="letter-spacing:5px;color:#2563eb;">${otp}</h1>
        <p style="font-size:13px;color:#6b7280;">Expires in ${expiryText}.</p>
      </div>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">© ${new Date().getFullYear()} ServiGlow</div>
  </div>
</div>`;