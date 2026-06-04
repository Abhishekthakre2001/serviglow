"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard";


/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
        >
            {status}
        </span>
    );
};

export default function Servicess() {
    const router = useRouter();

    /* ================= DUMMY DATA ================= */

    const services = [
        {
            id: 1,
            service_name: "Deep Cleaning",
            category: "Housekeeping",
            price: 1500,
            duration: "2 Hours",
            status: "Active",
            createdAt: "2026-01-01",
        },
        {
            id: 2,
            service_name: "Wiring Repair",
            category: "Electrician",
            price: 800,
            duration: "1 Hour",
            status: "Inactive",
            createdAt: "2026-01-03",
        },
    ];

    /* ================= TABLE COLUMNS ================= */

    const columns = [
        { key: "service_name", label: "Service Name" },
        { key: "category", label: "Category" },
        {
            key: "price",
            label: "Price ($)",
            render: (value) => `$ ${value}`,
        },
        { key: "duration", label: "Duration" },
        {
            key: "createdAt",
            label: "Created Date",
            isDate: true,
            render: (value) =>
                new Date(value).toLocaleDateString(),
        },
        {
            key: "status",
            label: "Status",
            render: (value) => <StatusBadge status={value} />,
        },
    ];

    /* ================= NAVIGATION ================= */

    const handleCreate = () => {
        router.push("/admin/services/manageservices");
    };

    const handleEdit = (row) => {
        router.push(`/admin/services/manageservices?id=${row.id}`);
    };

    /* ================= UI ================= */

    return (

        <>
            <AdminGuard>
                <AdminLayout>
                    <div className="mt-10">

                        <DataTable
                            title="Services List"
                            columns={columns}
                            data={services}
                            onCreate={handleCreate}
                            onEdit={handleEdit}
                        />

                    </div>
                </AdminLayout >
            </AdminGuard>
        </>

    );
}
