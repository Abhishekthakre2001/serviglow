"use client";

import React, { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { Eye, MessageCircle, Trash2 } from "lucide-react";
import Conformation from "@/components/ui/Conformation";
import AdminLayout from "@/components/layout/AdminLayout";
import contactQuotationApi from "@/services/contactQuotation";
import useServerPagination from "@/hooks/useServerPagination";
import ExportApi from "@/services/exportApi";

export default function Contacts() {
  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone No." },
{ key: "subject", label: "Subject" },

    {
      key: "message",
      label: "Message",
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      ),
    },

    {
      key: "createdAt",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString('en-GB'),
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
    {
      key: "actions",
      label: "Action",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleWhatsApp(row)}
            className="p-1 sm:p-1.5 text-green-600 hover:bg-green-100 rounded transition"
            title="Reply on WhatsApp"
          >
            <MessageCircle size={16} />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-100 rounded transition"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ================= STATE ================= */

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    onConfirm: null,
  });

  /* ================= SERVER PAGINATION ================= */

  const {
    data: contacts,
    loading,
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    refresh,
  } = useServerPagination(contactQuotationApi.getContacts, {
    initialPage: 1,
    initialLimit: 5,
    formatData: (rawData) =>
      (rawData || []).map((item) => ({
        id: item?.id,
        name: item?.name,
        email: item?.email,
        subject: item?.subject,
        message: item?.message,
        createdAt: item?.created_at,
        viewingStatus: item?.viewingStatus,
        phone: item?.whatsapp_number,
        // whatsapp_number: item?.whatsapp_number,
      })),
  });

  /* ================= DELETE ================= */

  const handleDelete = (row) => {
    setConfirmState({
      open: true,
      type: "warning",
      title: "Delete Contact",
      message: "Are you sure you want to delete this message?",
      onConfirm: async () => {
        try {
          await contactQuotationApi.deleteContact(row.id);

          refresh(); // ✅ refetch after delete

          setConfirmState({
            open: true,
            type: "success",
            title: "Deleted",
            message: "Contact deleted successfully",
          });
        } catch (error) {
          setConfirmState({
            open: true,
            type: "error",
            title: "Error",
            message: "Failed to delete contact",
          });
        }
      },
    });
  };

  /* ================= VIEW ================= */

  const handleView = async (row) => {
    try {
      setSelectedMessage(row);
      setViewModal(true);

      if (!row.viewingStatus) {
        await contactQuotationApi.updateViewingStatus(row?.id);
        refresh(); // ✅ refetch instead of old fetchContacts
      }
    } catch (error) {
      console.error("View update error", error);
    }
  };

  const handleWhatsApp = (row) => {
    console.log("row", row);

    if (!row.whatsapp_number) {
      setConfirmState({
        open: true,
        type: "error",
        title: "Error",
        message: "Whatsapp number not available",
      });
      return;
    }

    // remove spaces and convert to string
    let phone = String(row.whatsapp_number).replace(/\s+/g, "");

    // add India code if not present
    if (!phone.startsWith("91")) {
      phone = `91${phone}`;
    }

    const message = `Hello ${row.name}, regarding your query: "${row.subject}"`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };


  const handleExportContacts = async () => {
  try {
    const response =
      await ExportApi.exportContacts();

    const blob = new Blob([
      response.data,
    ]);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "contacts.xlsx";

    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "Contact export failed",
      error
    );
  }
};
  /* ================= UI ================= */

  return (
    <AdminLayout>
      <Conformation
        open={confirmState.open}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
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
        title="Contact Messages"
        columns={columns}
        data={contacts}
        loading={loading}
        actionsColumn={false}
        showActions={false}
        rowClass={(row) =>
          row.viewingStatus ? "bg-gray-50" : "bg-blue-50 font-medium"
        }

        onExport={handleExportContacts}
        pagination={true}
        currentPage={page}
        totalPages={totalPages}
        itemsPerPage={limit}
        onPageChange={setPage}
        onItemsPerPageChange={setLimit}
      />

      {viewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Contact Message
              </h2>

              <button
                onClick={() => setViewModal(false)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Name</p>
                <p className="font-medium text-gray-800">
                  {selectedMessage?.name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium text-blue-600 break-all">
                  {selectedMessage?.email}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Phone No.</p>
                <p className="font-medium text-blue-600 break-all">
                  {selectedMessage?.phone}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Subject</p>
                <p className="font-medium text-gray-800">
                  {selectedMessage?.subject}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">Message</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedMessage?.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewModal(false)}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-medium shadow hover:scale-105 transition"
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