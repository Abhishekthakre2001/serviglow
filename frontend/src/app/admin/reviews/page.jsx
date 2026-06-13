"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import DataTable from "@/components/ui/DataTable";
import Conformation from "@/components/ui/Conformation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import reviewsApi from "@/services/reviewsApi";
import useServerPagination from "@/hooks/useServerPagination";
import ExportApi from "@/services/exportApi";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  /* ================= FETCH REVIEWS ================= */

  // const fetchReviews = async () => {
  //   try {
  //     setLoading(true);

  //     const res = await reviewsApi.getAllReviews();

  //     const formatted =
  //       res?.data?.reviews?.map((item) => ({
  //         id: item._id,
  //         customer: `${item?.customer?.firstName || ""} ${item?.customer?.lastName || ""}`,
  //         serviceTitle: item?.service?.title || "-",
  //         partner: `${item?.partner?.firstName || ""} ${item?.partner?.lastName || ""}`,
  //         rating: item?.rating,
  //         comment: item?.comment,
  //         isApproved: item?.isApproved,
  //         createdAt: item?.createdAt,
  //         raw: item,
  //       })) || [];

  //     setReviews(formatted);
  //   } catch (error) {
  //     const message =
  //       error?.response?.data?.message || "Failed to fetch reviews";

  //     setConfirmState({
  //       open: true,
  //       type: "error",
  //       message,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchReviews();
  // }, []);

  /* ================= TOGGLE VISIBILITY ================= */
  const {
    data: paginatedReviews,
    loading: paginationLoading,
    page,
    totalPages,
    setPage,
  } = useServerPagination(
    (page, limit) => reviewsApi.getAllReviews(page, limit),
    {
      formatData: (raw) =>
        raw?.map((item) => ({
          id: item.id,
          customer: `${item?.customer?.first_name || ""} ${item?.customer?.last_name || ""}`,
          serviceTitle: item?.service?.title || "-",
          partner: `${item?.partner?.first_name || ""} ${item?.partner?.last_name || ""}`,
          rating: item?.rating,
          comment: item?.comment,
          isApproved: item?.is_approved,
          createdAt: item?.created_at,
          raw: item,
        })),
    }
  );
  const handleToggle = async (row) => {
    try {
      const res = await reviewsApi.toggleReview(row.id);

      const newStatus = !row.isApproved;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, isApproved: newStatus } : r,
        ),
      );

      setConfirmState({
        open: true,
        type: "success",
        message:
          res?.data?.message ||
          `Review ${newStatus ? "visible" : "hidden"} successfully`,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update visibility";

      setConfirmState({
        open: true,
        type: "error",
        message,
      });
    }
  };

  /* ================= DELETE REVIEW ================= */

  const handleDelete = (row) => {
    setConfirmState({
      open: true,
      type: "warning",
      message: "Are you sure you want to delete this review?",
      onConfirm: async () => {
        try {
          setDeleteLoading(true);

          const res = await reviewsApi.deleteReview(row.id);

          setReviews((prev) => prev.filter((r) => r.id !== row.id));

          setConfirmState({
            open: true,
            type: "success",
            message: res?.data?.message || "Review deleted successfully",
          });
        } catch (error) {
          const message =
            error?.response?.data?.message || "Failed to delete review";

          setConfirmState({
            open: true,
            type: "error",
            message,
          });
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  /* ================= VIEW REVIEW ================= */

  const handleView = (row) => {
    setSelectedReview(row);
    setViewModal(true);
  };

  /* ================= EDIT REVIEW ================= */

  const handleEdit = (row) => {
    setSelectedReview(row);
    setRating(row.rating);
    setComment(row.comment || "");
    setEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);

      const res = await reviewsApi.updateReview(selectedReview.id, {
        rating,
        comment,
      });

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id ? { ...r, rating, comment } : r,
        ),
      );

      setEditModal(false);

      setConfirmState({
        open: true,
        type: "success",
        message: res?.data?.message || "Review updated successfully",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update review";

      setConfirmState({
        open: true,
        type: "error",
        message,
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    { key: "customer", label: "Customer" },

    { key: "partner", label: "Partner" },

    {
      key: "rating",
      label: "Rating",
      render: (value) => (
        <span className="text-yellow-500">{"⭐".repeat(value)}</span>
      ),
    },

    {
      key: "comment",
      label: "Comment",
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {value || "-"}
        </span>
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
      key: "isApproved",
      label: "Visible",
      render: (value, row) => (
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={() => handleToggle(row)}
            className="sr-only peer"
          />

          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 relative">
            <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
          </div>
        </label>
      ),
    },

    {
      key: "createdAt",
      label: "Date",
      render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
    },

    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => handleDelete(row)}
            disabled={deleteLoading}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];
  const finalLoading = loading || paginationLoading;
  useEffect(() => {
    setReviews(paginatedReviews);
  }, [paginatedReviews]);


  const handleExportReviews = async () => {
    console.log("handleExportReviews")
  try {
    const response =
      await ExportApi.exportReviews();

    const blob = new Blob([response.data]);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "reviews.xlsx";

    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Review export failed", error);
  }
};

  return (
    <AdminLayout>
      <Conformation
        open={confirmState.open}
        type={confirmState.type}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onClose={() =>
          setConfirmState({
            open: false,
            type: "",
            message: "",
            onConfirm: null,
          })
        }
      />

      <DataTable
        title="Customer Reviews"
        columns={columns}
        data={reviews}
        loading={finalLoading}
        showActions={false}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onExport={handleExportReviews}
      />

      {/* VIEW MODAL */}

      {viewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">

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

            {/* Content */}
            <div className="space-y-4 text-sm">

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Service</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.serviceTitle || "-"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Customer</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.customer}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Partner</p>
                <p className="font-medium text-gray-800">
                  {selectedReview?.partner}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Rating</p>
                <p className="font-medium text-yellow-500">
                  {"⭐".repeat(selectedReview?.rating || 0)}
                  <span className="text-gray-700 ml-2">
                    ({selectedReview?.rating || 0}/5)
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">Comment</p>
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

      {/* EDIT MODAL */}

      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-6">Edit Review</h2>

            <div className="space-y-6">
              {/* Rating Section */}

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Your Rating
                </label>

                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300"
                        } hover:scale-110`}
                    >
                      ★
                    </button>
                  ))}

                  <span className="ml-3 text-sm text-gray-500">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Comment Section */}

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Share Your Experience
                </label>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell others about the service quality..."
                  className="w-full mt-2 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />

                <p className="text-xs text-gray-400 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={updateLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg disabled:opacity-60"
              >
                {updateLoading ? "Updating..." : "Update Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
