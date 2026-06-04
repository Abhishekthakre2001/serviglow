"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Clock, Tag, User } from "lucide-react";
import serviceApi from "@/services/serviceApi";

const FALLBACK_IMG = "/images/default_img.webp";

export default function ServicesProvider() {

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const subCategoryId = params?.subCategoryId;
  const zipFromUrl = searchParams.get("zip");

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [SubCategory, setSubCategory] = useState(
    localStorage.getItem("selectedSubCategory") || "Sub-Category",
  );

  useEffect(() => {
    const load = async () => {
      if (!subCategoryId) {
        setError("subCategoryId missing in URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const categoryId = localStorage.getItem("selectedCatId");
        const userData = JSON.parse(localStorage.getItem("USER"));
        // const pincode = userData?.user?.address?.zip || ""; // optional
        const pincode = zipFromUrl || userData?.user?.address?.zip || "";

        // ✅ NOW CALL SERVICE LIST API (same endpoint if you updated backend)
        // const res = await serviceApi.getPartnersBySubCategory(subCategoryId);
        const res = await serviceApi.getAvailablePartnerServices({
          categoryId,
          subCategoryId,
          ...(pincode && { pincode }),
        });
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setServices(list);
      } catch (e) {
        console.error(e);
        setError("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [subCategoryId]);
  console.log("SSERVICES", services);
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            {SubCategory || "Services "}
          </h2>
          <p className="text-gray-600 mt-2">Choose the service you need</p>
        </div>

        {loading && <p className="text-center text-gray-600">Loading...</p>}
        {!loading && error && (
          <p className="text-center text-red-600">{error}</p>
        )}

        {!loading && !error && services.length === 0 && (
          <p className="text-center text-gray-600">No services found.</p>
        )}

        {/* ✅ Services Grid */}
        {!loading && !error && services.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services?.map((s) => {
              const parsedImages =
                typeof s.images === "string"
                  ? JSON.parse(s.images)
                  : s.images;

              const img = parsedImages?.[0];

              // ✅ category fallback (old + new API)
              const categoryName =
                s?.category_name ||
                "—";

              const subCategoryName =
                s?.sub_category_name ||
                "—";

              // ✅ provider fallback (old + new API)
              const providerName =
                s?.first_name || s?.last_name
                  ? `${s.first_name || ""} ${s.last_name || ""}`.trim()
                  : "—";

              // ✅ id fallback
              const serviceId = s?.id;

              return (
                <div
                  key={serviceId}
                  className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
                >
                  {/* IMAGE WRAPPER */}
                  <div className="relative">

                    {/* BADGES */}
                    {/* BADGES */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">

                      {/* ACTIVE */}
                      <span
                        className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-semibold shadow-sm backdrop-blur-md border
      ${s?.is_active
                            ? "bg-green-500/90 text-white border-green-300 shadow-green-200"
                            : "bg-gray-200/80 text-gray-700 border-gray-300"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s?.is_active ? "bg-white animate-pulse" : "bg-gray-500"}`} />
                        {s?.is_active ? "Active" : "Inactive"}
                      </span>

                      {/* AVAILABLE */}
                      <span
                        className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-semibold shadow-sm backdrop-blur-md border
      ${s?.partner_available
                            ? "bg-blue-500/90 text-white border-blue-300 shadow-blue-200"
                            : "bg-red-200/80 text-red-700 border-red-300"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s?.partner_available ? "bg-white animate-pulse" : "bg-red-500"}`} />
                        {s?.partner_available ? "Available" : "Busy"}
                      </span>

                      {/* VERIFIED */}
                      <span
                        className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-semibold shadow-sm backdrop-blur-md border
      ${s?.approval_status === "approved"
                            ? "bg-emerald-500/90 text-white border-emerald-300 shadow-emerald-200"
                            : "bg-yellow-200/80 text-yellow-800 border-yellow-300"
                          }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s?.approval_status === "approved" ? "bg-white animate-pulse" : "bg-yellow-600"}`} />
                        {s?.approval_status === "approved" ? "Verified" : "Pending"}
                      </span>

                    </div>

                    {/* IMAGE */}
                    <img
                      src={img  || "/images/default_img.webp"}
                      alt={s.title}
                      className="w-full h-44 object-cover"
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {s.title}
                    </h3>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {s.subtitle || "—"}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <Tag size={16} />
                        {categoryName} / {subCategoryName}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock size={16} />
                        {s?.estimated_time || "—"} Hours
                      </p>

                      <p className="flex items-center gap-2">
                        <User size={16} />
                        {providerName}
                      </p>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-blue-600 font-bold text-lg">
                        ${s?.price}
                      </span>

                      <button
                        onClick={() =>
                          router.push(`/services/services_details/${serviceId}`)
                        }
                        className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:scale-105 transition"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
