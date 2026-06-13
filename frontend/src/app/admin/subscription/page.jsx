"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import paymentApi from "@/services/paymentApi";
import Conformation from "@/components/ui/Conformation";
import ExportApi from "@/services/exportApi";

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
    const styles = {
        ACTIVE: "bg-green-100 text-green-700",
        PENDING: "bg-yellow-100 text-yellow-700",
        EXPIRED: "bg-gray-200 text-gray-700",
        CANCELLED: "bg-red-100 text-red-700",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-700"
                }`}
        >
            {status}
        </span>
    );
};

export default function SubscriptionsPage() {
    const [allSubs, setAllSubs] = useState([]);
    const [activeSubs, setActiveSubs] = useState([]);
    const [pendingSubs, setPendingSubs] = useState([]);
    const [expiredSubs, setExpiredSubs] = useState([]);
    const [cancelSubs, setCancelSubs] = useState([]);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [loadingAll, setLoadingAll] = useState(true);
    const [loadingActive, setLoadingActive] = useState(false);
    const [loadingPending, setLoadingPending] = useState(false);
    const [loadingExpired, setLoadingExpired] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [refundedSubs, setRefundedSubs] = useState([]);
    const [loadingRefunded, setLoadingRefunded] = useState(false);

    const [cancelLoadingId, setCancelLoadingId] =
        useState(null);

    const [refundLoadingId, setRefundLoadingId] =
        useState(null);

    const [confirmation, setConfirmation] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* ================= TABLE COLUMNS ================= */
    const columns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "planKey", label: "Plan" },
        { key: "price", label: "Price ( in $ ) " },
        { key: "paypalSubscriptionId", label: "PayPal Sub ID" },
        {
            key: "startDate",
            label: "Start",
            render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
        },
        {
            key: "endDate",
            label: "End",
            render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
        },
        {
            key: "status",
            label: "Status",
            render: (value) => <StatusBadge status={value} />,
        },
        {
            key: "createdAt",
            label: "Created",
            render: (value) => (value ? new Date(value).toLocaleDateString('en-GB') : "-"),
        },
        {
            key: "refundStatus",
            label: "Refund",
            render: (value) =>
                value === 1 ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        Refunded
                    </span>
                ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        Not Refunded
                    </span>
                ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
                <div className="flex gap-2">

                    {row.status === "ACTIVE" && (
                        <button
                            onClick={() =>
                                handleCancelSubscription(row)
                            }
                            disabled={
                                cancelLoadingId === row.id ||
                                refundLoadingId === row.id
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
                        >
                            {cancelLoadingId === row.id
                                ? "Cancelling..."
                                : "Cancel"}
                        </button>
                    )}

                    {row.refundStatus !== 1 && (
                        <button
                            onClick={() =>
                                handleRefundSubscription(row)
                            }
                            disabled={
                                refundLoadingId === row.id ||
                                cancelLoadingId === row.id
                            }
                            className="px-3 py-1 bg-orange-600 text-white rounded text-sm disabled:opacity-50"
                        >
                            {refundLoadingId === row.id
                                ? "Refunding..."
                                : "Refund"}
                        </button>
                    )}

                    {row.refundStatus === 1 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                            Refunded
                        </span>
                    )}
                </div>
            ),
        }
    ];

    const refundColumns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "planKey", label: "Plan" },
        { key: "price", label: "Price ($)" },
        {
            key: "refundAmount",
            label: "Refund Amount",
        },
        {
            key: "refundDate",
            label: "Refund Date",
            render: (value) =>
                value
                    ? new Date(value).toLocaleDateString("en-GB")
                    : "-",
        },
        {
            key: "paypalRefundId",
            label: "Refund ID",
        },
        {
            key: "status",
            label: "Subscription Status",
            render: (value) => (
                <StatusBadge status={value} />
            ),
        },
    ];

    /* ================= FORMAT ROWS ================= */
    const formatRows = (arr) =>
        (arr || []).map((s) => ({
            id: s.id,
            name: s?.name || "-",
            email: s?.email || "-",
            planKey: s?.plan_key || "-",
            paypalSubscriptionId:
                s?.paypal_subscription_id || "-",

            refundStatus:
                Number(s?.refund_status || 0),

            refundAmount:
                s?.refund_amount || "0.00",

            refundDate:
                s?.refund_date || null,

            paypalRefundId:
                s?.paypal_refund_id || "-",

            price: s?.price || "-",
            startDate: s?.start_date || null,
            endDate: s?.end_date || null,
            status: s?.status || "-",
            createdAt: s?.created_at || null,
            raw: s,
        }));

    /* ================= FETCH ALL TABS (ON LOAD) ================= */
    // useEffect(() => {
    //     let alive = true;

    //     (async () => {
    //         try {
    //             setLoadingAll(true);

    //             const [
    //                 allRes,
    //                 activeRes,
    //                 pendingRes,
    //                 cancelledRes,
    //                 expiredRes,
    //             ] = await Promise.all([
    //                 paymentApi.getSubscriptions(),
    //                 paymentApi.getSubscriptionsByStatus("ACTIVE"),
    //                 paymentApi.getSubscriptionsByStatus("PENDING"),
    //                 paymentApi.getSubscriptionsByStatus("CANCELLED"),
    //                 paymentApi.getSubscriptionsByStatus("EXPIRED"),
    //             ]);

    //             if (!alive) return;

    //             // IMPORTANT: axios response => res.data.data
    //             setAllSubs(formatRows(allRes?.data?.data || []));
    //             setActiveSubs(formatRows(activeRes?.data?.data || []));
    //             setPendingSubs(formatRows(pendingRes?.data?.data || []));
    //             setCancelSubs(formatRows(cancelledRes?.data?.data || []));
    //             setExpiredSubs(formatRows(expiredRes?.data?.data || []));
    //         } catch (err) {
    //             console.error("Fetch subscriptions error:", err);
    //         } finally {
    //             if (alive) setLoadingAll(false);
    //         }
    //     })();

    //     return () => {
    //         alive = false;
    //     };
    // }, []);

    const handleCancelSubscription = async (row) => {
        try {
            const confirmCancel = window.confirm(
                "Are you sure you want to cancel this subscription?"
            );

            if (!confirmCancel) return;

            setCancelLoadingId(row.id);

            await paymentApi.cancelSubscription(
                row.raw.paypal_subscription_id
            );

            setConfirmation({
                open: true,
                type: "success",
                message:
                    "Subscription cancelled successfully",
            });

            await fetchSubscriptions();
        } catch (error) {
            console.error(error);

            setConfirmation({
                open: true,
                type: "error",
                message:
                    error?.response?.data?.message ||
                    "Failed to cancel subscription",
            });
        } finally {
            setCancelLoadingId(null);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            setLoadingAll(true);

            const [
                allRes,
                activeRes,
                pendingRes,
                cancelledRes,
                expiredRes,
            ] = await Promise.all([
                paymentApi.getSubscriptions(
                    1,
                    10,
                    startDate,
                    endDate
                ),
                paymentApi.getSubscriptionsByStatus(
                    "ACTIVE",
                    1,
                    10,
                    startDate,
                    endDate
                ),
                paymentApi.getSubscriptionsByStatus(
                    "PENDING",
                    1,
                    10,
                    startDate,
                    endDate
                ),
                paymentApi.getSubscriptionsByStatus(
                    "CANCELLED",
                    1,
                    10,
                    startDate,
                    endDate
                ),
                paymentApi.getSubscriptionsByStatus(
                    "EXPIRED",
                    1,
                    10,
                    startDate,
                    endDate
                ),
            ]);
            const allData = formatRows(allRes?.data?.data || []);

            setAllSubs(formatRows(allRes?.data?.data || []));
            setActiveSubs(formatRows(activeRes?.data?.data || []));
            setPendingSubs(formatRows(pendingRes?.data?.data || []));
            setCancelSubs(formatRows(cancelledRes?.data?.data || []));
            setExpiredSubs(formatRows(expiredRes?.data?.data || []));
            setRefundedSubs(
                allData.filter(
                    (item) => Number(item.refundStatus) === 1
                )
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAll(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleRefundSubscription = async (row) => {
        try {
            const confirmRefund = window.confirm(
                "Are you sure you want to refund this subscription?"
            );

            if (!confirmRefund) return;

            setRefundLoadingId(row.id);

            const res =
                await paymentApi.refundSubscription(
                    row.paypalSubscriptionId
                );

            setConfirmation({
                open: true,
                type: "success",
                message:
                    res?.data?.message ||
                    "Refund processed successfully",
            });

            await fetchSubscriptions();
        } catch (error) {
            console.error(error);

            setConfirmation({
                open: true,
                type: "error",
                message:
                    error?.response?.data?.message ||
                    "Refund failed",
            });
        } finally {
            setRefundLoadingId(null);
        }
    };

    const handleExport = async (status = "") => {
  try {
    const response =
      await ExportApi.exportSubscriptions(
        status
      );

    const blob = new Blob([
      response.data,
    ]);

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = status
      ? `${status.toLowerCase()}-subscriptions.xlsx`
      : "all-subscriptions.xlsx";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "Subscription export failed",
      error
    );

    setConfirmState?.({
      open: true,
      type: "error",
      title: "Export Failed",
      message:
        error?.response?.data?.message ||
        "Unable to export subscriptions",
    });
  }
};


    /* ================= TABS ================= */
    const tabs = [
        {
            label: "All",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                        title="All Subscriptions"
                        columns={columns}
                        data={allSubs}
                        loading={loadingAll}
                        showActions={false}
                        onExport={() => handleExport()}
                    // if DataTable supports refresh button:
                    // onRefresh={() => refreshTab()}
                    />
                </div>
            ),
        },
        {
            label: "Active",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                        title="Active Subscriptions"
                        columns={columns}
                        data={activeSubs}
                        loading={loadingActive}
                        showActions={false}
                        onExport={() => handleExport("ACTIVE")}
                    // onRefresh={() => refreshTab("ACTIVE")}
                    />
                </div>
            ),
        },
        {
            label: "Pending",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                        title="Pending Subscriptions"
                        columns={columns}
                        data={pendingSubs}
                        loading={loadingPending}
                        showActions={false}
                        onExport={() => handleExport("PENDING")}
                    // onRefresh={() => refreshTab("PENDING")}
                    />
                </div>
            ),
        },
        {
            label: "Cancelled",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                        title="Cancelled Subscriptions"
                        columns={columns}
                        data={cancelSubs}
                        loading={loadingCancel}
                        showActions={false}
                        onExport={() => handleExport("CANCELLED")}
                    />
                </div>
            ),
        },
        {
            label: "Expired",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                    onExport={() => handleExport("EXPIRED")}
                        title="Expired Subscriptions"
                        columns={columns}
                        data={expiredSubs}
                        showActions={false}
                        loading={loadingExpired}
                    // onRefresh={() => refreshTab("EXPIRED")}
                    />
                </div>
            ),
        },
        {
            label: "Refunded",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
                        title="Refunded Subscriptions"
                        columns={refundColumns}
                        data={refundedSubs}
                        loading={loadingRefunded}
                        showActions={false}
                    />
                </div>
            ),
        },
    ];

    return (
        <AdminGuard>
            <AdminLayout>
                <Conformation
                    open={confirmation.open}
                    type={confirmation.type}
                    message={confirmation.message}
                    onClose={() =>
                        setConfirmation((prev) => ({ ...prev, open: false }))
                    }
                />
                <div className="max-full w-full mx-auto">
                    <div className="flex flex-wrap items-end gap-4 mb-5">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            />
                        </div>

                        <button
                            onClick={fetchSubscriptions}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Apply Filter
                        </button>

                        <button
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");

                                setTimeout(() => {
                                    fetchSubscriptions();
                                }, 0);
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md"
                        >
                            Reset
                        </button>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <Tabs tabs={tabs} />
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}