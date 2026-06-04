import validator from "validator";
import pool from "../../../config/db.js";
import { QuoteModel } from "../models/quote.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

// ══════════════════════════════════════════════
// CREATE QUOTE
// ══════════════════════════════════════════════
export const createQuote = asyncHandler(async (req, res) => {
    const { name, phone, email, service, requirement, partnerId, customerId } = req.body;

    if (!name || !phone || !email || !service || !requirement) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email" });
    }

    // NEW (CORRECT)
    const [serviceRows] = await pool.query(
        "SELECT id FROM services WHERE id = ? LIMIT 1",
        [service]
    );

    if (!serviceRows.length) {
        return res.status(404).json({
            success: false,
            message: "Service not found",
        });
    }

    // ── Validate partnerId if provided ──
    if (partnerId) {
        const [pRows] = await pool.query(
            "SELECT id FROM users WHERE id = ? LIMIT 1", [partnerId]
        );
        if (!pRows.length) {
            return res.status(400).json({ success: false, message: "Invalid partner id" });
        }
    }

    const finalCustomerId = req.user?.id || customerId || null;

    const quote = await QuoteModel.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        serviceId: service,
        requirement: requirement.trim(),
        partnerId: partnerId || null,
        customerId: finalCustomerId,
    });

    res.status(201).json({
        success: true,
        message: "Quote request submitted successfully",
        data: quote,
    });
});

// ══════════════════════════════════════════════
// GET ALL QUOTES (admin)
// ══════════════════════════════════════════════
export const getQuotes = asyncHandler(async (req, res) => {
    const quotes = await QuoteModel.findAll();

    if (!quotes.length) {
        return res.status(200).json({
            success: true,
            message: "No quote requests found",
            count: 0,
            data: [],
        });
    }

    const unreadCount = await QuoteModel.countUnread();

    res.status(200).json({
        success: true,
        count: quotes.length,
        unreadCount,
        data: quotes,
    });
});

// ══════════════════════════════════════════════
// GET QUOTES BY PARTNER (paginated)
// ══════════════════════════════════════════════
export const getQuotespartneridwise = asyncHandler(async (req, res) => {
    const partnerId = req.user.id;

    const pageNum = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limitNum = Math.min(Math.max(parseInt(req.query.limit || 10, 10), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await QuoteModel.countByPartner(partnerId);
    const quotes = await QuoteModel.findByPartnerPaginated({ partnerId, limit: limitNum, skip });
    const unreadCount = await QuoteModel.countUnreadByPartner(partnerId);

    res.status(200).json({
        success: true,
        count: quotes.length,
        unreadCount,
        data: quotes,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});

// ══════════════════════════════════════════════
// GET QUOTES BY CUSTOMER
// ══════════════════════════════════════════════
export const getQuotescustomeridwise = asyncHandler(async (req, res) => {
    const customerId = req.user.id;

    const quotes = await QuoteModel.findByCustomer(customerId);

    if (!quotes.length) {
        return res.status(200).json({
            success: true,
            message: "No quote requests found for this customer",
            count: 0,
            data: [],
        });
    }

    res.status(200).json({
        success: true,
        count: quotes.length,
        data: quotes,
    });
});

// ══════════════════════════════════════════════
// MARK QUOTE VIEWED
// ══════════════════════════════════════════════
export const updateQuoteViewingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quote = await QuoteModel.findById(id);
    if (!quote) {
        return res.status(404).json({ success: false, message: "Quote not found" });
    }

    const updated = await QuoteModel.markViewed(id);

    res.status(200).json({
        success: true,
        message: "Quote marked as viewed",
        data: updated,
    });
});

// ══════════════════════════════════════════════
// UPDATE QUOTE STATUS
// ══════════════════════════════════════════════
export const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["new", "contacted", "resolved"];
    if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const quote = await QuoteModel.findById(id);
    if (!quote) {
        return res.status(404).json({ success: false, message: "Quote not found" });
    }

    const updated = await QuoteModel.updateStatus(id, status);

    res.status(200).json({
        success: true,
        message: "Quote status updated successfully",
        data: updated,
    });
});

// ══════════════════════════════════════════════
// DELETE QUOTE
// ══════════════════════════════════════════════
export const deleteQuote = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quote = await QuoteModel.findById(id);
    if (!quote) {
        return res.status(404).json({ success: false, message: "Quote request not found" });
    }

    await QuoteModel.deleteById(id);

    res.status(200).json({
        success: true,
        message: "Quote deleted successfully",
    });
});