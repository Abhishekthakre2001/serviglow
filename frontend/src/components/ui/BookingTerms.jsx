import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

import cmsApi from "../../services/cms";
import Alert from "@/components/ui/Conformation";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
});

export default function BookingTerms() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    useEffect(() => {
        fetchBookingTerms();
    }, []);

    const fetchBookingTerms = async () => {
        try {
            const res = await cmsApi.getBookingTerms();

            if (res.data?.data) {
                setTitle(res.data.data.title || "");
                setContent(res.data.data.content || "");
            }
        } catch (error) {
            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message: "Failed to load Booking Terms",
            });
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            await cmsApi.upsertBookingTerms({
                title,
                content,
            });

            setAlert({
                open: true,
                type: "success",
                title: "Success",
                message: "Booking Terms updated successfully",
            });
        } catch (error) {
            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message: "Failed to save Booking Terms",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="p-6 bg-white rounded-xl shadow">
                <h2 className="text-2xl font-semibold mb-6">
                    Booking Terms & Conditions
                </h2>

                <div className="mb-4">
                    <label className="block mb-2 font-medium">
                        Title
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter title"
                        className="w-full border rounded-lg p-3 outline-none"
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-2 font-medium">
                        Terms & Conditions
                    </label>

                    <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        style={{ height: "350px", marginBottom: "60px" }}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full text-white font-medium shadow-md transition bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>

            <Alert
                open={alert.open}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() =>
                    setAlert({
                        open: false,
                        type: "success",
                        title: "",
                        message: "",
                    })
                }
            />
        </>
    );
}