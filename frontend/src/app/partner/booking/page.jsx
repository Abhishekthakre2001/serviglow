"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import bookingApi from "@/services/bookingApi";
import PartnerGuard from "@/app/partner/PartnerGuard";
import Conformation from "@/components/ui/Conformation";

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "").toLowerCase();



  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    accept: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    canceled: "bg-red-100 text-red-700",
    reject: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };

  const labelMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    accept: "Accept",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    reject: "Reject",
    completed: "Completed",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[normalizedStatus] || "bg-gray-100 text-gray-700"
        }`}
    >
      {labelMap[normalizedStatus] || status || "N/A"}
    </span>
  );
};

export default function PartnerBookingsPage() {

  const OTP_EXPIRE_TIME = Number(process.env.NEXT_PUBLIC_OTP_EXPIRE_TIME)

  const [otpModal, setOtpModal] = useState({
    open: false,
    email: "",
    bookingId: "",
    otp: "",
    otpSent: false,
    sendingOtp: false,
    verifyingOtp: false,
    expiresIn: 0,
    serviceCharges: 0
  });

  useEffect(() => {
    if (!otpModal.open || otpModal.expiresIn <= 0) return;

    const timer = setInterval(() => {
      setOtpModal((prev) => {
        if (prev.expiresIn <= 1) {
          clearInterval(timer);
          return { ...prev, expiresIn: 0 };
        }
        return { ...prev, expiresIn: prev.expiresIn - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpModal.open, otpModal.expiresIn]);

  const formatOtpTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    try {
      setOtpModal((prev) => ({ ...prev, sendingOtp: true }));

      await bookingApi.sendBookingOtp({
        email: otpModal.email,
        otp_type: "booking_completion",
      });

      setOtpModal((prev) => ({
        ...prev,
        otpSent: true,
        sendingOtp: false,
        expiresIn: OTP_EXPIRE_TIME,
        otp: "",
      }));

      setConfirmation({
        open: true,
        type: "success",
        message: "OTP sent successfully",
      });
    } catch (error) {
      console.log("send otp error", error);
      setOtpModal((prev) => ({ ...prev, sendingOtp: false }));
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to send OTP",
      });
    }
  };

  const handleVerifyAndComplete = async () => {
    try {
      setOtpModal((prev) => ({ ...prev, verifyingOtp: true }));

      const res = await bookingApi.completeBookingOtp({
        bookingId: otpModal.bookingId,
        otp: otpModal.otp,
        serviceId: otpModal.serviceId,
        partnerId: otpModal.partnerId,
        customerId: otpModal.customerId,
        revenue: otpModal.revenue,
        date: otpModal.date,
        time: otpModal.time,
        serviceCharges: otpModal.serviceCharges,
      });

      const updated = res?.data?.data;

      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === otpModal.bookingId
            ? { ...b, status: updated?.status || "Completed" }
            : b,
        ),
      );

      setOtpModal({
        open: false,
        bookingId: "",
        email: "",
        otp: "",
        otpSent: false,
        sendingOtp: false,
        verifyingOtp: false,
        expiresIn: 0,
        serviceId: "",
        partnerId: "",
        customerId: "",
        revenue: 0,
        date: "",
        time: "",
      });

      setConfirmation({
        open: true,
        type: "success",
        message: "Booking completed successfully",
      });
    } catch (error) {
      console.log("verify otp error", error);
      setOtpModal((prev) => ({ ...prev, verifyingOtp: false }));
      setConfirmation({
        open: true,
        type: "error",
        message: error?.response?.data?.message || "OTP verification failed",
      });
    }
  };

  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chargeError, setChargeError] = useState("");
  // button loading per booking id: { [id]: "accept" | "reject" }
  const [actionLoading, setActionLoading] = useState({});

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "success",
    message: "",
  });

  /* ================= FETCH BOOKINGS ================= */
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const res = await bookingApi.getMyBookings();
      const payload = res?.data;

      const rawList =
        (payload?.success && Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload) && payload) ||
        (Array.isArray(payload?.data) && payload.data) ||
        [];
      console.log("PAYLOAD", payload)
      const formatted = rawList.map((item) => ({
        id: item?._id,
        bookingId: item?.id,

        // Service details
        category: item?.serviceCategory?.category_name || "-",
        serviceType: item?.serviceType?.sub_category_name || "-",

        // Customer details (customerId is populated in your response)
        customerName: item?.name || "-",

        customerEmail: item?.email || "-",
        customerPhone: item?.phone || "-",

        // Booking details
        date: item?.booking_date || null,
        time: item?.booking_time || "-",
        city: item?.city || "-",
        zip: item?.zip || "-",
        address: item?.address || "-",
        notes: item?.notes || "-",

        status: item?.status || "Pending",
        createdAt: item?.created_at,

        raw: item,
      }));

      setBookings(formatted);
    } catch (error) {
      console.log("error", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= ACTIONS ================= */
  const onAccept = async (row) => {
    const id = row.bookingId;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "accept" }));

      const res = await bookingApi.acceptBooking(id);
      const updated = res?.data?.data; // backend returns {data: booking}

      // update UI instantly
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === id
            ? { ...b, status: updated?.status || "Confirmed" }
            : b,
        ),
      );

      setConfirmation({
        open: true,
        type: "success",
        message: "Booking Accept successfully",
      });
    } catch (error) {
      console.log("accept error", error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to accept booking",
      });
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const onReject = async (row) => {
    const id = row.bookingId;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "reject" }));

      const res = await bookingApi.rejectBooking(id);
      const updated = res?.data?.data;

      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === id
            ? { ...b, status: updated?.status || "Cancelled" }
            : b,
        ),
      );

      setConfirmation({
        open: true,
        type: "success",
        message: "Booking rejected successfully",
      });
    } catch (error) {
      console.log("reject error", error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to reject booking",
      });
    } finally {
      setActionLoading((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { key: "bookingId", label: "Booking ID" },
    { key: "customerName", label: "Customer" },
    { key: "customerPhone", label: "Phone" },
    { key: "customerEmail", label: "Email" },
    { key: "category", label: "Category" },
    { key: "serviceType", label: "Service Type" },
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
      render: (v) => (v ? new Date(v).toLocaleDateString('en-GB') : "-"),
    },
    { key: "time", label: "Time" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "zip", label: "Pin Code" },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },

    // ✅ Actions column (Accept/Reject only for Pending)
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const id = row.bookingId;
        const isAccepting = actionLoading[id] === "accept";
        const isRejecting = actionLoading[id] === "reject";
        const disabled = !!actionLoading[id];

        // Pending → show Accept / Reject
        if (row.status === "Pending") {
          return (
            <div className="flex gap-2">
              <button
                disabled={disabled}
                onClick={() => onAccept(row)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm"
              >
                {isAccepting ? "Accepting..." : "Accept"}
              </button>

              <button
                disabled={disabled}
                onClick={() => onReject(row)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm"
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          );
        }

        // Accept → show Complete button only
        if (row.status === "Accept") {
          return (
            <button
              onClick={() =>
                setOtpModal({
                  open: true,
                  email: row.customerEmail,
                  bookingId: row.bookingId,
                  otp: "",
                  otpSent: false,
                  sendingOtp: false,
                  verifyingOtp: false,
                  expiresIn: 0,

                  serviceId: row.raw?.serviceId?.id ?? null,
                  partnerId: row.raw?.partnerId.id ?? null,
                  customerId: row.raw?.customerId.id ?? null,
                  revenue: row.raw?.serviceId?.price || 0,
                  date: row.raw?.booking_date || "",
                  time: row.raw?.booking_time || "",
                })
              }
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Complete
            </button>
          );
        }

        // Reject / Completed / others → no action
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
  ];

  /* ================= FILTER HELPERS ================= */
  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === "Accept"),
    [bookings],
  );
  const pending = useMemo(
    () => bookings.filter((b) => b.status === "Pending"),
    [bookings],
  );
  const cancelled = useMemo(
    () => bookings.filter((b) => b.status === "Reject"),
    [bookings],
  );

  const completed = useMemo(
    () => bookings.filter((b) => b.status === "Completed"),
    [bookings],
  );

  const Cancelled = useMemo(
    () => bookings.filter((b) => b.status === "Cancelled"),
    [bookings],
  );

  /* ================= TABS ================= */
  const tabs = [
    {
      label: `All (${bookings.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="All Bookings"
            columns={columns}
            data={bookings}
            loading={loading}
            showActions={false}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
    {
      label: `Accepted (${confirmed.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="Accepted Bookings"
            columns={columns}
            data={confirmed}
            loading={loading}
            showActions={false}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
    {
      label: `Pending (${pending.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="Pending Bookings"
            columns={columns}
            data={pending}
            showActions={false}
            loading={loading}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
    {
      label: `Rejected (${cancelled.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="Rejected Bookings"
            columns={columns}
            data={cancelled}
            loading={loading}
            showActions={false}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
    {
      label: `Completed (${completed.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="Completed Bookings"
            columns={columns}
            data={completed}
            loading={loading}
            showActions={false}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
    {
      label: `Cancelled (${Cancelled.length})`,
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            title="Cancelled Bookings"
            columns={columns}
            data={Cancelled}
            loading={loading}
            showActions={false}
            onView={(row) => router.push(`/partner/bookings/${row.bookingId}`)}
          />
        </div>
      ),
    },
  ];
  console.log("SERVICE", otpModal)
  return (
    <PartnerGuard>
      <AdminLayout>
        <Conformation
          open={confirmation.open}
          type={confirmation.type}
          message={confirmation.message}
          onClose={() => setConfirmation((prev) => ({ ...prev, open: false }))}
        />
        {otpModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-semibold text-center">
                Complete Booking
              </h2>

              <p className="text-sm text-gray-600 text-center">
                Send OTP to customer and verify to finish booking.
              </p>

              {!otpModal.otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={otpModal.sendingOtp}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {otpModal.sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  {otpModal.expiresIn > 0 ? (
                    <div className="text-center text-sm font-medium text-orange-600">
                      OTP expires in: {formatOtpTime(otpModal.expiresIn)}
                    </div>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      disabled={otpModal.sendingOtp}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {otpModal.sendingOtp ? "Sending OTP..." : "Resend OTP"}
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otpModal.otp}
                    onChange={(e) =>
                      setOtpModal((prev) => ({ ...prev, otp: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-3"
                    maxLength={6}
                  />

                  <input
                    type="number"
                    placeholder="Service Charges"
                    value={otpModal.serviceCharges || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);

                      setOtpModal((prev) => ({
                        ...prev,
                        serviceCharges: e.target.value,
                      }));

                      if (value < Number(otpModal.revenue || 0)) {
                        setChargeError("Service charges cannot be less than Booking charges");
                      } else {
                        setChargeError("");
                      }
                    }}
                    className="w-full border rounded-lg px-4 py-3"
                    min="0"
                  />

                  {chargeError && (
                    <p className="text-red-500 text-sm mt-1">{chargeError}</p>
                  )}

                  <button
                    onClick={handleVerifyAndComplete}
                    disabled={
                      otpModal.verifyingOtp ||
                      otpModal.otp.length !== 6 ||
                      otpModal.expiresIn <= 0
                    }
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {otpModal.verifyingOtp
                      ? "Verifying..."
                      : "Verify OTP & Complete"}
                  </button>

                  {otpModal.expiresIn <= 0 && (
                    <p className="text-red-600 text-sm text-center">
                      OTP expired. Click Resend OTP.
                    </p>
                  )}
                </>
              )}

              <button
                onClick={() =>
                  setOtpModal({
                    open: false,
                    bookingId: "",
                    otp: "",
                    otpSent: false,
                    sendingOtp: false,
                    verifyingOtp: false,
                    expiresIn: 0,
                  })
                }
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="max-full w-full mx-auto">
          <div className="w-full overflow-x-auto">
            <Tabs tabs={tabs} />
          </div>
        </div>
      </AdminLayout>
    </PartnerGuard>
  );
}
