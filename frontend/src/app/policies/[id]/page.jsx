"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import cmsApi from "@/services/cms";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Loading from "@/components/ui/loading";

import "react-quill-new/dist/quill.snow.css";

export default function PolicyPage() {

    const params = useParams();
    const id = params?.id;

    const [policy, setPolicy] = useState(null);

    useEffect(() => {

        if (!id) return;

        const load = async () => {
            try {

                const res = await cmsApi.getPolicy(id);

                setPolicy(res?.data?.data || null);

            } catch (err) {
                console.log("Failed to load policy", err);
            }
        };

        load();

    }, [id]);

    // CLEAN HTML CONTENT
    const cleanedContent = useMemo(() => {

        if (!policy?.content) return "";

        return policy.content

            // remove nbsp
            .replace(/&nbsp;/g, " ")

            // remove escaped quotes
            .replace(/\\"/g, '"')

        // remove extra spaces
        .replace(/\s+/g, " ");

    }, [policy]);

    if (!policy) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-gray-500">
                <Loading />
            </div>
        );
    }

    return (
        <>
            <Navbar />
             <Breadcrumb title={policy.title} />

            <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6">

               

                <h1 className="text-3xl font-bold mt-6 text-gray-900">
                    {policy.title}
                </h1>

                <div className="mt-8 bg-white rounded-3xl  overflow-hidden">

                    <div
                        className="
      ql-editor
      !p-5 md:!p-10

      text-gray-700

      [&_*]:max-w-full
      [&_*]:whitespace-normal

      [&_img]:max-w-full
      [&_img]:h-auto
      [&_img]:rounded-xl

      [&_table]:block
      [&_table]:overflow-x-auto
      [&_table]:max-w-full

      [&_iframe]:max-w-full
      [&_iframe]:w-full

      [&_pre]:overflow-x-auto

      [&_blockquote]:border-l-4
      [&_blockquote]:border-gray-300
      [&_blockquote]:pl-4
    "
                        style={{
                            overflowWrap: "break-word",
                            wordBreak: "normal",
                            whiteSpace: "normal",
                        }}
                        dangerouslySetInnerHTML={{
                            __html: cleanedContent,
                        }}
                    />

                </div>

            </div>

            <Footer />
        </>
    );
}