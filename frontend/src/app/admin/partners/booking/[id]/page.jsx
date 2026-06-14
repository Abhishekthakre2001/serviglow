"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import bookingApi from "@/services/bookingApi";
import Conformation from "@/components/ui/Conformation";
import ExportApi from "@/services/exportApi";
import { useParams } from "next/navigation";



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

    const params = useParams();

    const partnerId = params.id;

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

            console.log("partnerId", partnerId)

            const res = await bookingApi.getpartnerwiseBookings({
                partnerId,
                page: 1,
                limit: 10,
            });
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

    const handleExportBookings =
        async (status = "") => {
            try {
                const response =
                    await ExportApi.exportBookings(
                        status
                    );

                const blob = new Blob([
                    response.data,
                ]);

                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href = url;

                link.download =
                    status
                        ? `${status.toLowerCase()}-bookings.xlsx`
                        : "all-bookings.xlsx";

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                window.URL.revokeObjectURL(
                    url
                );
            } catch (error) {
                console.error(error);
            }
        };

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
                        exportable={false}
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
                        exportable={false}
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
                        exportable={false}
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
                        exportable={false}
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
                        exportable={false}
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
                        onExport={() =>
                            handleExportBookings(
                                "Cancelled"
                            )
                        }
                    />
                </div>
            ),
        },
    ];
    // console.log("SERVICE", otpModal)
    return (

        <AdminLayout>
            <Conformation
                open={confirmation.open}
                type={confirmation.type}
                message={confirmation.message}
                onClose={() => setConfirmation((prev) => ({ ...prev, open: false }))}
            />

            <div className="max-full w-full mx-auto">
                <div className="w-full overflow-x-auto">
                    <Tabs tabs={tabs} />
                </div>
            </div>
        </AdminLayout>
    );
}
