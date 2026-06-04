import React, { useEffect, useState } from "react";
import cmsApi from "../../services/cms";
import Alert from "@/components/ui/Conformation";

export default function Announcement() {

    const [announcement, setAnnouncement] = useState("");
    const [loading, setLoading] = useState(false);

    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {

        try {

            const res = await cmsApi.getAnnouncement();

            if (res.data?.data?.announcement) {
                setAnnouncement(res.data.data.announcement);
            }

        } catch (error) {

            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message: "Failed to load announcement",
            });

        }
    };

    const handleUpdate = async () => {

        try {

            setLoading(true);

            await cmsApi.upsertAnnouncement({
                announcement,
            });

            setAlert({
                open: true,
                type: "success",
                title: "Success",
                message: "Announcement updated successfully",
            });

        } catch (error) {

            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message: "Something went wrong",
            });

        } finally {

            setLoading(false);

        }
    };

    return (
        <>
            <div className="p-6 bg-white rounded-xl shadow">

                <h2 className="text-2xl font-semibold mb-4">
                    Announcement Bar
                </h2>

                <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    rows={5}
                    placeholder="Enter announcement..."
                    className="w-full border rounded-lg p-3 outline-none"
                />

                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full text-white font-medium shadow-md transition bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
                >
                    {loading ? "Updating..." : "Update"}
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