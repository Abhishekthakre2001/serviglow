import bcrypt from "bcrypt";
import validator from "validator";
import pool from "../../../config/db.js";
import { AdminModel } from "../models/admin.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generateAccessRefreshToken } from "../../../utils/generateToken.js";
import { sendMail } from "../../../utils/sendMail.js";
import fs from "fs";
import path from "path";

const loginUrl = process.env.LOGIN_URL;

// ══════════════════════════════════════════════
// REGISTER ADMIN
// ══════════════════════════════════════════════
export const registerAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, designation } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const formattedEmail = email.toLowerCase().trim();

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1", [formattedEmail]
  );
  if (existing.length) {
    return res.status(409).json({ success: false, message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, phone, role, designation)
     VALUES (?, ?, ?, ?, ?, 'admin', ?)`,
    [firstName.trim(), lastName.trim(), formattedEmail, hashed, phone, designation || null]
  );

  return res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    data: { id: result.insertId, email: formattedEmail, role: "admin", designation: designation || null },
  });
});

// ══════════════════════════════════════════════
// UPDATE ADMIN PROFILE
// ══════════════════════════════════════════════
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { firstName, lastName, email, phone, designation } = req.body;

  const [adminRows] = await pool.query(
    "SELECT * FROM users WHERE id = ? AND role IN ('admin', 'superadmin') LIMIT 1",
    [adminId]
  );

  console.log("adminRows", adminRows)
  if (!adminRows.length) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  const hasUpdate = [firstName, lastName, email, phone, designation].some(v => v !== undefined);
  if (!hasUpdate) {
    return res.status(400).json({ success: false, message: "No data provided for update" });
  }

  const updates = {};

  if (firstName !== undefined) {
    if (firstName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "First name must be at least 2 characters" });
    }
    updates.first_name = firstName.trim();
  }

  if (lastName !== undefined) {
    if (lastName.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Last name must be at least 2 characters" });
    }
    updates.last_name = lastName.trim();
  }

  if (email !== undefined) {
    const fmt = email.toLowerCase().trim();
    if (!validator.isEmail(fmt)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    const [dup] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1", [fmt, adminId]
    );
    if (dup.length) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    updates.email = fmt;
  }

  if (phone !== undefined) {
    if (!validator.isMobilePhone(String(phone), "any")) {
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }
    updates.phone = phone;
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(", ");
  await pool.query(
    `UPDATE users SET ${setClauses} WHERE id = ?`,
    [...Object.values(updates), adminId]
  );

  const [updated] = await pool.query(
    "SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?",
    [adminId]
  );

  return res.status(200).json({
    success: true,
    message: "Admin profile updated successfully",
    data: {
      id: updated[0].id,
      firstName: updated[0].first_name,
      lastName: updated[0].last_name,
      email: updated[0].email,
      phone: updated[0].phone,
      role: updated[0].role,
    },
  });
});

// ══════════════════════════════════════════════
// APPROVE PARTNER
// ══════════════════════════════════════════════
export const approvePartner = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;

  const [ppRows] = await pool.query(
    `SELECT pp.*, u.email, u.first_name, u.last_name
     FROM partner_profiles pp
     JOIN users u ON u.id = pp.user_id
     WHERE pp.id = ? LIMIT 1`,
    [partnerId]
  );
  if (!ppRows.length) {
    return res.status(404).json({ success: false, message: "Partner not found" });
  }

  const partner = ppRows[0];

  if (partner.approval_status === "approved") {
    return res.status(400).json({ success: false, message: "Partner already approved" });
  }

  await pool.query(
    "UPDATE partner_profiles SET approval_status = 'approved', is_active = 1, rejection_reason = NULL WHERE id = ?",
    [partnerId]
  );

  res.status(200).json({ success: true, message: "Partner approved successfully" });

  // ── Non-blocking email ──
  sendMail({
    to: partner.email,
    subject: "Partner Registration Approved 🎉",
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
            <h2 style="margin:0;">ServiGlow</h2>
          </div>
          <div style="padding:30px;">
            <h3 style="color:#111827;">🎉 Congratulations, Your Application is Approved!</h3>
            <p>Dear <b>${partner.first_name} ${partner.last_name}</b>,</p>
            <p>Your partner registration has been <b style="color:#16a34a;">approved successfully</b>.</p>
            <div style="background:#f0fdf4;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #16a34a;">
              <p style="margin:0;">✅ You can now log in to access your partner dashboard.</p>
            </div>
            <div style="text-align:center;margin:30px 0;">
              <a href="${loginUrl}" style="background:linear-gradient(90deg,#2563eb,#f97316);color:#fff;padding:12px 25px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                Login to Your Dashboard
              </a>
            </div>
            <p>Regards,<br/><b>ServiGlow Team</b></p>
          </div>
          <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
            © ${new Date().getFullYear()} ServiGlow. All rights reserved.
          </div>
        </div>
      </div>`,
  }).catch(err => console.error("Approval email failed:", err));
});

// ══════════════════════════════════════════════
// REJECT PARTNER
// ══════════════════════════════════════════════
export const rejectPartner = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason?.trim()) {
    return res.status(400).json({ success: false, message: "Rejection reason is required" });
  }

  const [ppRows] = await pool.query(
    `SELECT pp.*, u.email, u.first_name, u.last_name, u.id AS user_id
     FROM partner_profiles pp
     JOIN users u ON u.id = pp.user_id
     WHERE pp.id = ? LIMIT 1`,
    [partnerId]
  );
  if (!ppRows.length) {
    return res.status(404).json({ success: false, message: "Partner not found" });
  }

  const partner = ppRows[0];

  // ── Delete profile + user ──
  await pool.query("DELETE FROM partner_profiles WHERE id = ?", [partnerId]);
  await pool.query("DELETE FROM users WHERE id = ?", [partner.user_id]);

  res.status(200).json({ success: true, message: "Partner rejected and deleted successfully" });

  // ── Non-blocking email ──
  sendMail({
    to: partner.email,
    subject: "Partner Registration Update",
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">
            <h2 style="margin:0;">ServiGlow</h2>
          </div>
          <div style="padding:30px;">
            <h3 style="color:#111827;">Application Status Update</h3>
            <p>Dear <b>${partner.first_name} ${partner.last_name}</b>,</p>
            <p>After careful review, your application has been <b style="color:#dc2626;">rejected</b>.</p>
            <div style="margin:20px 0;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
              <p style="margin:0 0 8px 0;font-size:14px;color:#991b1b;font-weight:bold;">Rejection Reason:</p>
              <p style="margin:0;font-size:14px;color:#7f1d1d;">${rejectionReason.trim()}</p>
            </div>
            <p>Regards,<br/><b>ServiGlow Team</b></p>
          </div>
          <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">
            © ${new Date().getFullYear()} ServiGlow. All rights reserved.
          </div>
        </div>
      </div>`,
  }).catch(err => console.error("Rejection email failed:", err));
});

// ══════════════════════════════════════════════
// GET PENDING PARTNERS
// ══════════════════════════════════════════════
export const getPendingPartners = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT pp.*,
       u.first_name, u.last_name, u.email, u.phone,
       c.category_name, sc.sub_category_name
     FROM partner_profiles pp
     JOIN users u ON u.id = pp.user_id
     LEFT JOIN categories c ON c.id = pp.category_id
     LEFT JOIN sub_categories sc ON sc.id = pp.sub_category_id
     WHERE pp.approval_status = 'pending'
     ORDER BY pp.created_at DESC`
  );

  res.json({ success: true, data: rows });
});

// ══════════════════════════════════════════════
// GET ALL PARTNERS (with stats)
// ══════════════════════════════════════════════
export const getAllPartners = asyncHandler(async (req, res) => {
  const [partners] = await pool.query(
    `SELECT pp.*,
       u.first_name, u.last_name, u.email, u.phone,
       c.category_name, sc.sub_category_name
     FROM partner_profiles pp
     JOIN users u ON u.id = pp.user_id
     LEFT JOIN categories c ON c.id = pp.category_id
     LEFT JOIN sub_categories sc ON sc.id = pp.sub_category_id
     ORDER BY pp.created_at DESC`
  );

  if (!partners.length) {
    return res.status(200).json({ success: true, data: [] });
  }

  const partnerUserIds = partners.map(p => p.user_id);

  const [bookingStats] = await pool.query(
    `SELECT partner_id,
       COUNT(*) AS totalBookings,
       SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completedBookings
     FROM bookings
     WHERE partner_id IN (?)
     GROUP BY partner_id`,
    [partnerUserIds]
  );

  const [reviewStats] = await pool.query(
    `SELECT partner_id, COUNT(*) AS totalReviews
     FROM reviews
     WHERE partner_id IN (?)
     GROUP BY partner_id`,
    [partnerUserIds]
  );

  const [revenueStats] = await pool.query(
    `SELECT partner_id, COALESCE(SUM(service_charges), 0) AS totalRevenue
     FROM partner_revenue
     WHERE partner_id IN (?)
     GROUP BY partner_id`,
    [partnerUserIds]
  );

  // Build lookup maps
  const bookingMap = new Map(bookingStats.map(r => [r.partner_id, r]));
  const reviewMap = new Map(reviewStats.map(r => [r.partner_id, r]));
  const revenueMap = new Map(revenueStats.map(r => [r.partner_id, r]));

  const finalData = partners.map(p => ({
    ...p,
    totalBookings: Number(bookingMap.get(p.user_id)?.totalBookings || 0),
    completedBookings: Number(bookingMap.get(p.user_id)?.completedBookings || 0),
    totalReviews: Number(reviewMap.get(p.user_id)?.totalReviews || 0),
    totalRevenue: Number(revenueMap.get(p.user_id)?.totalRevenue || 0),
  }));

  res.status(200).json({ success: true, data: finalData });
});

// ══════════════════════════════════════════════
// GET PARTNER DETAILS
// ══════════════════════════════════════════════
export const getPartnerDetails = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;

  const [rows] = await pool.query(
    `SELECT pp.*,
       u.first_name, u.last_name, u.email, u.phone, u.role,
       c.category_name, sc.sub_category_name
     FROM partner_profiles pp
     JOIN users u ON u.id = pp.user_id
     LEFT JOIN categories c ON c.id = pp.category_id
     LEFT JOIN sub_categories sc ON sc.id = pp.sub_category_id
     WHERE pp.id = ? LIMIT 1`,
    [partnerId]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, message: "Partner not found" });
  }

  res.json({ success: true, data: rows[0] });
});

// ══════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    [usersRows],
    [partnersRows],
    [contactsRows],
    [quotesRows],
    [categoriesRows],
    [subCategoriesRows],
    [activeRows],
    [inactiveRows],
  ] = await Promise.all([
    pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'customer'"),
    pool.query("SELECT COUNT(*) AS totalPartners FROM users WHERE role = 'partner'"),
    pool.query("SELECT COUNT(*) AS totalContacts FROM contacts"),
    pool.query("SELECT COUNT(*) AS totalQuotes FROM quotes"),
    pool.query("SELECT COUNT(*) AS totalCategories FROM categories"),
    pool.query("SELECT COUNT(*) AS totalSubCategories FROM sub_categories"),
    pool.query("SELECT COUNT(*) AS activePartners FROM partner_profiles WHERE is_active = true"),
    pool.query("SELECT COUNT(*) AS inActivePartners FROM partner_profiles WHERE is_active = false"),
  ]);

  // ✅ Extract values
  const totalUsers = usersRows[0].totalUsers;
  const totalPartners = partnersRows[0].totalPartners;
  const totalContacts = contactsRows[0].totalContacts;
  const totalQuotes = quotesRows[0].totalQuotes;
  const totalCategories = categoriesRows[0].totalCategories;
  const totalSubCategories = subCategoriesRows[0].totalSubCategories;
  const activePartners = activeRows[0].activePartners;
  const inActivePartners = inactiveRows[0].inActivePartners;

  // ✅ Partner status
  const [partnerStatusRows] = await pool.query(`
    SELECT approval_status AS status, COUNT(*) AS count
    FROM partner_profiles 
    GROUP BY approval_status
  `);

  const partnerStats = {
    approved: 0,
    pending: 0,
    rejected: 0,
    active: Number(activePartners),
    inactive: Number(inActivePartners),
  };

  partnerStatusRows.forEach(({ status, count }) => {
    partnerStats[status] = Number(count);
  });

  // ✅ Revenue
  const [[{ totalRevenue }]] = await pool.query(`
    SELECT COALESCE(SUM(s.price), 0) AS totalRevenue
    FROM subscriptions s
    JOIN partner_profiles pp ON pp.user_id = s.user_id
    WHERE s.subscription = true 
      AND s.status = 'ACTIVE' 
      AND pp.is_active = true
  `);

  // ✅ Final response
  res.status(200).json({
    success: true,
    data: {
      totalUsers: Number(totalUsers),
      totalPartners: Number(totalPartners),
      totalContacts: Number(totalContacts),
      totalQuotes: Number(totalQuotes),
      totalCategories: Number(totalCategories),
      totalSubCategories: Number(totalSubCategories),
      partnerStats,
      totalRevenue: Number(totalRevenue),
    },
  });
});

// ══════════════════════════════════════════════
// ADMIN LAST 7 DAYS BOOKINGS
// ══════════════════════════════════════════════
export const getAdminLast7DaysBookings = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%d/%m') AS _id, COUNT(*) AS totalBookings
     FROM bookings
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
     GROUP BY DATE_FORMAT(created_at, '%d/%m')
     ORDER BY MIN(created_at) ASC`
  );

  res.status(200).json({ success: true, data: rows });
});

// ══════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════
export const upsertFooter = asyncHandler(async (req, res) => {
  const { highlights, company, quickLinks, contact, bottom } = req.body;

  // ── Validations (same as original) ──
  if (highlights && !Array.isArray(highlights)) {
    return res.status(400).json({ success: false, message: "Highlights must be an array" });
  }
  if (highlights?.length > 5) {
    // return res.status(400).json({ success: false, message: "Maximum 5 highlights allowed" });
  }
  highlights?.forEach((item, i) => {
    if (!item.text?.trim()) throw new Error(`Highlight ${i + 1} text is required`);
  });
  if (company?.logo && !validator.isURL(company.logo)) {
    throw new Error("Company logo must be a valid URL");
  }
  if (contact?.email && !validator.isEmail(contact.email)) {
    throw new Error("Invalid contact email");
  }
  if (contact?.phone && !validator.isMobilePhone(contact.phone, "any")) {
    throw new Error("Invalid phone number");
  }

  const isNew = !(await AdminModel.getFooter());
  const footer = await AdminModel.upsertFooter({ highlights, company, quickLinks, contact, bottom });

  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? "Footer created successfully" : "Footer updated successfully",
    data: footer,
  });
});

export const getFooter = asyncHandler(async (req, res) => {
  const footer = await AdminModel.getFooter();

  const defaultFooter = {
    highlights: [
      { text: "Verified & Trusted Professionals", icon: "" },
      { text: "4.8★ Rated by 10,000+ Customers", icon: "" },
      { text: "On-Demand Home Services", icon: "" },
    ],
    company: {
      name: "ServiGlow",
      description: "Premium home services delivered by trusted professionals.",
      logo: "",
      socials: [
        { platform: "facebook", icon: "", link: "#" },
        { platform: "instagram", icon: "", link: "#" },
        { platform: "twitter", icon: "", link: "#" },
        { platform: "linkedin", icon: "", link: "#" },
      ],
    },
    quickLinks: [
      { label: "Home", link: "/" },
      { label: "Services", link: "/services" },
      { label: "Login", link: "/login" },
      { label: "Contact", link: "/contact" },
    ],
    contact: {
      companyName: "ServiGlow Inc.",
      address: "245 Market Street, Suite 210, San Francisco, CA 94105",
      phone: "+91 99999 88888",
      email: "support@serviglow.com",
    },
    bottom: {
      copyright: "© 2026 ServiGlow. All rights reserved.",
      links: [
        { label: "Privacy Policy", link: "/privacy-policy" },
        { label: "Terms & Conditions", link: "/terms" },
      ],
    },
  };

  return res.status(200).json({ success: true, data: footer || defaultFooter });
});

// ══════════════════════════════════════════════
// HOME SECTION
// ══════════════════════════════════════════════
const isValidPhone = (phone) => /^[+]?[\d\s-]{10,15}$/.test(phone);

export const upsertHomeSection = asyncHandler(async (req, res) => {
  const { whyChooseUs, quickSupport } = req.body;

  if (whyChooseUs?.points?.length) {
    for (const point of whyChooseUs.points) {
      if (!point.text?.trim()) {
        return res.status(400).json({ success: false, message: "Each point must have text" });
      }
    }
  }
  if (quickSupport?.phoneNumber && !isValidPhone(quickSupport.phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number" });
  }

  const data = await AdminModel.upsertHomeSection({ whyChooseUs, quickSupport });
  res.status(200).json({ success: true, message: "Home section updated successfully", data });
});

export const getHomeSection = asyncHandler(async (req, res) => {
  const data = await AdminModel.getHomeSection();

  const defaultData = {
    whyChooseUs: {
      heading: "Why Choose Us?",
      points: [
        { text: "Verified background-checked professionals" },
        { text: "Transparent pricing with no hidden charges" },
        { text: "Same-day service availability" },
      ],
    },
    quickSupport: {
      heading: "Quick Support",
      description: "Call or WhatsApp us anytime for instant assistance.",
      phoneNumber: "+91 99999 88888",
    },
  };

  res.status(200).json({ success: true, data: data || defaultData });
});

// ══════════════════════════════════════════════
// BANNER
// ══════════════════════════════════════════════
// export const getBanner = asyncHandler(async (req, res) => {
//   const banner = await AdminModel.getBanner();

//   const defaultBanner = {
//     counters: [
//       { number: "10K+", title: "Happy Customers" },
//       { number: "4.8★", title: "Average Rating" },
//       { number: "500+", title: "Verified Professionals" },
//       { number: "24/7", title: "Support Available" },
//     ],
//   };

//   return res.status(200).json({ success: true, data: banner || defaultBanner });
// });
export const getBanner = asyncHandler(async (req, res) => {
  const banner = await AdminModel.getBanner();

  return res.status(200).json({
    success: true,
    data: banner,
  });
});

export const updateBanner = asyncHandler(async (req, res) => {

  const {
    counters,
    real_count,
  } = req.body;

  console.log("FULL BODY", req.body);

  if (!Array.isArray(counters)) {
    return res.status(400).json({
      success: false,
      message: "counters must be array",
    });
  }

  await AdminModel.upsertBanner(
    counters,
    real_count
  );

  const banner =
    await AdminModel.getBanner();

  return res.status(200).json({
    success: true,
    message: "Banner updated successfully",
    data: banner,
  });

});

// ══════════════════════════════════════════════
// POLICIES
// ══════════════════════════════════════════════
export const getPolicies = asyncHandler(async (req, res) => {
  const rows = await AdminModel.getPolicies();
  return res.status(200).json({ success: true, data: rows });
});

export const getPolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const policy = await AdminModel.getPolicyById(id);
  if (!policy) return res.status(404).json({ success: false, message: "Policy not found" });
  return res.status(200).json({ success: true, data: policy });
});

export const upsertPolicy = asyncHandler(async (req, res) => {
  const { id, title, content } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ success: false, message: "Title and content are required" });
  }

  const policies = await AdminModel.upsertPolicy({ id, title, content });

  return res.status(200).json({ success: true, message: id ? "Policy updated" : "Policy created", data: policies });
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AdminModel.deletePolicy(id);
  return res.status(200).json({ success: true, message: "Policy deleted" });
});


// ═══════════════════════════════
// GET ADMINS
// ═══════════════════════════════
export const getAdmins = asyncHandler(async (req, res) => {

  const [rows] = await pool.query(`
    SELECT
      id,
      first_name,
      last_name,
      designation,
      email,
      phone,
      status,
      role,
      created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY id DESC
  `);

  res.status(200).json({
    success: true,
    data: rows,
  });
});


// ═══════════════════════════════
// UPDATE ADMIN
// ═══════════════════════════════
export const updateAdmin = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const {
    firstName,
    lastName,
    email,
    phone,
    designation,
  } = req.body;

  const [existing] = await pool.query(
    `SELECT * FROM users
     WHERE id = ?
     AND role = 'admin'
     LIMIT 1`,
    [id]
  );

  if (!existing.length) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  await pool.query(
    `
    UPDATE users
    SET
      first_name = ?,
      last_name = ?,
      email = ?,
      phone = ?,
      designation = ?
    WHERE id = ?
    `,
    [
      firstName,
      lastName,
      email,
      phone,
      designation || null,
      id,
    ]
  );

  res.status(200).json({
    success: true,
    message: "Admin updated successfully",
  });
});


// ═══════════════════════════════
// DELETE ADMIN
// ═══════════════════════════════
export const deleteAdmin = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const [existing] = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
    AND role = 'admin'
    LIMIT 1
    `,
    [id]
  );

  if (!existing.length) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  await pool.query(
    `DELETE FROM users WHERE id = ?`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "Admin deleted successfully",
  });
});

// ═══════════════════════════════
// UPDATE ADMIN STATUS
// ═══════════════════════════════
export const updateAdminStatus = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const { status } = req.body;

  // VALIDATION
  if (status !== 0 && status !== 1) {
    return res.status(400).json({
      success: false,
      message: "Status must be 0 or 1",
    });
  }

  // CONVERT NUMBER TO ENUM VALUE
  const statusValue =
    Number(status) === 1
      ? "active"
      : "inactive";

  // CHECK ADMIN
  const [adminRows] = await pool.query(
    `
    SELECT id, first_name, last_name, role
    FROM users
    WHERE id = ?
    AND role IN ('admin', 'superadmin')
    LIMIT 1
    `,
    [id]
  );

  if (!adminRows.length) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  // UPDATE STATUS
  await pool.query(
    `
    UPDATE users
    SET status = ?
    WHERE id = ?
    `,
    [statusValue, id]
  );

  res.status(200).json({
    success: true,
    message: `Admin ${statusValue === "active"
      ? "activated"
      : "deactivated"
      } successfully`,
  });
});


// ═══════════════════════════════
// UPDATE ADMIN PERMISSIONS
// ═══════════════════════════════
export const updateAdminPermissions = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const { permissions } = req.body;

  /*
    permissions example:

    {
      dashboard: 1,
      partners: 1,
      master_module: 0,
      customer: 1,
      inquiry: 0,
      admins: 1,
      reviews: 1,
      subscription: 0,
      account: 1,
      content: 1
    }
  */

  // CHECK ADMIN
  const [adminRows] = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
    AND role = 'admin'
    LIMIT 1
    `,
    [id]
  );

  if (!adminRows.length) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  // DEFAULT VALUES
  const {
    dashboard = 0,
    partners = 0,
    master_module = 0,
    customer = 0,
    inquiry = 0,
    admins = 0,
    reviews = 0,
    subscription = 0,
    account = 0,
    content = 0,
  } = permissions || {};

  // CHECK PERMISSION ROW EXISTS
  const [existingRows] = await pool.query(
    `
    SELECT id
    FROM admin_permissions
    WHERE admin_id = ?
    LIMIT 1
    `,
    [id]
  );

  // UPDATE
  if (existingRows.length) {

    await pool.query(
      `
      UPDATE admin_permissions
      SET
        dashboard = ?,
        partners = ?,
        master_module = ?,
        customer = ?,
        inquiry = ?,
        admins = ?,
        reviews = ?,
        subscription = ?,
        account = ?,
        content = ?
      WHERE admin_id = ?
      `,
      [
        dashboard,
        partners,
        master_module,
        customer,
        inquiry,
        admins,
        reviews,
        subscription,
        account,
        content,
        id,
      ]
    );

  }

  // INSERT
  else {

    await pool.query(
      `
      INSERT INTO admin_permissions
      (
        admin_id,
        dashboard,
        partners,
        master_module,
        customer,
        inquiry,
        admins,
        reviews,
        subscription,
        account,
        content
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        dashboard,
        partners,
        master_module,
        customer,
        inquiry,
        admins,
        reviews,
        subscription,
        account,
        content,
      ]
    );

  }

  res.status(200).json({
    success: true,
    message: "Permissions updated successfully",
    data: {
      admin_id: id,
      permissions: {
        dashboard,
        partners,
        master_module,
        customer,
        inquiry,
        admins,
        reviews,
        subscription,
        account,
        content,
      },
    },
  });
});


// =========================
// GET ADMIN PERMISSIONS
// =========================

export const getAdminPermissions = asyncHandler(async (req, res) => {

  const { id } = req.params;

  console.log("ADMIN ID =>", id);

  const [permissions] = await pool.query(
    `SELECT 
            *
         FROM admin_permissions
         WHERE admin_id = ?`,
    [id]
  );

  if (!permissions.length) {

    return res.status(404).json({
      success: false,
      message: "Permissions not found",
    });
  }

  res.status(200).json({
    success: true,
    data: permissions[0],
  });
});


export const upsertBookingTerms = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: "Content is required",
    });
  }

  await AdminModel.upsert({
    title: title || "Booking Terms & Conditions",
    content,
  });

  res.status(200).json({
    success: true,
    message: "Booking Terms & Conditions saved successfully",
  });
});

export const getBookingTerms = asyncHandler(async (req, res) => {
  const data = await AdminModel.get();

  res.status(200).json({
    success: true,
    data,
  });
});


export const createPage = asyncHandler(async (req, res) => {
  const { title, subtitle, slug, content, status } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  const formattedSlug = title.trim().toLowerCase().replace(/\s+/g, "-");

  const [existing] = await pool.query(
    "SELECT id FROM pages WHERE slug = ?",
    [formattedSlug]
  );

  if (existing.length) {
    return res.status(409).json({
      success: false,
      message: "Slug already exists",
    });
  }

  const [result] = await pool.query(
    `INSERT INTO pages (title, subtitle, slug, content, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      title.trim(),
      subtitle || null,
      formattedSlug,
      JSON.stringify(content),
      status || "draft",
    ]
  );

  return res.status(201).json({
    success: true,
    message: "Page created successfully",
    data: {
      id: result.insertId,
      slug: formattedSlug,
    },
  });
});

export const getPageBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM pages WHERE slug = ? AND status = 'published'",
    [slug]
  );

  if (!rows.length) {
    return res.status(404).json({
      success: false,
      message: "Page not found",
    });
  }

  const page = rows[0];

  let parsedContent = page.content;

  try {
    if (typeof parsedContent === "string") {
      parsedContent = JSON.parse(parsedContent);
    }
  } catch (err) {
    parsedContent = {};
  }

  return res.status(200).json({
    success: true,
    data: {
      ...page,
      content: parsedContent,
    },
  });
});


export const getAllPages = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, title, slug, status, created_at FROM pages ORDER BY id DESC"
  );

  res.status(200).json({
    success: true,
    data: rows,
  });
});

export const updatePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, content, status } = req.body;

  const formattedSlug = title.trim().toLowerCase().replace(/\s+/g, "-");

  const [result] = await pool.query(
    `UPDATE pages
     SET title = ?, subtitle = ?, slug = ?, content = ?, status = ?
     WHERE id = ?`,
    [
      title,
      subtitle || null,
      formattedSlug,
      JSON.stringify(content),
      status,
      id,
    ]
  );

  return res.status(200).json({
    success: true,
    message: "Page updated successfully",
  });
});

export const deletePage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM pages WHERE id = ?", [id]);

  res.status(200).json({
    success: true,
    message: "Page deleted successfully",
  });
});


export const deletePartnerDocument = asyncHandler(async (req, res) => {
  const { partnerId, documentType } = req.params;

  const allowedFields = [
    "doc_business_license",
    "doc_certificate",
    "doc_insurance",
    "doc_tax_id",
    "doc_corporation_cert",
    "doc_gov_id",
    "logo",
  ];

  if (!allowedFields.includes(documentType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid document type",
    });
  }

  const [partners] = await pool.query(
    `SELECT ${documentType} FROM partner_profiles WHERE id = ?`,
    [partnerId]
  );

  if (!partners.length) {
    return res.status(404).json({
      success: false,
      message: "Partner not found",
    });
  }

  const filePath = partners[0][documentType];

  if (!filePath) {
    return res.status(404).json({
      success: false,
      message: "Document not found",
    });
  }

  // Delete file from uploads folder
  const absolutePath = path.join(process.cwd(), filePath.replace(/\\/g, "/"));

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  // Remove path from DB
  await pool.query(
    `UPDATE partner_profiles
     SET ${documentType} = NULL
     WHERE id = ?`,
    [partnerId]
  );

  res.status(200).json({
    success: true,
    message: "Document deleted successfully",
  });
});