
"use client";

import React from "react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-700",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}