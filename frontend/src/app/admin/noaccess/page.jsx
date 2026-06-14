"use client";

import React from "react";
import Link from "next/link";
import {
    ShieldX,
    ArrowRight,
    AlertTriangle
} from "lucide-react";

export default function Page() {

    return (
        <div className="relative overflow-hidden min-h-[80vh] flex items-center justify-center">

            {/* Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 py-10">

                <div className="max-w-2xl mx-auto text-center">

                    {/* Badge */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-md">
                            <AlertTriangle size={16} className="text-red-500" />
                            Access Restricted
                        </div>
                    </div>

                    {/* Card */}
                    <div className="relative rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_70px_rgba(17,24,39,0.10)] overflow-hidden">

                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />

                        <div className="px-6 py-12 md:px-12 md:py-16">

                            {/* Icon */}
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-200">
                                <ShieldX size={46} className="text-white" />
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
                                No Permission Access
                            </h1>

                            <span className="block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mt-3 text-xl md:text-2xl font-bold">
                                Please Contact Your Super Admin
                            </span>

                            {/* Description */}
                            <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                You currently do not have permission to access this modules or pages.
                                Please contact your super admin to enable permissions for your account.
                            </p>

                            {/* Actions */}
                            <div className="mt-10 flex items-center justify-center">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 px-7 py-3.5 text-white font-semibold shadow-lg transition hover:scale-[1.02]"
                                >
                                    Back to Home
                                    <ArrowRight size={18} />
                                </Link>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}