"use client";

import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import cmsApi from "@/services/cms";

export default function CounterSection() {
  const { getBanner } = cmsApi;

  const [counters, setCounters] = useState([]);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    fetchCounters();
  }, []);

  const fetchCounters = async () => {
    try {
      const res = await getBanner();

      setCounters(res?.data?.data?.counters || []);
    } catch (error) {
      console.log(error);
    }
  };

  const extractNumber = (value) => {
    return Number(String(value).replace(/[^\d.]/g, "")) || 0;
  };

  const getSuffix = (value) => {
    return String(value).replace(/[\d.]/g, "");
  };

  return (
    <section
      ref={ref}
      className="relative py-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white"
    >
      {/* Decorative blur */}
      <div className="absolute top-0 left-0 h-72 w-72 bg-blue-300/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 h-72 w-72 bg-orange-300/20 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-flex px-4 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            Trusted Service Platform
          </span>

          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
            Our Impact in Numbers
          </h2>

          <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
            Delivering trusted home services with verified professionals and
            exceptional customer satisfaction.
          </p>
        </div>

        <div
          className={`grid gap-6 ${
            counters.length === 5
              ? "md:grid-cols-2 lg:grid-cols-5"
              : "md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {counters.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500" />

              <div className="mb-3">
                <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-orange-500 bg-clip-text text-transparent">
                  {inView && (
                    <CountUp
                      end={extractNumber(item.number)}
                      duration={2.5}
                      decimals={item.number.includes(".") ? 1 : 0}
                    />
                  )}
                  {getSuffix(item.number)}
                </h3>
              </div>

              <p className="text-slate-700 font-semibold">
                {item.title}
              </p>

              <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-r from-blue-100 to-orange-100 opacity-50 transition-all duration-500 group-hover:scale-150" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}