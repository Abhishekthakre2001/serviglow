"use client";

import React, { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modals";
import InputField from "@/components/ui/InputField";
import Conformation from "@/components/ui/Conformation";
import FileUpload from "@/components/ui/FileUpload";
import categoryApi from "../../services/category";
import { useEffect } from "react";
import useServerPagination from '../../hooks/useServerPagination.js';
import ExportApi from "@/services/exportApi";


export default function Category() {
  const baseURL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  const columns = [
    { key: "category_name", label: "Category" },
    { key: "sub_title", label: "Sub Title" },
    {
      key: "imagePreview",
      label: "Image",
      render: (value) => (
        <img
          src={value || "/images/default_img.webp"}
          alt="category"
          className="w-16 h-16 object-contain rounded"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/default_img.webp";
          }}
        />
      ),
    },
  ];

  // const [data, setData] = useState([]);

  // useEffect(() => {
  //   fetchCategories();
  // }, []);

  // const fetchCategories = async () => {
  //   try {
  //     const res = await categoryApi.getCategories();

  //     const formatted = res.data.data.map((item) => ({
  //       id: item._id,
  //       category_name: item.categoryName,
  //       sub_title: item.subTitle,
  //       imagePreview: `${baseURL}${item.image}`,
  //       createdAt: item.createdAt,
  //     }));

  //     console.log("formatted", formatted)

  //     setData(formatted);
  //   } catch (error) {
  //     console.error("Error fetching categories", error);
  //   }
  // };

  // const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [form, setForm] = useState({
    category_name: "",
    sub_title: "",
    image: [],
    imagePreview: null,
  });

  // Open Create
  const handleCreate = () => {
    setEditingRow(null);
    setForm({
      category_name: "",
      sub_title: "",
      image: [],
      imagePreview: null,
    });
    setOpenModal(true);
  };

  // Open Edit
  const handleEdit = (row) => {
    setEditingRow(row);
    setForm({
      category_name: row.category_name,
      sub_title: row.sub_title || "",
      image: [],
      imagePreview: row.imagePreview || null,
    });
    setOpenModal(true);
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0];

      if (file) {
        const preview = URL.createObjectURL(file);

        setForm({
          ...form,
          image: files,
          imagePreview: preview,
        });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const isFormValid = () => {
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!form.category_name || !nameRegex.test(form.category_name)) return false;

    if (form.sub_title && !nameRegex.test(form.sub_title)) return false;

    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!form.category_name.trim()) return;

    const formData = new FormData();
    formData.append("categoryName", form.category_name);
    formData.append("subTitle", form.sub_title);

    if (form.image?.[0]) {
      formData.append("image", form.image[0]);
    }

    try {
      // setLoading(true);

      let res;

      if (editingRow) {
        res = await categoryApi.updateCategory(editingRow.id, formData);
      } else {
        res = await categoryApi.createCategory(formData);
      }

      // ✅ IMPORTANT: Check API success flag
      if (res?.data?.success === false) {
        setConfirmState({
          open: true,
          type: "error",
          title: "Error",
          message: res?.data?.message || "Something went wrong",
        });
        return; // stop execution
      }

      // ✅ Success case
      setConfirmState({
        open: true,
        type: "success",
        title: editingRow ? "Updated Successfully" : "Created Successfully",
        message:
          res?.data?.message ||
          (editingRow
            ? "Category updated successfully."
            : "Category created successfully."),
      });

      // fetchCategories();
      refresh();
      setOpenModal(false);

    } catch (error) {
      console.error("Error saving category", error);

      setConfirmState({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      // setLoading(false);
    }
  };

  const {
    data,
    loading,
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    refresh
  } = useServerPagination(categoryApi.getCategories, {
    formatData: (items) =>
      items.map((item) => ({
        id: item.id,
        category_name: item.category_name,
        sub_title: item.sub_title,
        imagePreview: item.image ? `${baseURL}${item.image}` : null,
        createdAt: item.created_at,
      })),
  });

  const handleExportCategory = async () => {
  try {
    const response = await ExportApi.exportMaster(
      "category",
      "excel"
    );

    const blob = new Blob([response.data]);

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "categories.xlsx";

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed", error);

    setConfirmState({
      open: true,
      type: "error",
      title: "Export Failed",
      message:
        error?.response?.data?.message ||
        "Unable to export categories",
    });
  }
};

  return (
    <>
      <Conformation
        open={confirmState.open}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onClose={() =>
          setConfirmState({
            open: false,
            type: "",
            title: "",
            message: "",
            onConfirm: null,
          })
        }
      />

      <DataTable
        title="Category List"
        columns={columns}
        pagination={true}
        data={data}
        onCreate={handleCreate}
        onEdit={handleEdit}
        loading={loading}
        serverSide={true}
        currentPageProp={page}
        totalPagesProp={totalPages}
        onExport={handleExportCategory}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onDelete={(row) => {
          setConfirmState({
            open: true,
            type: "warning",
            title: "Delete Category",
            message: "Are you sure you want to delete this category?",
            onConfirm: async () => {
              try {
                await categoryApi.deleteCategory(row.id);
                // fetchCategories();
                refresh()
              } catch (error) {
                console.error("Delete error", error);
              }
            },
          });
        }}
      />

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editingRow ? "Update Category" : "Create Category"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpenModal(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
              className={`px-4 py-2 rounded text-white ${loading || !isFormValid()
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600"
                }`}
            >
              {loading
                ? editingRow
                  ? "Updating..."
                  : "Creating..."
                : editingRow
                  ? "Update"
                  : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">

          <InputField
            label="Category Name"
            name="category_name"
            value={form.category_name}
            onChange={handleChange}
            required
            minLength={3}
            pattern={/^[A-Za-z\s]+$/}
            error="Only alphabets allowed"
          />

          <InputField
            label="Sub Title"
            name="sub_title"
            value={form.sub_title}
            onChange={handleChange}
            pattern={/^[A-Za-z\s]*$/}
            error="Only alphabets allowed"
          />

          <FileUpload
            label="Category Image"
            name="image"
            files={form.image}
            onChange={handleChange}
            multiple={false}
            maxFiles={1}
          />

          {form.imagePreview && editingRow && (
            <>
              {/* <p>Image Preview</p> */}
              <img
                src={form.imagePreview || "/images/default_img.webp"}
                alt="preview"
                className="w-20 h-20 rounded  border"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/default_img.webp";
                }}

              />
            </>

          )}

        </div>
      </Modal>
    </>
  );
}
