import pool from "../../../config/db.js";
import { PartnerModel } from "../models/partner.model.js";
import { PartnerRevenueModel } from "../models/partnerRevenue.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendMail } from "../../../utils/sendMail.js";
import bcrypt from "bcrypt";
import fs from "fs";
import validator from "validator";
import { deleteFile } from "../../../utils/file.utils.js";

// ══════════════════════════════════════════════
// REGISTER PARTNER
// ══════════════════════════════════════════════
export const registerPartner = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const {
      firstName, lastName, email, password, phone,
      businessName, categoryId, subCategoryId,
      yearsOfExperience, serviceAreas, about,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !phone) {
      throw new Error("Required fields are missing");
    }

    const formattedEmail = email.toLowerCase().trim();

    // ── Check OTP verified ──
    const [otpRows] = await conn.query(
      `SELECT id FROM otps WHERE email = ? AND is_verified = true AND type = 'register' LIMIT 1`,
      [formattedEmail]
    );
    if (!otpRows.length) {
      throw new Error("Please verify your email before registration");
    }

    // ── Check user exists ──
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [formattedEmail]
    );
    if (existing.length) throw new Error("User already exists");

    // ── Validate IDs ──
    const [catRows] = await conn.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1", [categoryId]
    );
    if (!catRows.length) throw new Error("Invalid categoryId");

    const [subCatRows] = await conn.query(
      "SELECT id FROM sub_categories WHERE id = ? LIMIT 1", [subCategoryId]
    );
    if (!subCatRows.length) throw new Error("Invalid subCategoryId");

    // ── Create user ──
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      `INSERT INTO users (first_name, last_name, email, password, phone, role, partner_status)
       VALUES (?, ?, ?, ?, ?, 'partner', 'pending')`,
      [firstName.trim(), lastName.trim(), formattedEmail, hashedPassword, phone]
    );
    const userId = userResult.insertId;

    // ── Parse service areas ──
    let areas = serviceAreas;
    if (typeof areas === "string") {
      try { areas = JSON.parse(areas); } catch { areas = [areas]; }
    }

    // ── Create partner profile ──
    await conn.query(
      `INSERT INTO partner_profiles
        (user_id, business_name, category_id, sub_category_id, years_of_experience,
         service_areas, logo, doc_business_license, doc_certificate, doc_insurance,
         about, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId, businessName.trim(), categoryId, subCategoryId,
        Number(yearsOfExperience),
        JSON.stringify(Array.isArray(areas) ? areas : [areas]),
        req.files?.logo?.[0]?.path || null,
        req.files?.businessLicense?.[0]?.path || null,
        req.files?.certificate?.[0]?.path || null,
        req.files?.insurance?.[0]?.path || null,
        about || null,
      ]
    );

    await conn.commit();
    conn.release();

    // ── Respond immediately ──
    res.status(201).json({
      success: true,
      message: "Partner registered. Waiting for admin approval.",
    });

    // ── Send email non-blocking ──
    sendMail({
      to: formattedEmail,
      subject: "Application Submitted Successfully",
      html: `
        <div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
              <h2 style="margin:0;">ServiGlow</h2>
            </div>
            <div style="padding:30px;">
              <h3 style="color:#111827;">🎉 Application Submitted Successfully!</h3>
              <p>Dear <b>${firstName} ${lastName}</b>,</p>
              <p>Thank you for submitting your partner application. It is currently under review.</p>
              <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
                <p><b>Name:</b> ${firstName} ${lastName}</p>
                <p><b>Email:</b> ${formattedEmail}</p>
                <p><b>Business Name:</b> ${businessName}</p>
                <p>Status: <b style="color:#f97316;">Pending Review</b></p>
              </div>
              <p>You will be notified once your application is <b>approved</b> or <b>rejected</b>.</p>
            </div>
            <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
              © ${new Date().getFullYear()} ServiGlow. All rights reserved.
            </div>
          </div>
        </div>`,
    });

  } catch (error) {
    await conn.rollback();
    conn.release();

    // ── Cleanup uploaded files ──
    if (req.files) {
      Object.values(req.files).flat().forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════
// GET PARTNER PROFILE
// ══════════════════════════════════════════════
export const getPartnerProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const profile = await PartnerModel.findByUserId(userId);
  if (!profile) return res.status(404).json({ success: false, message: "Partner profile not found" });

  // parse JSON service_areas
  if (profile.service_areas && typeof profile.service_areas === "string") {
    profile.service_areas = JSON.parse(profile.service_areas);
  }

  res.status(200).json({ success: true, data: profile });
});

// ══════════════════════════════════════════════
// GET PARTNER DASHBOARD
// ══════════════════════════════════════════════
export const getPartnerDashboard = asyncHandler(async (req, res) => {
  const partnerId = req.user.id;

  console.log("partnerId", partnerId)

  const [[{ totalServices }]] = await pool.query(
    "SELECT COUNT(*) AS totalServices FROM services WHERE created_by = ?",
    [partnerId]
  );

  const [[{ totalBookings }]] = await pool.query(
    "SELECT COUNT(*) AS totalBookings FROM bookings WHERE partner_id = ?",
    [partnerId]
  );

  const totalRevenue = await PartnerRevenueModel.getTotalRevenue(partnerId);

  const [bookingStats] = await pool.query(
    `SELECT status, COUNT(*) AS count FROM bookings WHERE partner_id = ? GROUP BY status`,
    [partnerId]
  );

  const bookingStatusStats = { Accept: 0, Pending: 0, Completed: 0, Reject: 0, Cancelled: 0 };
  bookingStats.forEach(({ status, count }) => {
    if (status in bookingStatusStats) bookingStatusStats[status] = Number(count);
  });

  res.status(200).json({
    success: true,
    data: { totalServices, totalBookings, totalRevenue, bookingStatusStats },
  });
});

// ══════════════════════════════════════════════
// GET LAST 7 DAYS BOOKINGS
// ══════════════════════════════════════════════
export const getLast7DaysBookings = asyncHandler(async (req, res) => {
  const partnerId = req.user.id;

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%d/%m') AS _id, COUNT(*) AS totalBookings
     FROM bookings
     WHERE partner_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
     GROUP BY DATE_FORMAT(created_at, '%d/%m')
     ORDER BY MIN(created_at) ASC`,
    [partnerId]
  );

  res.status(200).json({ success: true, data: rows });
});

// ══════════════════════════════════════════════
// GET CUSTOMER DASHBOARD
// ══════════════════════════════════════════════
export const getCustomerDashboard = asyncHandler(async (req, res) => {
  const customerId = req.user.id;

  const [[{ totalBookings }]] = await pool.query(
    "SELECT COUNT(*) AS totalBookings FROM bookings WHERE customer_id = ?",
    [customerId]
  );

  const [bookingStats] = await pool.query(
    "SELECT status, COUNT(*) AS count FROM bookings WHERE customer_id = ? GROUP BY status",
    [customerId]
  );

  const bookingStatusStats = { Accept: 0, Active: 0, Completed: 0, Pending: 0, Reject: 0, Cancelled: 0 };
  bookingStats.forEach(({ status, count }) => {
    if (status in bookingStatusStats) bookingStatusStats[status] = Number(count);
  });

  res.status(200).json({ success: true, data: { totalBookings, bookingStatusStats } });
});

// ══════════════════════════════════════════════
// TOGGLE PARTNER ACTIVE (admin)
// ══════════════════════════════════════════════
export const togglePartnerActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "isActive must be boolean" });
  }

  const partner = await PartnerModel.findById(id);
  if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

  await PartnerModel.toggleActive(id, isActive);

  res.status(200).json({
    success: true,
    message: `Partner ${isActive ? "activated" : "deactivated"} successfully`,
  });
});

// ══════════════════════════════════════════════
// GET PARTNER REVENUE DETAILS (paginated)
// ══════════════════════════════════════════════
export const getPartnerRevenueDetailsByPartnerId = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const pageNum = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limitNum = Math.min(Math.max(parseInt(req.query.limit || 10, 10), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const total = await PartnerRevenueModel.countByPartner(partnerId);
  const rows = await PartnerRevenueModel.getPaginated(partnerId, skip, limitNum);

  const data = rows.map((item) => {
    const customerName = [item.first_name, item.last_name].filter(Boolean).join(" ").trim();
    const address = [item.addr_line1, item.addr_line2, item.addr_city, item.addr_state, item.addr_zip]
      .filter(Boolean).join(", ") || "N/A";

    return {
      revenueId: item.id,
      bookingId: item.booking_id,
      customerId: item.customer_id,
      customerName: customerName || "N/A",
      mobileNumber: item.customer_phone || "N/A",
      email: item.customer_email || "N/A",
      address,
      revenue: item.service_charges,
      price: item.revenue,
      date: item.revenue_date,
      time: item.revenue_time,
      status: item.booking_status || "N/A",
      serviceId: item.service_id,
      partnerId: item.partner_id,
    };
  });

  res.status(200).json({
    success: true,
    total,
    data,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
});

// ══════════════════════════════════════════════
// UPDATE PARTNER PROFILE
// ══════════════════════════════════════════════
export const updatePartnerProfile = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const userId = req.user.id;
    const {
      firstName, lastName, email, phone,
      businessName, categoryId, subCategoryId,
      yearsOfExperience, serviceAreas, about, isAvailable,
    } = req.body;

    // ── Fetch existing records ──
    const [userRows] = await conn.query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]);
    const [ppRows] = await conn.query("SELECT * FROM partner_profiles WHERE user_id = ? LIMIT 1", [userId]);

    if (!userRows.length || !ppRows.length) throw new Error("Partner not found");

    const user = userRows[0];
    const partner = ppRows[0];

    // ── User fields ──
    const userUpdates = {};

    if (firstName !== undefined) {
      if (firstName.trim().length < 2) throw new Error("First name must be at least 2 characters");
      userUpdates.first_name = firstName.trim();
    }
    if (lastName !== undefined) {
      if (lastName.trim().length < 2) throw new Error("Last name must be at least 2 characters");
      userUpdates.last_name = lastName.trim();
    }
    if (email !== undefined) {
      const fmt = email.toLowerCase().trim();
      if (!validator.isEmail(fmt)) throw new Error("Invalid email format");
      const [dup] = await conn.query(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1", [fmt, userId]
      );
      if (dup.length) throw new Error("Email already in use");
      userUpdates.email = fmt;
    }
    if (phone !== undefined) {
      if (!validator.isMobilePhone(String(phone), "any")) throw new Error("Invalid phone number");
      userUpdates.phone = phone;
    }

    if (Object.keys(userUpdates).length) {
      const setClauses = Object.keys(userUpdates).map(k => `${k} = ?`).join(", ");
      await conn.query(
        `UPDATE users SET ${setClauses} WHERE id = ?`,
        [...Object.values(userUpdates), userId]
      );
    }

    // ── Partner fields ──
    const ppUpdates = {};

    if (businessName !== undefined) ppUpdates.business_name = businessName.trim();
    if (categoryId !== undefined) ppUpdates.category_id = categoryId;
    if (subCategoryId !== undefined) ppUpdates.sub_category_id = subCategoryId;
    if (yearsOfExperience !== undefined) ppUpdates.years_of_experience = Number(yearsOfExperience);
    if (about !== undefined) ppUpdates.about = about;

    if (isAvailable !== undefined) {
      if (typeof isAvailable === "boolean") {
        ppUpdates.is_available = isAvailable;

      } else if (typeof isAvailable === "string") {
        ppUpdates.is_available = ["true", "1"].includes(isAvailable.toLowerCase());

      } else if (typeof isAvailable === "number") {
        ppUpdates.is_available = isAvailable === 1;

      } else {
        throw new Error("Invalid value for isAvailable");
      }
    }

    if (serviceAreas !== undefined) {
      let areas = serviceAreas;
      if (typeof areas === "string") {
        try { areas = JSON.parse(areas); } catch { areas = [areas]; }
      }
      ppUpdates.service_areas = JSON.stringify(Array.isArray(areas) ? areas : [areas]);
    }

    // ── File handling ──
    // const deleteOld = (oldPath, newPath) => {
    //   if (newPath && oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    // };

    if (req.files) {
      if (req.files.businessLicense?.[0]) {
        deleteFile(partner.doc_business_license);
        ppUpdates.doc_business_license = req.files.businessLicense[0].path;
      }

      if (req.files.certificate?.[0]) {
        deleteFile(partner.doc_certificate);
        ppUpdates.doc_certificate = req.files.certificate[0].path;
      }

      if (req.files.insurance?.[0]) {
        deleteFile(partner.doc_insurance);
        ppUpdates.doc_insurance = req.files.insurance[0].path;
      }

      if (req.files.logo?.[0]) {
        deleteFile(partner.logo);
        ppUpdates.logo = req.files.logo[0].path;
      }
    }

    if (Object.keys(ppUpdates).length) {
      const setClauses = Object.keys(ppUpdates).map(k => `${k} = ?`).join(", ");
      await conn.query(
        `UPDATE partner_profiles SET ${setClauses} WHERE user_id = ?`,
        [...Object.values(ppUpdates), userId]
      );
    }

    await conn.commit();
    conn.release();

    res.status(200).json({ success: true, message: "Partner profile updated successfully" });

  } catch (error) {
    await conn.rollback();
    conn.release();

    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => deleteFile(file.path));
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════
// TOGGLE PARTNER AVAILABILITY
// ══════════════════════════════════════════════
export const togglePartnerAvailability = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access" });

  const profile = await PartnerModel.findByUserId(userId);
  if (!profile) return res.status(404).json({ success: false, message: "Partner profile not found" });

  const isAvailable = await PartnerModel.toggleAvailability(userId);

  res.status(200).json({
    success: true,
    message: `You are now ${isAvailable ? "Available" : "Unavailable"}`,
    data: { is_available: isAvailable },
  });
});