"use client";

export const runtime = "edge";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import serviceApi from "@/services/serviceApi"; // adjust path if different
import reviewApi from "@/services/reviewsApi"; // adjust path if different
import contactQuotationApi from "@/services/contactQuotation";
import Alert from "@/components/ui/Conformation";
import reviewsApi from "@/services/reviewsApi";

const API_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

function normalizeImage(url) {
  if (!url) return "/services/ac.png"; // fallback
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`; // handles "/uploads/..."
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const { serviceId } = useParams();
  const { createQuote } = contactQuotationApi;
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    requirement: "",
    partnerId: "",
    customerId: "",
  });
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    onConfirm: null,
  });

  // pick main image (service images are already full http in your response)
  const mainImage = useMemo(() => {
    if (!service) return "/services/ac.png";
    const first = service?.images?.[0];
    return normalizeImage(first);
  }, [service]);


  const handleBookService = () => {
    const isLoggedIn = localStorage.getItem("IS_LOGGED_IN");

    if (isLoggedIn === "true") {
      router.push(`/booking/${service.id}`);
    } else {
      const currentUrl = window.location.href;
      localStorage.setItem("Past_booking_url", currentUrl);
      setShowLoginModal(true);
    }
  };

  const handleQuote = () => {
    const isLoggedIn = localStorage.getItem("IS_LOGGED_IN");

    if (isLoggedIn === "true") {
      setShowQuote(true);
    } else {
      const currentUrl = window.location.href;
      localStorage.setItem("Past_booking_url", currentUrl);
      setShowLoginModal(true);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push("/login");
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        setPageLoading(true);
        setError("");

        if (!serviceId) {
          setError("serviceId missing in URL");
          setService(null);
          return;
        }

        const res = await serviceApi.getServiceById(serviceId);
        setService(res?.data?.data || null);
      } catch (err) {
        setPageLoading(false);
        setService(null);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load service",
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const getLoggedInCustomerId = () => {
    if (typeof window === "undefined") return "";

    try {
      const userData = JSON.parse(localStorage.getItem("USER") || "null");

      return userData?.id || userData?.user?._id || "";
    } catch (error) {
      return "";
    }
  };


  useEffect(() => {
    if (!service) return;

    const userData =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("USER") || "null")
        : null;

    const customerId = getLoggedInCustomerId();

    console.log("userData", userData)

    setQuoteForm((prev) => ({
      ...prev,
      service: service?.id || "",
      partnerId: service?.created_by || "",
      customerId,
      name:
        prev.name ||
        `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim(),
      phone: prev.phone || userData?.phone || "",
      email: prev.email || userData?.email || userData?.last_name || "",
    }));
  }, [service]);

  const handleChange = (field, value) => {
    const userData =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("USER") || "null")
        : null;

    setQuoteForm((prev) => ({
      ...prev,
      [field]: value,
      service: service?.id || "",              // ✅ FIXED
      partnerId: service?.created_by || "",   // ✅ FIXED
      customerId: getLoggedInCustomerId(),
    }));
  };

  const handleQuoteSubmit = async () => {
    try {
      if (!quoteForm.name.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Name is required",
        });
      }

      if (!quoteForm.phone.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Phone number is required",
        });
      }


      const validateUSPhone = (phone) => {
        if (!phone) return false;

        const phoneRegex =
          /^(?:\+1\s?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/;

        return phoneRegex.test(phone.trim());
      };

      if (!quoteForm.email.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Email is required",
        });
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(quoteForm.email)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Email",
          message: "Please enter a valid email address",
        });
      }

      // if (!quoteForm.service) {
      //   return setAlertConfig({
      //     open: true,
      //     type: "error",
      //     title: "Validation Error",
      //     message: "Please select a service",
      //   });
      // }

      if (!quoteForm.requirement.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Requirement description is required",
        });
      }

      setLoading(true);

      await createQuote(quoteForm);

      setAlertConfig({
        open: true,
        type: "success",
        title: "Quotation Requested",
        message: "Your quotation request has been submitted successfully.",
      });

      setQuoteForm({
        name: "",
        phone: "",
        email: "",
        service: service?.id || "",              // ✅ FIXED
        requirement: "",
        partnerId: service?.created_by || "",   // ✅ FIXED
        customerId: getLoggedInCustomerId(),
      });

      setShowQuote(false);
    } catch (error) {
      console.log("QUOTE ERROR:", error);

      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message: error?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

    // CLEAN HTML CONTENT
  const cleanedContent = useMemo(() => {

    if (!service?.about_service) return "";

    return service?.about_service

      // remove nbsp
      .replace(/&nbsp;/g, " ")

      // remove escaped quotes
      .replace(/\\"/g, '"')

      // remove extra spaces
      .replace(/\s+/g, " ");

  }, [service]);
  
  const fetchReviews = async () => {
    try {
      setLoading(true);

      const res = await reviewsApi.getServiceReviews(serviceId);

      const formatted =
        res?.data?.reviews?.map((item) => ({
          name: `${item?.customer?.first_name || ""} ${item?.customer?.last_name || ""}`,
          city: item?.booking?.city || "India",
          rating: item?.rating || 0,
          review: item?.comment || "",
          service: item?.service?.title || "Service",
        })) || [];

      setReviews(formatted);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);
  console.log("SERVICE", service);
  console.log("Reviews", reviews);
  if (pageLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
        <div className="flex flex-col items-center">

          {/* Spinner */}
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          {/* Text */}
          <p className="mt-4 text-gray-700 font-medium text-lg">
            Loading service...
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Please wait while we fetch the details
          </p>

        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </section>
    );
  }

  if (!service) return null;



  return (
    <>
      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
        onConfirm={alertConfig.onConfirm}
      />
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">

            {/* Close Icon */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Login Required
            </h3>

            <p className="text-gray-600 mb-6">
              You are not logged in. please login first.
            </p>

            <div className="flex gap-4">
              {/* Registration Button */}
              <button
                onClick={() => router.push("/user_registration")}
                className="w-1/2 py-3 rounded-full border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition"
              >
                Registration
              </button>

              {/* Login Button */}
              <button
                onClick={handleLoginRedirect}
                className="w-1/2 py-3 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14">
          {/* IMAGE */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={mainImage || "/images/default_img.webp"}
              alt={service?.title || "Service"}
              className="w-full h-[460px] object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/default_img.webp";
              }}
            />

            <span className="absolute top-6 left-6 bg-white/90 backdrop-blur px-5 py-2 rounded-full text-sm font-semibold text-blue-700 shadow">
              ⭐ {service?.avg_rating || 0} ({service?.total_reviews || 0}{" "}
              Reviews)
            </span>
          </div>

          {/* DETAILS */}
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              {service.title}
            </h1>

            {/* Category / Subcategory */}
            <p className="text-sm text-gray-500 mt-3">
              {service?.category_name} /{" "}
              {service?.sub_category_name}
            </p>

            <p className="text-gray-600 mt-4 text-lg leading-relaxed">
              {service.subtitle || "—"}
            </p>

            {/* PRICE + TIME */}
            <div className="mt-6 flex items-center gap-6">
              <span className="text-3xl font-bold text-blue-700">
                ${service.price}
              </span>
              <span className="text-gray-500 text-sm">
                Estimated Time: <b>{service?.estimated_time} Hours</b>
              </span>
            </div>

            {/* FEATURES (from keyFeatures array) */}
            {Array.isArray(service.keyFeatures) &&
              service.keyFeatures.length > 0 && (
                <div className="mt-8 space-y-3">
                  {service.keyFeatures.map((item, index) => (
                    <p key={index} className="text-gray-700 font-medium">
                      ✔ {item}
                    </p>
                  ))}
                </div>
              )}

            {/* CTA BUTTONS */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                // onClick={() => setShowQuote(true)}
                onClick={handleQuote}
                className="px-8 py-3 rounded-full border-2 border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition"
              >
                Get a Quote
              </button>

              <button
                onClick={handleBookService}
                className="px-10 py-3 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition"
              >
                Book Service
              </button>
            </div>

            {/* TRUST */}
            <div className="mt-10 flex gap-6 text-sm text-gray-500">
              <span>🛡 100% Safe Service</span>
              <span>⏱ Same-Day Support</span>
              <span>💳 Secure Payments</span>
            </div>

            {/* Partner Info */}
            {/* {service?.createdBy && (
              <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-gray-800 font-semibold">
                  Provided by: {service.first_name}{" "}
                  {service.createdBy.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {service.createdBy.email}
                </p>
                <p className="text-sm text-gray-500">
                  {service.createdBy.phone}
                </p>
              </div>
            )} */}
          </div>
        </div>

        {/* ABOUT SERVICE (HTML from API) */}
        <div className="max-w-4xl mx-auto px-6 mt-20 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            About Service
          </h2>

          {/* <div
            className="
      bg-white rounded-2xl p-8 shadow-md border border-gray-100

      [&_*]:whitespace-normal
      [&_*]:break-words
      [&_*]:overflow-wrap-anywhere
      [&_*]:max-w-full

      [&_p]:mb-4
      [&_p]:text-gray-700
      [&_p]:leading-8
      [&_p]:text-lg

      [&_strong]:font-semibold
      [&_strong]:text-gray-900

      [&_ul]:list-disc
      [&_ul]:pl-6
      [&_ol]:list-decimal
      [&_ol]:pl-6
      [&_li]:mb-2

      [&_img]:max-w-full
      [&_img]:h-auto
      [&_img]:rounded-lg

      [&_table]:block
      [&_table]:overflow-x-auto

      [&_pre]:overflow-x-auto
      [&_span]:whitespace-normal
      [&_div]:whitespace-normal
    "
            dangerouslySetInnerHTML={{
              __html: service.about_service || "",
            }}
          /> */}
          <div
            className="
      ql-editor
      !p-5 md:!p-10

      text-gray-700

      [&_*]:max-w-full
      [&_*]:whitespace-normal

      [&_img]:max-w-full
      [&_img]:h-auto
      [&_img]:rounded-xl

      [&_table]:block
      [&_table]:overflow-x-auto
      [&_table]:max-w-full

      [&_iframe]:max-w-full
      [&_iframe]:w-full

      [&_pre]:overflow-x-auto

      [&_blockquote]:border-l-4
      [&_blockquote]:border-gray-300
      [&_blockquote]:pl-4
    "
            style={{
              overflowWrap: "break-word",
              wordBreak: "normal",
              whiteSpace: "normal",
            }}
            dangerouslySetInnerHTML={{
              __html: cleanedContent,
            }}
          />
        </div>

        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-orange-50">
          <div className="max-w-7xl mx-auto px-6">

            {/* HEADER */}
            <div className="text-center mb-14">
              <h2 className="text-4xl font-extrabold text-gray-900">
                Reviews
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Real reviews from customers who booked services with confidence.
              </p>
            </div>

            {/* ================= CONTENT ================= */}
            <div className="grid md:grid-cols-3 gap-8">

              {/* 🔄 LOADING STATE */}
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-8 rounded-xl shadow animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-6 w-2/3"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* ✅ REVIEWS */}
              {!loading &&
                reviews.map((r, i) => (
                  <div
                    key={i}
                    className="relative bg-white rounded-b-lg p-8 shadow-md
                 hover:shadow-2xl transition duration-300
                 border border-gray-100
                 flex flex-col min-h-[260px]"
                  >
                    {/* TOP BORDER */}
                    <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-blue-600 to-orange-500" />

                    {/* CONTENT */}
                    <div>
                      {/* STARS */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <span key={i} className="text-orange-400 text-lg">
                            ★
                          </span>
                        ))}
                      </div>

                      {/* REVIEW */}
                      <p className="text-gray-600 leading-relaxed mb-6 min-h-[72px]">
                        {r.review || "Happy and satisfied with the service."}
                      </p>
                    </div>

                    {/* USER INFO - ALWAYS BOTTOM */}
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 text-white flex items-center justify-center font-bold text-lg">
                        {r.name?.charAt(0) || "U"}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">{r.name}</p>

                        {/* Optional */}
                        {/* <p className="text-sm text-gray-500">
            {r.city} • {r.service}
          </p> */}
                      </div>
                    </div>
                  </div>
                ))}
              {/* ❌ EMPTY STATE */}
              {!loading && reviews.length === 0 && (
                <div className="col-span-3 text-center py-10">
                  <div className="text-5xl mb-3">😕</div>
                  <p className="text-gray-600 text-lg font-medium">
                    No reviews yet
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>


          </div>
        </section>
        {/* QUOTE MODAL */}
        {showQuote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Get a Quote
              </h3>

              <input
                type="text"
                placeholder="Your Name"
                value={quoteForm.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full mb-4 px-4 py-3 border rounded-xl"
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                value={quoteForm.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full mb-4 px-4 py-3 border rounded-xl"
              />

              <input
                type="email"
                placeholder="Enter Email"
                value={quoteForm.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full mb-4 px-4 py-3 border rounded-xl"
              />

              <textarea
                placeholder="Describe your issue"
                value={quoteForm.requirement}
                onChange={(e) => handleChange("requirement", e.target.value)}
                className="w-full mb-6 px-4 py-3 border rounded-xl"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setShowQuote(false)}
                  className="w-1/2 py-3 rounded-full border font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleQuoteSubmit}
                  disabled={loading}
                  className="w-1/2 py-3 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
