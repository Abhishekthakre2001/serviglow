import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserModel, OtpModel } from "./auth.model.js";
import { PartnerModel } from "../partner/models/partner.model.js";
import { generateAccessRefreshToken } from "../../utils/generateToken.js";
import { sendMail } from "../../utils/sendMail.js";
import pool from "../../config/db.js";
import ms from "ms";

// ── Login ──────────────────────────────────────────────
// export const loginService = async ({ email, password }) => {
//   const user = await UserModel.findByEmail(email);
//   if (!user) throw new Error("Invalid email or password");

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) throw new Error("Invalid email or password");

//   const { accessToken, refreshToken } = await generateAccessRefreshToken(user.id);

//   const { password: _pw, refresh_token: _rt, ...safeUser } = user;
//   return { user: safeUser, accessToken, refreshToken };
// };
export const loginService = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // ── Find user ──
  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  // ── Verify password ──
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { status: 401, message: "Invalid credentials" };
  }

  // ── Partner-specific checks ──
  let latestSubscription = null;
  let freebooking = false;

  // ── Check user active/inactive ──
  if (user.status !== "active") {
    return {
      status: 403,
      message: "Your account is inactive. Please contact admin.",
    };
  }

  if (user.role === "partner") {

    // ── Check partner profile exists ──
    const partnerProfile = await PartnerModel.findByUserId(user.id);

    if (!partnerProfile) {
      return { status: 403, message: "Partner profile not found" };
    }

    // ── Check approval status ──
    if (partnerProfile.approval_status !== "approved") {
      return {
        status: 403,
        message: `Partner account is ${partnerProfile.approval_status}. Please wait for admin approval.`,
      };
    }

    // ── Check active status ──
    if (!partnerProfile.is_active) {
      return {
        status: 403,
        message: "Inactive Partner. Please contact admin.",
      };
    }

    // ── Get latest subscription ──
    const [subRows] = await pool.query(
      `SELECT * FROM subscriptions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );
    latestSubscription = subRows[0] || null;

    // ── Free booking check (first 5 bookings) ──
    const [[{ totalBookings }]] = await pool.query(
      "SELECT COUNT(*) AS totalBookings FROM bookings WHERE partner_id = ?",
      [user.id]
    );
    freebooking = Number(totalBookings) < 5;
  }

  // ── Generate tokens ──
  const { accessToken, refreshToken } = await generateAccessRefreshToken(user.id);

  // ── Strip sensitive fields ──
  const { password: _pw, refresh_token: _rt, ...safeUser } = user;

  return {
    status: 200,
    user: safeUser,
    accessToken,
    refreshToken,
    subscription: latestSubscription,
    freebooking,
  };
};

// ── Forgot Password ────────────────────────────────────
export const forgotPasswordService = async (email) => {
  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error("No account found with this email");

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiryMs = ms(process.env.FORGOT_PASSWORD_OTP_EXPIRY);
  const expiresAt = new Date(Date.now() + expiryMs);

  const readableExpiry = process.env.FORGOT_PASSWORD_OTP_EXPIRY
    .replace("s", " seconds")
    .replace("m", " minutes")
    .replace("h", " hours");

  await OtpModel.create({ email, otp, expiresAt, type: "forgot-password" });

  await sendMail({
    to: email,
    subject: "🔐 Reset Your Password - ServiGlow",
    html: passwordResetOtpTemplate(user.first_name, otp, readableExpiry),
  });

  return { message: "OTP sent to your email" };
};

// ── Verify Forgot OTP ──────────────────────────────────
export const verifyForgotOtpService = async ({ email, otp }) => {
  const record = await OtpModel.findValid(email, otp, "forgot-password");
  if (!record) throw new Error("Invalid or expired OTP");

  await OtpModel.markVerified(email, "forgot-password");
  return { message: "OTP verified successfully" };
};

// ── Reset Password ─────────────────────────────────────
export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const record = await OtpModel.findValid(email, otp, "forgot-password");

  // allow already-verified OTP too
  if (!record) {
    const [rows] = await (await import("../../config/db.js")).default.query(
      `SELECT * FROM otps WHERE email = ? AND type = 'forgot-password' AND is_verified = true LIMIT 1`,
      [email]
    );
    if (!rows[0]) throw new Error("OTP not verified. Please verify OTP first.");
  }

  const user = await UserModel.findByEmail(email);
  if (!user) throw new Error("User not found");

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(user.id, hashed);
  await OtpModel.deleteByEmail(email, "forgot-password");

  return { message: "Password reset successfully" };
};


const passwordResetOtpTemplate = (name, otp, expiryText) => `
<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#ffffff;">
      <h2 style="margin:0;">ServiGlow</h2>
    </div>

    <!-- Body -->
    <div style="padding:30px;">
      <h3 style="color:#111827;">🔐 Reset Your Password</h3>

      <p style="color:#4b5563;">
        Hi <b>${name}</b>,
      </p>

      <p style="color:#4b5563;">
        We received a request to reset your password. Use the OTP below to proceed:
      </p>

      <!-- OTP Box -->
      <div style="background:#f9fafb;padding:25px;text-align:center;border-radius:10px;margin:25px 0;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Your OTP Code</p>
        <h1 style="margin:10px 0;font-size:36px;letter-spacing:6px;color:#2563eb;">${otp}</h1>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Valid for ${expiryText}</p>
      </div>

      <p style="color:#4b5563;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="margin-top:20px;color:#111827;">
        Regards,<br/>
        <b>ServiGlow Team</b>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#111827;padding:15px;text-align:center;color:#ffffff;font-size:12px;">
      © ${new Date().getFullYear()} ServiGlow. All rights reserved.
    </div>

  </div>
</div>
`;