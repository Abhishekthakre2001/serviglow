"use client";


import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Tabs from "@/components/ui/Tabs";
import Category from '../Category.jsx';
import SubCategory from '../SubCategory.jsx';
import AdminGuard from "@/app/admin/AdminGuard.jsx";


export default function Master() {
    const tabs = [
        { label: "Category", content: <Category /> },
        { label: "Sub-Category", content: <SubCategory /> }
    ];

    return (
        <>
            <AdminGuard>
                <AdminLayout>
                    <div className="max-w-full">
                        <Tabs tabs={tabs} />
                    </div>
                </AdminLayout>
            </AdminGuard>
        </>

    );
}
