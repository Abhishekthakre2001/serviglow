"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";

export default function Page() {
    useEffect(() => {
        const subscription = localStorage.getItem("SUBSCRIPTION");

        if (subscription) {
            const parsed = JSON.parse(subscription);

            const now = new Date();

            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            const updatedSubscription = {
                ...parsed,
                subscription: 1,
                status: "ACTIVE",
                start_date: now.toISOString(),
                end_date: nextMonth.toISOString(),
            };

            localStorage.setItem(
                "SUBSCRIPTION",
                JSON.stringify(updatedSubscription)
            );

            console.log("Updated SUBSCRIPTION →", updatedSubscription);
        }
    }, []);
    return (
        <>
            <PartnerGuard>
                <AdminLayout>
                    <div className="min-h-screen bg-[#f7f9fc] relative overflow-hidden">
                        {/* soft background */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                        </div>

                        <div className="relative max-w-6xl mx-auto px-4 ">
                            <div className="max-w-3xl mx-auto">
                                {/* top badge */}
                                <div className="flex justify-center mb-6">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-md">
                                        <Sparkles size={16} className="text-orange-500" />
                                        Payment completed successfully
                                    </div>
                                </div>

                                {/* main success card */}
                                <div className="relative rounded-[32px] border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_70px_rgba(17,24,39,0.10)] overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500" />

                                    <div className="px-6 py-10 md:px-12 md:py-14 text-center">
                                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-orange-500 shadow-lg shadow-blue-500/20">
                                            <CheckCircle2 size={46} className="text-white" />
                                        </div>

                                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                                            Subscription Activated
                                            <span className="block bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 bg-clip-text text-transparent mt-2">
                                                Payment Successful
                                            </span>
                                        </h1>

                                        <p className="mt-5 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-7">
                                            Thank you for your payment. Your subscription has been activated
                                            successfully. You can now access your partner features and start
                                            managing your services from the dashboard.
                                        </p>

                                        {/* feature pills */}
                                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-sm font-semibold">
                                                <BadgeCheck size={16} />
                                                Subscription Confirmed
                                            </div>
                                            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-700 px-4 py-2 text-sm font-semibold">
                                                <BadgeCheck size={16} />
                                                Premium Access Enabled
                                            </div>
                                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-semibold">
                                                <BadgeCheck size={16} />
                                                Ready to Use
                                            </div>
                                        </div>

                                        {/* action buttons */}
                                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <Link
                                                href="/partner/dashboard"
                                                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 px-7 py-3.5 text-white font-semibold shadow-lg shadow-orange-200 transition hover:scale-[1.02]"
                                            >
                                                Go to Dashboard
                                                <ArrowRight size={18} />
                                            </Link>

                                            <Link
                                                href="/partner/services"
                                                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-gray-700 font-semibold transition hover:bg-gray-50"
                                            >
                                                Manage Services
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