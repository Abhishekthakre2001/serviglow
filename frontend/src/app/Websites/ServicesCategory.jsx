"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import serviceApi from "@/services/serviceApi";

const BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export default function ServicesPremium() {
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zipCode, setZipCode] = useState("");

  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const handleZipChange = async (e) => {

    const value = e.target.value;

    setZipCode(value);

    // call api after 3 characters
    if (value.length >= 3) {

      loadCategories(value);

    }

    // reset all data when empty
    if (value.length === 0) {

      loadCategories();

    }
  };

  const loadCategories = async (zip = "") => {
    try {
      setLoading(true);

      const res = await serviceApi.getUsedCategories(zip);

      const data = res.data?.data || [];

      const formatted = data.map((cat) => ({
        id: cat.id,
        title: cat.category_name,
        desc: cat.sub_title,
        image: `${BASE_URL}${cat.image}`,
        totalSubCategory: cat.totalSubCategory,
      }));

      setCategories(formatted);
    } catch (error) {
      console.error("Category fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleCategories = showAll
    ? categories
    : categories.slice(0, 4);

  return (
    <section className="py-10 bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold">
            Premium Services
          </h2>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-md">

            <input
              type="text"
              value={zipCode}
              onChange={handleZipChange}
              placeholder="Search services by ZIP Code"
              className="w-full rounded-full border border-gray-300 bg-white px-6 py-4 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : categories.length === 0 ? (

          <div className="flex flex-col items-center justify-center rounded-3xl bg-transparent py-20 px-6 text-center  border border-gray-100">

            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
              <span className="text-5xl">🚀</span>
            </div>

            <h3 className="text-3xl font-bold text-gray-800">
              Services Coming Soon
            </h3>

            <p className="mt-4 max-w-xl text-gray-500 text-lg leading-7">
              We’re currently expanding exciting new services
              will be available very soon.
            </p>

            <button
              onClick={() => router.push("/contact")}
              className="mt-8 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
            >
              Contact Us
            </button>

          </div>

        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {visibleCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group relative rounded-3xl overflow-hidden shadow-xl"
                >
                  <img
                    src={cat.image || "/images/default_img.webp"}
                    alt={cat.title}
                    className="h-80 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/default_img.webp";
                    }}

                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute bottom-0 p-6 text-white w-full">

                    {/* Category Name */}
                    <h3 className="text-2xl font-bold">
                      {cat.title}
                    </h3>

                    {/* Sub Category Count Badge */}
                    <div className="mt-3 inline-flex items-center px-4 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-medium">
                      {cat.totalSubCategory} Sub-Categories Available
                    </div>

                    {/* Description */}
                    <p className="text-sm mt-4 text-gray-200 leading-relaxed">
                      {cat.desc}
                    </p>

                    {/* Button */}
                    <button
                      onClick={() => {
                        console.log("cat", cat);
                        localStorage.setItem("selectedCategory", cat.title);
                        localStorage.setItem("selectedCatId", cat.id);

                        router.push(`/services/service_subcategory/${cat.id}?zip=${zipCode}`);
                      }}
                      className="mt-5 px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-orange-500"
                    >
                      View Service →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!showAll && categories.length > 4 && (
              <div className="text-center mt-16">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-10 py-3 text-white bg-gradient-to-r from-blue-600 to-orange-500 rounded-full"
                >
                  Explore All Categories
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}