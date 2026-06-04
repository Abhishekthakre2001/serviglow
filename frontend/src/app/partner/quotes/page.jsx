"use client";

import React, { useState, useEffect } from "react";
import DataTable from "@/components/ui/DataTable";
import { Eye } from "lucide-react";
import Conformation from "@/components/ui/Conformation";
import AdminLayout from "@/components/layout/AdminLayout";
import contactQuotationApi from "@/services/contactQuotation";
import useServerPagination from "@/hooks/useServerPagination";
export default function Quotes() {
  const [loadingResolve, setLoadingResolve] = useState(false);
  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>

          {/* {!row?.viewingStatus && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
              New
            </span>
          )} */}
        </div>
      ),
    },

    { key: "phone", label: "Phone" },

    { key: "email", label: "Email" },

    { key: "service", label: "Service" },

    {
      key: "status",
      label: "Status",
      render: (value) => {
        const status = value || "pending";

        const colors = {
          new: "bg-yellow-100 text-yellow-700",
          contacted: "bg-blue-100 text-blue-700",
          resolved: "bg-green-100 text-green-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded text-xs ${colors[status]} capitalize`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "requirement",
      label: "Requirement",
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {value ?? "-"}
        </span>
      ),
    },

    {
      key: "createdAt",
      label: "Date",
      render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
    },

    {
      key: "view",
      label: "View",
      render: (_, row) => (
        <button
          onClick={() => handleView(row)}
          className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-100 rounded"
        >
          <Eye size={14} className="sm:w-4 sm:h-4" />
        </button>
      ),
    },
  ];

  /* ================= STATE ================= */

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [viewModal, setViewModal] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    onConfirm: null,
  });

  /* ================= FETCH QUOTES ================= */
  const formatRows = (arr) =>
    (arr || []).map((item) => ({
      id: item?.id,
      name: item?.name,
      phone: item?.phone,
      email: item?.email,
      service: item?.service?.category_name,
      requirement: item?.requirement,
      createdAt: item?.created_at,
      viewingStatus: item?.viewing_status,
      status: item?.status,
    }));

  const {
    data: paginatedQuotes,
    loading: paginationLoading,
    page,
    totalPages,
    setPage,
    refetch
  } = useServerPagination(
    (page, limit) => contactQuotationApi.getQuotationbypartnerwise(page, limit),
    {
      formatData: (raw) => formatRows(raw || []),
    }
  );

  useEffect(() => {
    setQuotes(paginatedQuotes || []);
    setLoading(false);
  }, [paginatedQuotes]);

  /* ================= DELETE ================= */

  const handleDelete = (row) => {
    setConfirmState({
      open: true,
      type: "warning",
      title: "Delete Quote",
      message: "Are you sure you want to delete this quote request?",
      onConfirm: async () => {
        try {
          await contactQuotationApi?.deleteQuote?.(row?.id);

          setQuotes((prev) => prev?.filter((q) => q?.id !== row?.id));

          setConfirmState({
            open: true,
            type: "success",
            title: "Deleted",
            message: "Quote deleted successfully",
          });
        } catch (error) {
          setConfirmState({
            open: true,
            type: "error",
            title: "Error",
            message: "Failed to delete quote",
          });
        }
      },
    });
  };

  /* ================= VIEW ================= */

  const handleView = async (row) => {
    try {
      setSelectedQuote(row);
      setViewModal(true);

      if (!row?.viewingStatus) {
        await contactQuotationApi?.updateViewingStatusQuote?.(row?.id);
        await refetch();
      }
    } catch (error) {
      console.error("View update error", error);
    }
  };

  /* ================= UI ================= */

  const handleWhatsApp = async () => {
    if (!selectedQuote?.phone) return;

    try {
      // ================= UPDATE STATUS API =================
      if (selectedQuote?.status?.toLowerCase() === "new") {
        // ================= UPDATE STATUS API =================
        await contactQuotationApi.updateStatus(selectedQuote?.id, {
          status: "contacted",
        });
        setViewModal(false);
        refetch();

        // ================= SUCCESS MESSAGE =================
        setConfirmState({
          open: true,
          type: "success",
          title: "Updated",
          message: "Quote marked as contacted successfully",
        });
      }

      // ================= WHATSAPP LOGIC =================

      // Format phone (remove spaces, +, etc.)
      let phone = selectedQuote.phone.replace(/\D/g, "");

      // Add country code if not present (India)
      if (!phone.startsWith("91")) {
        phone = "91" + phone;
      }

      const message = `Hello ${selectedQuote?.name || ""},

Thank you for your quotation request.

Service: ${selectedQuote?.service || ""}
Requirement: ${selectedQuote?.requirement || ""}

We would like to discuss further details with you.

Best regards,
Your Team`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      window.open(url, "_blank");
    } catch (error) {
      console.error("Error updating status:", error);

      setConfirmState({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message || "Failed to update quote status",
      });
    }
  };
  const handleResolve = async () => {
    if (!selectedQuote?.id) return;

    try {
      if (selectedQuote?.status?.toLowerCase() !== "contacted") {
        setConfirmState({
          open: true,
          type: "info",
          title: "Invalid Action",
          message: "Only contacted quotes can be resolved",
        });
        return;
      }

      setLoadingResolve(true);

      await contactQuotationApi.updateStatus(selectedQuote.id, {
        status: "resolved",
      });

      setViewModal(false);

      refetch();

      setConfirmState({
        open: true,
        type: "success",
        title: "Resolved",
        message: "Quote marked as resolved successfully",
      });
    } catch (error) {
      setConfirmState({
        open: true,
        type: "error",
        title: "Error",
        message: error?.response?.data?.message || "Failed to resolve quote",
      });
    } finally {
      setLoadingResolve(false);
    }
  };
  return (
    <AdminLayout>
      <Conformation
        open={confirmState?.open}
        type={confirmState?.type}
        title={confirmState?.title}
        message={confirmState?.message}
        onConfirm={confirmState?.onConfirm}
        onClose={() =>
          setConfirmState({
            open: false,
            type: "",
            title: "",
            message: "",
            onConfirm: null,
          })
        }
      />
      <DataTable
        title="Quote Requests"
        columns={columns}
        data={quotes ?? []}
        loading={loading || paginationLoading}
        onDelete={handleDelete}
        rowClass={(row) =>
          row?.viewingStatus ? "bg-gray-50" : "bg-blue-50 font-medium"
        }
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {viewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                Quote Request
              </h2>

              <button
                onClick={() => setViewModal(false)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-sm">

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Name</p>
                <p className="font-medium text-gray-800">
                  {selectedQuote?.name ?? "-"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Phone</p>
                <p className="font-medium text-gray-800">
                  {selectedQuote?.phone ?? "-"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium text-blue-600 break-all">
                  {selectedQuote?.email ?? "-"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Service</p>
                <p className="font-medium text-gray-800">
                  {selectedQuote?.service ?? "-"}
                </p>
              </div>

              {/* Requirement */}
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">Requirement</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedQuote?.requirement ?? "-"}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="flex flex-wrap justify-end gap-3 mt-6">

              {/* WhatsApp */}
              <button
                onClick={() => handleWhatsApp(selectedQuote)}
                className="px-5 py-2 rounded-full bg-green-500 text-white font-medium shadow hover:scale-105 hover:bg-green-600 transition"
              >
                WhatsApp
              </button>

              {/* Resolve */}
              <button
                onClick={handleResolve}
                disabled={
                  loadingResolve ||
                  selectedQuote?.status?.toLowerCase() === "resolved"
                }
                className={`px-5 py-2 rounded-full text-white font-medium shadow transition ${loadingResolve ||
                  selectedQuote?.status?.toLowerCase() === "resolved"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
                  }`}
              >
                {loadingResolve ? "Resolving..." : "Mark as Resolved"}
              </button>

              {/* Close */}
              <button
                onClick={() => setViewModal(false)}
                className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
