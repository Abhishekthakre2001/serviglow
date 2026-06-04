"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import UserGuard from "@/app/Users/UserGuard.jsx";
import DataTable from "@/components/ui/DataTable";
import Conformation from "@/components/ui/Conformation";
import bookingApi from "@/services/bookingApi";
import reviewsApi from "@/services/reviewsApi";
import Modal from "@/components/ui/Modals"; // ✅ you already have this in partner code

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase();



  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    accept: "bg-green-100 text-green-700",
    reject: "bg-red-100 text-red-700",
  };

  const labelMap = {
    accept: "Accepted",
    reject: "Rejected",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[normalized] || "bg-gray-100 text-gray-700"
        }`}
    >
      {labelMap[normalized] || status}
    </span>
  );
};

export default function Page() {

  const router = useRouter();

  const [submiting, setSubmiting] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewBooking, setReviewBooking] = useState(null);
  // button loading per row
  const [rowLoading, setRowLoading] = useState({}); // { [id]: "cancel" | "reschedule" }

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "error",
    message: "",
  });

  // reschedule modal state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDate, setNewDate] = useState(""); // yyyy-mm-dd
  const [newTime, setNewTime] = useState(""); // text like "11:00 AM" OR "11:00"

  /* ================= FETCH BOOKINGS ================= */
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await bookingApi.getMyBookings();
      const payload = res?.data;

      const rawList =
        (payload?.success && payload?.data) || payload?.data || payload || [];

      const formatted = rawList.map((item) => ({
        id: item.id,

        serviceCategory: item?.serviceCategory?.category_name || "-",
        serviceType: item?.serviceId?.title || "-",

        partner:
          `${item?.partnerId?.first_name || ""} ${item?.partnerId?.last_name || ""}`.trim() ||
          "-",

        date: item?.booking_date,
        phone: item?.phone,
        time: item?.booking_time,
        notes: item?.notes,
        email: item?.email,
        address: item?.address,
        city: item?.city,
        address: item?.address,
        zip: item?.zip,
        status: item?.status,
        raw: item,
      }));

      setBookings(formatted);
    } catch (error) {
      console.log(error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to load bookings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /* ================= CANCEL BOOKING ================= */
  const handleCancel = async (row) => {
    console.log("row", row)
    const id = row.id;
    try {
      setRowLoading((prev) => ({ ...prev, [id]: "cancel" }));

      const res = await bookingApi.cancelBooking(id);
      const updated = res?.data?.data;

      // update UI
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: updated?.status || "Cancelled" } : b,
        ),
      );

      setConfirmation({
        open: true,
        type: "success",
        message: "Booking cancelled successfully",
      });
    } catch (error) {
      console.log("cancel error", error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to cancel booking",
      });
    } finally {
      setRowLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  /* ================= OPEN RESCHEDULE MODAL ================= */
  const openRescheduleModal = (row) => {
    setSelectedBooking(row);

    // default date value for input type="date" must be yyyy-mm-dd
    const d = row?.date ? new Date(row.date) : null;
    const yyyy = d ? d.getFullYear() : "";
    const mm = d ? String(d.getMonth() + 1).padStart(2, "0") : "";
    const dd = d ? String(d.getDate()).padStart(2, "0") : "";

    setNewDate(d ? `${yyyy}-${mm}-${dd}` : "");
    setNewTime(row?.time || "");

    setRescheduleOpen(true);
  };

  /* ================= SUBMIT RESCHEDULE ================= */
  const submitReschedule = async () => {
    if (!selectedBooking?.id) return;

    if (!newDate || !newTime) {
      setConfirmation({
        open: true,
        type: "warning",
        message: "Please select date and time",
      });
      return;
    }

    const id = selectedBooking.id;

    try {
      setRowLoading((prev) => ({ ...prev, [id]: "reschedule" }));

      // ✅ backend should accept: { date, time }
      const res = await bookingApi.rescheduleBooking(id, {
        date: newDate,
        time: newTime,
      });

      const updated = res?.data?.data;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
              ...b,
              date: updated?.date || newDate,
              time: updated?.time || newTime,
            }
            : b,
        ),
      );

      setConfirmation({
        open: true,
        type: "success",
        message: "Booking rescheduled successfully",
      });

      setRescheduleOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.log("reschedule error", error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to reschedule booking",
      });
    } finally {
      setRowLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const Bookagain = (row) => {

    // console.log("row",row?.partnerId?.id);

    const serviceId = row?.raw?.serviceId?.id;
    const subCategoryId = row?.raw?.serviceType?.id;

    if (!subCategoryId) {
      console.error("SubCategory ID not found");
      return;
    }

    router.push(`/services/services_details/${serviceId}`);
  };


  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { key: "serviceCategory", label: "Category" },
    { key: "serviceType", label: "Service" },
    { key: "partner", label: "Partner" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "notes",
      label: "Notes",
      render: (value) => {
        if (!value) return "-";

        return <div className="max-w-[150px] line-clamp-3">{value}</div>;
      },
    },
    {
      key: "date",
      label: "Date",
      render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
    },
    { key: "time", label: "Time" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "zip", label: "Pin Code" },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },

    // ✅ ACTIONS
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const status = String(row.status || "").toLowerCase();
        console.log("row", row)
        const id = row.id;

        const isCancelling = rowLoading[id] === "cancel";
        const isRescheduling = rowLoading[id] === "reschedule";
        const disabled = isCancelling || isRescheduling;

        // ✅ Completed → show Review button
        if (status === "completed") {
          return (
            <>
              <button
                onClick={() => openReviewModal(row)}
                className="mx-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs"
              >
                Add Review
              </button>


              <button
                onClick={() => Bookagain(row)}
                className="mx-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs"
              >
                Book Again
              </button>
            </>

          );
        }

        // ✅ Accept / Accepted → show Reschedule + Cancel
        if (status === "accept" || status === "accepted") {
          return (
            <div className="flex gap-2">
              <button
                disabled={disabled}
                onClick={() => openRescheduleModal(row)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs"
              >
                {isRescheduling ? "Opening..." : "Reschedule"}
              </button>

              <button
                disabled={disabled}
                onClick={() => handleCancel(row)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-xs"
              >
                {isCancelling ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          );
        }

        // ✅ Pending / Reject / Cancelled / others → hide all buttons
        return <span className="text-gray-400">—</span>;
      },
    }
  ];
  const openReviewModal = (row) => {
    setReviewBooking(row);
    setRating(5);
    setComment("");
    setReviewOpen(true);
  };

  const submitReview = async () => {
    try {
      setSubmiting(true);
      const payload = {
        customer: reviewBooking?.raw?.customerId?.id,
        partner: reviewBooking?.raw?.partnerId?.id,
        booking: reviewBooking?.raw?.id,
        service: reviewBooking?.raw?.serviceId?.id,
        rating,
        comment,
      };

      const res = await reviewsApi.addReviews(payload);
      setSubmiting(false);
      setConfirmation({
        open: true,
        type: "success",
        message: res?.data?.message || "Review added successfully",
      });

      setReviewOpen(false);
    } catch (error) {
      console.log("ERROR", error);
      setSubmiting(false);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      setConfirmation({
        open: true,
        type: "error",
        message: message,
      });
    } finally {
      setSubmiting(false);
    }
  };


  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const timeOptions = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
  ];


  return (
    <UserGuard>
      <AdminLayout>
        <Conformation
          open={confirmation.open}
          type={confirmation.type}
          message={confirmation.message}
          onClose={() => setConfirmation((prev) => ({ ...prev, open: false }))}
        />

        <div className="max-w-full w-full mx-auto">
          <DataTable
            title="My Bookings"
            columns={columns}
            data={bookings}
            loading={loading}
            showActions={false}
          />
        </div>

        {/* ✅ RESCHEDULE MODAL */}
        <Modal
          open={rescheduleOpen}
          onClose={() => {
            setRescheduleOpen(false);
            setSelectedBooking(null);
          }}
          title="Reschedule Booking"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                onClick={() => setRescheduleOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
              >
                Close
              </button>

              <button
                onClick={submitReschedule}
                disabled={
                  !selectedBooking?.id ||
                  rowLoading[selectedBooking?.id] === "reschedule"
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm"
              >
                {rowLoading[selectedBooking?.id] === "reschedule"
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Select Date
              </label>
              <input
                type="date"
                value={newDate}
                min={getTomorrowDate()}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Select Time
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg outline-none bg-white"
              >
                <option value="">Select Time</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
        <Modal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          title="Rate Your Experience"
          footer={
            <div className="flex justify-end gap-3 w-full pt-2">
              <button
                onClick={() => setReviewOpen(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={submiting}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition shadow-sm"
              >
                {submiting ? "Submiting" : "Submit Review"}
              </button>
            </div>
          }
        >
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

                <span className="ml-3 text-sm text-gray-500">{rating} / 5</span>
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
        </Modal>
      </AdminLayout>
    </UserGuard>
  );
}
