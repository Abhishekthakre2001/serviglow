import { asyncHandler } from "../../../utils/asyncHandler.js";
import { exportExcel, exportCSV } from "../../../utils/excelExport.js";
import { getPartnersData } from "../services/partner.service.js";
import { getMasterData } from "../services/master.service.js";
import { getCustomersData } from "../services/customer.service.js";
import { getContactsData } from "../services/contact.service.js";
import { getReviewsData, getPartnerReviewsData } from "../services/review.service.js";
import { getSubscriptionsData } from "../services/subscription.service.js";

// partner Export
import { getPartnerServicesData } from "../services/service.service.js";
import { getPartnerQuotesData } from "../services/quote.service.js";
import { getPartnerRevenueData } from "../services/revenue.service.js";
import { getPartnerBookingsData } from "../services/booking.service.js";

export const exportPartners = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";
  const status = req.query.status;
  const backendUrl = process.env.BACKEND_URL || "";

  const partners = await getPartnersData(status);

  const rows = partners.map((p) => ({
    UserID: p.user_id,

    FirstName: p.first_name,
    LastName: p.last_name,
    Email: p.email,
    Phone: p.phone,

    Role: p.role,
    PartnerStatus: p.partner_status,
    UserStatus: p.user_status,

    // Designation: p.designation,

    BusinessName: p.business_name,
    BusinessAddress: p.business_address,

    PartnerCity: p.city,
    PartnerState: p.state,

    Category: p.category_name,
    SubCategory: p.sub_category_name,

    Experience: p.years_of_experience,

    ServiceAreas: Array.isArray(p.service_areas)
      ? p.service_areas.join(", ")
      : p.service_areas,

    About: p.about,

    ApprovalStatus: p.approval_status,

    IsActive: p.is_active ? "Yes" : "No",
    IsAvailable: p.is_available ? "Yes" : "No",

    Logo: p.logo
      ? `${backendUrl}/${p.logo.replace(/^\/+/, "")}`
      : "",

    BusinessLicense: p.doc_business_license
      ? `${backendUrl}/${p.doc_business_license.replace(/^\/+/, "")}`
      : "",

    Certificate: p.doc_certificate
      ? `${backendUrl}/${p.doc_certificate.replace(/^\/+/, "")}`
      : "",

    Insurance: p.doc_insurance
      ? `${backendUrl}/${p.doc_insurance.replace(/^\/+/, "")}`
      : "",

    TaxId: p.doc_tax_id
      ? `${backendUrl}/${p.doc_tax_id.replace(/^\/+/, "")}`
      : "",

    CorporationCertificate: p.doc_corporation_cert
      ? `${backendUrl}/${p.doc_corporation_cert.replace(/^\/+/, "")}`
      : "",

    GovernmentId: p.doc_gov_id
      ? `${backendUrl}/${p.doc_gov_id.replace(/^\/+/, "")}`
      : "",

    UserCreatedAt: p.user_created_at,
    PartnerCreatedAt: p.created_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      `${status || "all"}-partners`
    );
  }

  return exportExcel(
    res,
    rows,
    `${status || "all"}-partners`,
    "Partners"
  );
});

export const exportMaster = asyncHandler(async (req, res) => {
  const type = req.query.type;
  const format = req.query.format || "excel";
  const backendUrl = process.env.BACKEND_URL || "";

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "type is required",
    });
  }

  const data = await getMasterData(type);

  let rows = [];

  if (type === "category") {
    rows = data.map((item) => ({
      ID: item.id,
      Category: item.category_name,

      Image: item.image
        ? `${backendUrl}/${item.image.replace(/^\/+/, "")}`
        : "",

      CreatedAt: item.created_at,
    }));
  }

  if (type === "sub-category") {
    rows = data.map((item) => ({
      ID: item.id,
      Category: item.category_name,
      SubCategory: item.sub_category_name,

      Image: item.image
        ? `${backendUrl}/${item.image.replace(/^\/+/, "")}`
        : "",

      CreatedAt: item.created_at,
    }));
  }

  if (format === "csv") {
    return exportCSV(res, rows, type);
  }

  return exportExcel(
    res,
    rows,
    type,
    type === "category"
      ? "Categories"
      : "Sub Categories"
  );
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const customers = await getCustomersData();

  const rows = customers.map((c) => ({
    CustomerID: c.id,

    FirstName: c.first_name,
    LastName: c.last_name,

    Email: c.email,
    Phone: c.phone,

    AddressLine1: c.addr_line1,
    AddressLine2: c.addr_line2,

    City: c.addr_city,
    State: c.addr_state,
    ZipCode: c.addr_zip,

    Status: c.status,

    CreatedAt: c.created_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      "customers"
    );
  }

  return exportExcel(
    res,
    rows,
    "customers",
    "Customers"
  );
});

export const exportContacts = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const contacts = await getContactsData();

  const rows = contacts.map((c) => ({
    ID: c.id,

    Name: c.name,

    Email: c.email,

    Phone: c.whatsapp_number || "",

    Subject: c.subject || "",

    Message: c.message || "",

    ViewingStatus: c.viewing_status,

    CreatedAt: c.created_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      "contacts"
    );
  }

  return exportExcel(
    res,
    rows,
    "contacts",
    "Contacts"
  );
});

export const exportReviews = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const reviews = await getReviewsData();

  const rows = reviews.map((r) => ({
    ReviewID: r.id,

    CustomerName: `${r.customer_first || ""} ${r.customer_last || ""}`.trim(),
    CustomerEmail: r.customer_email || "",

    PartnerName: `${r.partner_first || ""} ${r.partner_last || ""}`.trim(),
    PartnerEmail: r.partner_email || "",

    ServiceTitle: r.service_title || "",
    ServiceSlug: r.service_slug || "",

    Rating: r.rating,

    Review: r.review || r.comment || "",

    CreatedAt: r.created_at,
  }));

  if (format === "csv") {
    return exportCSV(res, rows, "reviews");
  }

  return exportExcel(
    res,
    rows,
    "reviews",
    "Reviews"
  );
});

export const exportSubscriptions = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";
  const status = req.query.status;

  const subscriptions =
    await getSubscriptionsData(status);

  const rows = subscriptions.map((s) => ({
    SubscriptionID: s.id,

    UserID: s.user_id,

    Username: s.username,

    Name: s.name,

    Email: s.email,

    Plan: s.plan_key,

    Price: s.price,

    PaypalSubscriptionID:
      s.paypal_subscription_id,

    Subscription:
      s.subscription ? "Yes" : "No",

    Status: s.status,

    StartDate: s.start_date,

    EndDate: s.end_date,

    CancelDate: s.cancel_date,

    RefundStatus:
      s.refund_status ? "Refunded" : "No",

    RefundDate: s.refund_date,

    RefundAmount: s.refund_amount,

    PaypalRefundID:
      s.paypal_refund_id,

    CreatedAt: s.created_at,

    UpdatedAt: s.updated_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      `${status || "all"}-subscriptions`
    );
  }

  return exportExcel(
    res,
    rows,
    `${status || "all"}-subscriptions`,
    "Subscriptions"
  );
});

// Partner Export
export const exportMyServices = asyncHandler(
  async (req, res) => {
    const format =
      req.query.format || "excel";

    const partnerId = req.user.id;

    const services =
      await getPartnerServicesData(
        partnerId
      );

    const rows = services.map((s) => ({
      ServiceID: s.id,

      Title: s.title,

      Slug: s.slug,

      Category: s.category_name,

      SubCategory:
        s.sub_category_name,

      Description: s.description,

      Price: s.price,

      Status: s.status,

      CreatedAt: s.created_at,
    }));

    if (format === "csv") {
      return exportCSV(
        res,
        rows,
        "my-services"
      );
    }

    return exportExcel(
      res,
      rows,
      "my-services",
      "My Services"
    );
  }
);

export const exportMyQuotes = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const partnerId = req.user.id;

  const quotes = await getPartnerQuotesData(partnerId);

  const rows = quotes.map((q) => ({
    QuoteID: q.id,

    Service: q.service_title,

    Category: q.category_name,

    CustomerName: `${q.customer_first_name || ""} ${q.customer_last_name || ""}`,

    CustomerEmail: q.customer_email,

    CustomerPhone: q.customer_phone,

    Description: q.description,

    Status: q.status,

    ViewingStatus: q.viewing_status ? "Viewed" : "Pending",

    CreatedAt: q.created_at,
  }));

  if (format === "csv") {
    return exportCSV(res, rows, "my-quotes");
  }

  return exportExcel(
    res,
    rows,
    "my-quotes",
    "My Quotes"
  );
});

export const exportMyRevenue = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const partnerId = req.user.id;

  const revenues = await getPartnerRevenueData(partnerId);

  const rows = revenues.map((r) => ({
    RevenueID: r.id,

    BookingID: r.booking_id,

    CustomerName: `${r.first_name || ""} ${r.last_name || ""}`,

    CustomerEmail: r.customer_email,

    CustomerPhone: r.customer_phone,

    AddressLine1: r.addr_line1,

    AddressLine2: r.addr_line2,

    City: r.addr_city,

    State: r.addr_state,

    ZipCode: r.addr_zip,

    BookingStatus: r.booking_status,

    // ServiceAmount: r.service_amount,

    ServiceCharges: r.service_charges,

    // NetAmount: r.net_amount,

    CreatedAt: r.created_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      "my-revenue"
    );
  }

  return exportExcel(
    res,
    rows,
    "my-revenue",
    "My Revenue"
  );
});

export const exportMyBookings =
  asyncHandler(async (req, res) => {
    const format =
      req.query.format || "excel";

    const status =
      req.query.status;

    const partnerId =
      req.user.id;

    const bookings =
      await getPartnerBookingsData(
        partnerId,
        status
      );

    const rows = bookings.map(
      (b) => ({
        BookingID: b.id,

        Service: b.service_title,

        Category: b.category_name,

        SubCategory:
          b.sub_category_name,

        CustomerName: b.name,

        CustomerPhone: b.phone,

        CustomerEmail: b.email,

        Address: b.address,

        City: b.city,

        ZipCode: b.zip,

        BookingDate:
          b.booking_date,

        BookingTime:
          b.booking_time,

        Status: b.status,

        Verified:
          b.is_verified
            ? "Yes"
            : "No",

        CancelledByUser:
          b.cancel_by_user
            ? "Yes"
            : "No",

        Notes: b.notes,

        CreatedAt:
          b.created_at,
      })
    );

    if (format === "csv") {
      return exportCSV(
        res,
        rows,
        `${status || "all"}-bookings`
      );
    }

    return exportExcel(
      res,
      rows,
      `${status || "all"}-bookings`,
      "Bookings"
    );
  });

export const exportPartnerReviews = asyncHandler(async (req, res) => {
  const format = req.query.format || "excel";

  const partnerId = req.user.id;

  const reviews = await getPartnerReviewsData(partnerId);

  const rows = reviews.map((r) => ({
    ReviewID: r.id,

    CustomerName: `${r.customer_first || ""} ${r.customer_last || ""}`,

    CustomerEmail: r.customer_email,

    CustomerPhone: r.customer_phone,

    ServiceTitle: r.service_title,

    ServiceSlug: r.service_slug,

    Rating: r.rating,

    Review: r.review,

    BookingDate: r.booking_date,

    BookingTime: r.booking_time,

    BookingStatus: r.booking_status,

    Approved: r.is_approved ? "Yes" : "No",

    CreatedAt: r.created_at,
  }));

  if (format === "csv") {
    return exportCSV(
      res,
      rows,
      "partner-reviews"
    );
  }

  return exportExcel(
    res,
    rows,
    "partner-reviews",
    "Partner Reviews"
  );
});