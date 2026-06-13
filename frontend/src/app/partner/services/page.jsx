"use client";

import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";
import React, { useEffect, useState } from "react";
import serviceApi from "../../../services/serviceApi";
import Conformatiom from "@/components/ui/Conformation";
import useServerPagination from "@/hooks/useServerPagination";
import ExportApi from "@/services/exportApi";
/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${status === "Active"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
        }`}
    >
      {status}
    </span>
  );
};

export default function Servicess() {
  const router = useRouter();
  /* ================= DUMMY DATA ================= */
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "",
    message: "",
    onConfirm: null,
  });

  const {
    data: paginatedServices,
    loading: paginationLoading,
    page,
    totalPages,
    setPage,
  } = useServerPagination(
    (page, limit) => serviceApi.getPartnerServices(page, limit),
    {
      formatData: (raw) => raw || [],
    },
  );

  useEffect(() => {
    if (paginatedServices) {
      setServices(paginatedServices);
      setLoading(false); // stop old loader
    }
  }, [paginatedServices]);
  /* ================= TABLE COLUMNS ================= */

  /* ================= TABLE COLUMNS ================= */

  const PLACEHOLDER_IMG =
    "https://t4.ftcdn.net/jpg/05/97/47/95/360_F_597479556_7bbQ7t4Z8k3xbAloHFHVdZIizWK1PdOo.jpg"; // put any placeholder in /public/images/

  const columns = [
    {
      key: "images",
      label: "Image",
      render: (value, row) => {
        const img =
          (Array.isArray(row?.images) &&
            row.images.length > 0 &&
            row.images[0]) ||
          row?.image || // in case backend sends single image field
          PLACEHOLDER_IMG;

        // if backend returns relative path like "/uploads/xxx.png", it will work if same domain
        return (
          <div className="w-12 h-12 rounded overflow-hidden">
            <img
              src={img || "/images/default_img.webp"}
              alt={row?.title || "service"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER_IMG;
              }}
            />
          </div>
        );
      },
    },
    { key: "title", label: "Service Title" },
    { key: "subtitle", label: "Subtitle", render: (v) => v || "-" },
    {
      key: "category",
      label: "Category",
      render: (value) => value?.category_name || "-",
    },
    {
      key: "subCategory",
      label: "Sub-category",
      render: (value) => value?.sub_category_name || "-",
    },
    {
      key: "is_active",
      label: "Status",
      render: (value, row) => {
        return (
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${value
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
                }`}
            >
              {value ? "Active" : "Inactive"}
            </span>

            {/* Toggle Button */}
            <button
              onClick={() => handleToggleStatus(row)}
              disabled={loadingId === row.id}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${row.is_active ? "bg-green-500" : "bg-gray-300"
                } ${loadingId === row.id ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${row.is_active ? "translate-x-5" : "translate-x-1"
                  }`}
              />

              {/* 🔥 Optional Loader */}
              {loadingId === row.id && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white">
                  ...
                </span>
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: "price",
      label: "Price ($)",
      render: (value) => ((value ?? value === 0) ? `$ ${value}` : "-"),
    },
    // {
    //     key: "estimatedTime",
    //     label: "Estimate Time",
    //     render: (v) => v || "-",
    // },
    {
      key: "avg_rating",
      label: "Rating",
      render: (value) => value,
    },
    {
      key: "created_at",
      label: "Created At",
      render: (value) => (value ? new Date(value).toLocaleString('en-GB') : "-"),
    },
  ];
  /* ================= NAVIGATION ================= */

  const handleCreate = () => {
    router.push("/partner/services/manageservices");
  };

  const handleEdit = (row) => {
    // router.push(`/partner/services/manageservices?id=${row._id}`);
    router.push(`/partner/services/manageservices/${row.id}`);
  };

  const handleDelete = (row) => {
    setConfirmation({
      open: true,
      type: "warning",
      message: "Are you sure you want to delete this service?",
      onConfirm: async () => {
        try {
          await serviceApi.deleteService(row.id);

          setServices((prev) =>
            prev.filter((service) => service.id !== row.id),
          );

          setConfirmation({
            open: true,
            type: "success",
            message: "Service deleted successfully!",
          });
        } catch (error) {
          setConfirmation({
            open: true,
            type: "error",
            message: "Failed to delete service",
          });
        }
      },
    });
  };

  const handleToggleStatus = (row) => {
    setConfirmation({
      open: true,
      type: "warning",
      message: `Are you sure you want to ${row.is_active ? "deactivate" : "activate"
        } this service?`,

      onConfirm: async () => {
        try {
          setLoadingId(row.id);

          const res = await serviceApi.toggleServiceStatus(row.id);

          console.log("test", res?.data?.data?.is_active)

          // ✅ Update UI instantly
          setServices((prev) =>
            prev.map((service) =>
              service.id === row.id
                ? { ...service, is_active: res?.data?.data?.is_active }
                : service,
            ),
          );

          setConfirmation({
            open: true,
            type: "success",
            message: res.data.message || "Status updated successfully",
          });
        } catch (error) {
          setConfirmation({
            open: true,
            type: "error",
            message:
              error?.response?.data?.message || "Failed to update status",
          });
        } finally {
          setLoadingId(null);
        }
      },
    });
  };
  const handleExport = async () => {
    try {
      const response =
        await ExportApi.exportServices();

      const blob = new Blob([
        response.data,
      ]);

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "services.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Service export failed",
        error
      );
    }
  };
  /* ================= UI ================= */

  return (
    <>
      <PartnerGuard>
        <AdminLayout>
          <div className="">
            <DataTable
              title="Services List"
              columns={columns}
              data={services}
              loading={loading || paginationLoading}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onExport={handleExport}
            />
          </div>
        </AdminLayout>
      </PartnerGuard>

      <Conformatiom
        open={confirmation.open}
        type={confirmation.type}
        message={confirmation.message}
        onClose={() => setConfirmation({ open: false, type: "", message: "" })}
        onConfirm={() => {
          if (confirmation.onConfirm) {
            confirmation.onConfirm();
          }
          setConfirmation({ open: false, type: "", message: "" });
        }}
      />
    </>
  );
}
