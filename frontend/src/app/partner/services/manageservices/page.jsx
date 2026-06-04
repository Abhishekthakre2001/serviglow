"use client";

import React, { useState, useEffect } from "react";
import dynamicImport from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import InputField from "@/components/ui/InputField";
import "react-quill-new/dist/quill.snow.css";
import PartnerGuard from "@/app/partner/PartnerGuard";
import Dropdown from "@/components/ui/Dropdown";
import FileUpload from "@/components/ui/FileUpload";
import Conformatiom from "@/components/ui/Conformation";
import serviceApi from "../../../../services/serviceApi";
import categoryApi from "../../../../services/category";
import subcategoryApi from "../../../../services/subcategory";


const ReactQuill = dynamicImport(
  () => import("react-quill-new"),
  { ssr: false }
);
export default function ManageServices() {

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "", // success | error
    message: "",
  });
  const router = useRouter();
  // const searchParams = useSearchParams();
  // const serviceId = searchParams.get("id");
  const params = useParams(); // ✅ no suspense issue
  const serviceId = params?.id; // ✅ /manageservices/[id]

  /* ================= STATE ================= */

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    estimatedTime: "",
    service_category: "",
    service_subcategory: "",
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [serviceImages, setServiceImages] = useState([]); // only File objects

  // const handleDocumentUpload = (name, files) => {
  //   // files is array from FileUpload
  //   const fileArr = Array.isArray(files) ? files : [];
  //   setServiceImages(fileArr.slice(0, 3)); // limit 3
  // };
  const handleDocumentUpload = (name, files) => {
    const fileArr = Array.isArray(files) ? files : [];

    const validFiles = [];
    const invalidFiles = [];

    for (let file of fileArr) {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (> 2MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      setConfirmation({
        open: true,
        type: "error",
        message: `Invalid files: ${invalidFiles.join(", ")}`,
      });
    }

    setServiceImages(validFiles.slice(0, 3));
  };
  /* ================= EDIT MODE ================= */

  useEffect(() => {
    if (!serviceId) return;

    const fetchService = async () => {
      try {
        const { data } = await serviceApi.getServiceById(serviceId);

        if (data.success) {
          setForm({
            title: data.data.title || "",
            subtitle: data.data.subtitle || "",
            description: data.data.aboutService || "",
            price: data.data.price || "",
            estimatedTime: data.data.estimatedTime || "",
            service_category: data.data.category?._id || data.data.category || "",
            service_subcategory:
              data.data.subCategory?._id || data.data.subCategory || "",
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchService();
  }, [serviceId]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data } = await categoryApi.getCategories();

        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  console.log("form.service_category", form.service_category)

  useEffect(() => {



    if (!form.service_category) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      try {
        setSubcategoriesLoading(true);

        const { data } = await subcategoryApi.getSubcategories({
          categoryId: form.service_category, // ✅ FIX HERE
        });

        if (data.success) {
          setSubcategories(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSubcategoriesLoading(false);
      }
    };
    fetchSubcategories();
  }, [form.service_category]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const isQuillEmpty = (html) => {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return text.length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title?.trim() ||
      !form.subtitle?.trim() ||
      isQuillEmpty(form.description) ||
      !form.price ||
      !form.estimatedTime?.trim() ||
      serviceImages.length === 0
    ) {
      const missingFields = [];

      if (!form.title?.trim()) missingFields.push("Service Title");
      if (!form.subtitle?.trim()) missingFields.push("Service Sub Title");
      if (isQuillEmpty(form.description)) missingFields.push("Description");
      if (!form.price) missingFields.push("Price");
      if (!form.estimatedTime?.trim()) missingFields.push("Estimated Time");
      if (serviceImages.length === 0) missingFields.push("Image");

      setConfirmation({
        open: true,
        type: "error",
        message: `Please fill required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subtitle", form.subtitle);
      formData.append("aboutService", form.description);
      formData.append("price", form.price);
      formData.append("category", form.service_category);
      formData.append("subCategory", form.service_subcategory);
      formData.append("estimatedTime", form.estimatedTime);
      formData.append('slug', `${form.title}-${form.subtitle}`);

      serviceImages.forEach((file) => {
        formData.append("images", file);
      });

      let response;

      if (serviceId) {
        response = await serviceApi.updateService(serviceId, formData);
      } else {
        response = await serviceApi.createService(formData);
      }

      if (response.data.success) {
        setConfirmation({
          open: true,
          type: "success",
          message: serviceId
            ? "Service updated successfully!"
            : "Service created successfully!",
        });
        // router.push("/partner/services");
      }
    } catch (error) {
      console.error(error);
      setConfirmation({
        open: true,
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <Conformatiom
        open={confirmation.open}
        type={confirmation.type}
        message={confirmation.message}
        onClose={() => {
          setConfirmation({ open: false, type: "", message: "" });

          if (confirmation.type === "success") {
            router.push("/partner/services");
          }
        }}
      />
      <PartnerGuard>
        <AdminLayout>
          <div className="max-w-auto mx-auto bg-white p-6">

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
                    pattern={/^[A-Za-z].*$/}

                  />

                  <InputField
                    label="Service Sub Title"
                    name="subtitle"
                    value={form.subtitle}
                    onChange={handleChange}
                    required
                    placeholder="Enter service sub title"
                    pattern={/^[A-Za-z].*$/}

                  />


                  {/* Categories Dropdown with Loading State */}
                  <div>
                    <Dropdown
                      label="Services Offered"
                      name="service_category"
                      value={form.service_category}
                      onChange={handleChange}
                      options={categories.map((cat) => ({
                        label: cat.category_name,
                        value: cat.id,
                      }))}
                      required
                      disabled={categoriesLoading}
                    />
                    {/* {categoriesLoading && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading categories...
                      </div>
                    )} */}
                  </div>

                  {/* Subcategories Dropdown with Loading State */}
                  <div>
                    <Dropdown
                      label="Services Sub Category"
                      name="service_subcategory"
                      value={form.service_subcategory}
                      onChange={handleChange}
                      options={subcategories.map((sub) => ({
                        label: sub.sub_category_name,
                        value: sub.id,
                      }))}
                      required
                      disabled={!form.service_category || subcategoriesLoading}
                    />
                    {/* {subcategoriesLoading && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading subcategories...
                      </div>
                    )} */}
                    {/* {!form.service_category && (
                      <p className="text-sm text-gray-500 mt-2">
                        Select a category first
                      </p>
                    )} */}
                  </div>

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
                    label="Estimated Time in Hours (e.g. 2 )"
                    name="estimatedTime"
                    value={form.estimatedTime}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 2 "
                    pattern={/^[0-9]+$/}
                  />
                </div>

                {/* ================= DESCRIPTION ================= */}

                <div>

                  <FileUpload
                    label="Service Images"
                    name="images"
                    multiple={true}
                    maxFiles={1}
                    required
                    maxSizeMB={2}
                    files={serviceImages} // ✅ ONLY File objects
                    onChange={(e) => handleDocumentUpload("images", e.target.files)}
                    accept="image/*"
                  />

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description<span className="text-red-500"> *</span>
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
      </PartnerGuard>
    </>

  );
}


// import React from 'react'

// export default function page() {
//   return (
//     <div>manage services</div>
//   )
// }
