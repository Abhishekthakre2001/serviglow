"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import serviceApi from "@/services/serviceApi";

export default function PremiumHero({
  zipCode,
  setZipCode,
}) {

  const router = useRouter();

  const [slides, setSlides] = useState([]);

  const [current, setCurrent] = useState(0);

  const BASE_URL =
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {

    const loadData = async () => {

      try {

        const res =
          await serviceApi.getUsedCategories();

        const categories =
          res?.data?.topCarouselCategories || [];

        setSlides(categories);

      } catch (error) {

        console.log(error);
      }
    };

    loadData();

  }, []);

  // =========================
  // AUTO SLIDE
  // =========================

  useEffect(() => {

    if (!slides.length) return;

    const interval = setInterval(() => {

      setCurrent((prev) =>
        prev === slides.length - 1
          ? 0
          : prev + 1
      );

    }, 5000);

    return () => clearInterval(interval);

  }, [slides]);

  // =========================
  // NAVIGATION
  // =========================

  const nextSlide = () => {

    setCurrent((prev) =>
      prev === slides.length - 1
        ? 0
        : prev + 1
    );
  };

  const prevSlide = () => {

    setCurrent((prev) =>
      prev === 0
        ? slides.length - 1
        : prev - 1
    );
  };

  return (
    <section className="relative h-[85vh] overflow-hidden bg-black">

      {/* SLIDES */}
      {slides.map((item, index) => (

        <div
          key={item.id}
          className={`absolute inset-0 transition-all duration-[1800ms] ease-in-out ${index === current
            ? "opacity-100 scale-100 z-20"
            : "opacity-0 scale-110 z-10"
            }`}
        >

          {/* BACKGROUND IMAGE */}
          <img
            src={`${BASE_URL}${item.image}`}
            alt={item.category_name}
            className="absolute inset-0 h-full w-full object-cover animate-zoom"
          />

          {/* OVERLAYS */}
          <div className="absolute inset-0 bg-black/50 z-10" />

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />

          {/* GLOW */}
          <div className="absolute left-[-100px] top-[-100px] z-10 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[140px]" />

          <div className="absolute right-[-100px] bottom-[-100px] z-10 h-[500px] w-[500px] rounded-full bg-orange-500/20 blur-[140px]" />

          {/* CONTENT */}
          <div className="relative z-20 flex h-full items-center justify-center px-6 md:px-14 lg:px-24 text-center">

            <div className="max-w-4xl mx-auto flex flex-col items-center">

              {/* TOP TAG */}
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-2xl shadow-[0_8px_40px_rgba(255,255,255,0.1)]">

                <span className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-ping"></span>

                <span className="text-xs md:text-sm uppercase tracking-[5px] text-white/90 font-semibold">
                  Premium Serviglow Solutions
                </span>

              </div>

              {/* TITLE */}
              <h1 className="animate-fadeUp text-4xl font-black leading-tight text-white sm:text-5xl md:text-7xl lg:text-6xl">

                {item.category_name}

              </h1>

              {/* SUBTITLE */}
              {item.sub_title && (

                <p className="animate-fadeUp mt-8 max-w-2xl text-base leading-relaxed text-gray-300 md:text-xl lg:text-2xl">

                  {item.sub_title}

                </p>

              )}

              <div className="mt-8 w-full max-w-md">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Search services by ZIP Code"
                  className="w-full rounded-full border border-white/20 bg-white/10 backdrop-blur-xl px-6 py-4 text-white placeholder:text-gray-300 outline-none focus:border-blue-400"
                />
              </div>

              {/* BUTTONS */}
              <div className="mt-10 flex flex-wrap justify-center gap-5">
                {/* EXPLORE */}
                <button
                  onClick={() => {
                    localStorage.setItem("selectedCategory", item.category_name);
                    localStorage.setItem("selectedCatId", String(item.id));

                    router.push(`/services/service_subcategory/${item.id}`);
                  }}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_50px_rgba(37,99,235,0.5)] transition duration-500 hover:scale-105"
                >

                  <span className="relative z-10 flex items-center gap-3">

                    Explore Services

                    <ArrowRight className="transition duration-300 group-hover:translate-x-1" />

                  </span>

                  <span className="absolute inset-0 bg-white/10 opacity-0 transition duration-500 group-hover:opacity-100"></span>

                </button>

                {/* CONTACT */}
                <button
                  onClick={() =>
                    router.push("/contact")
                  }
                  className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-xl transition duration-500 hover:bg-white/20 hover:scale-105"
                >

                  Contact Us

                </button>

              </div>

            </div>

          </div>

        </div>

      ))}

      {/* LEFT BUTTON */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-5 top-1/2 z-40 h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl transition duration-300 hover:scale-110 hover:bg-white/20"
      > <ChevronLeft className="text-white" />
      </button>

      {/* RIGHT BUTTON */}
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-5 top-1/2 z-40 h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_10px_40px_rgba(37,99,235,0.5)] transition duration-300 hover:scale-110"
      >

        <ChevronRight className="text-white" />

      </button>

      {/* INDICATORS */}
      <div className="absolute bottom-10 left-1/2 z-40 flex -translate-x-1/2 gap-3">

        {slides.map((_, index) => (

          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-500 ${index === current
              ? "h-3 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              : "h-3 w-3 rounded-full bg-white/40 hover:bg-white"
              }`}
          />

        ))}

      </div>

      {/* STYLES */}
      <style jsx global>{`

        .animate-zoom {
          animation: zoomHero 12s ease-in-out infinite alternate;
        }

        @keyframes zoomHero {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.12);
          }
        }

        .animate-fadeUp {
          animation: fadeUp 1s ease;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(80px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

      `}</style>

    </section>
  );
}