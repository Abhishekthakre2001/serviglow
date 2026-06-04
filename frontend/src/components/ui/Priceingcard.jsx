"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";

export default function PricingCard({
  plan,
  onSelect,
  popular = false,
  loading = false,
  isActive = false,
}) {
  const disabled = loading || isActive;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm bg-white relative ${
        popular ? "border-blue-600" : "border-gray-200"
      }`}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-6 flex gap-2">
        {popular && (
          <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
            Popular
          </span>
        )}
      </div>

      {isActive && (
        <span className="absolute -top-3 right-6 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
          Active
        </span>
      )}

      <h3 className="text-xl font-semibold">{plan.title}</h3>
      <p className="text-gray-500 mt-1">{plan.description}</p>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-bold">${plan.price}</span>
        <span className="text-gray-500">/{plan.duration}</span>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-gray-700">
        {plan.features?.map((f, i) => (
          <li key={i} className="flex gap-2">
            <Check size={18} className="text-green-600 mt-[2px] shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        onClick={() => {
          if (disabled) return;
          onSelect(plan);
        }}
        disabled={disabled}
        className={`mt-6 w-full rounded-lg py-3 font-semibold transition flex items-center justify-center gap-2
          ${
            isActive
              ? "bg-green-100 text-green-700 cursor-not-allowed"
              : loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Processing...
          </>
        ) : isActive ? (
          "Current Plan"
        ) : (
          "Choose Plan"
        )}
      </button>
    </div>
  );
}