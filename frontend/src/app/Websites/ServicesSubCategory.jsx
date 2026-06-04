"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import {
  useRouter,
  useParams,
  useSearchParams,
} from "next/navigation";

import serviceApi from "@/services/serviceApi";

const BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export default function HousekeepingSubCategory() {

  const router = useRouter();

  const { categoryId } = useParams();

  // ✅ GET ZIP FROM URL
  const searchParams = useSearchParams();

  const zip =
    searchParams.get("zip") || "";

  const [subCategories, setSubCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [Category, setCategory] =
    useState(
      localStorage.getItem("selectedCategory") ||
      "Sub-Category"
    );

  useEffect(() => {

    if (!categoryId) return;

    const fetchSubCategories = async () => {

      try {

        setLoading(true);

        // ✅ SEND ZIP TO API
        const res =
          await serviceApi.getUsedSubCategories(
            categoryId,
            zip
          );

        const data =
          res.data.data.map((item) => ({
            id: item.id,
            title: item.sub_category_name,
            desc: item.sub_title,
            image: `${BASE_URL}${item.image}`,
            totalServices: item.totalServices,
          }));

        setSubCategories(data);

      } catch (err) {

        console.error(
          "Subcategory error:",
          err
        );

      } finally {

        setLoading(false);

      }
    };

    fetchSubCategories();

  }, [categoryId, zip]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            {Category}
          </h2>

          <p className="text-gray-600 mt-2">
            Choose specialized services
          </p>
        </div>

        {loading ? (

          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>

        ) : subCategories.length === 0 ? (

          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 px-6 text-center shadow-sm border border-gray-100">

            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100">
              <span className="text-5xl">🚀</span>
            </div>

            <h3 className="text-3xl font-bold text-gray-800">
              Services Coming Soon
            </h3>

            <p className="mt-4 max-w-xl text-gray-500 text-lg leading-7">
              We’re currently expanding this category and exciting new services
              will be available very soon.
            </p>

            <button
              onClick={() =>
                router.push("/contact")
              }
              className="mt-8 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
            >
              Contact Us
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {subCategories.map((item) => (

              <div
                key={item.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >

                <div className="relative overflow-hidden">

                  <img
                    src={item.image || "/images/default_img.webp"}
                    alt={item.title}
                    className="h-52 w-full object-cover group-hover:scale-110 transition duration-500"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/default_img.webp";
                    }}

                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                      {item.totalServices} Services Available
                    </span>
                  </div>

                </div>

                <div className="p-6">

                  <h3 className="text-xl font-bold text-gray-800 line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>

                  <button
                    onClick={() => {

                      localStorage.setItem(
                        "selectedSubCategory",
                        item.title
                      );

                      // ✅ PASS ZIP TO NEXT PAGE ALSO
                      router.push(
                        `/services/partners/${item.id}?zip=${zip}`
                      );

                    }}
                    className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-medium hover:scale-[1.02] transition"
                  >
                    View Services →
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </section>
  );
}