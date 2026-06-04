"use client";

import React from "react";

export default function ChartCard({ title, children, className = "" }) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 ${className}`}
        >
            {title && (
                <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        {title}
                    </h3>
                </div>
            )}
            {children}
        </div>
    );
}