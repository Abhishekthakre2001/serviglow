import validator from "validator";
import { ContactModel } from "../models/contact.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

// ══════════════════════════════════════════════
// CREATE CONTACT
// ══════════════════════════════════════════════
export const createContact = asyncHandler(async (req, res) => {
  const { name, email, whatsappNumber, subject, message } = req.body;

  if (!name || !email || !whatsappNumber || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  // if (!/^[6-9]\d{9}$/.test(whatsappNumber)) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Invalid WhatsApp number",
  //   });
  // }

  const contact = await ContactModel.create({
    name: name.trim(),
    email: email.toLowerCase(),
    whatsappNumber: whatsappNumber.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: contact,
  });
});

// ══════════════════════════════════════════════
// GET CONTACTS (paginated + phone from users)
// ══════════════════════════════════════════════
export const getContacts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
  const skip = (page - 1) * limit;

  const total = await ContactModel.countAll();
  const contacts = await ContactModel.findAllPaginated({ limit, skip });

  if (!contacts.length) {
    return res.status(200).json({
      success: true,
      message: "No contact messages found",
      count: 0,
      unreadCount: 0,
      data: [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const unreadCount = await ContactModel.countUnread();

  res.status(200).json({
    success: true,
    count: contacts.length,
    unreadCount,
    data: contacts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ══════════════════════════════════════════════
// MARK CONTACT VIEWED
// ══════════════════════════════════════════════
export const markContactViewed = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await ContactModel.findById(id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact message not found",
    });
  }

  const updated = await ContactModel.markViewed(id);

  res.status(200).json({
    success: true,
    data: updated,
  });
});

// ══════════════════════════════════════════════
// DELETE CONTACT
// ══════════════════════════════════════════════
export const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await ContactModel.findById(id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: "Contact message not found",
    });
  }

  await ContactModel.deleteById(id);

  res.status(200).json({
    success: true,
    message: "Contact message deleted successfully",
  });
});