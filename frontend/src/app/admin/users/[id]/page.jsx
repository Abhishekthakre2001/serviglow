"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import bookingApi from "@/services/bookingApi";
import authApi from "@/services/authApi";
import DataTable from "@/components/ui/DataTable";

export default function UserBookingsPage() {

    const params = useParams();
    const userId = params.id;

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);

    const columns = [
        {
            key: "id",
            label: "Booking ID",
            render: (value) => `${value}`,
        },

        {
            key: "service_title",
            label: "Service",
        },

        {
            key: "booking_date",
            label: "Date",
            render: (value) => {

                if (!value) return "-";

                return new Date(value).toLocaleDateString("en-GB");
            },
        },

        {
            key: "partner_name",
            label: "Partner",
        },

        {
            key: "price",
            label: "Price",
            render: (value) => `${value}`,
        },

        {
            key: "status",
            label: "Status",
            render: (value) => (
                <span
                    className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusStyles[value] ||
                        "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                >
                    {value}
                </span>
            ),
        },
    ];
    //   const [user, setUser] = useState(null);

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        try {

            setLoading(true);

            // USER DETAILS
            //   const userResponse = await authApi.getCustomerById(userId);

            //   setUser(userResponse.data?.data);

            // BOOKINGS
            const bookingResponse =
                await bookingApi.getCustomerBookings({
                    customerId: userId,
                    page: 1,
                    limit: 50,
                });

            setBookings(bookingResponse.data?.data || []);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    const statusStyles = {
        Pending:
            "bg-yellow-100 text-yellow-700 border-yellow-200",

        Confirmed:
            "bg-blue-100 text-blue-700 border-blue-200",

        Completed:
            "bg-green-100 text-green-700 border-green-200",

        Cancelled:
            "bg-red-100 text-red-700 border-red-200",
    };

    return (
        <AdminLayout>

            <div className="space-y-6">

                {/* LOADING */}
                {loading ? (

                    <div className="flex items-center justify-center py-20">

                        <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>

                    </div>

                ) : bookings.length === 0 ? (

                    <div className="bg-white rounded-2xl p-16 text-center shadow-sm border">

                        <div className="text-6xl mb-4">📭</div>

                        <h2 className="text-xl font-semibold text-gray-700">
                            No Bookings Found
                        </h2>

                    </div>

                ) : (

                    <>
                        {/* STATUS CARDS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                            {[
                                {
                                    label: "Total",
                                    value: bookings.length,
                                    bg: "bg-white",
                                    text: "text-gray-800",
                                },

                                {
                                    label: "Pending",
                                    value: bookings.filter(
                                        (b) => b.status === "Pending"
                                    ).length,
                                    bg: "bg-yellow-100",
                                    text: "text-yellow-700",
                                },

                                {
                                    label: "Completed",
                                    value: bookings.filter(
                                        (b) => b.status === "Completed"
                                    ).length,
                                    bg: "bg-green-100",
                                    text: "text-green-700",
                                },

                                {
                                    label: "Cancelled",
                                    value: bookings.filter(
                                        (b) => b.status === "Cancelled"
                                    ).length,
                                    bg: "bg-red-100",
                                    text: "text-red-700",
                                },
                            ].map((item, index) => (

                                <div
                                    key={index}
                                    className={`${item.bg} rounded-2xl p-5 shadow-xl`}
                                >

                                    <p className={`text-sm ${item.text}`}>
                                        {item.label}
                                    </p>

                                    <h2 className={`text-3xl font-bold mt-2 ${item.text}`}>
                                        {item.value}
                                    </h2>

                                </div>

                            ))}

                        </div>

                        <DataTable
                            title="Customer Bookings"
                            columns={columns}
                            data={bookings}
                            loading={loading}
                            showActions={false}
                            pagination={false}
                        />
                    </>
                )}

            </div>

        </AdminLayout>
    );
}