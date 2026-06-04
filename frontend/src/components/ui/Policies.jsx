"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
});

import "react-quill-new/dist/quill.snow.css";

import Alert from "@/components/ui/Conformation";
import cmsApi from "@/services/cms";

const PoliciesManager = () => {
    const [policies, setPolicies] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [editingId, setEditingId] = useState(null);

    // Alert State
    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null,
    });

    const titleInputRef = useRef(null);

    // Add / Update Policy
    const handleSavePolicy = () => {
        if (!title.trim() || !content.trim()) {
            setAlert({
                open: true,
                type: "error",
                title: "Validation Error",
                message: "Please enter policy title and content.",
            });
            return;
        }

        (async () => {
            try {
                const payload = { id: editingId, title, content };
                const res = await cmsApi.upsertPolicy(payload);
                setAlert({
                    open: true,
                    type: "success",
                    title: editingId ? "Updated" : "Added",
                    message: res?.data?.message || (editingId ? "Policy updated" : "Policy added"),
                });
                await loadPolicies();
            } catch (err) {
                setAlert({
                    open: true,
                    type: "error",
                    title: "Error",
                    message: err?.response?.data?.message || "Failed to save policy",
                });
            } finally {
                resetForm();
            }
        })();
    };

    // Edit Policy
    const handleEdit = (policy) => {
        setTitle(policy.title);
        setContent(policy.content);
        setEditingId(policy.id);
        setShowForm(true);

        // scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        // focus input after render
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 300);
    };

    // Delete Policy
    const handleDelete = (id) => {
        setAlert({
            open: true,
            type: "warning",
            title: "Delete Policy",
            message: "Are you sure you want to delete this policy?",
            onConfirm: () => {
                (async () => {
                    try {
                        const res = await cmsApi.deletePolicy(id);
                        setAlert({
                            open: true,
                            type: "success",
                            title: "Deleted",
                            message: res?.data?.message || "Policy deleted successfully",
                        });
                        await loadPolicies();
                    } catch (err) {
                        setAlert({
                            open: true,
                            type: "error",
                            title: "Error",
                            message: err?.response?.data?.message || "Failed to delete",
                        });
                    }
                })();
            },
        });
    };

    // Reset Form
    const resetForm = () => {
        setTitle("");
        setContent("");
        setEditingId(null);
        setShowForm(false);
    };

    // Load policies from server
    const loadPolicies = async () => {
        try {
            const res = await cmsApi.getPolicies();
            setPolicies(res?.data?.data || []);
        } catch (err) {
            console.log("Failed to load policies", err);
        }
    };

    React.useEffect(() => {
        loadPolicies();
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Policies Manager
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Add Terms & Conditions, Refund Policy, Privacy Policy, etc.
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition"
                >
                    <Plus size={18} />
                    Add Policy
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 mb-8 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Policy Title
                        </label>

                        <input
                            ref={titleInputRef}
                            type="text"
                            placeholder="Enter policy title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Policy Content
                        </label>

                        <div className="bg-white">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                placeholder="Write policy content..."
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSavePolicy}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl transition"
                        >
                            {editingId ? "Update Policy" : "Save Policy"}
                        </button>

                        <button
                            onClick={resetForm}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2.5 rounded-xl transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Policies List */}
            <div className="space-y-4">
                {policies.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center">
                        <FileText className="mx-auto text-slate-400 mb-3" size={40} />
                        <p className="text-slate-500">No policies added yet.</p>
                    </div>
                ) : (
                    policies.map((policy) => (
                        <div
                            key={policy.id}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-h-[400px] overflow-auto"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-slate-800">
                                        {policy.title}
                                    </h2>
                                    <div
                                        className="
    ql-editor
    !p-0
    mt-4

    text-slate-700
    leading-7

    overflow-hidden

    [&_*]:max-w-full
    [&_*]:whitespace-normal

    [&_img]:max-w-full
    [&_img]:h-auto
    [&_img]:rounded-xl
    [&_img]:my-4

    [&_iframe]:w-full
    [&_iframe]:max-w-full

    [&_video]:max-w-full

    [&_table]:block
    [&_table]:w-full
    [&_table]:overflow-x-auto
    [&_table]:border-collapse

    [&_pre]:overflow-x-auto
    [&_pre]:bg-slate-100
    [&_pre]:rounded-xl
    [&_pre]:p-4

    [&_blockquote]:border-l-4
    [&_blockquote]:border-slate-300
    [&_blockquote]:pl-4
    [&_blockquote]:italic

    [&_ul]:list-disc
    [&_ul]:pl-6

    [&_ol]:list-decimal
    [&_ol]:pl-6

    [&_a]:text-blue-600
    [&_a]:underline
  "
                                        style={{
                                            overflowWrap: "break-word",
                                            wordBreak: "normal",
                                            whiteSpace: "normal",
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: policy.content
                                                ?.replace(/&nbsp;/g, " ")
                                                ?.replace(/\\"/g, '"'),
                                        }}
                                    />
                                </div>

                                <div className="sticky top-0 self-start flex gap-2 bg-white z-10 py-1">

                                    <button
                                        onClick={() => handleEdit(policy)}
                                        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition shadow-sm"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(policy.id)}
                                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Alert Component */}
            <Alert
                open={alert.open}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() =>
                    setAlert((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
                onConfirm={alert.onConfirm}
            />
        </div>
    );
};

export default PoliciesManager;