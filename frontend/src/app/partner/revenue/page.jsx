"use client";

import React, { useEffect, useMemo, useState } from "react";
import PartnerGuard from "@/app/partner/PartnerGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import DataTable from "@/components/ui/DataTable";
import partnerApi from "@/services/partnerApi";
import useServerPagination from "@/hooks/useServerPagination"; // ✅ ADD

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ GET PARTNER ID (same logic reused)
  const userData =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("USER") || "{}")
      : {};
  const partnerId = userData?.id;

  // ✅ PAGINATION HOOK
  const {
    data: paginatedRows,
    loading: paginationLoading,
    page,
    totalPages,
    setPage,
  } = useServerPagination(
    (page, limit) =>
      partnerApi.getRevenueDetailsByPartnerId(partnerId, page, limit),
    {
      formatData: (raw) => raw,
    }
  );



  useEffect(() => {
    console.log("paginatedRows", paginatedRows)
    if (paginatedRows) {
      setRows(paginatedRows);
      setLoading(false);
    }
  }, [paginatedRows]);


  const totalRevenue = useMemo(() => {
    return rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  }, [rows]);

  const columns = [
    { key: "bookingId", label: "Booking ID" },
    { key: "customerId", label: "Customer ID" },
    { key: "customerName", label: "Customer Name" },
    { key: "mobileNumber", label: "Mobile Number" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    {
      key: "price",
      label: "Price",
      render: (value) => `$ ${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (value) => `$ ${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "date",
      label: "Date",
      isDate: true,
      render: (value) =>
        value ? new Date(value).toLocaleDateString("en-IN") : "N/A",
    },
    { key: "time", label: "Time" },
    { key: "status", label: "Status" },
  ];

  return (
    <PartnerGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          <DataTable
            title="Partner Revenue Details"
            columns={columns}
            data={rows}
            loading={loading || paginationLoading}
            showActions={false}
            searchable={true}
            pagination={true}
            exportable={true}

            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </AdminLayout>
    </PartnerGuard>
  );
}