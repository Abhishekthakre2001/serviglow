"use client";

import { useEffect, useState } from "react";
import InputField from "@/components/ui/InputField";
import AdminLayout from "@/components/layout/AdminLayout";
import Conformation from "@/components/ui/Conformation";
import Modal from "@/components/ui/Modals";
import { useAuth } from "@/hooks/useAuth";
import profileApi from "@/services/profileApi";

export default function ProfilePage() {
  const { sendOtp, verifyOtp } = useAuth();
  const { getProfile, updateAdminProfile } = profileApi;

  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [openModal, setOpenModal] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(true);
  const [loadingOtp, setLoadingOtp] = useState(false);

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

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        contact: profile.phone || "",
        email: profile.email || "",
      });
      setOtp("");
      setOtpSent(false);
      setOtpVerified(true);
    }
  }, [profile]);

  const isFormChanged = () => {
    if (!originalProfile) return false;

    return (
      form.first_name !== originalProfile.firstName ||
      form.last_name !== originalProfile.lastName ||
      form.contact !== originalProfile.phone ||
      form.email !== originalProfile.email
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      const isSameEmail = value === profile?.email;
      setOtpVerified(isSameEmail);
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
      });
    }

    setOtp("");
    setOtpSent(false);
    setOtpVerified(true);
    setOpenModal(false);
  };

  const handleUpdate = async () => {
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
      };

      const res = await updateAdminProfile(payload);

      await fetchProfile();

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "Profile updated successfully",
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

  const handleSendOtp = async () => {
    try {
      setLoadingOtp(true);

      const res = await sendOtp({ email: form.email, type: "update" });

      setOtpSent(true);

      setConfirmation({
        open: true,
        type: "success",
        message: res?.message || "OTP sent successfully",
      });
    } catch (err) {
      setConfirmation({
        open: true,
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to send OTP",
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
      setConfirmation({
        open: true,
        type: "error",
        message:
          err?.response?.data?.message || err?.message || "Invalid OTP",
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  const isFormValid = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.first_name || !nameRegex.test(form.first_name)) return false;
    if (!form.last_name || !nameRegex.test(form.last_name)) return false;
    if (!phoneRegex.test(form.contact)) return false;
    if (!emailRegex.test(form.email)) return false;

    return true;
  };

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleCloseModal}
        className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <button
        onClick={handleUpdate}
        disabled={!isFormChanged() || !isFormValid() || updating}
        className={`px-6 py-2 rounded-lg text-white font-medium transition ${!isFormChanged() || !isFormValid() || updating
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {updating ? "Updating..." : "Update"}
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <Conformation
        open={confirmation.open}
        type={confirmation.type}
        message={confirmation.message}
        onClose={() =>
          setConfirmation((prev) => ({ ...prev, open: false }))
        }
      />

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">My Profile</h1>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.08)]">

          {/* Gradient Header */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-blue-600 via-sky-500 to-orange-500" />

          {/* Glow Effects */}
          <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative p-6 md:p-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              {/* Left */}
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg">
                  <span className="text-2xl font-bold text-blue-600">
                    {profile?.first_name?.charAt(0) || "U"}
                  </span>
                </div>

                <div className="pt-8 md:pt-4">
                  <h2 className="text-2xl font-bold text-white">
                    {profile?.first_name || "-"} {profile?.last_name || ""}
                  </h2>

                  <p className="text-sm text-slate-300 mt-1">
                    Manage your account details
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-100">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Active Account
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="md:self-start md:pt-6">
                <button
                  onClick={() => setOpenModal(true)}
                  className="border-2 border-white inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                >
                  Update Profile
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 uppercase">First Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {profile?.first_name || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 uppercase">Last Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {profile?.last_name || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 uppercase">Email</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 break-all">
                  {profile?.email || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs text-slate-500 uppercase">Phone</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {profile?.phone || "-"}
                </p>
              </div>

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
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
            pattern={/^[A-Za-z]+$/}
            minLength={2}
            error="Only alphabets allowed"
          />

          <InputField
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            pattern={/^[A-Za-z]+$/}
            minLength={2}
            error="Only alphabets allowed"
          />

          <InputField
            label="Phone"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            required
            pattern={
              /^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/
            }
            error="Enter a valid phone number"
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
                  error="Enter a valid email"
                />
              </div>

              {form.email !== profile?.email && !otpSent && (
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
          </div>

          {form.email !== profile?.email && otpSent && !otpVerified && (
            <div className="md:col-span-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <InputField
                    label="Enter OTP"
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
            </div>
          )}

          {form.email !== profile?.email && otpVerified && otpSent && (
            <div className="md:col-span-2">
              <p className="text-sm text-green-600 font-medium">
                Email verified successfully.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
}