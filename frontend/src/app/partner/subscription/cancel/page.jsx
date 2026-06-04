"use client";

import React from "react";
import Link from "next/link";
import { XCircle, ArrowRight, RefreshCcw, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";

export default function Page() {
    return (
        <>
            <PartnerGuard>
                <AdminLayout>
                    <div className=" bg-[#f7f9fc] relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                        </div>

                        <div className="relative max-w-6xl mx-auto px-4 py-4">
                            <div className="max-w-3xl mx-auto text-center">
                                {/* Badge */}
                                <div className="flex justify-center mb-6">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-md">
                                        <AlertTriangle size={16} className="text-red-500" />
                                        Payment Cancelled / Failed
                                    </div>
                                </div>

                                {/* Card */}
                                <div className="relative rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_70px_rgba(17,24,39,0.10)] overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />

                                    <div className="px-6 py-10 md:px-12 md:py-14">
                                        {/* Icon */}
                                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-200">
                                            <XCircle size={46} className="text-white" />
                                        </div>

                                        {/* Heading */}
                                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">
                                            Payment Not Completed
                                            <span className="block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mt-2">
                                                Try Again Anytime
                                            </span>
                                        </h1>

                                        {/* Description */}
                                        <p className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                                            Your subscription process was not completed or was cancelled.
                                            Don’t worry — you can retry anytime and continue accessing premium features.
                                        </p>

                                        {/* Actions */}
                                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <Link
                                                href="/partner/subscription"
                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 px-7 py-3.5 text-white font-semibold shadow-lg transition hover:scale-[1.02]"
                                            >
                                                Retry Subscription
                                                <RefreshCcw size={18} />
                                            </Link>

                                            <Link
                                                href="/partner/dashboard"
                                                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-gray-700 font-semibold transition hover:bg-gray-50"
                                            >
                                                Go to Dashboard
                                                <ArrowRight size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                
                            </div>
                        </div>
                    </div>
                </AdminLayout>
            </PartnerGuard>
        </>

    );
}