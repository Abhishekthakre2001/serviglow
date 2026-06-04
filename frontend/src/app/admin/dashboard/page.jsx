"use client";

import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard";
import { Users, Briefcase, FileText, CircleDollarSign } from "lucide-react";

import ChartCard from "@/components/charts/ChartCard";
import StatCard from "@/components/charts/StatCard";
import PieChartBox from "@/components/charts/PieChartBox";
import BarChartBox from "@/components/charts/BarChartBox";
import LineChartBox from "@/components/charts/LineChartBox";
import DonutChartBox from "@/components/charts/DonutChartBox";
import ProgressChartBox from "@/components/charts/ProgressChartBox";
import dashboardApi from "@/services/dashboardData";

export default function Page() {
  const [dashboardData, setDashboardData] = React.useState(null);
  const [last7daysBookings, setLast7DaysBookings] = React.useState([]);

  const { getAdminDashboardData, getAdminLast7DaysBookings, } = dashboardApi;
  // const partnerStatusData = [
  //   { name: "Pending", value: 15, color: "#5B7CFA" },
  //   { name: "Approved", value: 40, color: "#0E73B8" },
  //   { name: "Rejected", value: 10, color: "#33A6DD" },
  //   { name: "Active", value: 20, color: "#1FC7C9" },
  //   { name: "Other", value: 15, color: "#342F9E" },
  // ];

  const partnerStatusData = dashboardData
    ? [
      { name: "Pending", key: "pending", color: "#F59E0B" },
      { name: "Approved", key: "approved", color: "#10B981" },
      { name: "Active", key: "active", color: "#3B82F6" },
      { name: "Rejected", key: "rejected", color: "#EF4444" }
    ].map((item) => ({
      name: item.name,
      value: dashboardData?.partnerStats?.[item.key] || 0,
      color: item.color,
    }))
    : [];

  // const bookingBarData = [
  //   { year: "2018", value: 80 },
  //   { year: "2019", value: 150 },
  //   { year: "2020", value: 100 },
  //   { year: "2021", value: 220 },
  //   { year: "2022", value: 180 },
  //   { year: "2023", value: 130 },
  //   { year: "2024", value: 160 },
  //   { year: "2025", value: 250 },
  // ];

  const growthLineData = [
    { month: "Jan", users: 20, partners: 60, booking: 10 },
    { month: "Feb", users: 70, partners: 40, booking: 30 },
    { month: "Mar", users: 50, partners: 30, booking: 90 },
    { month: "Apr", users: 40, partners: 80, booking: 60 },
    { month: "May", users: 85, partners: 55, booking: 35 },
    { month: "Jun", users: 65, partners: 95, booking: 75 },
  ];

  const miniPie1 = React.useMemo(() => [
    {
      name: "Categories",
      value: dashboardData?.totalCategories || 0,
      color: "#0E73B8",
    },
    {
      name: "SubCategories",
      value: dashboardData?.totalSubCategories || 0,
      color: "#5B7CFA",
    },
  ], [dashboardData]);

  const miniPie2 = React.useMemo(() => [
    {
      name: "Approved",
      value: dashboardData?.partnerStats?.approved || 0,
      color: "#0E73B8",
    },
    {
      name: "Pending",
      value: dashboardData?.partnerStats?.pending || 0,
      color: "#5B7CFA",
    },
    {
      name: "Rejected",
      value: dashboardData?.partnerStats?.rejected || 0,
      color: "#33A6DD",
    },
  ], [dashboardData]);

  const miniPie3 = React.useMemo(() => [
    {
      name: "Contacts",
      value: dashboardData?.totalContacts || 0,
      color: "#33A6DD",
    },
    {
      name: "Quotes",
      value: dashboardData?.totalQuotes || 0,
      color: "#5B7CFA",
    },
  ], [dashboardData]);

  const donutData = [
    { name: "Profit", value: 45, color: "#0E73B8" },
    { name: "Sales", value: 35, color: "#1FC7C9" },
    { name: "Loss", value: 20, color: "#5B7CFA" },
  ];

  const progressItems = [
    { label: "Partners", value: 25 },
    { label: "Users", value: 80 },
    { label: "Enquiry", value: 50 },
    { label: "Quotation", value: 35 },
  ];
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, last7DaysResponse] = await Promise.all([
          getAdminDashboardData(),
          getAdminLast7DaysBookings(),
        ]);
        console.log("dashboardResponse?.data?.data", dashboardResponse?.data?.data)
        setDashboardData(dashboardResponse?.data?.data ?? {});
        setLast7DaysBookings(last7DaysResponse?.data?.data ?? []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const bookingBarData =
    last7daysBookings?.map((item) => ({
      year: item?._id,
      value: item?.totalBookings,
    })) || [];
  console.log("dashboardData", dashboardData);
  return (
    <AdminGuard>
      <AdminLayout>
        <div className="min-h-screen bg-slate-100 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Dashboard Analytics
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Admin dashboard
            </p>
          </div>

          {/* top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <StatCard
              title="Total Customers"
              value={dashboardData?.totalUsers ?? 0}
              icon={Users}
            />
            <StatCard
              title="Total Partners"
              value={dashboardData?.partnerStats.approved ?? 0}
              icon={Briefcase}
            />
            <StatCard
              title="Enquiry"
              value={dashboardData?.totalContacts ?? 0}
              icon={FileText}
            />
            <StatCard title="Revenue" value={`$ ${dashboardData?.totalRevenue ?? 0}`} icon={CircleDollarSign} />
          </div>

          {/* row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Partner's">
              <div className="relative">
                <PieChartBox
                  data={partnerStatusData}
                  height={300}
                  outerRadius={100}
                />

                {!partnerStatusData?.some(item => item.value > 0) && (
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
              <div className="relative">
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

          {/* row 2 */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  <ChartCard title="Masters">
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="relative">
        <PieChartBox
          data={miniPie1}
          height={180}
          outerRadius={55}
          innerRadius={25}
          showLegend={false}
        />

        {!miniPie1?.some(item => item.value > 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
            <FileText size={28} className="mb-2 text-gray-400" />
            <p className="text-lg text-gray-500">
              Data not available
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xl font-bold text-slate-800">01</h4>
        <p className="text-sm text-slate-500 mt-2">
          Categories Distribution summary.
        </p>
      </div>
    </div>
  </ChartCard>

  <ChartCard title="User">
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="relative">
        <PieChartBox
          data={miniPie2}
          height={180}
          outerRadius={55}
          innerRadius={25}
          showLegend={false}
        />

        {!miniPie2?.some(item => item.value > 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
            <FileText size={28} className="mb-2 text-gray-400" />
            <p className="text-lg text-gray-500">
              Data not available
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xl font-bold text-slate-800">02</h4>
        <p className="text-sm text-slate-500 mt-2">
          Total Users
        </p>
      </div>
    </div>
  </ChartCard>

  <ChartCard title="Contact">
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="relative">
        <PieChartBox
          data={miniPie3}
          height={180}
          outerRadius={55}
          innerRadius={25}
          showLegend={false}
        />

        {!miniPie3?.some(item => item.value > 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
            <FileText size={28} className="mb-2 text-gray-400" />
            <p className="text-lg text-gray-500">
              Data not available
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xl font-bold text-slate-800">02</h4>
        <p className="text-sm text-slate-500 mt-2">
          Contacts and quote Summary
        </p>
      </div>
    </div>
  </ChartCard>
</div> */}

          {/* row 3 */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Progress">
              <ProgressChartBox items={progressItems} />
            </ChartCard>

            <ChartCard title="Donut Chart">
              <DonutChartBox
                data={donutData}
                height={240}
                centerText="45%"
                centerSubText="Profit"
              />
            </ChartCard>

            <ChartCard title="Profit Overview">
              <DonutChartBox
                data={[
                  { name: "Profit", value: 70, color: "#33A6DD" },
                  { name: "Remaining", value: 30, color: "#25136E" },
                ]}
                height={240}
                centerText="PROFIT"
              />
            </ChartCard>
          </div> */}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
