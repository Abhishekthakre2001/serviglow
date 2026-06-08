"use client";

import { useEffect, useState } from "react";
import {
  User,
  Building2,
  FileText,
  Check,
  Loader,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import InputField from "@/components/ui/InputField";
import Dropdown from "@/components/ui/Dropdown";
import FileUpload from "@/components/ui/FileUpload";
import Conformatiom from "@/components/ui/Conformation";
import { useAuth } from "@/hooks/useAuth";
import { useMasterData } from "@/hooks/useMasterData";

export default function PartnerRegistration() {

  const OTP_EXPIRE_TIME = Number(process.env.NEXT_PUBLIC_OTP_EXPIRE_TIME);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const router = useRouter();
  // Custom hooks
  const {
    categories,
    categoriesLoading,
    subcategories,
    subcategoriesLoading,
    selectedCategoryId,
    handleSelectCategory,
  } = useMasterData();

  const {
    loading: isSubmitting,
    registerPartner,
    sendOtp,
    verifyOtp,
    error,
  } = useAuth();

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const steps = [
    { id: 1, title: "Personal", icon: User },
    { id: 2, title: "Business", icon: Building2 },
    { id: 3, title: "Documents", icon: FileText },
    { id: 4, title: "Confirmation", icon: Check },
  ];

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",

    business_name: "",
    business_address: "",
    city: "",
    state: "",
    service_category: "",
    service_subcategory: "",
    experience: "",
    zip_codes: "",

    services: [
      {
        name: "",
        category: "",
        subcategory: "",
        price: "",
        details: "",
        images: [],
      },
    ],

    business_license: null,
    certification: null,
    insurance: null,
    logo: null,
    taxid: null,
    corporationcert: null,
    govId: null,
    about: "",
    agree: false,
  });

  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const validateConfirmPassword = () => {
    return form.confirm_password === form.password;
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCityState = (value) => {
    return /^[A-Za-z\s]+$/.test(value.trim());
  };

  const validatePhone = (phone) => {
    if (!phone) return false;

    // Remove spaces, dashes, brackets
    const cleaned = phone.replace(/[\s\-()]/g, "");

    // Must be digits with optional +
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    return phoneRegex.test(cleaned);
  };

  const validatePassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+]).{8,}$/;

    return strongPasswordRegex.test(password);
  };
  const getPasswordError = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must include at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must include at least one number";
    }
    if (!/[@$!%*?&^#()[\]{}\-_=+]/.test(password)) {
      return "Password must include at least one special character";
    }
    return "";
  };
  const validateZipCodes = (zips) => {
    return zips.trim().length > 0;
  };

  const isStep1Valid = () => {
    return (
      form.first_name.trim() &&
      form.last_name.trim() &&
      validateEmail(form.email) &&
      validatePhone(form.phone) &&
      !getPasswordError(form.password) &&
      form.confirm_password &&
      validateConfirmPassword() &&
      otpVerified
    );
  };

  const isStep2Valid = () => {
    return (
      form.business_name.trim() &&
      form.business_address.trim() &&
      validateCityState(form.city) &&
      validateCityState(form.state) &&
      form.service_category &&
      form.service_subcategory &&
      form.experience.trim() &&
      form.zip_codes.trim()
    );
  };

  const isStep3Valid = () => {
    return (
      form.business_license &&
      // form.certification &&
      // form.insurance &&
      form.about.trim() &&
      form.agree
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));

    if (name === "email") {
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCountdown(0);
      setCanResendOtp(true);
    }

    if (name === "service_category") {
      handleSelectCategory(value);

      setForm((prev) => ({
        ...prev,
        service_subcategory: "",
      }));
    }
  };

  const handleDocumentUpload = (documentType, file) => {
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setConfirmationModal({
          open: true,
          type: "error",
          message: "Only PDF and image files are allowed",
        });
        return;
      }

      setForm((prev) => ({
        ...prev,
        [documentType]: file,
        // Auto-sync same file to all docs if needed
      }));
    }
  };

  const handleSubmit = async () => {
    if (!isStep3Valid()) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Incomplete Form",
        message: "Please fill all required fields and accept the terms.",
      });
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add personal info (camelCase to match backend)
      formData.append("firstName", form.first_name);
      formData.append("lastName", form.last_name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("phone", form.phone);

      // Add business info (camelCase to match backend)
      formData.append("businessName", form.business_name);
      formData.append("categoryId", form.service_category);
      formData.append("subCategoryId", form.service_subcategory);
      formData.append("yearsOfExperience", form.experience);
      formData.append("serviceAreas", form.zip_codes);
      formData.append("about", form.about);

      formData.append("businessAddress", form.business_address);
      formData.append("city", form.city);
      formData.append("state", form.state);

      // Add documents (exact names expected by Multer)
      if (form.business_license) {
        formData.append("businessLicense", form.business_license);
      }
      if (form.certification) {
        formData.append("certificate", form.certification);
      }
      if (form.insurance) {
        formData.append("insurance", form.insurance);
      }
      if (form.logo) {
        formData.append("logo", form.logo);
      }

      if (form.taxid) {
        formData.append("taxid", form.taxid);
      }
      if (form.corporationcert) {
        formData.append("corporationcert", form.corporationcert);
      }
      if (form.govId) {
        formData.append("govId", form.govId);
      }

      // Call API via useAuth hook
      await registerPartner(formData);

      // Show success confirmation
      setConfirmationModal({
        open: true,
        type: "success",
        title: "Application Submitted!",
        message:
          "Your partner application has been received. Our team will review your details and contact you shortly.",
      });

      setStep(4);
    } catch (error) {
      let errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit registration. Please try again.";

      // 🔥 Custom friendly message for duplicate email
      if (errorMsg && errorMsg.toLowerCase().includes("already exists")) {
        errorMsg = "Email already exists. Please use another email.";
      }

      setConfirmationModal({
        open: true,
        type: "error",
        title: "Submission Failed",
        message: errorMsg,
      });
    }
  };

  const handleSendOtp = async () => {
    try {
      if (!validateEmail(form.email)) return;

      setSendingOtp(true);

      await sendOtp({ email: form.email, type: "register" });

      setOtpSent(true);
      setOtpVerified(false);
      setOtpCountdown(OTP_EXPIRE_TIME);
      setCanResendOtp(false);

      setConfirmationModal({
        open: true,
        type: "success",
        title: "OTP Sent",
        message: "OTP sent successfully. Please check your email.",
      });
    } catch (error) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Failed",
        message: error?.message || "Something went wrong",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setVerifyingOtp(true);


      await verifyOtp({
        email: form.email,
        otp,
      });

      setOtpVerified(true);
      setConfirmationModal({
        open: true,
        type: "success",
        title: "Email verified",
        message: "Email verified successfully",
      });
    } catch (error) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Failed ",
        message: error?.message || "Something went wrong",
      });
      setVerifyingOtp(false);
    } finally {
      setVerifyingOtp(false);

    }
  };


  useEffect(() => {
    if (otpCountdown <= 0) {
      if (otpSent && !otpVerified) setCanResendOtp(true);
      return;
    }

    const timer = setTimeout(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpCountdown, otpSent, otpVerified]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-16 px-6 ">
      <Conformatiom
        open={confirmationModal.open}
        type={confirmationModal.type}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
      />
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Confirmation Modal */}

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">
            Become a Service Partner
          </h1>
          <p className="text-slate-500">
            Complete your professional onboarding in few steps
          </p>
        </div>

        {/* STEP PROGRESS */}
        <div className="flex justify-between relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          <div
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full transition-all"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center
                ${step >= s.id
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-sm mt-2 text-gray-600">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* FORM BODY */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl space-y-6">
          {/* STEP 1 - PERSONAL INFO */}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* First Name */}
              <InputField
                label="First Name"
                name="first_name"
                minLength={2}
                value={form.first_name}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
                pattern={/^[A-Za-z\s]+$/}

              />

              {/* Last Name */}
              <InputField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                minLength={2}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
                pattern={/^[A-Za-z\s]+$/}

              />




              {/* Password */}
              <div className="flex flex-col">
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter a strong password"
                  required
                />

                {form.password && getPasswordError(form.password) && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <AlertCircle size={14} />
                    {getPasswordError(form.password)}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col">
                <InputField
                  label="Confirm Password"
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                />

                {form.confirm_password && !validateConfirmPassword() && (
                  <p className="text-red-500 text-sm md:col-span-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Phone */}
              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />

              {form.phone && !validatePhone(form.phone) && (
                <p className="text-red-500 text-sm md:col-span-2 flex items-center gap-1">
                  <AlertCircle size={14} /> Please enter a valid phone number

                </p>
              )}


              {/* EMAIL + OTP SECTION */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end">

                  {/* Email */}
                  <div className="md:col-span-3">
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      disabled={otpVerified}
                    />
                  </div>

                  {/* Send OTP */}
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={
                        !validateEmail(form.email) ||
                        sendingOtp ||
                        otpVerified ||
                        (!canResendOtp && otpSent)
                      }
                      className={`w-full h-[42px] rounded-md text-white font-medium transition
      ${!validateEmail(form.email) || sendingOtp || otpVerified || (!canResendOtp && otpSent)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }
    `}
                    >
                      {sendingOtp
                        ? "Sending..."
                        : otpVerified
                          ? "Verified"
                          : otpSent
                            ? canResendOtp
                              ? "Resend OTP"
                              : `Resend in ${formatTime(otpCountdown)}`
                            : "Send OTP"}
                    </button>
                  </div>

                  {/* OTP Input */}
                  <div className="md:col-span-3">
                    <InputField
                      label="Enter OTP"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6 digit OTP"
                      required
                      disabled={!otpSent || otpVerified}
                    />
                  </div>

                  {/* Verify OTP */}
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={
                        !otpSent ||
                        otpVerified ||
                        verifyingOtp ||
                        otp.length !== 6
                      }
                      className={`w-full h-[42px] rounded-md text-white font-medium transition
          ${!otpSent ||
                          otpVerified ||
                          verifyingOtp ||
                          otp.length !== 6
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                        }
        `}
                    >
                      {verifyingOtp
                        ? "Verifying..."
                        : otpVerified
                          ? "Verified"
                          : "Verify OTP"}
                    </button>
                  </div>

                </div>

                {otpSent && !otpVerified && otpCountdown > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    OTP expires in {formatTime(otpCountdown)}
                  </p>
                )}

                {otpSent && !otpVerified && canResendOtp && (
                  <p className="text-sm text-blue-600 mt-2">
                    OTP expired. You can resend OTP now.
                  </p>
                )}

                {/* Email Error */}
                {form.email && !validateEmail(form.email) && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Please enter a valid email address
                  </p>
                )}

                {/* Verified Message */}
                {otpVerified && (
                  <p className="text-green-600 text-sm mt-2">
                    Email verified successfully
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 - BUSINESS INFO */}
          {step === 2 && (
            <div className="space-y-4">
              <InputField
                label="Business Name"
                name="business_name"
                minLength={2}
                value={form.business_name}
                onChange={handleChange}
                placeholder="Enter your business name"
                required
              />

              <InputField
                label="Business Address"
                name="business_address"
                value={form.business_address}
                onChange={handleChange}
                placeholder="Enter business address"
                required
              />

              <InputField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                required
              />

              {form.city && !validateCityState(form.city) && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> City must contain only letters
                </p>
              )}

              <InputField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Enter state"
                required
              />

              {form.state && !validateCityState(form.state) && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> State must contain only letters
                </p>
              )}

              {/* Categories Dropdown with Loading State */}
              <div>
                <Dropdown
                  label="Services Offered"
                  name="service_category"
                  value={form.service_category}
                  onChange={handleChange}
                  options={categories}
                  required
                  disabled={categoriesLoading}
                />
                {categoriesLoading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading categories...
                  </div>
                )}
              </div>

              {/* Subcategories Dropdown with Loading State */}
              <div>
                <Dropdown
                  label="Services Sub Category"
                  name="service_subcategory"
                  value={form.service_subcategory}
                  onChange={handleChange}
                  required
                  options={subcategories}
                  disabled={!form.service_category || subcategoriesLoading}
                />
                {subcategoriesLoading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading subcategories...
                  </div>
                )}
                {!form.service_category && (
                  <p className="text-sm text-gray-500 mt-2">
                    Select a category first
                  </p>
                )}
              </div>

              <InputField
                label="Years of Experience"
                name="experience"
                type="number"
                maxLength={2}
                value={form.experience}
                onChange={handleChange}
                placeholder="e.g., 5"
                required
              />

              <InputField
                label="Service Areas (ZIP Codes)"
                name="zip_codes"
                value={form.zip_codes}
                onChange={handleChange}
                placeholder="e.g., 560001, 560002"
                maxLength={6}
                required
              />
            </div>
          )}

          {/* STEP 3 - DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-4">
              <FileUpload
                label="Business License"
                name="business_license"
                files={form.business_license ? [form.business_license] : []}
                onChange={(e) =>
                  handleDocumentUpload("business_license", e.target.files?.[0])
                }
                required
                accept="image/*,.pdf"
              />
              {!form.business_license && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> Business license is required
                </p>
              )}

              <FileUpload
                label="Professional Certificate (Optional)"
                name="certification"
                files={form.certification ? [form.certification] : []}
                onChange={(e) =>
                  handleDocumentUpload("certification", e.target.files?.[0])
                }
                accept=".pdf"
              // required
              />
              {/* {!form.certification && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> Certificate is required
                </p>
              )} */}

              <FileUpload
                label="Insurance Certificate (Optional)"
                name="insurance"
                files={form.insurance ? [form.insurance] : []}
                onChange={(e) =>
                  handleDocumentUpload("insurance", e.target.files?.[0])
                }
                accept="application/pdf"
              // required
              />
              {/* {!form.insurance && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> Insurance is required
                </p>
              )} */}

              <FileUpload
                label="Business Logo (Optional)"
                name="logo"
                files={form.logo ? [form.logo] : []}
                onChange={(e) =>
                  handleDocumentUpload("logo", e.target.files?.[0])
                }
                accept=".jpg,.jpeg,.png,.webp"
              />

              <FileUpload
                label="Government ID (Optional)"
                name="logo"
                files={form.govId ? [form.govId] : []}
                onChange={(e) =>
                  handleDocumentUpload("govId", e.target.files?.[0])
                }
                accept="application/pdf"
              />

              <FileUpload
                label="LLC/corporation Doc. (Optional)"
                name="logo"
                files={form.corporationcert ? [form.corporationcert] : []}
                onChange={(e) =>
                  handleDocumentUpload("corporationcert", e.target.files?.[0])
                }
                accept="application/pdf"
              />

              <FileUpload
                label="EIN or Tax ID  (Optional)"
                name="logo"
                files={form.taxid ? [form.taxid] : []}
                onChange={(e) =>
                  handleDocumentUpload("taxid", e.target.files?.[0])
                }
                accept="application/pdf"
              />



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Your Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  placeholder="Tell us about your experience..."
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  required
                />
                {!form.about.trim() && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> Please tell us about your
                    experience
                  </p>
                )}
              </div>

              <label className="flex gap-2 text-sm items-start">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span>I agree to Terms & Conditions and Privacy Policy</span>
              </label>
              {!form.agree && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} /> You must agree to terms and
                  conditions
                </p>
              )}
            </div>
          )}

          {/* STEP 4 - CONFIRMATION */}
          {step === 4 && (
            <div className="text-center space-y-6 animate-fadeUp">
              <CheckCircle size={80} className="text-green-500 mx-auto" />

              <h3 className="text-3xl font-bold text-gray-900">
                Registration Submitted!
              </h3>

              <p className="text-gray-600 my-4">
                Your partner application has been received. Our team will review
                your details and contact you shortly.
              </p>

              <div className="flex justify-center">
                <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                  {/* Title */}
                  <h4 className="text-xl font-semibold text-gray-900 text-center mb-8">
                    Partner Application Summary
                  </h4>

                  <div className="space-y-6 text-sm">
                    {/* Row */}
                    <div className="flex items-center justify-between border-b border-gray-100 ">
                      <div className="flex items-center gap-3 text-gray-600">
                        <User className="w-5 h-5 text-blue-600" />
                        <span>Full Name</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {form.first_name} {form.last_name}
                      </span>
                    </div>

                    {/* Row */}
                    <div className="flex items-center justify-between border-b border-gray-100 ">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <span>Mobile</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {form.phone}
                      </span>
                    </div>

                    {/* Row */}
                    <div className="flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span>Email</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {form.email}
                      </span>
                    </div>

                    {/* Row */}
                    <div className="flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>Business</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {form.business_name}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-gray-600">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <span>Status</span>
                      </div>

                      <span className="px-3 py-1 text-xs font-medium rounded-full text-white bg-yellow-600">
                        Under Verification
                      </span>
                    </div>

                    <button
                      onClick={() => router.push("/")}
                      className="px-8 py-3 mt-6 rounded-xl text-white font-semibold 
  bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-lg transition"
                    >
                      Go to Home Page
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        {/* NAVIGATION */}
        {step !== 4 && (
          <div className="flex justify-between items-center">
            {/* BACK BUTTON */}
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
              >
                Back
              </button>
            )}

            {/* NEXT / SUBMIT BUTTON */}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !isStep1Valid()) ||
                  (step === 2 && !isStep2Valid())
                }
                className={`ml-auto px-8 py-3 rounded-xl text-white font-semibold transition
          ${(step === 1 && !isStep1Valid()) ||
                    (step === 2 && !isStep2Valid())
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-lg"
                  }
        `}
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid() || isSubmitting}
                className={`ml-auto px-10 py-3 rounded-xl text-white font-semibold flex items-center gap-2 transition
          ${!isStep3Valid() || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg"
                  }
        `}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
