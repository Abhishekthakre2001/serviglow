"use client";

import React, { useEffect, useState } from "react";
import reviewsApi from "@/services/reviewsApi";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const res = await reviewsApi.getApprovedReviews();

      console.log("res", res?.data?.reviews)

      const formatted =
        res?.data?.reviews.map((item) => ({
          name: `${item?.customer?.first_name || ""} ${item?.customer?.last_name || ""}`,
          city: item?.booking?.city,
          rating: item?.rating || 0,
          review: item?.comment || "",
          service: item?.service?.title,
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

    console.log("reviews", reviews)
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Trusted by Thousands of Customers
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
                 flex flex-col h-full min-h-[280px]"
              >
                {/* TOP BORDER */}
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-blue-600 to-orange-500" />

                {/* TOP CONTENT */}
                <div>
                  {/* STARS */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <span key={i} className="text-orange-400 text-lg">
                        ★
                      </span>
                    ))}
                  </div>

                  {/* REVIEW TEXT */}
                  <p className="text-gray-600 leading-relaxed mb-6 min-h-[80px]">
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

                    <p className="text-sm text-gray-500">
                      {r.city} • {r.service}
                    </p>
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

        {/* TRUST BAR */}
        <div className="mt-16 flex flex-wrap justify-center gap-10 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">★</span>
            <span>
              <strong>4.8/5</strong> Average Rating
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">👥</span>
            <span>
              <strong>10,000+</strong> Happy Customers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">🛡</span>
            <span>
              <strong>Verified</strong> Professionals
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}