"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

import DataTable from "@/components/ui/DataTable";
import cmsApi from "../../services/cms";
import Alert from "@/components/ui/Conformation";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
});

export default function PagesCMS() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // form
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [leftContent, setLeftContent] = useState("");
    const [rightContent, setRightContent] = useState("");

    const domain = process.env.NEXT_PUBLIC_SITE_URL;

    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    useEffect(() => {
        fetchPages();
    }, []);

    // ---------------- FETCH ----------------
    const fetchPages = async () => {
        try {
            setLoading(true);

            const res = await cmsApi.getPages();
            const data = res.data.data || [];

            const cleanDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

            const enriched = data.map((page) => {
                const slug = page?.slug || "";
                const cleanSlug = slug.replace(/^\//, "");

                return {
                    ...page,
                    fullUrl: slug ? `${cleanDomain}/${cleanSlug}` : "",
                };
            });

            setPages(enriched);
        } catch (err) {
            showAlert("error", "Error", "Failed to load pages");
        } finally {
            setLoading(false);
        }
    };

    // ---------------- OPEN CREATE ----------------
    const openCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    // ---------------- OPEN EDIT ----------------
    const handleEdit = async (row) => {
        try {
            const res = await cmsApi.getPageById(row.slug);
            const data = res.data.data;

            setEditId(row.id);
            setTitle(data.title || "");
            setSubtitle(data.subtitle || "");

            const content = data.content || {};

            setLeftContent(content?.layout?.left?.content || "");
            setRightContent(content?.layout?.right?.content || "");

            // setLeftContent(content?.layout?.left?.content || "");
            // setRightContent(content?.layout?.right?.content || "");

            setModalOpen(true);
        } catch (err) {
            const status = err?.response?.status;

            if (
                status === 413 ||
                err?.message?.includes("413") ||
                err?.toString()?.includes("413")
            ) {
                showAlert(
                    "error",
                    "Content Too Large",
                    "The page content or images are too large for the server. Please reduce the content size or contact the server administrator to increase the upload/request size limit."
                );
            } else {
                showAlert(
                    "error",
                    "Error",
                    err?.response?.data?.message || "Save failed"
                );
            }
        }
    };

    // ---------------- DELETE ----------------
    const handleDelete = async (row) => {
        if (!window.confirm("Delete this page?")) return;

        try {
            await cmsApi.deletePage(row.id);
            setPages((prev) => prev.filter((p) => p.id !== row.id));
            showAlert("success", "Deleted", "Page deleted successfully");
        } catch (err) {
            showAlert("error", "Error", "Failed to delete page");
        }
    };

    // ---------------- SAVE ----------------
    const handleSave = async () => {
        try {
            setLoading(true);

            const payload = {
                title,
                subtitle,
                content: {
                    layout: {
                        left: {
                            type: "quill",
                            content: leftContent,
                        },
                        right: {
                            type: "quill",
                            content: rightContent,
                        },
                    },
                },
                status: "published",
            };

            if (editId) {
                await cmsApi.updatePage(editId, payload);
                showAlert("success", "Updated", "Page updated");
            } else {
                await cmsApi.createPage(payload);
                showAlert("success", "Created", "Page created");
            }

            setModalOpen(false);
            resetForm();
            fetchPages();
        } catch (err) {
            const status = err?.response?.status;

            if (
                status === 413 ||
                err?.message?.includes("413") ||
                err?.toString()?.includes("413")
            ) {
                showAlert(
                    "error",
                    "Content Too Large",
                    "The page content or images are too large for the server. Please reduce the content size or contact the server administrator to increase the upload/request size limit."
                );
            } else {
                showAlert(
                    "error",
                    "Error",
                    err?.response?.data?.message || "Save failed"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ---------------- RESET ----------------
    const resetForm = () => {
        setEditId(null);
        setTitle("");
        setSubtitle("");
        setLeftContent("");
        setRightContent("");
    };

    const showAlert = (type, title, message) => {
        setAlert({ open: true, type, title, message });
    };

    // ---------------- TABLE COLUMNS ----------------
    const columns = [
        { key: "title", label: "Title" },
        { key: "slug", label: "Route" },

        {
            key: "fullUrl",
            label: "Link",
        },

        { key: "status", label: "Status" },
    ];

    return (
        <div className="p-4">

            {/* ================= TABLE ================= */}
            <DataTable
                title="Pages CMS"
                columns={columns}
                data={pages}
                loading={loading}
                onCreate={openCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
            />

            {/* ================= MODAL ================= */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-5xl rounded-xl p-6 overflow-auto max-h-[90vh]">

                        <h2 className="text-xl font-semibold mb-4">
                            {editId ? "Edit Page" : "Create Page"}
                        </h2>

                        {/* TITLE */}
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            className="w-full border p-3 rounded mb-3"
                        />

                        {/* SUBTITLE */}
                        <input
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Subtitle"
                            className="w-full border p-3 rounded mb-4"
                        />

                        {/* TWO COLUMN QUILL */}
                        <div className="grid grid-cols-2 gap-4">

                            {/* LEFT */}
                            <div>
                                <h3 className="font-semibold mb-2">Left Content</h3>
                                <ReactQuill
                                    value={leftContent}
                                    onChange={setLeftContent}
                                />
                            </div>

                            {/* RIGHT */}
                            <div>
                                <h3 className="font-semibold mb-2">Right Content</h3>
                                <ReactQuill
                                    value={rightContent}
                                    onChange={setRightContent}
                                />
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-300 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded"
                            >
                                {loading ? "Saving..." : editId ? "Update" : "Create"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ALERT */}
            <Alert
                open={alert.open}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() =>
                    setAlert({ open: false, type: "success", title: "", message: "" })
                }
            />
        </div>
    );
}