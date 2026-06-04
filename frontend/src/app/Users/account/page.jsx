"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Home,
  MapPinned,
  Landmark,
  Hash,
} from "lucide-react";
import { useEffect, useState } from "react";
import InputField from "@/components/ui/InputField";
import AdminLayout from "@/components/layout/AdminLayout";
import UserGuard from "@/app/Users/UserGuard.jsx";
import Conformation from "@/components/ui/Conformation";
import Modal from "@/components/ui/Modals";
import { useAuth } from "@/hooks/useAuth";
import profileApi from "@/services/profileApi";

export default function ProfilePage() {
  const { sendOtp, verifyOtp } = useAuth();
  const { getProfile, updateProfile } = profileApi;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(true);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    contact: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      const data = res?.data?.data;

      setProfile(data);
      setOriginalProfile(data);
    } catch (err) {
      setConfirmation({
        open: true,
        type: "error",
        message: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormChanged = () => {
    if (!originalProfile) return false;

    return (
      form.first_name !== (originalProfile.firstName || "") ||
      form.last_name !== (originalProfile.lastName || "") ||
      form.contact !== (originalProfile.phone || "") ||
      form.email !== (originalProfile.email || "") ||
      form.address1 !== (originalProfile.address?.line1 || "") ||
      form.address2 !== (originalProfile.address?.line2 || "") ||
      form.city !== (originalProfile.address?.city || "") ||
      form.state !== (originalProfile.address?.state || "") ||
      form.zip !== (originalProfile.address?.zip || "")
    );
  };

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        contact: profile.phone || "",
        email: profile.email || "",
        address1: profile.addr_line1 || "",
        address2: profile.addr_line2 || "",
        city: profile.addr_city || "",
        state: profile.addr_state || "",
        zip: profile.addr_zip || "",
      });

      setOtp("");
      setOtpSent(false);
      setOtpVerified(true);
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email" && value !== profile?.email) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtp("");
    }

    if (name === "email" && value === profile?.email) {
      setOtpVerified(true);
      setOtpSent(false);
      setOtp("");
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseModal = () => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        contact: profile.phone || "",
        email: profile.email || "",
        address1: profile.addr_line1 || "",
        address2: profile.addr_line2 || "",
        city: profile.addr_city || "",
        state: profile.addr_state || "",
        zip: profile.addr_zip || "",
      });
    }

    setOtp("");
    setOtpSent(false);
    setOtpVerified(true);
    setOpenModal(false);
    setSubmitAttempted(false);
  };

  const handleUpdate = async () => {

    setSubmitAttempted(true);

    if (!validateForm()) {
      return setConfirmation({
        open: true,
        type: "error",
        message: "Please fix all validation errors before submitting",
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

      if (form.email !== profile.email && !otpVerified) {
        return setConfirmation({
          open: true,
          type: "error",
          message: "Please verify new email first",
        });
      }

      setUpdating(true);

      const payload = {
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        phone: form.contact,
        address: {
          line1: form.address1,
          line2: form.address2,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
      };

      const res = await updateProfile(payload);

      await fetchProfile();

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "Profile updated successfully",
      });

      setOpenModal(false);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Update failed";

      setConfirmation({
        open: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setUpdating(false);
    }
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
        message: res?.message || "OTP sent successfully",
      });
    } catch (err) {
      let errorMessage = "Failed to send OTP";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setConfirmation({
        open: true,
        type: "error",
        message: errorMessage,
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
        message: res?.message || "Email verified",
      });
    } catch (err) {
      let errorMessage = "Invalid OTP";

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setConfirmation({
        open: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  const validateForm = () => {
    // First Name
    if (!/^[A-Za-z\s]{2,}$/.test(form.first_name)) return false;

    // Last Name
    if (!/^[A-Za-z\s]{2,}$/.test(form.last_name)) return false;

    // Phone
    // if (
    //   !/^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/.test(form.contact)
    // ) {
    //   return false;
    // }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;

    // Address 1
    if (!/^[\w\s#.,\/&()\-:]{5,}$/.test(form.address1)) return false;

    // City
    if (!/^[A-Za-z\s]{2,}$/.test(form.city)) return false;

    // State
    if (!/^[A-Za-z\s]{2,}$/.test(form.state)) return false;

    // ZIP
    if (!/^[0-9]{5,6}$/.test(form.zip)) return false;

    return true;
  };

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleCloseModal}
        className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <button
        onClick={handleUpdate}
        disabled={!isFormChanged() || updating}
        className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition ${!isFormChanged() || updating
          ? "bg-gray-400 cursor-not-allowed text-white"
          : "bg-blue-600 text-white hover:shadow-md"
          }`}
      >
        {updating ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            Updating...
          </>
        ) : (
          "Update"
        )}
      </button>
    </div>
  );

  return (
    <UserGuard>
      <AdminLayout>
        <Conformation
          open={confirmation.open}
          type={confirmation.type}
          message={confirmation.message}
          onClose={() => setConfirmation((prev) => ({ ...prev, open: false }))}
        />

        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">My Profile</h1>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.08)]">
            {/* top gradient */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-600 via-sky-500 to-orange-500" />

            {/* glow */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute top-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative p-6 md:p-8">
              {/* header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg">
                    <User className="h-9 w-9 text-blue-600" />
                  </div>

                  <div className="pt-8 md:pt-4">
                    <h2 className="text-2xl font-bold text-white">
                      {profile?.first_name || "-"} {profile?.last_name || ""}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      Manage your personal information and address details
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Account Active
                    </div>
                  </div>
                </div>

                <div className="md:self-start md:pt-6">
                  <button
                    onClick={() => setOpenModal(true)}
                    className="border-2 border-white inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                  >
                    <Edit3 className="h-4 w-4" />
                    Update Profile
                  </button>
                </div>
              </div>

              {/* info cards */}
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    First Name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {profile?.first_name || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last Name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {profile?.last_name || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email Address
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
                    Phone Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {profile?.phone || "-"}
                  </p>
                </div>
              </div>

              {/* address */}
              <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Address Details</h3>
                    <p className="text-sm text-slate-500">
                      Your saved communication address
                    </p>
                  </div>
                </div>

                {profile?.addr_line1 ||
                  profile?.addr_line2 ||
                  profile?.addr_city ||
                  profile?.addr_state ||
                  profile?.addr_zip ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Home className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Address Line 1
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.addr_line1 || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Home className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Address Line 2
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.addr_line2 || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <MapPinned className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          City
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.addr_city || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Landmark className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          State
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.addr_state || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <Hash className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          ZIP Code
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.addr_zip || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <MapPin className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">
                      No address details added yet
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Click “Update Profile” to add your address information
                    </p>
                  </div>
                )}
              </div>
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
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                submitAttempted={submitAttempted}
              />

              <InputField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                submitAttempted={submitAttempted}
              />

              <InputField
                label="Phone"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                required
                // pattern={
                //   /^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/
                // }
                submitAttempted={submitAttempted}
              />

              <div className="md:col-span-2">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <InputField
                      label="Email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                      submitAttempted={submitAttempted}
                    />
                  </div>

                  {form.email !== profile?.email && !otpSent && (
                    <button
                      onClick={handleSendOtp}
                      disabled={loadingOtp}
                      className={`px-4 py-2 rounded-lg h-fit text-white transition ${loadingOtp
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {loadingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  )}
                </div>
              </div>

              {form.email !== profile?.email && otpSent && !otpVerified && (
                <div className="md:col-span-2">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <InputField
                        label="Enter OTP"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleVerifyOtp}
                      disabled={loadingOtp}
                      className={`px-4 py-2 rounded-lg h-fit text-white transition ${loadingOtp
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {loadingOtp ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}

              {form.email !== profile?.email && otpSent && otpVerified && (
                <div className="md:col-span-2">
                  <p className="text-sm text-green-600 font-medium">
                    Email verified successfully.
                  </p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Address 1"
                name="address1"
                value={form.address1}
                onChange={handleChange}
                required
                minLength={5}
                // pattern={/^[A-Za-z0-9\s:,_-]+$/}
                submitAttempted={submitAttempted}
              />

              <InputField
                label="Address 2"
                name="address2"
                value={form.address2}
                onChange={handleChange}
              />

              <InputField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                submitAttempted={submitAttempted}
              />

              <InputField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                minLength={2}
                pattern={/^[A-Za-z\s]+$/}
                submitAttempted={submitAttempted}
              />

              <InputField
                label="ZIP"
                name="zip"
                value={form.zip}
                onChange={handleChange}
                required
                pattern={/^[0-9]{5,6}$/}
                maxLength={6}
                submitAttempted={submitAttempted}
              />
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </UserGuard>
  );
}