"use client";

import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import UserGuard from "@/app/Users/UserGuard.jsx";
import { Users, Briefcase, CircleDollarSign, FileText } from "lucide-react";

import ChartCard from "@/components/charts/ChartCard";
import StatCard from "@/components/charts/StatCard";
import PieChartBox from "@/components/charts/PieChartBox";
import BarChartBox from "@/components/charts/BarChartBox";
import dashboardApi from "@/services/dashboardData";

export default function Page() {
  const { getCustomerDashboardData } = dashboardApi;
  const [dashboardData, setDashboardData] = React.useState(null);

  // const bookingStatusData = [
  //   { name: "Pending", value: 15, color: "#5B7CFA" },
  //   { name: "Accepted", value: 40, color: "#0E73B8" },
  //   { name: "Rejected", value: 10, color: "#33A6DD" },
  //   { name: "Active", value: 20, color: "#1FC7C9" },
  //   { name: "Completed", value: 15, color: "#342F9E" },
  // ];

  const bookingBarData = [
    { day: "1/12", value: 80 },
    { day: "2/12", value: 150 },
    { day: "3/12", value: 100 },
    { day: "4/12", value: 220 },
    { day: "5/12", value: 180 },
    { day: "6/12", value: 130 },
    { day: "7/12", value: 160 },
  ];
  const bookingStatusData = dashboardData?.bookingStatusStats ? [
    { name: "Pending", value: dashboardData?.bookingStatusStats?.Pending ?? 0, color: "#5B7CFA" },
    { name: "Accepted", value: dashboardData?.bookingStatusStats?.Accept ?? 0, color: "#0E73B8" },
    { name: "Rejected", value: dashboardData?.bookingStatusStats?.Reject ?? 0, color: "#33A6DD" },
    { name: "Active", value: dashboardData?.bookingStatusStats?.Active ?? 0, color: "#1FC7C9" },
    { name: "Completed", value: dashboardData?.bookingStatusStats?.Completed ?? 0, color: "#342F9E" },
    { name: "Cancelled", value: dashboardData?.bookingStatusStats?.Cancelled ?? 0, color: "#f7ab40" },
  ] : [];

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getCustomerDashboardData();
        setDashboardData(response?.data?.data ?? {});
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <UserGuard>
      <AdminLayout>
        <div className="min-h-screen bg-slate-100 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Dashboard Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">User dashboard</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
            <StatCard title="Total Bookings" value={dashboardData?.totalBookings ?? 0} icon={Briefcase} />
            {/* <StatCard
              title="Revenue"
              value="$12,500"
              icon={CircleDollarSign}
            /> */}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Booking Status">
              <div className="relative">
                <PieChartBox
                  data={bookingStatusData}
                  height={300}
                  outerRadius={100}
                />

                {!bookingStatusData?.some(item => item.value > 0) && (
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
      </AdminLayout>
    </UserGuard>
  );
}