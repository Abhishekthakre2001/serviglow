"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import ServicesSubCategory from "../../../Websites/ServicesSubCategory";
import Footer from "@/components/layout/Footer";

export default function ServicesSubCategoryPage() {
  const [categoryName, setCategoryName] = useState("Category");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedCategory");
      if (stored) setCategoryName(stored);
    }
  }, []);

  return (
    <>
      <Navbar />

      <section className="w-full bg-white border-t-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="relative overflow-hidden rounded-3xl bg-white/80 px-6 py-6">
            <ol className="flex items-center flex-wrap gap-3 text-sm md:text-base text-gray-600">
              <li className="flex items-center gap-3">
                <span className="p-2.5 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                  <Home size={16} />
                </span>

                <Link href="/" className="font-semibold hover:text-blue-600">
                  Home
                </Link>
              </li>

              <li className="flex items-center gap-3">
                <ChevronRight size={20} className="text-gray-400" />
                <Link href="/services" className="hover:text-blue-600">
                  Services
                </Link>
              </li>

              <li className="flex items-center gap-3">
                <ChevronRight size={20} className="text-gray-400" />
                <span className="font-bold text-blue-600">
                  {categoryName}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <ServicesSubCategory />
      <Footer />
    </>
  );
}