"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";
import PricingSection from "../PricingSection";
import ComingSoon from "@/app/coming-soon/page";
import { Users, Briefcase, FileText, CircleDollarSign } from "lucide-react";
import ChartCard from "@/components/charts/ChartCard";
import StatCard from "@/components/charts/StatCard";
import PieChartBox from "@/components/charts/PieChartBox";
import BarChartBox from "@/components/charts/BarChartBox";
import dashboardApi from "@/services/dashboardData";

export default function Page() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getPartnerDashboardData, getPartnerLast7DaysBookings } = dashboardApi;
  const [dashboardData, setDashboardData] = useState(null);
  const [freebookingLimit, setFreebookingLimit] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const rawUser = localStorage.getItem("USER");
      const freebookingLimit = localStorage.getItem("FREEBOOKINGLIMIT");

      const Subscription = localStorage.getItem("SUBSCRIPTION")

      console.log("Subscription", JSON.parse(Subscription));


      setFreebookingLimit(freebookingLimit);

      // console.log("freebookingLimit", freebookingLimit)


      // // ✅ check subscription
      // // const isSubscribed =
      // //   user?.subscription?.subscription === true &&
      // //   user?.subscription?.status === "ACTIVE" &&
      // //   !isExpired || freebookingLimit;

      const subscriptionData = JSON.parse(Subscription);

      const expiryDate = subscriptionData?.end_date;
      const today = new Date();

      const isExpired = expiryDate ? new Date(expiryDate) < today : true;

      // ✅ correct subscription check
      const isSubscribed =
        subscriptionData?.status === "ACTIVE" &&
        !isExpired;

      // include free booking fallback
      const finalAccess = isSubscribed || freebookingLimit;

      setHasSubscription(finalAccess);

      setIsSubscribed(isSubscribed);

      // console.log("finalAccess",finalAccess)

      // setHasSubscription(isSubscribed);
    } catch (err) {
      console.error("USER parse error:", err);
    }
  }, []);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, last7DaysResponse] = await Promise.all([
          getPartnerDashboardData(),
          getPartnerLast7DaysBookings(),
        ]);

        setDashboardData(dashboardResponse?.data?.data ?? {});
        setLast7DayBooking(last7DaysResponse?.data?.data ?? []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const [last7dayBooking, setLast7DayBooking] = useState([]);

  const bookingBarData =
    last7dayBooking?.map((item) => ({
      year: item?._id,
      value: item?.totalBookings,
    })) || [];
  // ✅ prevent hydration mismatch

  if (!mounted) return null;

  console.log("hasSubscription", hasSubscription);

  // const BookingStatusData = [
  //   { name: "Pending", value: 15, color: "#5B7CFA" },
  //   { name: "Approved", value: 40, color: "#0E73B8" },
  //   { name: "Rejected", value: 10, color: "#33A6DD" },
  //   { name: "Active", value: 20, color: "#1FC7C9" },
  //   { name: "Complete", value: 15, color: "#342F9E" },
  // ];
  const BookingStatusData = dashboardData
    ? [
      { name: "Pending", key: "Pending", color: "#5B7CFA" },
      { name: "Approved", key: "Accept", color: "#0E73B8" },
      { name: "Rejected", key: "Reject", color: "#33A6DD" },
      { name: "Complete", key: "Completed", color: "#342F9E" },
      { name: "Cancelled", key: "Cancelled", color: "#342F9E" },
    ].map((item) => ({
      name: item?.name,
      value: dashboardData?.bookingStatusStats?.[item.key] || 0,
      color: item.color,
    }))
    : [];
  // const bookingBarData = [
  //   { year: "1/12", value: 80 },
  //   { year: "2/12", value: 150 },
  //   { year: "3/12", value: 100 },
  //   { year: "4/12", value: 220 },
  //   { year: "5/12", value: 180 },
  //   { year: "6/12", value: 130 },
  //   { year: "7/12", value: 160 },
  // ];

  console.log("freebookingLimit", typeof (freebookingLimit));
  return (
    <PartnerGuard>
      <AdminLayout>
        {/* <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${freebookingLimit === "true"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
            }`}
        >
          <p>
            {freebookingLimit === "true"
              ? "🚀 Free Booking Access Activated! You can accept up to 5 bookings without a subscription. Upgrade later for more."
              : "Your free booking trial has ended. Please subscribe to a plan."}
          </p>
        </div> */}
        {!isSubscribed && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${freebookingLimit === "true"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
              }`}
          >
            <p>
              {freebookingLimit === "true"
                ? "🚀 Free Booking Access Activated! You can accept up to 5 bookings without a subscription. Upgrade later for more."
                : "Your free booking trial has ended. Please subscribe to a plan."}
            </p>
          </div>
        )}


        {!hasSubscription ? (
          <PricingSection />
        ) : (
          <div className="p-6 text-center text-red-500 font-semibold">
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="mb-6 text-left">
                <h1 className="text-2xl font-bold text-slate-800">
                  Dashboard Analytics
                </h1>
                <p className="text-slate-500 text-sm mt-1">Partner dashboard</p>
              </div>

              {/* top stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                <StatCard
                  title="Total Services"
                  value={dashboardData?.totalServices ?? 0}
                  icon={Users}
                />
                <StatCard
                  title="Total Booking"
                  value={dashboardData?.bookingStatusStats?.Completed ?? 0}
                  icon={Briefcase}
                />
                <StatCard
                  title="Revenue"
                  value={"$ " + (dashboardData?.totalRevenue ?? 0)}
                  icon={CircleDollarSign}
                />
              </div>

              {/* row 1 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Booking">
                  <div className="relative h-[300px]">
                    <PieChartBox
                      data={BookingStatusData}
                      height={300}
                      outerRadius={100}
                    />

                    {!BookingStatusData?.some((item) => item.value > 0) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                        <FileText size={28} className="mb-2 text-gray-400" />
                        <p className="text-lg text-gray-500">
                          Data not available
                        </p>
                      </div>
                    )}
                  </div>
                </ChartCard>

                <ChartCard title="Last 7 days Booking">
                  <div className="relative h-[300px]">
                    <BarChartBox
                      data={bookingBarData}
                      xKey="year"
                      barKey="value"
                      height={300}
                      color="#0E73B8"
                    />

                    {bookingBarData?.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                        <FileText size={28} className="mb-2 text-gray-400" />
                        <p className="text-lg text-gray-500">
                          Data not available
                        </p>
                      </div>
                    )}
                  </div>
                </ChartCard>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </PartnerGuard>
  );
}
