"use client";

import React from "react";

export default function ProgressChartBox({
  items = [],
  trackColor = "bg-indigo-800",
  fillColor = "bg-sky-500",
}) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-semibold text-slate-800">{item.value}%</span>
          </div>

          <div className={`w-full h-5 rounded-full overflow-hidden ${trackColor}`}>
            <div
              className={`h-full rounded-full ${fillColor}`}
              style={{ width: `${item.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}