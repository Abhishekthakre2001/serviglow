"use client";

import React, { useState, useEffect } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modals";
import InputField from "@/components/ui/InputField";
import Dropdown from "@/components/ui/Dropdown";
import Conformation from "@/components/ui/Conformation";
import FileUpload from "@/components/ui/FileUpload";
import subcategoryApi from "../../services/subcategory";
import categoryApi from "../../services/category";
import useServerPagination from "@/hooks/useServerPagination";
export default function SubCategory() {

  const baseURL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    { key: "category_name", label: "Category" },
    { key: "subcategory_name", label: "Sub Category" },
    { key: "sub_title", label: "Sub Title" },
    {
      key: "image",
      label: "Image",
      render: (value) =>
        value ? (
          <img
            src={value || "/images/default_img.webp"}
            alt="subcategory"
            className="w-14 h-14 object-contain rounded"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/default_img.webp";
            }}

          />
        ) : (
          <span className="text-gray-400 text-sm">No Image</span>
        ),
    },
  ];

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    category_id: "",
    subcategory_name: "",
    sub_title: "",
    image: [],
    imagePreview: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    title: "",
    message: "",
    onConfirm: null,
  });

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      console.log("res", res.data.data)

      const formatted = res.data.data.map((item) => ({
        label: item.category_name,
        value: item.id, // 👈 store id here
      }));

      setCategoryOptions(formatted);
    } catch (error) {
      console.error("Category fetch error", error);
    }
  };


  const fetchSubcategories = async () => {
    try {
      setLoading(true);

      const res = await subcategoryApi.getSubcategories({
        page,
        limit,
      });

      const formatted = res.data.data.map((item) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.category_name,
        subcategory_name: item.sub_category_name,
        sub_title: item.sub_title,
        image: item.image ? `${baseURL}${item.image}` : null,
        createdAt: item.created_at,
      }));

      setData(formatted);
      setTotalPages(res?.data?.pagination?.totalPages || 1);

    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, [page, limit]);

  useEffect(() => {
    fetchCategories();
  }, []);
  /* ================= HANDLE CHANGE ================= */

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setForm((prev) => ({
          ...prev,
          image: files,
          imagePreview: preview,
        }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ================= CREATE ================= */

  const handleCreate = () => {
    setEditingRow(null);
    setForm({
      category_id: "",
      subcategory_name: "",
      sub_title: "",
      image: [],
      imagePreview: null,
    });
    setOpenModal(true);
  };

  /* ================= EDIT ================= */

  const handleEdit = (row) => {
    setEditingRow(row);

    setForm({
      category_id: row.category_id,
      subcategory_name: row.subcategory_name,
      sub_title: row.sub_title,
      image: [],
      imagePreview: row.image,
    });

    setOpenModal(true);
  };

  const isFormValid = () => {
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!form.category_id) return false;

    if (!form.subcategory_name || !nameRegex.test(form.subcategory_name)) return false;

    if (form.sub_title && !nameRegex.test(form.sub_title)) return false;

    return true;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!form.category_id || !form.subcategory_name.trim()) return;

    const formData = new FormData();
    formData.append("categoryId", form.category_id);
    formData.append("subCategoryName", form.subcategory_name);
    formData.append("subTitle", form.sub_title);

    if (form.image?.[0]) {
      formData.append("image", form.image[0]);
    }

    try {
      setLoading(true);

      let res;

      if (editingRow) {
        res = await subcategoryApi.updateSubcategory(editingRow.id, formData);
      } else {
        res = await subcategoryApi.createSubcategory(formData);
      }

      // ✅ If backend returns success: false
      if (res?.data?.success === false) {
        setConfirmState({
          open: true,
          type: "error",
          title: "Error",
          message: res?.data?.message || "Something went wrong",
        });
        return;
      }

      fetchSubcategories();
      setOpenModal(false);

      setConfirmState({
        open: true,
        type: "success",
        title: "Success",
        message:
          res?.data?.message ||
          (editingRow ? "Updated successfully" : "Created successfully"),
      });

    } catch (error) {
      setConfirmState({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = (row) => {
    setConfirmState({
      open: true,
      type: "warning",
      title: "Delete Sub Category",
      message: "Are you sure?",
      onConfirm: async () => {
        await subcategoryApi.deleteSubcategory(row.id);
        fetchSubcategories();
      },
    });
  };

  /* ================= UI ================= */

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
        title="Sub Category List"
        columns={columns}
        loading={loading}
        data={data}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        serverSide={true}
        currentPageProp={page}
        totalPagesProp={totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editingRow ? "Update Sub Category" : "Create Sub Category"}
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
          {/* <InputField
            label="Category ID"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
          /> */}
          <Dropdown
            label="Category"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            options={categoryOptions}
            required
          />

          <InputField
            label="Sub Category Name"
            name="subcategory_name"
            value={form.subcategory_name}
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
            label="Sub Category Image"
            name="image"
            files={form.image}
            onChange={handleChange}
            multiple={false}
            maxFiles={1}
          />

          {form.imagePreview && (
            <img
              src={form.imagePreview || "/images/default_img.webp"}
              alt="preview"
              className="w-20 h-20 rounded  border"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/default_img.webp";
              }}

            />
          )}
        </div>
      </Modal>
    </>
  );
}