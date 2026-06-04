"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import InputField from "@/components/ui/InputField";
import "react-quill-new/dist/quill.snow.css";
import AdminGuard from "@/app/admin/AdminGuard";


const ReactQuill = dynamic(
  () => import("react-quill-new"),
  { ssr: false }
);

export default function ManageServices() {

  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id; // ✅ correct


  /* ================= STATE ================= */

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    estimatedTime: "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= EDIT MODE ================= */

  useEffect(() => {
    if (serviceId) {
      setForm({
        title: "Deep Cleaning",
        subtitle: "Home Deep Cleaning Service",
        description:
          "<p>Professional deep cleaning service for your home.</p>",
        price: "1500",
        estimatedTime: "2 Hours",
      });
    }
  }, [serviceId]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.title ||
      !form.subtitle ||
      !form.description ||
      !form.price ||
      !form.estimatedTime
    ) {
      alert("All fields are required");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert(serviceId ? "Service Updated!" : "Service Created!");
      router.push("/services");
    }, 800);
  };

  //   /* ================= UI ================= */

  return (
    <>
      <AdminGuard>
        <AdminLayout>
          <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm">

            <h2 className="text-2xl font-bold mb-8 text-slate-800">
              {serviceId ? "Update Service" : "Add New Service"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ================= BASIC DETAILS ================= */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="flex flex-col gap-4">
                  <InputField
                    label="Service Title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter service title"
                  />

                  <InputField
                    label="Service Sub Title"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    required
                    placeholder="Enter service sub title"
                  />

                  <InputField
                    label="Price ($)"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="Enter price"
                  />

                  <InputField
                    label="Estimated Time"
                    name="estimatedTime"
                    value={form.estimatedTime}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 2 Hours"
                  />
                </div>

                {/* ================= DESCRIPTION ================= */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>

                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={form.description}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, description: value }))
                      }
                      className="h-60"
                    />
                  </div>
                </div>

              </div>



              {/* ================= ACTION BUTTONS ================= */}

              <div className="flex justify-end gap-3 pt-6 ">

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {loading
                    ? "Processing..."
                    : serviceId
                      ? "Update Service"
                      : "Create Service"}
                </button>

              </div>

            </form>
          </div>
        </AdminLayout>
      </AdminGuard>
    </>

  );
}


