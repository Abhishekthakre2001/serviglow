import crypto from "crypto";
import pool from "../../../config/db.js";
import { OtpModel } from "../model/otp.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendMail } from "../../../utils/sendMail.js";
import { parseExpiryToMs } from "../../../utils/expiryParser.js";
import ms from "ms";

// ══════════════════════════════════════════════
// SEND OTP  (new user registration only)
// ══════════════════════════════════════════════
export const sendOtp = asyncHandler(async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Block if user already registered ──
    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    if (userRows.length) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login.",
      });
    }

    // ── Check existing OTP ──
    const existingOtp = await OtpModel.findByEmail(normalizedEmail);

    if (existingOtp) {
      if (new Date(existingOtp.expires_at) > new Date()) {
        return res.status(400).json({
          success: false,
          message: "OTP already sent. Please check your email or wait until it expires.",
        });
      }
      // Expired → delete
      await OtpModel.deleteByEmail(normalizedEmail);
    }

    // ── Generate OTP ──
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryMs = parseExpiryToMs(process.env.OTP_EXPIRY);
    const expiresAt = new Date(Date.now() + expiryMs);

    await OtpModel.create({ email: normalizedEmail, otp, expiresAt, type });

    const readableExpiry = process.env.OTP_EXPIRY
      .replace("s", " Seconds")
      .replace("m", " Minutes")
      .replace("h", " Hours");

    // ── Send email ──
    await sendMail({
      to: normalizedEmail,
      subject: "Email Verification - ServiGlow",
      html: otpEmailTemplate(otp, readableExpiry),
    });

    return res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
});

// ══════════════════════════════════════════════
// VERIFY OTP
// ══════════════════════════════════════════════
export const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const record = await OtpModel.findValid({ email: normalizedEmail, otp, isVerified: false });

    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    await OtpModel.markVerified(record.id);

    // ── Send verification success email ──
    await sendMail({
      to: normalizedEmail,
      subject: "Email Verified Successfully - ServiGlow",
      html: verifiedEmailTemplate(normalizedEmail),
    });

    return res.status(200).json({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════
// SEND OTP TO ANYONE  (no user-exists check)
// ══════════════════════════════════════════════
export const sendOtpToAnyone = asyncHandler(async (req, res) => {
  try {
    const { email, type, otp_type } = req.body;

    console.log("otp_type", otp_type)

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Delete any existing unverified OTP ──
    const existing = await OtpModel.findByEmail(normalizedEmail);
    if (existing && !existing.is_verified) {
      await OtpModel.deleteByEmail(normalizedEmail);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryMs = parseExpiryToMs(process.env.OTP_EXPIRY);
    const expiresAt = new Date(Date.now() + expiryMs);

    const readableExpiry = process.env.OTP_EXPIRY
      .replace("s", " Seconds")
      .replace("m", " Minutes")
      .replace("h", " Hours");

    await OtpModel.create({ email: normalizedEmail, otp, expiresAt, type });


    if (otp_type === "booking_completion") {
      await sendMail({
        to: normalizedEmail,
        subject: "Service Completion Verification - ServiGlow",
        html: serviceCompleteOtpTemplate(otp, readableExpiry),
      });
    } else {
      await sendMail({
        to: normalizedEmail,
        subject: "Verify Your Email - ServiGlow",
        html: otpEmailTemplate(otp, readableExpiry),
      });
    }

    return res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
});

// ══════════════════════════════════════════════
// VERIFY BOOKING OTP  (complete booking + revenue)
// ══════════════════════════════════════════════
export const verifyBookingOtp = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const {
      bookingId, otp,
      serviceId, partnerId, customerId,
      revenue, date, time, serviceCharges,
    } = req.body;

    if (!bookingId || !otp) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: "Booking ID and OTP are required" });
    }

    // ── Fetch booking ──
    const [bookingRows] = await conn.query(
      "SELECT * FROM bookings WHERE id = ? LIMIT 1",
      [bookingId]
    );
    if (!bookingRows.length) {
      throw new Error("Booking not found");
    }

    const booking = bookingRows[0];

    if (booking.is_verified || booking.status === "Completed") {
      throw new Error("Booking already completed");
    }

    const customerEmail = booking.email?.toLowerCase().trim();

    // ── Validate OTP ──
    const [otpRows] = await conn.query(
      `SELECT * FROM otps
       WHERE email = ? AND otp = ? AND is_verified = false AND expires_at > NOW()
       LIMIT 1`,
      [customerEmail, otp]
    );
    if (!otpRows.length) throw new Error("Invalid OTP");

    const otpRecord = otpRows[0];

    if (new Date(otpRecord.expires_at) < new Date()) {
      throw new Error("OTP expired");
    }

    // ── Mark OTP verified ──
    await conn.query(
      "UPDATE otps SET is_verified = true WHERE id = ?",
      [otpRecord.id]
    );

    // ── Complete booking ──
    await conn.query(
      "UPDATE bookings SET status = 'Completed', is_verified = true WHERE id = ?",
      [bookingId]
    );

    // ── Insert partner revenue (avoid duplicate) ──
    const [existingRevenue] = await conn.query(
      "SELECT id FROM partner_revenue WHERE booking_id = ? LIMIT 1",
      [bookingId]
    );

    const formattedDate =
      date
        ? new Date(date).toISOString().split("T")[0]
        : booking.booking_date
          ? new Date(booking.booking_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

    if (!existingRevenue.length) {
      await conn.query(
        `INSERT INTO partner_revenue
          (service_id, partner_id, customer_id, booking_id, revenue, service_charges, revenue_date, revenue_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceId,
          partnerId,
          customerId,
          bookingId,
          revenue || 0,
          serviceCharges || 0,
          formattedDate,
          time || booking.booking_time || new Date().toLocaleTimeString(),
        ]
      );
    }

    await conn.commit();
    conn.release();

    // ── Send completion email ──
    sendMail({
      to: booking.email,
      subject: "Booking Completed Successfully - ServiGlow",
      html: bookingCompletedTemplate(booking),
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified and booking completed successfully",
      data: { bookingId, status: "Completed" },
    });

  } catch (error) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
});

// ══════════════════════════════════════════════
// EMAIL TEMPLATES
// ══════════════════════════════════════════════
const otpEmailTemplate = (otp, validity) => `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
      <h2 style="margin:0;">ServiGlow</h2>
    </div>
    <div style="padding:30px;">
      <h3 style="color:#111827;">🔐 Email Verification Required</h3>
      <p style="color:#4b5563;font-size:15px;">To complete your verification, use the OTP below:</p>
      <div style="background:#f9fafb;padding:25px;border-radius:10px;margin:25px 0;text-align:center;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Your Verification Code</p>
        <h1 style="margin:10px 0;font-size:36px;letter-spacing:6px;color:#2563eb;">${otp}</h1>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Valid for ${validity}</p>
      </div>
      <p style="color:#4b5563;">Do not share this code with anyone.</p>
      <p>Regards,<br/><b>ServiGlow Team</b></p>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>
  </div>
</div>`;

const serviceCompleteOtpTemplate = (otp, validity) => `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <div style="background:linear-gradient(90deg,#16a34a,#22c55e);padding:20px;text-align:center;color:#fff;">
      <h2 style="margin:0;">ServiGlow</h2>
    </div>

    <div style="padding:30px;">
      <h3 style="color:#111827;">✅ Service Completion Verification</h3>
      <p style="color:#4b5563;font-size:15px;">
        Your service has been marked as completed. Please confirm using the OTP below:
      </p>

      <div style="background:#f9fafb;padding:25px;border-radius:10px;margin:25px 0;text-align:center;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Completion OTP</p>
        <h1 style="margin:10px 0;font-size:36px;letter-spacing:6px;color:#16a34a;">${otp}</h1>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Valid for ${validity}</p>
      </div>

      <p style="color:#4b5563;">Do not share this OTP with anyone.</p>
      <p>Regards,<br/><b>ServiGlow Team</b></p>
    </div>

    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>
  </div>
</div>`;

const verifiedEmailTemplate = (email) => `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
      <h2 style="margin:0;">ServiGlow</h2>
    </div>
    <div style="padding:30px;">
      <h3 style="color:#111827;">✅ Email Verified Successfully!</h3>
      <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
        <p><b>Email:</b> ${email}</p>
        <p>Status: <b style="color:#10b981;">Verified</b></p>
      </div>
      <p style="color:#4b5563;">🎉 You can now continue with your registration process.</p>
      <p>Regards,<br/><b>ServiGlow Team</b></p>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>
  </div>
</div>`;

const bookingCompletedTemplate = (booking) => `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
      <h2 style="margin:0;">ServiGlow</h2>
    </div>
    <div style="padding:30px;">
      <h3 style="color:#111827;">✅ Booking Completed Successfully</h3>
      <p>Hello <b>${booking.name}</b>,</p>
      <p>Your booking has been completed successfully.</p>
      <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
        <p><b>Booking ID:</b> ${booking.id}</p>
        <p><b>Status:</b> <span style="color:#10b981;font-weight:bold;">Completed</span></p>
        <p><b>Date:</b> ${new Date(booking.booking_date).toLocaleDateString()}</p>
        <p><b>Time:</b> ${booking.booking_time}</p>
      </div>
      <p>Thank you for connecting with us. Please leave us a review!</p>
      <p>Regards,<br/><b>ServiGlow Team</b></p>
    </div>
    <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>
  </div>
</div>`;