"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Tabs from "@/components/ui/Tabs";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modals";
import { useFetchData } from "@/hooks/useFetchData";
import partnerApi from "@/services/partnerApi";
import AdminGuard from "@/app/admin/AdminGuard";
import Alert from "@/components/ui/Conformation";

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }) => {

  const statusStyles = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
    Active: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
};

const ActiveBadge = ({ isActive }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${isActive
        ? "bg-green-100 text-green-700"
        : "bg-gray-200 text-gray-700"
        }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

export default function Pathners() {

  const imagebaseurl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

  const router = useRouter();
  /* ================= STATE ================= */
  const { data, loading } = useFetchData(partnerApi.getProfile, []);
  const [partners, setPartners] = useState([]);
  const [viewPartner, setViewPartner] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
  });
  /* ================= TABLE COLUMNS ================= */

  const columns = [
    { key: "name", label: "Partner Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "serviceCategory", label: "Service Category" },
    { key: "services", label: "Services" },
    {
      key: "createdAt",
      label: "Created Date",
      isDate: true,
      render: (value) =>
        new Date(value).toLocaleDateString('en-GB'),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "isActive",
      label: "Active Status",
      render: (value) => <ActiveBadge isActive={value} />,
    },
  ];

  /* ================= FILTER FUNCTION ================= */

  const getFilteredPartners = (status) =>
    partners.filter((partner) => partner.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  /* ================= TABS ================= */
  const [actionLoading, setActionLoading] = useState(null);

  const pendingCount = getFilteredPartners("Pending").length;
  const approvedCount = getFilteredPartners("Approved").length;
  const rejectedCount = getFilteredPartners("Rejected").length;
  const [previewImage, setPreviewImage] = useState(null);

  const tabs = [
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Approved</span>
          <span className="min-w-[24px] h-6 px-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
            {approvedCount}
          </span>
        </div>
      ),
      content: (
        <DataTable
          title="Approved Partners"
          loading={loading}
          columns={columns}
          data={getFilteredPartners("Approved")}
          onView={(row) => setViewPartner(row)}
        />
      ),
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Pending</span>
          <span className="min-w-[24px] h-6 px-2 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold flex items-center justify-center">
            {pendingCount}
          </span>
        </div>
      ),
      content: (
        <div className="w-full overflow-x-auto">
          <DataTable
            loading={loading}
            title="Pending Partners"
            columns={columns}
            data={getFilteredPartners("Pending")}
            onView={(row) => router.push(`/admin/partners/${row.id}`)}
          />
        </div>
      ),
    },

    // {
    //   label: (
    //     <div className="flex items-center gap-2">
    //       <span>Rejected</span>
    //       <span className="min-w-[24px] h-6 px-2 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center">
    //         {rejectedCount}
    //       </span>
    //     </div>
    //   ),
    //   content: (
    //     <DataTable
    //       title="Rejected Partners"
    //       columns={columns}
    //       data={getFilteredPartners("Rejected")}
    //       onView={(row) => setViewPartner(row)}
    //     />
    //   ),
    // },
  ];
  /* ================= UI ================= */
  useEffect(() => {
    if (!data || !Array.isArray(data)) return;

    const formattedPartners = data.map((item) => ({
      id: item.id,

      name: `${item.first_name || ""} ${item.last_name || ""}`,

      email: item.email,
      phone: item.phone,

      serviceCategory: item.category_name,
      services: item.sub_category_name,

      status:
        item.approval_status?.charAt(0).toUpperCase() +
        item.approval_status?.slice(1),

      isActive: item.is_active === 1,

      createdAt: item.created_at,

      raw: item,
    }));

    setPartners(formattedPartners);
  }, [data]);

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${imagebaseurl}/${String(path).replace(/\\/g, "/")}`;
  };

  console.log("viewPartner", viewPartner)
  return (
    <>
      <AdminGuard>
        <AdminLayout>
          <div className="max-full w-full mx-auto">
            <div className="w-full overflow-x-auto">
              <Tabs tabs={tabs} />
            </div>
          </div>


          {/* ================= VIEW MODAL ================= */}

          <Modal
            open={!!viewPartner}
            onClose={() => setViewPartner(null)}
            title="Partner Details"
            width="w-full max-w-6xl"
            footer={
              <div className="flex justify-between items-center w-full">
                {/* LEFT SIDE ACTIONS */}
                <div className="flex gap-2">
                  {/* PENDING → Show Accept / Reject */}
                  {viewPartner?.status === "Pending" && (
                    <>
                      <button
                        disabled={actionLoading !== null}
                        onClick={async () => {
                          try {
                            setActionLoading("approve");

                            await partnerApi.updatePartnerStatus(
                              viewPartner.id,
                              "approve"
                            );

                            setPartners((prev) =>
                              prev.map((p) =>
                                p.id === viewPartner.id
                                  ? { ...p, status: "Approved" }
                                  : p
                              )
                            );

                            setViewPartner((prev) => ({
                              ...prev,
                              status: "Approved",
                            }));

                            // ✅ Success Alert
                            setAlertConfig({
                              open: true,
                              type: "success",
                              title: "Success",
                              message: `Partner approved successfully`,
                            });

                          } catch (error) {
                            console.error("Error approving partner:", error);
                            setAlertConfig({
                              open: true,
                              type: "error",
                              title: "Error",
                              message: `Failed to approve partner`,
                            });
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      >
                        {actionLoading === "approve" ? "Accepting..." : "Accept"}
                      </button>

                      <button
                        disabled={actionLoading !== null}
                        onClick={async () => {
                          try {
                            setActionLoading("reject");

                            await partnerApi.updatePartnerStatus(
                              viewPartner.id,
                              "reject"
                            );

                            setPartners((prev) =>
                              prev.map((p) =>
                                p.id === viewPartner.id
                                  ? { ...p, status: "Rejected" }
                                  : p
                              )
                            );

                            setViewPartner((prev) => ({
                              ...prev,
                              status: "Rejected",
                            }));

                            // ✅ Success Alert
                            setAlertConfig({
                              open: true,
                              type: "success",
                              title: "Success",
                              message: `Partner rejected successfully`,
                            });

                          } catch (error) {
                            console.error("Error rejecting partner:", error);
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                      </button>
                    </>
                  )}

                  {/* ACTIVE → Show Deactivate */}
                  {/* {viewPartner?.status === "Active" && (
                    <button
                      onClick={() => {
                        setPartners((prev) =>
                          prev.map((p) =>
                            p.id === viewPartner.id
                              ? { ...p, status: "Approved" }
                              : p,
                          ),
                        );
                        setViewPartner({ ...viewPartner, status: "Approved" });
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
                    >
                      Deactivate
                    </button>
                  )} */}
                  {viewPartner?.status === "Approved" && (
                    <button
                      disabled={actionLoading !== null}
                      onClick={async () => {
                        try {
                          setActionLoading("toggle-active");

                          const nextActive = !viewPartner.isActive;

                          await partnerApi.togglePartnerActive(viewPartner.id, nextActive);

                          setPartners((prev) =>
                            prev.map((p) =>
                              p.id === viewPartner.id
                                ? { ...p, isActive: nextActive }
                                : p
                            )
                          );

                          setViewPartner((prev) => ({
                            ...prev,
                            isActive: nextActive,
                          }));

                          setAlertConfig({
                            open: true,
                            type: "success",
                            title: "Success",
                            message: `Partner ${nextActive ? "activated" : "deactivated"} successfully`,
                          });
                        } catch (error) {
                          console.error("Error toggling partner active status:", error);
                          setAlertConfig({
                            open: true,
                            type: "error",
                            title: "Error",
                            message: "Failed to update active status",
                          });
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                      className={`px-4 py-2 text-white rounded-lg text-sm ${viewPartner.isActive
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {actionLoading === "toggle-active"
                        ? "Updating..."
                        : viewPartner.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  )}
                </div>

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => setViewPartner(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            }
          >

            <Alert
              open={alertConfig.open}
              type={alertConfig.type}
              title={alertConfig.title}
              message={alertConfig.message}
              onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
              onConfirm={alertConfig.onConfirm}
            />
            {viewPartner && (
              <div className="space-y-6">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-gray-300">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {viewPartner.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Registered on {new Date(viewPartner.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <StatusBadge status={viewPartner.status} />
                    <ActiveBadge isActive={viewPartner.isActive} />
                  </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
                    <h4 className="text-2xl font-bold text-blue-700">
                      {viewPartner.raw.totalBookings || 0}
                    </h4>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Completed Bookings</p>
                    <h4 className="text-2xl font-bold text-green-700">
                      {viewPartner.raw.completedBookings || 0}
                    </h4>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Reviews</p>
                    <h4 className="text-2xl font-bold text-yellow-700">
                      {viewPartner.raw.totalReviews || 0}
                    </h4>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                    <h4 className="text-2xl font-bold text-purple-700">
                      ${viewPartner.raw.totalRevenue || 0}
                    </h4>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-6 border border-gray-300">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">
                      Basic Information
                    </h4>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Full Name</span>
                        <span className="col-span-2">{viewPartner.name || "-"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Email</span>
                        <span className="col-span-2 break-all">{viewPartner.email || "-"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Phone</span>
                        <span className="col-span-2">{viewPartner.phone || "-"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Business Name</span>
                        <span className="col-span-2">{viewPartner.raw.business_name || "-"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Category</span>
                        <span className="col-span-2">
                          {viewPartner.raw.category_name || "-"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Sub Category</span>
                        <span className="col-span-2">
                          {viewPartner.raw?.sub_category_name || "-"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Experience</span>
                        <span className="col-span-2">
                          {viewPartner.raw.years_of_experience || 0} Years
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Service Areas</span>
                        <span className="col-span-2">
                          {(() => {
                            try {
                              const areas = JSON.parse(viewPartner.raw.service_areas || "[]");
                              return areas.length ? areas.join(", ") : "-";
                            } catch {
                              return "-";
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 border border-gray-300">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">
                      Status & Description
                    </h4>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Approval Status</span>
                        <span className="col-span-2">{viewPartner.status || "-"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Active</span>
                        <span className="col-span-2">
                          {viewPartner.isActive ? "Yes" : "No"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Created Date</span>
                        <span className="col-span-2">
                          {new Date(viewPartner.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <span className="font-medium text-gray-500">Updated Date</span>
                        <span className="col-span-2">
                          {viewPartner.raw.updatedAt
                            ? new Date(viewPartner.raw.updatedAt).toLocaleString('en-GB')
                            : "-"}
                        </span>
                      </div>

                      {viewPartner.raw.rejectionReason && (
                        <div className="grid grid-cols-3 gap-3">
                          <span className="font-medium text-gray-500">Rejection Reason</span>
                          <span className="col-span-2 text-red-600">
                            {viewPartner.raw.rejectionReason}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-500 mb-2">About</p>
                        <div className="rounded-lg border border-gray-300 bg-white p-3 text-gray-700 min-h-[100px]">
                          {viewPartner.raw.about || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DOCUMENTS */}
                {/* <div className="bg-slate-50 rounded-xl p-6 border border-gray-300">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">
                    Uploaded Documents
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {viewPartner.raw.doc_business_license && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Business License
                        </p>
                        <img
                          src={getImageUrl(viewPartner.raw.doc_business_license)}
                          className="h-40 w-full object-cover rounded-lg cursor-pointer border"
                          onClick={() =>
                            setPreviewImage(viewPartner.raw.doc_business_license)
                          }
                          onError={(e) => { e.target.src = "/images/default_img.webp"; }}
                        />
                      </div>
                    )}

                    {viewPartner.raw.doc_certificate && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Certificate
                        </p>
                        <img
                          src={getImageUrl(viewPartner.raw.doc_certificate)}
                          className="h-40 w-full object-cover rounded-lg cursor-pointer border"
                          onClick={() =>
                            setPreviewImage(viewPartner.raw.doc_certificate)
                          }
                          onError={(e) => { e.target.src = "/images/default_img.webp"; }}
                        />
                      </div>
                    )}

                    {viewPartner.raw.doc_insurance && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Insurance
                        </p>
                        <img
                          src={getImageUrl(viewPartner.raw.doc_insurance)}
                          className="h-40 w-full object-cover rounded-lg cursor-pointer border"
                          onClick={() =>
                            setPreviewImage(viewPartner.raw.doc_insurance)
                          }
                          onError={(e) => { e.target.src = "/images/default_img.webp"; }}
                        />
                      </div>
                    )}

                  </div>
                </div> */}
                <div className="bg-slate-50 rounded-xl p-6 border border-gray-300">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">
                    Uploaded Documents
                  </h4>

                  <div className="flex flex-wrap gap-3">

                    {viewPartner.raw.doc_business_license && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_business_license)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Business License
                      </a>
                    )}

                    {viewPartner.raw.doc_certificate && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_certificate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Certificate
                      </a>
                    )}

                    {viewPartner.raw.doc_insurance && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_insurance)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Insurance
                      </a>
                    )}

                    {viewPartner.raw.doc_tax_id && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_tax_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Tax ID
                      </a>
                    )}

                    {viewPartner.raw.doc_corporation_cert && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_corporation_cert)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Corporation Certificate
                      </a>
                    )}

                    {viewPartner.raw.doc_gov_id && (
                      <a
                        href={getImageUrl(viewPartner.raw.doc_gov_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Government ID
                      </a>
                    )}

                  </div>
                </div>

                {/* LOGO */}
                {viewPartner.raw.logo && (
                  <div className="bg-slate-50 rounded-xl p-6 border">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">
                      Business Logo
                    </h4>

                    <img
                      src={getImageUrl(viewPartner.raw.logo)}
                      alt="Business Logo"
                      className="h-32 w-32 object-cover rounded-lg border cursor-pointer"
                      onClick={() => setPreviewImage(viewPartner.raw.logo)}
                      onError={(e) => { e.target.src = "/images/default_img.webp"; }}

                    />
                  </div>
                )}
              </div>
            )}

            {previewImage && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="relative max-w-3xl w-full p-4">

                  {/* Close Button */}
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
                  >
                    ✕
                  </button>

                  <img
                    src={getImageUrl(previewImage)}
                    alt="Preview"
                    className="w-full max-h-[80vh] object-contain rounded-lg"
                    onError={(e) => { e.target.src = "/images/default_img.webp"; }}

                  />
                </div>
              </div>
            )}

          </Modal>
        </AdminLayout>
      </AdminGuard>

    </>
  );
}
