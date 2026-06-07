"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import cmsApi from "@/services/cms";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function DynamicCmsPage() {
    const params = useParams();
    const slug = params?.slug;

    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);

                const res = await cmsApi.getPageBySlug(slug);
                const data = res?.data?.data;

                setPageData(data || null);
            } catch (err) {
                console.error("Failed to load page:", err);
                setPageData(null);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchPage();
    }, [slug]);

    // ✅ Safe HTML cleaner (DO NOT over-strip whitespace in CMS content)
    const cleanHtml = (html = "") => {
        return html
            .replace(/&nbsp;/g, " ")
            .replace(/\\"/g, '"');
    };

    // ================= LOADING =================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 animate-pulse">Loading...</p>
            </div>
        );
    }

    // ================= NOT FOUND =================
    if (!pageData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-red-500 font-semibold">Page not found</p>
            </div>
        );
    }

    // ================= SAFE DESTRUCTURING =================
    const { title, subtitle, content } = pageData;

    const leftContent = cleanHtml(content?.layout?.left?.content || "");
    const rightContent = cleanHtml(content?.layout?.right?.content || "");

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 px-6 py-14">

                {/* ================= HERO ================= */}
                <div className="text-center max-w-4xl mx-auto mb-14">
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                            {title}
                        </span>
                    </h1>

                    <p className="mt-5 text-gray-600 text-lg max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* ================= CONTENT GRID ================= */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* LEFT */}
                    <div className="p-8">
                        <div
                            className="
                                ql-editor
                                !p-5 md:!p-10
                                text-gray-700

                                [&_*]:max-w-full
                                [&_*]:whitespace-normal
                                [&_*]:break-words

                                [&_img]:max-w-full
                                [&_img]:h-auto
                                [&_img]:rounded-xl

                                [&_table]:block
                                [&_table]:overflow-x-auto
                                [&_table]:max-w-full

                                [&_iframe]:max-w-full
                                [&_iframe]:w-full

                                [&_pre]:!whitespace-pre-wrap
                                [&_pre]:overflow-x-auto

                                [&_code]:break-words
                                [&_a]:break-words

                                [&_blockquote]:border-l-4
                                [&_blockquote]:border-gray-300
                                [&_blockquote]:pl-4
                            "
                            style={{
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                            }}
                            dangerouslySetInnerHTML={{
                                __html: leftContent,
                            }}
                        />
                    </div>

                    {/* RIGHT */}
                    <div className="p-8">
                        <div
                            className="
                                ql-editor
                                !p-5 md:!p-10
                                text-gray-700

                                [&_*]:max-w-full
                                [&_*]:whitespace-normal
                                [&_*]:break-words

                                [&_img]:max-w-full
                                [&_img]:h-auto
                                [&_img]:rounded-xl

                                [&_table]:block
                                [&_table]:overflow-x-auto
                                [&_table]:max-w-full

                                [&_iframe]:max-w-full
                                [&_iframe]:w-full

                                [&_pre]:!whitespace-pre-wrap
                                [&_pre]:overflow-x-auto

                                [&_code]:break-words
                                [&_a]:break-words

                                [&_blockquote]:border-l-4
                                [&_blockquote]:border-gray-300
                                [&_blockquote]:pl-4
                            "
                            style={{
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                            }}
                            dangerouslySetInnerHTML={{
                                __html: rightContent,
                            }}
                        />
                    </div>

                </div>
            </div>

            <Footer />
        </>
    );
}