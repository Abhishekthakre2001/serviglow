"use client";

import React, { useState, useEffect } from "react";
import DataTable from "@/components/ui/DataTable";
import { Eye } from 'lucide-react';
import Conformation from "@/components/ui/Conformation";
import AdminLayout from "@/components/layout/AdminLayout";
import contactQuotationApi from "@/services/contactQuotation";

export default function Quotes() {

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
      render: (value) =>
        value ? new Date(value).toLocaleDateString() : "-",
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

  const fetchQuotes = async () => {
    try {
      setLoading(true);

      const res = await contactQuotationApi?.getQuotation();

      const formatted = res?.data?.data?.map((item) => ({
        id: item?._id,
        name: item?.name,
        phone: item?.phone,
        email: item?.email,
        service: item?.service?.categoryName,
        requirement: item?.requirement,
        createdAt: item?.createdAt,
        viewingStatus: item?.viewingStatus,
      })) || [];

      setQuotes(formatted);

    } catch (error) {
      console.error("Quote fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

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

          setQuotes((prev) =>
            prev?.filter((q) => q?.id !== row?.id)
          );

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
        await fetchQuotes();
      }

    } catch (error) {
      console.error("View update error", error);
    }
  };

  /* ================= UI ================= */

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
        loading={loading}
        onDelete={handleDelete}
        rowClass={(row) =>
          row?.viewingStatus ? "bg-gray-50" : "bg-blue-50 font-medium"
        }
      />

      {viewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">

            <h2 className="text-lg font-semibold mb-4">
              Quote Request
            </h2>

            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedQuote?.name ?? "-"}</p>
              <p><strong>Phone:</strong> {selectedQuote?.phone ?? "-"}</p>
              <p><strong>Email:</strong> {selectedQuote?.email ?? "-"}</p>
              <p><strong>Service:</strong> {selectedQuote?.service ?? "-"}</p>

              <div className="mt-3">
                <strong>Requirement:</strong>
                <p className="mt-1 text-gray-700">
                  {selectedQuote?.requirement ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
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