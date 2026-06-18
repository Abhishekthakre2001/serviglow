"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import DataTable from "@/components/ui/DataTable";
import partnerAPI from "@/services/partnerApi";

export default function Page() {
    const params = useParams();

    const userId = params?.id;

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchServices = async () => {
        try {
            setLoading(true);

            console.log("Partner ID:", userId);

            const res = await partnerAPI.getPartnerServices({
                userId,
                page: 1,
                limit: 10,
            });

            const payload = res?.data;

            const rawList =
                payload?.success && Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            const formatted = rawList.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                category: item.category_name || "-",
                subCategory: item.sub_category_name || "-",
                price: item.price,
                estimatedTime: item.estimated_time,
                rating: item.avg_rating,
                reviews: item.total_reviews,
                status: item.is_active ? "Active" : "Inactive",
                createdAt: item.created_at,
                image: item.images?.[0] || "",
            }));

            setServices(formatted);
        } catch (error) {
            console.error("Failed to load services:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("partnerId changed:", userId);

        if (userId) {
            fetchServices();
        }

    }, [userId]);

    const columns = [
        {
            key: "image",
            label: "Image",
            render: (value) => (
                <img
                    src={value || "/images/default_img.webp"}
                    alt="service"
                    className="w-14 h-14 rounded object-cover"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/default_img.webp";
                    }}
                />
            ),
        },
        {
            key: "title",
            label: "Service Title",
        },
        {
            key: "subtitle",
            label: "Subtitle",
        },
        {
            key: "category",
            label: "Category",
        },
        {
            key: "subCategory",
            label: "Sub Category",
        },
        {
            key: "price",
            label: "Price",
            render: (v) => `$${v}`,
        },
        {
            key: "estimatedTime",
            label: "Estimated Time",
        },
        {
            key: "rating",
            label: "Rating",
        },
        {
            key: "reviews",
            label: "Reviews",
        },
        {
            key: "status",
            label: "Status",
            render: (v) => (
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${v === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                >
                    {v}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            render: (v) => new Date(v).toLocaleDateString("en-GB"),
        },
    ];

    return (
        <AdminLayout>
            <div className="w-full mx-auto">
                <DataTable
                    title={`Partner Services `}
                    columns={columns}
                    data={services}
                    loading={loading}
                    showActions={false}
                    exportable={false}
                />
            </div>
        </AdminLayout>

    );
}