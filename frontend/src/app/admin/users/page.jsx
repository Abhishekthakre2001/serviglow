"use client";

import React, { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import AdminLayout from "@/components/layout/AdminLayout";
import userApi from "../../../services/userApi";
import useServerPagination from "@/hooks/useServerPagination";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Conformation";
import ExportApi from "@/services/exportApi";

export default function Users() {
  const router = useRouter();

  const [alertOpen, setAlertOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    message: "",
  });

  // =========================================
  // TABLE COLUMNS
  // =========================================
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Mobile" },

    {
      key: "address",
      label: "Address",
      render: (value) => (
        <div className="max-w-[260px] whitespace-normal break-words">
          {value || "-"}
        </div>
      ),
    },

    // =========================================
    // STATUS COLUMN
    // =========================================
    {
      key: "status",
      label: "Status",
      render: (value, row) => (
        <button
          disabled={processing}
          onClick={() => handleStatusToggle(row)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition disabled:opacity-50
      ${value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {processing
            ? "Updating..."
            : value.charAt(0).toUpperCase() + value.slice(1)}
        </button>
      ),
    },
  ];

  // =========================================
  // SERVER PAGINATION
  // =========================================
  const {
    data: users,
    loading,
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    refetch,
  } = useServerPagination(userApi.getAllCustomer, {
    initialPage: 1,
    initialLimit: 5,

    formatData: (rawData) =>
      (rawData || []).map((user) => ({
        id: user.id,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        email: user.email || "-",
        phone: user.phone || "-",

        status: user.status || "active",

        address: [
          user?.addr_line1,
          user?.addr_line2,
          user?.addr_city,
          user?.addr_state,
          user?.addr_zip,
        ]
          .filter(Boolean)
          .join(", "),
      })),
  });

  // =========================================
  // VIEW USER
  // =========================================
  const handleView = (row) => {
    router.push(`/admin/users/${row.id}`);
  };

  // =========================================
  // DELETE USER
  // =========================================
  const handleDelete = (row) => {

    setSelectedUser(row);

    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {

    if (!selectedUser) return;

    try {

      setProcessing(true);

      await userApi.deleteCustomer(selectedUser.id);

      await refetch();

      setAlertConfig({
        type: "success",
        title: "Deleted",
        message: "Customer deleted successfully",
      });


      setAlertOpen(true);


    } catch (error) {

      setAlertConfig({
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Failed to delete customer",
      });

      setAlertOpen(true);

    } finally {

      setProcessing(false);

      setConfirmOpen(false);

      setSelectedUser(null);
    }
  };
  // =========================================
  // ACTIVE / DEACTIVE
  // =========================================
  const handleStatusToggle = async (row) => {

    try {

      setProcessing(true);

      const response =
        await userApi.toggleCustomerStatus(row.id);

      setAlertConfig({
        type: "success",
        title: "Success",
        message:
          response?.data?.message ||
          "Status updated successfully",
      });

      setAlertOpen(true);

      // refresh data
      await refetch();

    } catch (error) {

      setAlertConfig({
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Failed to update status",
      });

      setAlertOpen(true);

    } finally {

      setProcessing(false);
    }
  };

  const handleExportCustomers = async () => {
    try {
      const response =
        await ExportApi.exportCustomers();

      const blob = new Blob([
        response.data,
      ]);

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "customers.xlsx";

      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <Alert
        open={confirmOpen}
        type="warning"
        title="Delete Customer"
        message="Are you sure you want to permanently delete this customer? This action cannot be undone. All customer data, including profile information, bookings, transactions, subscriptions, and any associated records, will be permanently removed from the system."
        onClose={() => {
          setConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDeleteUser}
      />
      <DataTable
        title="User's List"
        columns={columns}
        data={users}
        loading={loading || processing}
        showActions={true}
        pagination={true}
        onExport={handleExportCustomers}
        // built-in actions
        onView={handleView}
        onDelete={handleDelete}

        // server pagination
        serverSide={true}
        currentPageProp={page}
        totalPagesProp={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </AdminLayout>
  );
}