
"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import DataTable from "@/components/ui/DataTable";
import Conformation from "@/components/ui/Conformation";
import { Eye } from "lucide-react";
import reviewsApi from "@/services/reviewsApi";
import ExportApi from "@/services/exportApi";
// import useServerPagination from "@/hooks/useServerPagination";

export default function PartnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedReview, setSelectedReview] = useState(null);
  const [viewModal, setViewModal] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    message: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ================= FORMAT ================= */
  const formatRows = (arr) =>
    (arr || []).map((item) => ({
      id: item.id,

      customer: `${item?.customer?.first_name || ""} ${item?.customer?.last_name || ""}`,

      serviceTitle: item?.service?.title || "-",
      rating: item?.rating,
      comment: item?.comment,

      // ✅ FIXED
      bookingDate: item?.booking?.booking_date || null,
      bookingTime: item?.booking?.booking_time || null,
      bookingStatus: item?.booking?.status || null,

      bookingAddress: item?.booking?.address || null,
      bookingCity: item?.booking?.city || null,

      createdAt: item?.created_at,

      raw: item,
    }));

  /* ================= PAGINATION ================= */
  // const {
  //   data: paginatedReviews,
  //   loading: paginationLoading,
  //   page,
  //   totalPages,
  //   setPage,
  // } = useServerPagination(
  //   (page, limit) => reviewsApi.getPartnerReviews(page, limit),
  //   {
  //     formatData: (raw) => {
  //       console.log("RAW API RESPONSE 👉", raw);
  //       return formatRows(raw?.reviews || []);
  //     },
  //   }
  // );

  const fetchReviews = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await reviewsApi.getPartnerReviews(pageNumber, 5);

      console.log("API RESPONSE 👉", res.data);

      const raw = res?.data;

      const formatted = (raw?.reviews || []).map((item) => ({
        id: item.id,

        customer: `${item?.customer?.first_name || ""} ${item?.customer?.last_name || ""}`,

        serviceTitle: item?.service?.title || "-",
        rating: item?.rating,
        comment: item?.comment,

        bookingDate: item?.booking?.booking_date || null,
        bookingTime: item?.booking?.booking_time || null,
        bookingStatus: item?.booking?.status || null,

        bookingAddress: item?.booking?.address || null,
        bookingCity: item?.booking?.city || null,

        createdAt: item?.created_at,

        raw: item,
      }));

      setReviews(formatted);
      setTotalPages(raw?.pages || 1);
      setPage(raw?.page || 1);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  // console.log("paginatedReviews", paginatedReviews)

  /* ================= SYNC PAGINATION ================= */
  // useEffect(() => {
  //   setReviews(paginatedReviews || []);
  //   setLoading(false);
  // }, [paginatedReviews]);

  /* ================= VIEW ================= */
  const handleView = (row) => {
    setSelectedReview(row);
    setViewModal(true);
  };

  /* ================= COLUMNS ================= */
  const columns = [
    { key: "customer", label: "Customer" },
    {
      key: "rating",
      label: "Rating",
      render: (value) => (
        <span className="text-yellow-500">{"⭐".repeat(value)}</span>
      ),
    },
    {
      key: "comment",
      label: "Review",
      render: (value) => (
        <div className="max-w-[320px] whitespace-normal break-words text-sm text-gray-600 py-2">
          {value || "-"}
        </div>
      ),
    },
    {
      key: "serviceTitle",
      label: "Service",
      render: (value) => (
        <span className="text-gray-700 font-medium">{value || "-"}</span>
      ),
    },
    {
      key: "bookingDate",
      label: "Booking Date",
      render: (value) =>
        value ? new Date(value).toLocaleDateString('en-GB') : "-",
    },
    { key: "bookingTime", label: "Time" },
    {
      key: "bookingStatus",
      label: "Status",
      render: (value) => (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (_, row) => (
        <button
          onClick={() => handleView(row)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  const handleExportReviews = async () => {
    try {
      const res = await ExportApi.exportReviews();

      const blob = new Blob([res.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "partner-reviews.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <Conformation
        open={confirmState.open}
        type={confirmState.type}
        message={confirmState.message}
        onClose={() =>
          setConfirmState({
            open: false,
            type: "",
            message: "",
          })
        }
      />

      <DataTable
        title="My Reviews"
        columns={columns}
        data={reviews}
        loading={loading}
        showActions={false}
        page={page}
        totalPages={totalPages}
        onExport={handleExportReviews}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* VIEW MODAL (unchanged) */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6">


            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                ⭐ Review Details
              </h2>

              <button
                onClick={() => setViewModal(false)}
                className="text-gray-400 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

              {/* Service */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Service</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.serviceTitle || "-"}
                </p>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Customer</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.customer || "-"}
                </p>
              </div>

              {/* Rating */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Rating</p>
                <p className="font-medium text-yellow-500">
                  {"⭐".repeat(selectedReview?.rating || 0)}
                  <span className="text-gray-700 ml-2">
                    ({selectedReview?.rating || 0}/5)
                  </span>
                </p>
              </div>

              {/* Date */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Date</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.bookingDate
                    ? new Date(selectedReview.bookingDate).toLocaleDateString('en-GB')
                    : "-"}
                </p>
              </div>

              {/* Time */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Time</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.bookingTime || "-"}
                </p>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Status</p>
                <p
                  className={`font-medium ${selectedReview?.bookingStatus === "Completed"
                    ? "text-green-600"
                    : selectedReview?.bookingStatus === "Pending"
                      ? "text-yellow-600"
                      : "text-gray-800"
                    }`}
                >
                  {selectedReview?.bookingStatus || "-"}
                </p>
              </div>

              {/* Location (full width) */}
              {/* <div className="md:col-span-2 bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Location</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.bookingAddress || "-"}, {selectedReview?.bookingCity || ""}
                </p>
              </div> */}

              {/* Review (full width highlight) */}
              <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">Review</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedReview?.comment || "-"}
                </p>
              </div>

            </div>

            {/* Footer */}
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










