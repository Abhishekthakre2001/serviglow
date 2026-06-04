"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarUI({ value, onChange }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isSameDay = (d1, d2) =>
    d1?.toDateString() === d2?.toDateString();

  const isPastDate = (date) =>
    date < new Date(today.setHours(0, 0, 0, 0));

  const selectDate = (day) => {
    const selected = new Date(year, month, day);
    if (!isPastDate(selected)) onChange(selected);
  };

  return (
    <div className="rounded-3xl bg-white shadow-xl border-2-gray-200 overflow-hidden">

      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-2 rounded-full hover:bg-white/20 transition"
        >
          <ChevronLeft />
        </button>

        <h3 className="font-semibold text-lg tracking-wide">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h3>

        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-2 rounded-full hover:bg-white/20 transition"
        >
          <ChevronRight />
        </button>
      </div>

      {/* ===== BODY ===== */}
      <div className="p-5">

        {/* DAYS */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-3">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* DATES */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(firstDay)].map((_, i) => (
            <div key={i} />
          ))}

          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);

            const disabled = isPastDate(dateObj);
            const selected = isSameDay(value, dateObj);
            const isToday = isSameDay(today, dateObj);

            return (
              <button
                key={day}
                onClick={() => selectDate(day)}
                disabled={disabled}
                className={`
                  h-11 rounded-xl flex items-center justify-center
                  text-sm font-semibold transition-all duration-200
                  ${
                    selected
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg scale-105"
                      : isToday
                      ? "border-2 border-blue-500 text-blue-600"
                      : "hover:bg-blue-50"
                  }
                  ${
                    disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* FOOTER INFO */}
        <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
          <span>
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1" />
            Today
          </span>
          <span>
            <span className="inline-block w-2 h-2 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mr-1" />
            Selected
          </span>
        </div>
      </div>
    </div>
  );
}
