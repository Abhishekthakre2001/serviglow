import bcrypt from "bcrypt";
import validator from "validator";
import pool from "../../../config/db.js";
import { UserModel } from "../models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ReviewModel } from "../../reviews/models/review.model.js";
import { generateAccessRefreshToken } from "../../../utils/generateToken.js";

// ══════════════════════════════════════════════
// REGISTER USER (customer)
// ══════════════════════════════════════════════
export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, address } = req.body;

  if (!firstName || !lastName || !email || !password || !phone) {
    throw new Error("Required fields are missing");
  }

  const formattedEmail = email.toLowerCase().trim();

  // ── Check OTP verified ──
  const [otpRows] = await pool.query(
    `SELECT id FROM otps
     WHERE email = ? AND is_verified = true
     ORDER BY created_at DESC LIMIT 1`,
    [formattedEmail]
  );
  if (!otpRows.length) {
    throw new Error("Please verify your email before registration");
  }

  // ── Check user exists ──
  const existing = await UserModel.findByEmail(formattedEmail);
  if (existing) throw new Error("User already exists");

  // ── Hash password ──
  const hashedPassword = await bcrypt.hash(password, 10);

  // ── Create user ──
  const userId = await UserModel.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: formattedEmail,
    password: hashedPassword,
    phone,
    address,
    role: "customer",
  });

  return res.status(201).json({
    success: true,
    message: "Customer registered successfully",
    data: { id: userId, role: "customer", email: formattedEmail },
  });
});

// ══════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (userId) {
    await UserModel.clearRefreshToken(userId);
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json({ success: true, message: "Logged out successfully" });
});

// ══════════════════════════════════════════════
// GET CURRENT USER
// ══════════════════════════════════════════════
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, data: user });
});

// ══════════════════════════════════════════════
// GET ALL USERS  (admin)
// ══════════════════════════════════════════════
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.findAll();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// ══════════════════════════════════════════════
// GET ALL CUSTOMERS  (paginated)
// ══════════════════════════════════════════════
export const getAllCustomer = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
  const skip = (page - 1) * limit;

  const total = await UserModel.countByRole("customer");
  const customers = await UserModel.findByRole({ role: "customer", limit, skip });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ══════════════════════════════════════════════
// GET CUSTOMER BOOKINGS
// ══════════════════════════════════════════════
export const getCustomerBookings = asyncHandler(async (req, res) => {

  const customerId = req.query.customerId;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: "customerId is required",
    });
  }

  const page = Math.max(parseInt(req.query.page || 1, 10), 1);

  const limit = Math.min(
    parseInt(req.query.limit || 10, 10),
    100
  );

  const skip = (page - 1) * limit;

  // total bookings
  const total = await UserModel.countByCustomer(customerId);

  // booking list
  const bookings = await UserModel.findByCustomerId({
    customerId,
    limit,
    skip,
  });

  return res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });

});


// ══════════════════════════════════════════════
// UPDATE USER PROFILE
// ══════════════════════════════════════════════
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email, phone, address } = req.body;

  // ── Check user exists ──
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // ── Empty update check ──
  if (!firstName && !lastName && !email && !phone && !address) {
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
    const taken = await UserModel.emailExistsExcept(fmt, userId);
    if (taken) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    updates.email = fmt;
  }

  // if (phone !== undefined) {
  //   if (!validator.isMobilePhone(String(phone), "any")) {
  //     return res.status(400).json({ success: false, message: "Invalid phone number" });
  //   }
  //   updates.phone = phone;
  // }

  // ── Address fields ──
  if (address !== undefined) {
    if (address.line1 !== undefined) updates.addr_line1 = address.line1;
    if (address.line2 !== undefined) updates.addr_line2 = address.line2;
    if (address.city !== undefined) updates.addr_city = address.city;
    if (address.state !== undefined) updates.addr_state = address.state;
    if (address.zip !== undefined) updates.addr_zip = address.zip;
  }

  await UserModel.update(userId, updates);

  // ── Fetch updated record ──
  const updated = await UserModel.findById(userId);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      id: updated.id,
      firstName: updated.first_name,
      lastName: updated.last_name,
      email: updated.email,
      phone: updated.phone,
      address: {
        line1: updated.addr_line1,
        line2: updated.addr_line2,
        city: updated.addr_city,
        state: updated.addr_state,
        zip: updated.addr_zip,
      },
      role: updated.role,
    },
  });
});


// delete customer
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customerId = req.params.id;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const user = await UserModel.findById(customerId);

    if (!user) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // delete Customer Revenue
    await UserModel.revenuedeleteById(customerId, conn);

    // Delete customer reviews
    await UserModel.deleteById(customerId, conn);



    // Delete bookings and all related records
    await UserModel.deleteCustomerBookings(customerId, conn);

    // delete Quoates
    await UserModel.deleteCustomerQuotes(customerId, conn);

    // Delete customer
    await UserModel.delete(customerId, conn);

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});


// customer active / inactive
export const toggleCustomerStatus = asyncHandler(async (req, res) => {

  const customerId = req.params.id;

  const user = await UserModel.findById(customerId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  const newStatus =
    user.status === "active"
      ? "inactive"
      : "active";

  await UserModel.updateStatus(customerId, newStatus);

  return res.status(200).json({
    success: true,
    message: `Customer ${newStatus} successfully`,
    data: {
      id: customerId,
      status: newStatus,
    },
  });
});