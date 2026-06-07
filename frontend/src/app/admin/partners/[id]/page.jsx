
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard";
import partnerApi from "@/services/partnerApi";
import Loading from "@/components/ui/loading";

export default function PartnerDetails() {
  const params = useParams();
  const id = params?.id;

  const router = useRouter();

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${path.replace(/\\/g, "/")}`;
  };

  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const logoUrl = getImageUrl(partner?.logo);



  useEffect(() => {
    if (!id) return;
    fetchPartner();
  }, [id]);

  const fetchPartner = async () => {
    try {
      const res = await partnerApi.getPartnerById(id);
      setPartner(res?.data?.data);
      console.log("partner", res.data.data)
    } catch (error) {
      console.error("Error fetching partner:", error);
    } finally {
      setLoading(false);
    }
  };

  const documents = partner
    ? [
      { key: "Business License", value: partner.doc_business_license },
      { key: "Certificate", value: partner.doc_certificate },
      { key: "Insurance", value: partner.doc_insurance },
      { key: "Tax ID", value: partner.doc_tax_id },
      { key: "Corporation Certificate", value: partner.doc_corporation_cert },
      { key: "Government ID", value: partner.doc_gov_id },
    ]
    : [];

  const handleStatusUpdate = async () => {
    try {

      // ❌ validation
      if (confirmAction === "reject" && !rejectReason.trim()) {
        alert("Rejection reason is required");
        return;
      }

      setUpdating(true);

      await partnerApi.updatePartnerStatus(
        partner.id,
        confirmAction,
        confirmAction === "reject" ? { rejectionReason: rejectReason } : {}
      );

      setPartner((prev) => ({
        ...prev,
        approvalStatus:
          confirmAction === "approve" ? "approved" : "rejected",
      }));

      router.push("/admin/partners");

      setConfirmAction(null);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-6"><Loading /></p>;
  if (!partner) return <p className="p-6">Partner not found</p>;

  const InfoItem = ({ label, children }) => (
    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 text-right">{children}</p>
    </div>
  );

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="max-w-6xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {partner.business_name}
            </h1>

            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold
                  ${partner.approval_status === "approved"
                    ? "bg-green-100 text-green-700"
                    : partner.approval_status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
              >
                {partner.approval_status}
              </span>

              {partner.approval_status === "pending" && (
                <>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </>
              )}

              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Back
              </button>
            </div>
          </div>

          {/* GRID SECTION */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* OWNER CARD */}
            <div className="rounded-2xl p-8 shadow-sm bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Owner Information
                </h2>
              </div>

              <div className="space-y-4">
                <InfoItem label="Full Name">
                  {partner?.first_name} {partner?.last_name}
                </InfoItem>

                <InfoItem label="Email">
                  {partner?.email}
                </InfoItem>

                <InfoItem label="Phone">
                  {partner?.phone}
                </InfoItem>

                <InfoItem label="Received Date">
                  {new Date(partner.created_at).toLocaleDateString()}
                </InfoItem>
              </div>
            </div>

            {/* BUSINESS CARD */}
            <div className="rounded-2xl p-8 shadow-sm bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
              {/* <div className="border-l-4 border-indigo-500 pl-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Business Information
                </h2>
              </div> */}
              <div className="border-l-4 border-indigo-500 pl-4 mb-6 flex items-center gap-4">

                {partner?.logo && (
                  <img
                    src={logoUrl || "/images/default_img.webp"}
                    alt="Business Logo"
                    // onClick={() =>
                    //   setPreviewImage(
                    //     `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${partner.logo.replace(/\\/g, "/")} || "https://placehold.net/400x400.png"`
                    //   )
                    // }
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/default_img.webp";
                    }}

                    className="h-20 w-20 object-contain rounded-lg border border-gray-300 bg-white p-1 cursor-pointer"
                  />
                )}

                <h2 className="text-lg font-semibold text-gray-800">
                  Business Information
                </h2>
              </div>

              <div className="space-y-4">

                <InfoItem label="Category">
                  {partner?.category_name}
                </InfoItem>

                <InfoItem label="Sub Category">
                  {partner?.sub_category_name}
                </InfoItem>

                <InfoItem label="Business Address">
                  {partner?.business_address || "-"}
                </InfoItem>

                <InfoItem label="City">
                  {partner?.city || "-"}
                </InfoItem>

                <InfoItem label="State">
                  {partner?.state || "-"}
                </InfoItem>

                <InfoItem label="Experience">
                  {partner.years_of_experience} Years
                </InfoItem>

                <InfoItem label="Service Areas">
                  {JSON.parse(partner.service_areas || "[]").join(", ")}
                </InfoItem>
              </div>
            </div>
          </div>

          {/* ABOUT */}
          <div className="rounded-2xl p-8 shadow-sm bg-gradient-to-br from-gray-50 to-white border border-gray-100">
            <div className="border-l-4 border-gray-400 pl-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                About Business
              </h2>
            </div>

            <p className="text-gray-600 leading-relaxed">
              {partner.about}
            </p>
          </div>

          {/* DOCUMENTS */}
          <div className="rounded-2xl p-8 shadow-sm bg-gradient-to-br from-orange-50 to-white border border-orange-100">
            <div className="border-l-4 border-orange-500 pl-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-800">
                Documents
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {documents.map(({ key, value }) => {
                if (!value) return null;

                const fileUrl = getImageUrl(value);
                const isPDF = value.toLowerCase().includes(".pdf");

                return (
                  <div
                    key={key}
                    className="group rounded-xl bg-white shadow-sm hover:shadow-lg transition duration-300 p-6 text-center border border-gray-100 hover:border-blue-200"
                  >
                    <p className="capitalize text-sm font-medium text-gray-700 mb-4">
                      {key}
                    </p>

                    {isPDF ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        View PDF
                      </a>
                    ) : (
                      <img
                        src={fileUrl || "/images/default_img.webp"}
                        alt={key}
                        onClick={() => setPreviewImage(fileUrl)}
                        className="h-32 mx-auto object-contain rounded-lg cursor-pointer group-hover:scale-105 transition"
                        onError={(e) => { e.target.src = "/images/default_img.webp"; }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* IMAGE PREVIEW MODAL */}
          {previewImage && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-10 right-0 text-white text-2xl"
                >
                  ✕
                </button>

                <img
                  src={previewImage || "/images/default_img.webp"}
                  alt="Preview"
                  className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/default_img.webp";
                  }}

                />
              </div>
            </div>
          )}

          {/* CONFIRMATION MODAL */}
          {/* {confirmAction && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
                <h3 className="text-lg font-semibold mb-3">
                  Confirmation
                </h3>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to{" "}
                  <strong>{confirmAction}</strong> this partner?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleStatusUpdate}
                    className={`px-4 py-2 text-white rounded-lg ${confirmAction === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                      }`}
                  >
                    {updating ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )} */}
          {confirmAction && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">

                {/* Header */}
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {confirmAction === "approve" ? "Approve Partner" : "Reject Partner"}
                </h3>

                <p className="text-gray-600 mb-4">
                  Are you sure you want to{" "}
                  <strong>{confirmAction}</strong> this partner?
                </p>

                {/* 🔥 Show reason input only for reject */}
                {confirmAction === "reject" && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-600">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Enter reason for rejection..."
                      className="w-full mt-2 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setConfirmAction(null);
                      setRejectReason("");
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleStatusUpdate}
                    disabled={
                      updating ||
                      (confirmAction === "reject" && !rejectReason.trim())
                    }
                    className={`px-4 py-2 text-white rounded-lg ${confirmAction === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                      } disabled:opacity-50`}
                  >
                    {updating ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </AdminLayout>
    </AdminGuard>
  );
}