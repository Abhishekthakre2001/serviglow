"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import paymentApi from "@/services/paymentApi";

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
    ];

    /* ================= FORMAT ROWS ================= */
    const formatRows = (arr) =>
        (arr || []).map((s) => ({
            id: s.id,
            name:
                s?.name ||
                `${s?.userId?.firstName || ""} ${s?.userId?.lastName || ""}`.trim() ||
                "-",
            email: s?.email || s?.userId?.email || "-",
            planKey: s?.plan_key || "-",
            paypalSubscriptionId: s?.paypal_subscription_id || "-",
            price: s?.price || "-",
            startDate: s?.start_date || null,
            endDate: s?.end_date || null,
            status: s?.status || "-",
            createdAt: s?.created_at || null,
            raw: s,
        }));

    /* ================= FETCH ALL TABS (ON LOAD) ================= */
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoadingAll(true);

                const [
                    allRes,
                    activeRes,
                    pendingRes,
                    cancelledRes,
                    expiredRes,
                ] = await Promise.all([
                    paymentApi.getSubscriptions(),
                    paymentApi.getSubscriptionsByStatus("ACTIVE"),
                    paymentApi.getSubscriptionsByStatus("PENDING"),
                    paymentApi.getSubscriptionsByStatus("CANCELLED"),
                    paymentApi.getSubscriptionsByStatus("EXPIRED"),
                ]);

                if (!alive) return;

                // IMPORTANT: axios response => res.data.data
                setAllSubs(formatRows(allRes?.data?.data || []));
                setActiveSubs(formatRows(activeRes?.data?.data || []));
                setPendingSubs(formatRows(pendingRes?.data?.data || []));
                setCancelSubs(formatRows(cancelledRes?.data?.data || []));
                setExpiredSubs(formatRows(expiredRes?.data?.data || []));
            } catch (err) {
                console.error("Fetch subscriptions error:", err);
            } finally {
                if (alive) setLoadingAll(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    /* ================= OPTIONAL: REFRESH ONE TAB ================= */
    const refreshTab = async (status) => {
        try {
            if (!status) setLoadingAll(true);
            if (status === "ACTIVE") setLoadingActive(true);
            if (status === "PENDING") setLoadingPending(true);
            if (status === "EXPIRED") setLoadingExpired(true);
            if (status === "CANCELLED") setLoadingCancel(true);

            const res = status
                ? await paymentApi.getSubscriptionsByStatus(status)
                : await paymentApi.getSubscriptions();

            const rows = formatRows(res?.data?.data || []);

            if (!status) setAllSubs(rows);
            if (status === "ACTIVE") setActiveSubs(rows);
            if (status === "PENDING") setPendingSubs(rows);
            if (status === "EXPIRED") setExpiredSubs(rows);
            if (status === "CANCELLED") setCancelSubs(rows);
        } catch (err) {
            console.error("Refresh subscriptions error:", err);
        } finally {
            if (!status) setLoadingAll(false);
            if (status === "ACTIVE") setLoadingActive(false);
            if (status === "PENDING") setLoadingPending(false);
            if (status === "EXPIRED") setLoadingExpired(false);
            if (status === "CANCELLED") setLoadingCancel(false);
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
                    />
                </div>
            ),
        },
        {
            label: "Expired",
            content: (
                <div className="w-full overflow-x-auto">
                    <DataTable
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
    ];

    return (
        <AdminGuard>
            <AdminLayout>
                <div className="max-full w-full mx-auto">
                    <div className="w-full overflow-x-auto">
                        <Tabs tabs={tabs} />
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}