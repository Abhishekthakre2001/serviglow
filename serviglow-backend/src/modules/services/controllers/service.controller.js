import pool from "../../../config/db.js";

import { ServiceModel } from "../models/service.model.js";

import { asyncHandler } from "../../../utils/asyncHandler.js";

import { sendMail } from "../../../utils/sendMail.js";

import dotenv from "dotenv";

import { deleteFile } from "../../../utils/file.utils.js";

dotenv.config();

// ══════════════════════════════════════════════

// CREATE SERVICE

// ══════════════════════════════════════════════

export const createService = asyncHandler(async (req, res) => {

  const {

    title, subtitle, slug, aboutService,

    price, keyFeatures, category, subCategory, estimatedTime,

  } = req.body;



  if (!title || !slug || !aboutService || !price || !category || !subCategory || !estimatedTime) {

    return res.status(400).json({ success: false, message: "Required fields are missing" });

  }



  if (req.files && req.files.length > 3) {

    return res.status(400).json({ success: false, message: "Maximum 3 images allowed" });

  }



  const existing = await ServiceModel.findBySlug(slug);

  if (existing) {

    return res.status(409).json({ success: false, message: "Service with this slug already exists" });

  }



  const imageUrls = (req.files || []).map(

    (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`

  );



  // parse keyFeatures if sent as JSON string

  let features = keyFeatures;

  if (typeof features === "string") {

    try { features = JSON.parse(features); } catch { features = [features]; }

  }



  const service = await ServiceModel.create({

    title, subtitle, slug, aboutService, price, estimatedTime,

    keyFeatures: features || [],

    images: imageUrls,

    categoryId: category,

    subCategoryId: subCategory,

    createdBy: req.user.id,

  });



  res.status(201).json({

    success: true,

    message: "Service created successfully",

    data: service,

  });

});



// ══════════════════════════════════════════════

// UPDATE SERVICE

// ══════════════════════════════════════════════

export const updateService = asyncHandler(async (req, res) => {

  const { id } = req.params;



  const service = await ServiceModel.findById(id);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }



  // Only owner can update

  if (String(service.created_by) !== String(req.user.id)) {

    return res.status(403).json({ success: false, message: "Not authorized to update this service" });

  }



  // Images

  let imageUrls = JSON.parse(service.images || "[]");

  if (req.files && req.files.length > 0) {
    if (req.files.length > 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 images allowed",
      });
    }

    // Delete old images
    const oldImages = JSON.parse(service.images || "[]");

    oldImages.forEach((imageUrl) => {
      try {
        const imagePath = new URL(imageUrl).pathname;
        deleteFile(imagePath);
      } catch (err) {
        console.error("Error deleting old image:", err.message);
      }
    });

    // Save new images
    imageUrls = req.files.map(
      (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );
  }



  let features = req.body.keyFeatures;

  if (typeof features === "string") {

    try { features = JSON.parse(features); } catch { features = [features]; }

  }



  const updates = {};

  if (req.body.title !== undefined) updates.title = req.body.title;

  if (req.body.subtitle !== undefined) updates.subtitle = req.body.subtitle;

  if (req.body.slug !== undefined) updates.slug = req.body.slug;

  if (req.body.aboutService !== undefined) updates.about_service = req.body.aboutService;

  if (req.body.price !== undefined) updates.price = req.body.price;

  if (req.body.estimatedTime !== undefined) updates.estimated_time = req.body.estimatedTime;

  if (req.body.category !== undefined) updates.category_id = req.body.category;

  if (req.body.subCategory !== undefined) updates.sub_category_id = req.body.subCategory;

  if (features !== undefined) updates.key_features = features;

  updates.images = imageUrls;



  const updated = await ServiceModel.update(id, updates);



  res.status(200).json({ success: true, message: "Service updated successfully", data: updated });

});



// ══════════════════════════════════════════════

// DELETE SERVICE

// ══════════════════════════════════════════════

export const deleteService = asyncHandler(async (req, res) => {

  const { id } = req.params;



  const service = await ServiceModel.findById(id);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }



  await ServiceModel.deleteById(id);

  const images = JSON.parse(service.images || "[]");

  images.forEach((imageUrl) => {
    try {
      const imagePath = new URL(imageUrl).pathname;
      deleteFile(imagePath);
    } catch (err) {
      console.error("Error deleting image:", err.message);
    }
  });


  res.status(200).json({ success: true, message: "Service deleted successfully" });

});



// ══════════════════════════════════════════════

// GET ALL SERVICES

// ══════════════════════════════════════════════

export const getAllServices = asyncHandler(async (req, res) => {

  const services = await ServiceModel.findAllActive();



  if (!services.length) {

    return res.status(200).json({ success: true, message: "No services available", count: 0, data: [] });

  }



  const parsed = services.map(parseServiceRow);

  res.status(200).json({ success: true, count: parsed.length, data: parsed });

});



// ══════════════════════════════════════════════

// GET SERVICES BY USER ID

// ══════════════════════════════════════════════

export const getServicesByUserId = asyncHandler(async (req, res) => {

  const { userId } = req.params;

  const services = await ServiceModel.findByUserId(userId);

  res.status(200).json({ success: true, count: services.length, data: services.map(parseServiceRow) });

});



// ══════════════════════════════════════════════

// GET MY SERVICES (paginated)

// ══════════════════════════════════════════════

export const getMyServices = asyncHandler(async (req, res) => {

  const pageNum = Math.max(parseInt(req.query.page || 1, 10), 1);

  const limitNum = Math.min(Math.max(parseInt(req.query.limit || 10, 10), 1), 100);

  const skip = (pageNum - 1) * limitNum;



  const total = await ServiceModel.countMyServices(req.user.id);

  const services = await ServiceModel.findMyServicesPaginated({

    userId: req.user.id, limit: limitNum, skip,

  });



  if (!services.length) {

    return res.status(200).json({

      success: true, message: "No services found", count: 0, data: [],

      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },

    });

  }



  res.status(200).json({

    success: true,

    count: services.length,

    data: services.map(parseServiceRow),

    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },

  });

});


export const getPartnerServices = asyncHandler(async (req, res) => {

  const { userId } = req.query;

  const pageNum = Math.max(parseInt(req.query.page || 1, 10), 1);

  const limitNum = Math.min(Math.max(parseInt(req.query.limit || 10, 10), 1), 100);

  const skip = (pageNum - 1) * limitNum;



  const total = await ServiceModel.countMyServices(userId);

  const services = await ServiceModel.findMyServicesPaginated({

    userId, limit: limitNum, skip,

  });



  if (!services.length) {

    return res.status(200).json({

      success: true, message: "No services found", count: 0, data: [],

      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },

    });

  }



  res.status(200).json({

    success: true,

    count: services.length,

    data: services.map(parseServiceRow),

    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },

  });

});



// ══════════════════════════════════════════════

// GET SERVICE BY SLUG

// ══════════════════════════════════════════════

export const getServiceBySlug = asyncHandler(async (req, res) => {

  const service = await ServiceModel.findBySlugActive(req.params.slug);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }

  res.status(200).json({ success: true, data: parseServiceRow(service) });

});



// ══════════════════════════════════════════════

// GET SERVICE BY ID

// ══════════════════════════════════════════════

export const getServiceById = asyncHandler(async (req, res) => {

  const service = await ServiceModel.findById(req.params.id);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }

  res.status(200).json({ success: true, data: parseServiceRow(service) });

});



// ══════════════════════════════════════════════

// TOGGLE SERVICE STATUS

// ══════════════════════════════════════════════

export const toggleServiceStatus = asyncHandler(async (req, res) => {

  const service = await ServiceModel.findById(req.params.id);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }



  const updated = await ServiceModel.toggleStatus(req.params.id);



  res.status(200).json({

    success: true,

    message: `Service is now ${updated.is_active ? "Active" : "Inactive"}`,

    data: parseServiceRow(updated),

  });

});



// ══════════════════════════════════════════════

// REVIEW SERVICE (admin approve/reject)

// ══════════════════════════════════════════════

export const reviewService = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const { status } = req.body;



  if (!["approved", "rejected"].includes(status)) {

    return res.status(400).json({ success: false, message: "Invalid status value" });

  }



  const service = await ServiceModel.findById(id);

  if (!service) {

    return res.status(404).json({ success: false, message: "Service not found" });

  }



  await ServiceModel.update(id, { is_active: status === "approved" });



  const statusColor = status === "approved" ? "#16a34a" : "#dc2626";



  sendMail({

    to: service.creator_email,

    subject: `Your Service Has Been ${status.toUpperCase()}`,

    html: `

      <div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">

        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,0.08);">

          <div style="background:linear-gradient(90deg,#2563eb,#f97316);padding:20px;text-align:center;color:#fff;">

            <h2 style="margin:0;">ServiGlow</h2>

          </div>

          <div style="padding:30px;">

            <h3 style="color:#111827;">📢 Service Review Update</h3>

            <p>Dear <b>${service.first_name} ${service.last_name}</b>,</p>

            <p>Your submitted service has been reviewed.</p>

            <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">

              <p><b>Service Title:</b> ${service.title}</p>

              <p><b>Status:</b> <span style="color:${statusColor};font-weight:bold;">${status.toUpperCase()}</span></p>

            </div>

            ${status === "approved"

        ? `<p style="color:#16a34a;">🎉 Your service is now live on the platform.</p>`

        : `<p style="color:#dc2626;">Your service was not approved. Please review and resubmit.</p>`

      }

            <p>Regards,<br/><b>ServiGlow Team</b></p>

          </div>

          <div style="background:#111827;padding:15px;text-align:center;color:#fff;font-size:12px;">

            © ${new Date().getFullYear()} ServiGlow. All rights reserved.

          </div>

        </div>

      </div>`,

  }).catch(err => console.error("Review email failed:", err));



  res.status(200).json({ success: true, message: `Service ${status} successfully` });

});



// ══════════════════════════════════════════════

// GET USED CATEGORIES (categories that have active services)

// ══════════════════════════════════════════════

// ══════════════════════════════════════════════

// GET USED CATEGORIES (categories that have active services)

// ══════════════════════════════════════════════

export const getUsedCategories = asyncHandler(async (req, res) => {

  const { zipCode } = req.query;

  // ==================================================
  // CATEGORY QUERY
  // ==================================================

  let categoriesQuery = `
    SELECT 
      c.*,
      COUNT(DISTINCT s.sub_category_id) AS totalSubCategory

    FROM categories c

    INNER JOIN services s
      ON s.category_id = c.id
  `;

  const queryParams = [];

  // ==================================================
  // ZIP FILTER
  // ==================================================



  // ==================================================
  // ZIP FILTER
  // ==================================================

  if (zipCode) {

    const numericZip = String(zipCode).replace(/\D/g, "");

    if (numericZip.length < 3) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        topCarouselCategories: [],
      });
    }

    categoriesQuery += `
INNER JOIN partner_profiles pp
  ON pp.user_id = s.created_by
`;

    categoriesQuery += `
WHERE
  s.is_active = 1
  AND c.status = 1
  AND pp.is_active = 1
  AND pp.approval_status = 'approved'
  AND pp.service_areas IS NOT NULL
  AND pp.service_areas != ''
  AND JSON_VALID(pp.service_areas)
  AND (
    JSON_CONTAINS(pp.service_areas, CONCAT('"', ? ,'"'))
  )
`;

    queryParams.push(numericZip);
    queryParams.push(numericZip);

    console.log("ZIP:", numericZip);
    console.log("PARAMS:", queryParams);

  } else {

    categoriesQuery += `
    WHERE
      s.is_active = 1
      AND c.status = 1
  `;
  }

  // ==================================================
  // GROUPING
  // ==================================================

  categoriesQuery += `
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  console.log("FINAL SQL:", categoriesQuery);
  console.log("FINAL PARAMS:", queryParams);
  const [categories] = await pool.query(
    categoriesQuery,
    queryParams
  );

  console.log("CATEGORIES RESULT:", categories);

  // ==================================================
  // TOP CAROUSEL LOGIC (UNCHANGED)
  // ==================================================

  const [topBooked] = await pool.query(

    `SELECT 
        service_category AS category_id,
        COUNT(*) AS totalBookings

     FROM bookings

     GROUP BY service_category

     ORDER BY totalBookings DESC

     LIMIT 5`
  );

  const topIds =
    topBooked.map(r => r.category_id);

  let topCarouselCategories = [];

  if (topIds.length) {

    // const [topCats] = await pool.query(

    //   `SELECT * 
    //    FROM categories 
    //    WHERE id IN (?) 
    //    AND status = 1`,

    //   [topIds]
    // );
    const [topCats] = await pool.query(
      `
  SELECT
      c.*,
      COUNT(DISTINCT s.sub_category_id) AS totalSubCategory

  FROM categories c

  LEFT JOIN services s
      ON s.category_id = c.id
      AND s.is_active = true

  WHERE c.id IN (?)
    AND c.status = 1

  GROUP BY c.id
  `,
      [topIds]
    );

    topCarouselCategories = topIds
      .map(id =>
        topCats.find(
          c => String(c.id) === String(id)
        ) || null
      )
      .filter(Boolean);

    if (topCarouselCategories.length < 5) {

      const remainingCount =
        5 - topCarouselCategories.length;

      const existingIds =
        topCarouselCategories.map(c => c.id);

      // const [latestCats] = await pool.query(

      //   `SELECT * 
      //    FROM categories 
      //    WHERE status = 1
      //    AND id NOT IN (?)
      //    ORDER BY created_at DESC
      //    LIMIT ?`,

      //   [
      //     existingIds.length
      //       ? existingIds
      //       : [0],

      //     remainingCount
      //   ]
      // );
      const [latestCats] = await pool.query(
        `
  SELECT
      c.*,
      COUNT(DISTINCT s.sub_category_id) AS totalSubCategory

  FROM categories c

  LEFT JOIN services s
      ON s.category_id = c.id
      AND s.is_active = true

  WHERE c.status = 1
    AND c.id NOT IN (?)

  GROUP BY c.id
  ORDER BY c.created_at DESC
  LIMIT ?
  `,
        [
          existingIds.length ? existingIds : [0],
          remainingCount
        ]
      );

      topCarouselCategories = [
        ...topCarouselCategories,
        ...latestCats
      ];
    }

  } else {

    // const [fallbackCats] = await pool.query(

    //   `SELECT * 
    //    FROM categories 
    //    WHERE status = 1 
    //    ORDER BY created_at DESC 
    //    LIMIT 5`
    // );
    const [fallbackCats] = await pool.query(
      `
  SELECT
      c.*,
      COUNT(DISTINCT s.sub_category_id) AS totalSubCategory

  FROM categories c

  LEFT JOIN services s
      ON s.category_id = c.id
      AND s.is_active = true

  WHERE c.status = 1

  GROUP BY c.id
  ORDER BY c.created_at DESC
  LIMIT 5
  `
    );

    topCarouselCategories =
      fallbackCats;
  }

  // ==================================================
  // RESPONSE
  // ==================================================

  return res.status(200).json({

    success: true,

    count: categories.length,

    data: categories,

    topCarouselCategories,

  });

});



// ══════════════════════════════════════════════

// GET USED SUB-CATEGORIES BY CATEGORY

// ══════════════════════════════════════════════

export const getUsedSubCategoriesByCategory =
  asyncHandler(async (req, res) => {

    const { categoryId } = req.params;
    const { zipCode } = req.query;

    let params = [categoryId];
    let zipFilter = "";

    if (zipCode && zipCode.trim() !== "") {

      const zip = zipCode.trim();

      zipFilter = `
        AND EXISTS (
          SELECT 1
          FROM partner_profiles pp
          WHERE pp.user_id = s.created_by
          AND pp.is_active = 1
          AND pp.approval_status = 'approved'
          AND (
            pp.service_areas LIKE CONCAT('%', ?, '%')
          )
        )
      `;

      params.push(zip);
    }

    const [subCategories] = await pool.query(
      `
      SELECT 
        sc.*,
        COUNT(s.id) AS totalServices
      FROM services s
      JOIN sub_categories sc 
        ON sc.id = s.sub_category_id
      WHERE s.is_active = true
        AND s.category_id = ?
        ${zipFilter}
      GROUP BY sc.id
      ORDER BY sc.created_at DESC
      `,
      params
    );

    return res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });
  });



// ══════════════════════════════════════════════

// GET PARTNERS BY SUB-CATEGORY

// ══════════════════════════════════════════════

export const getPartnersBySubCategory = asyncHandler(async (req, res) => {

  const { subCategoryId } = req.params;



  const [services] = await pool.query(

    `SELECT s.*,

       c.category_name, sc.sub_category_name,

       u.first_name, u.last_name, u.email AS creator_email, u.phone AS creator_phone

     FROM services s

     LEFT JOIN categories c      ON c.id  = s.category_id

     LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id

     LEFT JOIN users u            ON u.id  = s.created_by

     WHERE s.is_active = true AND s.sub_category_id = ?

     ORDER BY s.created_at DESC`,

    [subCategoryId]

  );



  if (!services.length) {

    return res.status(200).json({ success: true, count: 0, data: [], message: "No services found" });

  }



  const data = services.map(s => ({

    serviceId: s.id,

    title: s.title,

    subtitle: s.subtitle,

    slug: s.slug,

    aboutService: s.about_service,

    price: s.price,

    estimatedTime: s.estimated_time,

    images: safeParseJSON(s.images),

    category: { id: s.category_id, category_name: s.category_name },

    subCategory: { id: s.sub_category_id, sub_category_name: s.sub_category_name },

    provider: {

      id: s.created_by,

      name: `${s.first_name || ""} ${s.last_name || ""}`.trim(),

      email: s.creator_email,

      phone: s.creator_phone,

    },

  }));



  return res.status(200).json({ success: true, count: data.length, data });

});



// ══════════════════════════════════════════════

// GET AVAILABLE SERVICES (complex filtering)

// ══════════════════════════════════════════════

export const getAvailableServices = asyncHandler(async (req, res) => {
  const { categoryId, subCategoryId, pincode } = req.query;

  if (!categoryId || !subCategoryId) {
    return res.status(400).json({
      success: false,
      message: "categoryId and subCategoryId are required",
    });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // ---------------- BASE QUERY ----------------
  let query = `
    SELECT
      s.*,
      c.category_name,
      sc.sub_category_name,
      u.first_name,
      u.last_name,
      pp.is_active AS partner_active,
      pp.is_available AS partner_available,
      pp.approval_status,
      pp.service_areas,

      sub.plan_key,
      sub.subscription AS sub_active,
      sub.status AS sub_status,
      sub.end_date AS sub_end_date,

      (
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.partner_id = s.created_by
          AND b.created_at BETWEEN ? AND ?
      ) AS booking_count

    FROM services s

    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN sub_categories sc ON sc.id = s.sub_category_id
    LEFT JOIN users u ON u.id = s.created_by
    LEFT JOIN partner_profiles pp ON pp.user_id = s.created_by

    LEFT JOIN (
      SELECT *
      FROM subscriptions
      WHERE subscription = true
        AND status = 'ACTIVE'
        AND end_date > NOW()
      ORDER BY created_at DESC
    ) sub ON sub.user_id = s.created_by

    WHERE s.is_active = true
      AND s.category_id = ?
      AND s.sub_category_id = ?
      AND pp.approval_status = 'approved'
      AND pp.is_active = true
      AND pp.is_available = true
  `;

  const values = [startOfMonth, endOfMonth, categoryId, subCategoryId];

  // ---------------- PINCODE FILTER ----------------
  const zip = pincode && pincode.trim() !== ""
    ? String(pincode).trim()
    : null;

  if (zip) {
    query += `
    AND pp.service_areas IS NOT NULL
    AND pp.service_areas != ''
    AND JSON_VALID(pp.service_areas)
    AND JSON_CONTAINS(
          pp.service_areas,
          JSON_QUOTE(?)
        )
  `;

    values.push(zip);
  }

  const [rows] = await pool.query(query, values);

  // ---------------- PLAN LOGIC ----------------
  const planLimit = {
    BASIC: process.env.BASIC_PLAN_LIMIT,
    MODERN: process.env.MODERN_PLAN_LIMIT,
    PREMIUM: process.env.PREMIUM_PLAN_LIMIT,
  };

  console.log("ENV:", {
    BASIC: process.env.BASIC_PLAN_LIMIT,
    MODERN: process.env.MODERN_PLAN_LIMIT,
    PREMIUM: process.env.PREMIUM_PLAN_LIMIT,
  });

  const planPriority = {
    PREMIUM: 1,
    MODERN: 2,
    BASIC: 3,
  };

  const filtered = rows
    .map((row) => {




      const bookingCount = Number(row.booking_count || 0);

      const planKey = (row.plan_key || "").toUpperCase();

      const limit = planLimit[planKey] || 0;


      // ---------------- SUBSCRIPTION VALID ----------------
      // const hasValidSubscription =
      //   row.sub_active === true &&
      //   row.sub_status === "ACTIVE" &&
      //   new Date(row.sub_end_date) > new Date();
      const hasValidSubscription =
        Boolean(row.sub_active) &&
        row.sub_status === "ACTIVE" &&
        new Date(row.sub_end_date) > new Date();

      // ---------------- FREE RULE ----------------
      const freeEligible = bookingCount < 5;

      // ---------------- FINAL ELIGIBILITY ----------------
      const eligible =
        (hasValidSubscription && bookingCount < limit) ||
        (!hasValidSubscription && freeEligible);

      console.log({
        hasValidSubscription,
        freeEligible,
        eligible,
      });

      console.log({
        partner: row.created_by,
        bookingCount,
        planKey,
        limit,
        sub_active: row.sub_active,
        sub_status: row.sub_status,
        sub_end_date: row.sub_end_date,
      });

      return {
        ...row,
        bookingCount,
        planKey,
        planLimit: limit,
        planPriority: planPriority[planKey] || 99,
        hasValidSubscription,
        freeEligible,
        eligible,
        service_areas: safeParseJSON(row.service_areas),
      };
    })

    // keep only valid
    .filter((r) => r.eligible)

    // sorting
    .sort(
      (a, b) =>
        a.planPriority - b.planPriority ||
        new Date(b.created_at) - new Date(a.created_at)
    );

  return res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
});



// ══════════════════════════════════════════════

// HELPERS

// ══════════════════════════════════════════════

const safeParseJSON = (val) => {

  if (!val) return [];

  if (Array.isArray(val)) return val;

  try { return JSON.parse(val); } catch { return []; }

};



const parseServiceRow = (s) => ({

  ...s,

  images: safeParseJSON(s.images),

  key_features: safeParseJSON(s.key_features),

  category: {

    id: s.category_id,

    category_name: s.category_name,

    sub_title: s.category_sub_title,

    image: s.category_image,

  },

  subCategory: {

    id: s.sub_category_id,

    sub_category_name: s.sub_category_name,

    sub_title: s.sub_category_sub_title,

    image: s.sub_category_image,

  },

  createdBy: {

    id: s.created_by,

    first_name: s.first_name,

    last_name: s.last_name,

    email: s.creator_email,

    phone: s.creator_phone,

    role: s.creator_role,

  },

});