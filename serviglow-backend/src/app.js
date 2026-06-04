import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimiter from "./middleware/rateLimiter.js";
import path from "path";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json());
app.use(cookieParser());

// Split the comma-separated string into an array of strings
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

import authRoutes from "./modules/auth/auth.routes.js";
import partnerRoutes from "./modules/partner/routes/partner.routes.js";
import otpRoutes from "./modules/otp/routes/otp.routes.js";
import UserRoutes from "./modules/user/routes/user.routes.js";
import AdminRoutes from "./modules/admin/routes/admin.routes.js";
import categoryRoutes from "./modules/master/routes/category.routes.js";
import subCategoryRoutes from "./modules/master/routes/subCategory.routes.js";
import ConatctRoutes from "./modules/contact/routes/contact.routes.js";
import paymentRoutes from "./modules/payment/routes/payment.routes.js";
import ServicesRoutes from "./modules/services/routes/service.routes.js";
import QuoteRoutes from "./modules/quote/routes/quote.routes.js";
import ServicesBookingRoutes from "./modules/booking/routes/booking.routes.js";
import ReviewRoutrtes from "./modules/reviews/routes/review.routes.js";
import AnnouncementRoutes from "./modules/announcement/routes/announcement.routes.js";

app.use(rateLimiter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Test route
app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working 🚀",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/partner", partnerRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/", otpRoutes);
app.use("/api/v1/master/category", categoryRoutes);
app.use("/api/v1/master/subcategory", subCategoryRoutes);
app.use("/api/v1/contact", ConatctRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/service", ServicesRoutes);
app.use("/api/v1/quote", QuoteRoutes);
app.use("/api/v1/service-booking", ServicesBookingRoutes);
app.use("/api/v1/reviews", ReviewRoutrtes);
app.use("/api/v1/announcement", AnnouncementRoutes);

export default app;