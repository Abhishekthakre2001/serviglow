"use client";

import {
  Briefcase,
  Mail,
  Phone,
  BadgeCheck,
  Clock3,
  MapPin,
  FileText,
  Edit3,
  ShieldCheck,
  Layers3,
  Wrench,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import InputField from "@/components/ui/InputField";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";
import Conformation from "@/components/ui/Conformation";
import Modal from "@/components/ui/Modals";
import profileApi from "@/services/profileApi";
import { useAuth } from "@/hooks/useAuth";

export default function PartnerProfilePage() {
  const { getPartnerProfile, updatePartnerProfile } = profileApi;
  const { sendOtp, verifyOtp } = useAuth();

  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [openModal, setOpenModal] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(true);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const [errors, setErrors] = useState({});

  const [docViewer, setDocViewer] = useState({
    open: false,
    url: "",
    title: "",
  });

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    business_name: "",
    experience: "",
    about: "",
    zip_codes: "",
    business_license: null,
    certificate: null,
    insurance: null,
    tax_id: null,
    corporation_cert: null,
    gov_id: null,
    isAvailable: false,
    business_address: "",
    city: "",
    state: "",
    country: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getPartnerProfile();
      const data = res?.data?.data;
      console.log("RESSSSS", data)
      setProfile(data);
      setOriginalProfile(data);

      setForm({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        email: data?.email || "",
        phone: data?.phone || "",
        business_name: data?.business_name || "",
        experience: data?.years_of_experience || "",
        about: data?.about || "",
        zip_codes: data?.service_areas?.join(", ") || "",
        isAvailable: data?.is_available,

        // ✅ ADD THESE
        business_address: data?.business_address || "",
        city: data?.city || "",
        state: data?.state || "",
        country: data?.country || "",

        business_license: null,
        certificate: null,
        insurance: null,
      });

      setOtp("");
      setOtpSent(false);
      setOtpVerified(true);
    } catch {
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "";
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    return `${baseUrl.replace(/\/$/, "")}/${path.replace(/\\/g, "/")}`;
  };
  console.log("GETFILEURL", docViewer)
  const isFormChanged = () => {
    if (!originalProfile) return false;

    return (
      form.first_name !== (originalProfile.userId?.firstName || "") ||
      form.last_name !== (originalProfile.userId?.lastName || "") ||
      form.email !== (originalProfile.userId?.email || "") ||
      form.isAvailable !== (originalProfile.isAvailable || "") ||
      form.phone !== (originalProfile.userId?.phone || "") ||
      form.business_name !== (originalProfile.businessName || "") ||
      String(form.experience) !==
      String(originalProfile.yearsOfExperience || "") ||
      form.about !== (originalProfile.about || "") ||
      form.zip_codes !== (originalProfile.serviceAreas?.join(", ") || "") ||
      !!form.business_license ||
      !!form.certificate ||
      !!form.insurance ||
      form.business_address !== (originalProfile.business_address || "") ||
      form.city !== (originalProfile.city || "") ||
      form.state !== (originalProfile.state || "") ||
      form.country !== (originalProfile.country || "")
    );
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "email" && value !== profile?.userId?.email) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");
    }

    // if (name === "zip_codes") {
    //   let valueOnlyNumbers = value.replace(/\D/g, ""); // allow only digits

    //   // split every 6 digits
    //   const chunks = valueOnlyNumbers.match(/.{1,6}/g) || [];

    //   // join with comma
    //   const formatted = chunks.join(", ");

    //   setForm((prev) => ({
    //     ...prev,
    //     zip_codes: formatted,
    //   }));

    //   return;
    // }
    if (name === "zip_codes") {
      setForm((prev) => ({
        ...prev,
        zip_codes: value,
      }));
      return;
    }

    if (name === "email" && value === profile?.userId?.email) {
      setOtpVerified(true);
      setOtpSent(false);
      setOtp("");
    }

    // ✅ DOCUMENT VALIDATION (added only this block)
    if (files && files[0]) {
      const file = files[0];

      const isValidType =
        file.type === "application/pdf" || file.type.startsWith("image/");

      if (!isValidType) {
        setConfirmation({
          open: true,
          type: "error",
          message: "Only PDF and image files are allowed",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setConfirmation({
          open: true,
          type: "error",
          message: "File size must be less than 2MB",
        });
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCloseModal = () => {
    if (profile) {
      setForm({
        first_name: profile?.userId?.firstName || "",
        last_name: profile?.userId?.lastName || "",
        email: profile?.userId?.email || "",
        phone: profile?.userId?.phone || "",
        business_name: profile?.businessName || "",
        experience: profile?.yearsOfExperience || "",
        about: profile?.about || "",
        zip_codes: profile?.serviceAreas?.join(", ") || "",
        business_license: null,
        certificate: null,
        insurance: null,
      });
    }

    setOtp("");
    setOtpSent(false);
    setOtpVerified(true);
    setOpenModal(false);
  };

  const handleSendOtp = async () => {
    try {
      if (!form.email?.trim()) {
        return setConfirmation({
          open: true,
          type: "warning",
          message: "Please enter email first",
        });
      }

      setLoadingOtp(true);
      const res = await sendOtp({ email: form.email, type: "update" });

      setOtpSent(true);

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "OTP sent",
      });
    } catch (err) {
      setConfirmation({
        open: true,
        type: "error",
        message: err?.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!otp.trim()) {
        return setConfirmation({
          open: true,
          type: "warning",
          message: "Please enter OTP",
        });
      }

      setLoadingOtp(true);
      const res = await verifyOtp({ email: form.email, otp });

      setOtpVerified(true);

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "Verified",
      });
    } catch (err) {
      setConfirmation({
        open: true,
        type: "error",
        message: err?.response?.data?.message || "Invalid OTP",
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleUpdate = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);



    // ✅ Stop if errors exist
    if (Object.keys(validationErrors).length > 0) {
      return setConfirmation({
        open: true,
        type: "error",
        message: Object.values(validationErrors)[0],
      });
    }

    try {
      if (!isFormChanged()) {
        return setConfirmation({
          open: true,
          type: "warning",
          message: "No changes detected",
        });
      }

      if (form.email !== profile?.userId?.email && !otpVerified) {
        return setConfirmation({
          open: true,
          type: "error",
          message: "Verify email first",
        });
      }

      setUpdating(true);

      const formData = new FormData();
      formData.append("firstName", form.first_name);
      formData.append("lastName", form.last_name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("businessName", form.business_name);
      formData.append("yearsOfExperience", form.experience);
      formData.append("about", form.about);
      formData.append("isAvailable", form.isAvailable);
      formData.append("businessAddress", form.business_address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("country", form.country);

      formData.append(
        "serviceAreas",
        JSON.stringify(
          form.zip_codes
            .split(",")
            .map((z) => z.trim())
            .filter(Boolean)
        )
      );

      if (form.business_license) {
        formData.append("businessLicense", form.business_license);
      }
      if (form.certificate) {
        formData.append("certificate", form.certificate);
      }
      if (form.insurance) {
        formData.append("insurance", form.insurance);
      }
      if (form.tax_id) {
        formData.append("taxid", form.tax_id);
      }

      if (form.corporation_cert) {
        formData.append("corporationcert", form.corporation_cert);
      }

      if (form.gov_id) {
        formData.append("govId", form.gov_id);
      }

      const res = await updatePartnerProfile(formData);

      await fetchProfile();

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "Profile updated",
      });

      setOpenModal(false);
    } catch (err) {
      setConfirmation({
        open: true,
        type: "error",
        message:
          err?.response?.data?.message || err?.message || "Update failed",
      });
    } finally {
      setUpdating(false);
    }
  };

  const parseServiceAreas = (areas) => {
    try {
      let parsed = areas;

      while (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      return Array.isArray(parsed) ? parsed.flat(Infinity) : [];
    } catch {
      return [];
    }
  };



  const validateForm = () => {
    const newErrors = {};

    if (!/^[A-Za-z\s]{2,}$/.test(form.first_name)) {
      newErrors.first_name = "Only alphabets (min 2)";
    }

    if (!/^[A-Za-z\s]{2,}$/.test(form.last_name)) {
      newErrors.last_name = "Only alphabets (min 2)";
    }

    // if (!/^\d{10}$/.test(form.phone)) {
    //   newErrors.phone = "Phone must be 10 digits";
    // }

    if (!/^[A-Za-z0-9\s&.,'-]{2,}$/.test(form.business_name)) {
      newErrors.business_name = "Invalid business name";
    }

    const exp = Number(form.experience);
    if (!exp || exp < 1 || exp > 99) {
      newErrors.experience = "1–99 only";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email";
    }

    if (!form.zip_codes.trim()) {
      newErrors.zip_codes = "Service area required";
    }

    return newErrors;
  };

  const formError = validateForm();



  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleCloseModal}
        className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <button
        onClick={handleUpdate}
        // disabled={!isFormChanged() || updating || formError}
        className={`px-6 py-2 rounded-lg text-white transition ${!isFormChanged() || updating
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {updating ? "Updating..." : "Update"}
      </button>
    </div>
  );

  const renderFile = (path) => {
    if (!path) return null;

    const url = getFileUrl(path);
    const isPdf = path.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      return (
        <div
          onClick={() => window.open(url, "_blank")}
          className="w-full h-48 flex flex-col items-center justify-center  rounded-xl shadow cursor-pointer hover:bg-gray-50"
        >
          <FileText className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-sm font-medium">View PDF</p>
        </div>
      );
    }

    return (
      <img
        src={url || "/images/default_img.webp"}
        className="w-full h-48 object-contain rounded-xl"
        alt="Document"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/images/default_img.webp";
        }}

      />
    );
  };

  return (
    <PartnerGuard>
      <AdminLayout>
        <Conformation
          open={confirmation.open}
          type={confirmation.type}
          message={confirmation.message}
          onClose={() => setConfirmation((prev) => ({ ...prev, open: false }))}
        />

        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">Partner Profile</h1>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.08)]">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-600 via-sky-500 to-orange-500" />
            <div className="absolute -top-8 right-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute top-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative p-6 md:p-8">
              {loading ? (
                <p className="text-sm text-gray-500">Loading profile...</p>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg">
                        <Briefcase className="h-9 w-9 text-blue-600" />
                      </div>

                      <div className="pt-8 md:pt-4">
                        <h2 className="text-2xl font-bold text-white">
                          {profile?.first_name || "-"}{" "}
                          {profile?.last_name || ""}
                        </h2>
                        <p className="mt-1 text-sm text-slate-300">
                          {profile?.business_name || "Business profile"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            {profile?.approval_status || "pending"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${profile?.is_active
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                              }`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {profile?.is_active ? "Active" : "Inactive"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${profile?.is_available
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                          >
                            {profile?.is_available ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {profile?.is_available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:pt-4">
                      <button
                        onClick={() => setOpenModal(true)}
                        className="border-2 border-white inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                      >
                        <Edit3 className="h-4 w-4" />
                        Update Profile
                      </button>
                    </div>
                  </div>

                  {/* Top info cards */}
                  <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Mail className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {profile?.email || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Phone className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Phone
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {profile?.phone || "-"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Experience
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {profile?.years_of_experience || 0} years
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Business Address
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-900">
                        {profile?.business_address || "-"}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {profile?.city} {profile?.state}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Service Areas
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {profile?.service_areas?.length || 0} locations
                      </p>
                    </div>
                  </div>

                  {/* Business details + service area */}
                  <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Business Details
                          </h3>
                          <p className="text-sm text-slate-500">
                            Partner and service information
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <Layers3 className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Business Name
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {profile?.business_name || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <BadgeCheck className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Status
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {profile?.approval_status || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <Layers3 className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Category
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {profile?.category_name || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-slate-500">
                            <Wrench className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Sub Category
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">
                            {profile?.sub_category_name || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Service Coverage
                          </h3>
                          <p className="text-sm text-slate-500">
                            Areas where you provide service
                          </p>
                        </div>
                      </div>

                      {profile?.service_areas?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.service_areas.map((area, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                          <MapPin className="mx-auto mb-2 h-7 w-7 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">
                            No service areas added
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About */}
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          About Business
                        </h3>
                        <p className="text-sm text-slate-500">
                          Short description about your services
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm leading-7 text-slate-700">
                        {profile?.about || "No business description added yet."}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Uploaded Documents
                        </h3>
                        <p className="text-sm text-slate-500">
                          View your submitted verification files
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {profile?.doc_business_license && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Business License
                          </p>
                          {renderFile(profile.doc_business_license)}
                        </div>
                      )}

                      {profile?.doc_certificate && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Certificate
                          </p>
                          {renderFile(profile.doc_certificate)}
                        </div>
                      )}

                      {profile?.doc_insurance && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Insurance
                          </p>
                          {renderFile(profile.doc_insurance)}
                        </div>
                      )}

                      {profile?.doc_tax_id && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Tax ID
                          </p>
                          {renderFile(profile.doc_tax_id)}
                        </div>
                      )}

                      {profile?.doc_corporation_cert && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Corporation Certificate
                          </p>
                          {renderFile(profile.doc_corporation_cert)}
                        </div>
                      )}

                      {profile?.doc_gov_id && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Government ID
                          </p>
                          {renderFile(profile.doc_gov_id)}
                        </div>
                      )}

                    </div>

                    {!profile?.doc_business_license &&
                      !profile?.doc_certificate &&
                      !profile?.doc_insurance && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center w-full mt-3">
                          <FileText className="mx-auto mb-2 h-7 w-7 text-slate-400" />
                          <p className="text-sm text-slate-600">
                            No documents uploaded
                          </p>
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Modal
          open={openModal}
          onClose={handleCloseModal}
          title="Update Profile"
          width="max-w-4xl"
          footer={modalFooter}
        >
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                name="first_name"
                label="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                error={errors.first_name}
              />
              <InputField
                name="last_name"
                label="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                error={errors.last_name}
              />
              <InputField
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={handleChange}
                required
                pattern={
                  /^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/
                }
                error={errors.phone}
              />
              <InputField
                name="business_name"
                label="Business Name"
                value={form.business_name}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z0-9\s&.,'-]+$/}
                error={errors.business_name}
              />

              <InputField
                name="business_address"
                label="Business Address"
                value={form.business_address}
                onChange={handleChange}
                error={errors.business_address}
              />

              <InputField
                name="city"
                label="City"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
              />

              <InputField
                name="state"
                label="State"
                value={form.state}
                onChange={handleChange}
                error={errors.state}
              />

              <InputField
                name="experience"
                label="Experience"
                value={form.experience}
                onChange={handleChange}
                required
                min={1}
                max={99}
                validator={(val) => {
                  if (!val) return "Experience is required";
                  if (val < 1 || val > 99) return "Value must be between 1 and 99";
                  return "";
                }}
                error={errors.experience}
              />
              <InputField
                name="zip_codes"
                label="Service Areas"
                value={form.zip_codes}
                onChange={handleChange}
                required
                error={errors.zip_codes}
              />
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                {/* Label */}
                <label className="text-sm font-medium text-gray-700">
                  Partner Available for Service
                </label>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    handleChange({
                      target: {
                        name: "isAvailable",
                        value: !form.isAvailable,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.isAvailable ? "bg-green-500" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${form.isAvailable ? "translate-x-5" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <InputField
                    name="email"
                    label="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                    error={errors.email}
                  />
                </div>

                {form.email !== profile?.userId?.email && !otpSent && (
                  <button
                    onClick={handleSendOtp}
                    disabled={loadingOtp}
                    className={`px-4 py-2 rounded-lg text-white transition ${loadingOtp
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    {loadingOtp ? "Sending..." : "Send OTP"}
                  </button>
                )}
              </div>

              {otpSent && !otpVerified && (
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <div className="flex-1">
                    <InputField
                      label="OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loadingOtp}
                    className={`mt-0 sm:mt-7 px-4 py-2 rounded-lg text-white transition ${loadingOtp
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                      }`}
                  >
                    {loadingOtp ? "Verifying..." : "Verify"}
                  </button>
                </div>
              )}

              {otpVerified &&
                otpSent &&
                form.email !== profile?.userId?.email && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Email verified successfully
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About
              </label>
              <textarea
                name="about"
                value={form.about}
                onChange={handleChange}
                rows={4}
                placeholder="About your business..."
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                "business_license",
                "certificate",
                "insurance",
                "tax_id",
                "corporation_cert",
                "gov_id",
              ].map((field) => (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field.replace(/_/g, " ")}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    name={field}
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {form[field] && (
                    <p className="text-xs text-gray-500 break-all">
                      {form[field].name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>

        <Modal
          open={docViewer.open}
          onClose={() => setDocViewer({ open: false, url: "", title: "" })}
          title={docViewer.title}
          width="max-w-4xl"
        >
          <div className="flex justify-center">
            <img
              src={docViewer.url || "/images/default_img.webp"}
              alt={docViewer.title || "Document"}
              className="max-h-[70vh] w-auto rounded-lg shadow"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/default_img.webp";
              }}

            />
          </div>
        </Modal>
      </AdminLayout>
    </PartnerGuard>
  );
}
