import pool from "../../../config/db.js";
import { ReviewModel } from "../models/review.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

// ══════════════════════════════════════════════
// CREATE REVIEW
// ══════════════════════════════════════════════
export const createReview = asyncHandler(async (req, res) => {
    const { service, partner, booking, rating, comment } = req.body;
    const customerId = req.user.id;

    if (!service || !partner || !booking) {
        return res.status(400).json({ success: false, message: "Invalid IDs provided" });
    }

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // ── Check booking is completed by this customer with this partner ──
    const [bookingRows] = await pool.query(
        `SELECT id FROM bookings
     WHERE id = ? AND customer_id = ? AND partner_id = ? AND status = 'Completed'
     LIMIT 1`,
        [booking, customerId, partner]
    );

    if (!bookingRows.length) {
        return res.status(400).json({
            success: false,
            message: "You can review only completed bookings",
        });
    }

    const review = await ReviewModel.create({
        customerId, partnerId: partner, serviceId: service,
        bookingId: booking, rating, comment,
    });

    res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        review,
    });
});

// ══════════════════════════════════════════════
// GET SERVICE REVIEWS (approved only)
// ══════════════════════════════════════════════
export const getServiceReviews = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    const reviews = await ReviewModel.findByService(serviceId);

    if (!reviews.length) {
        return res.status(200).json({
            success: true,
            message: "No reviews found for this service",
            reviews: [],
        });
    }

    res.status(200).json({ success: true, count: reviews.length, reviews });
});

// ══════════════════════════════════════════════
// GET BOOKING REVIEW
// ══════════════════════════════════════════════
export const getBookingReview = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const review = await ReviewModel.findByBooking(bookingId);

    if (!review) {
        return res.status(404).json({
            success: false,
            message: "No review found for this booking",
        });
    }

    res.status(200).json({ success: true, review });
});

// ══════════════════════════════════════════════
// GET ALL APPROVED REVIEWS (public)
// ══════════════════════════════════════════════
export const getAllApprovedReviews = asyncHandler(async (req, res) => {
    const reviews = await ReviewModel.findAllApproved();

    if (!reviews.length) {
        return res.status(200).json({
            success: true,
            message: "No reviews available",
            reviews: [],
        });
    }

    res.status(200).json({ success: true, count: reviews.length, reviews });
});

// ══════════════════════════════════════════════
// GET ALL REVIEWS (admin, paginated)
// ══════════════════════════════════════════════
export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
    const skip = (page - 1) * limit;

    const total = await ReviewModel.countAll();
    const reviews = await ReviewModel.findAllAdmin({ limit, skip });

    if (!reviews.length) {
        return res.status(200).json({
            success: true, message: "No reviews found", reviews: [],
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
});

// ══════════════════════════════════════════════
// UPDATE REVIEW (admin)
// ══════════════════════════════════════════════
export const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await ReviewModel.findById(id);
    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const updated = await ReviewModel.update(id, { rating, comment });

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review: updated,
    });
});

// ══════════════════════════════════════════════
// TOGGLE REVIEW APPROVAL (admin)
// ══════════════════════════════════════════════
export const toggleReviewApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await ReviewModel.findById(id);
    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
    }

    const updated = await ReviewModel.toggleApproval(id);

    // ── Recalculate service avg rating ──
    if (review.service?.id) {
        await ReviewModel.recalcServiceRating(review.service.id);
    }

    res.status(200).json({
        success: true,
        message: `Review ${updated.is_approved ? "approved" : "hidden"} successfully`,
        review: updated,
    });
});

// ══════════════════════════════════════════════
// DELETE REVIEW (admin)
// ══════════════════════════════════════════════
export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const review = await ReviewModel.findById(id);
    if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
    }

    await ReviewModel.deleteById(id);

    res.status(200).json({ success: true, message: "Review deleted successfully" });
});

// ══════════════════════════════════════════════
// GET PARTNER REVIEWS (partner dashboard)
// ══════════════════════════════════════════════
export const getPartnerReviews = asyncHandler(async (req, res) => {
    const partnerId = req.user.id;
    console.log("id", partnerId)
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const limit = Math.min(parseInt(req.query.limit || 10, 10), 100);
    const skip = (page - 1) * limit;

    const total = await ReviewModel.countByPartner(partnerId);
    const reviews = await ReviewModel.findByPartner({ partnerId, limit, skip });

    if (!reviews.length) {
        return res.status(200).json({
            success: true, message: "No reviews found", reviews: [],
        });
    }

    res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        reviews,
    });
});